#!/usr/bin/env python
#
# A library containing community-based extension for the python-telegram-bot library
# Copyright (C) 2020-2022
# The ptbcontrib developers
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Lesser Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Lesser Public License for more details.
#
# You should have received a copy of the GNU Lesser Public License
# along with this program.  If not, see [http://www.gnu.org/licenses/].
"""This module contains MysqlPersistence class, based on schema defined in /web/prisma/schema.prisma."""


import json
import logging
from pythonjsonlogger import jsonlogger
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.sql import text
from telegram.ext import DictPersistence

CDCData = Tuple[List[Tuple[str, float, Dict[str, Any]]], Dict[str, str]]


class MySQLPersistence(DictPersistence):
    """Using MySQL database to make user/chat/bot data persistent across reboots.

    Args:
        url (:obj:`str`, Optional) the mysql database url.
        session (:obj:`scoped_session`, Optional): sqlalchemy scoped session.
        on_flush (:obj:`bool`, optional): if set to :obj:`True` :class:`MySQLPersistence`
            will only update bot/chat/user data when :meth:flush is called.
        **kwargs (:obj:`dict`): Arbitrary keyword Arguments to be passed to
            the DictPersistence constructor.

    Attributes:
        store_data (:class:`PersistenceInput`): Specifies which kinds of data will be saved by this
            Persistence instance.
    """

    def __init__(
        self,
        url: str = None,
        session: scoped_session = None,
        on_flush: bool = False,
        **kwargs: Any,
    ) -> None:

        if url:
            if not url.startswith("mysql://"):
                raise TypeError(f"{url} isn't a valid MySQL database URL.")
            engine = create_engine(url)
            self._session = scoped_session(
                sessionmaker(bind=engine, autoflush=False))

        elif session:
            if not isinstance(session, scoped_session):
                raise TypeError(
                    "session must needs to be `sqlalchemy.orm.scoped_session` object")
            self._session = session

        else:
            raise TypeError("You must need to provide either url or session.")

        self.logger = logging.getLogger(__name__)
        logHandler = logging.StreamHandler()
        formatter = jsonlogger.JsonFormatter()
        logHandler.setFormatter(formatter)
        self.logger.addHandler(logHandler)

        self.on_flush = on_flush
        self.__init_database()
        try:
            self.logger.info("Loading database....")

            # chat data
            chat_data_ = self._session.execute(
                text("SELECT chat_data FROM Persistence")).first()
            chat_data = chat_data_[0] if chat_data_ is not None else {}
            chat_data_json = json.loads(chat_data) if chat_data else {}

            # user data
            user_data_ = self._session.execute(
                text("SELECT user_data FROM Persistence")).first()
            user_data = user_data_[0] if user_data_ is not None else {}
            user_data_json = json.loads(user_data) if user_data else {}

            # bot data
            bot_data_ = self._session.execute(
                text("SELECT bot_data FROM Persistence")).first()
            bot_data = bot_data_[0] if bot_data_ is not None else {}
            bot_data_json = json.loads(bot_data) if bot_data else {}

            # conversations data
            # converstations is always "null" in the database
            conversations_data_ = self._session.execute(
                text("SELECT conversations FROM Persistence")).first()
            conversations_data = conversations_data_[
                0] if conversations_data_ is not None else {}
            conversations_json_data = {}

            # callback data
            callback_data_ = self._session.execute(
                text("SELECT callback_data FROM Persistence")).first()
            callback_data = callback_data_[
                0] if callback_data_ is not None else {}
            callback_data_json = json.loads(
                callback_data) if callback_data else {}

            self.logger.info("Database loaded successfully!")

            # if it is a fresh setup we'll add some placeholder data so we
            # can perform `UPDATE` operations on it, cause SQL only allows
            # `UPDATE` operations if column have some data already present inside it.
            if not chat_data:
                insert_qry = "INSERT INTO Persistence (chat_data) VALUES ('{}')"
                self._session.execute(text(insert_qry))
            if not user_data:
                insert_qry = "INSERT INTO Persistence (user_data) VALUES ('{}')"
                self._session.execute(text(insert_qry))
            if not bot_data:
                insert_qry = "INSERT INTO Persistence (bot_data) VALUES ('{}')"
                self._session.execute(text(insert_qry))
            if not conversations_data:
                insert_qry = "INSERT INTO Persistence (conversations) VALUES ('{}')"
                self._session.execute(text(insert_qry))
            if not callback_data:
                insert_qry = "INSERT INTO Persistence (callback_data) VALUES ('{}')"
                self._session.execute(text(insert_qry))

            self._session.commit()

            super().__init__(
                **kwargs,
                chat_data_json=chat_data_json,
                user_data_json=user_data_json,
                bot_data_json=bot_data_json,
                callback_data_json=callback_data_json,
                conversations_json=conversations_json_data,
            )
        finally:
            self._session.close()

    def __init_database(self) -> None:
        """
        creates table for storing the data if table
        doesn't exist already inside database.
        """
        self.logger.info("Passing database initialization...")
        # create_table_qry = """
        #         CREATE TABLE Persistence (
        #         bot_data json,
        #         chat_data json,
        #         user_data json,
        #         callback_data json,
        #         conversations json,
        #         updatedAt datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        #         PRIMARY KEY (updatedAt)
        #     );"""

        # self._session.execute(text(create_table_qry))
        # self._session.commit()

    def _dump_into_json(self) -> Any:
        """Dumps data into json format for inserting in db."""

        to_dump = {
            "chat_data": self.chat_data_json,
            "user_data": self.user_data_json,
            "bot_data": self.bot_data_json,
            "conversations": self.conversations_json,
            "callback_data": self.callback_data_json,
        }
        self.logger.debug("Dumping %s", to_dump)
        return json.dumps(to_dump)

    def _update_database(self) -> None:
        self.logger.debug("Updating database...")
        try:
            # update chat data
            insert_qry = "UPDATE Persistence SET chat_data = :jsondata"
            params = {"jsondata": json.dumps(self.chat_data_json)}
            self._session.execute(text(insert_qry), params)

            # update user data
            insert_qry = "UPDATE Persistence SET user_data = :jsondata"
            params = {"jsondata": json.dumps(self.user_data_json)}
            self._session.execute(text(insert_qry), params)

            # update bot data
            insert_qry = "UPDATE Persistence SET bot_data = :jsondata"
            params = {"jsondata": json.dumps(self.bot_data_json)}
            self._session.execute(text(insert_qry), params)

            # update conversations data
            insert_qry = "UPDATE Persistence SET conversations = :jsondata"
            params = {"jsondata": json.dumps(self.conversations_json)}
            self._session.execute(text(insert_qry), params)

            # update callback data
            insert_qry = "UPDATE Persistence SET callback_data = :jsondata"
            params = {"jsondata": json.dumps(self.callback_data_json)}
            self._session.execute(text(insert_qry), params)

            self._session.commit()
        except Exception as excp:  # pylint: disable=W0703
            self._session.close()
            self.logger.error(
                "Failed to save data in the database.\nLogging exception: ",
                exc_info=excp,
            )

    async def update_conversation(
        self, name: str, key: Tuple[int, ...], new_state: Optional[object]
    ) -> None:
        """Will update the conversations for the given handler.

        Args:
            name (:obj:`str`): The handler's name.
            key (:obj:`tuple`): The key the state is changed for.
            new_state (:obj:`tuple` | :obj:`any`): The new state for the given key.
        """
        await super().update_conversation(name, key, new_state)
        if not self.on_flush:
            await self.flush()

    async def update_user_data(self, user_id: int, data: Dict) -> None:
        """Will update the user_data (if changed).
        Args:
            user_id (:obj:`int`): The user the data might have been changed for.
            data (:obj:`dict`): The :attr:`telegram.ext.Dispatcher.user_data` ``[user_id]``.
        """
        await super().update_user_data(user_id, data)
        if not self.on_flush:
            await self.flush()

    async def update_chat_data(self, chat_id: int, data: Dict) -> None:
        """Will update the chat_data (if changed).
        Args:
            chat_id (:obj:`int`): The chat the data might have been changed for.
            data (:obj:`dict`): The :attr:`telegram.ext.Dispatcher.chat_data` ``[chat_id]``.
        """
        await super().update_chat_data(chat_id, data)
        if not self.on_flush:
            await self.flush()

    async def update_bot_data(self, data: Dict) -> None:
        """Will update the bot_data (if changed).
        Args:
            data (:obj:`dict`): The :attr:`telegram.ext.Dispatcher.bot_data`.
        """
        await super().update_bot_data(data)
        if not self.on_flush:
            await self.flush()

    async def update_callback_data(self, data: CDCData) -> None:
        """Will update the callback_data (if changed).

        Args:
            data (Tuple[List[Tuple[:obj:`str`, :obj:`float`, Dict[:obj:`str`, :class:`object`]]], \
                Dict[:obj:`str`, :obj:`str`]]): The relevant data to restore
                :class:`telegram.ext.CallbackDataCache`.
        """
        await super().update_callback_data(data)
        if not self.on_flush:
            await self.flush()

    async def flush(self) -> None:
        """Will be called by :class:`telegram.ext.Updater` upon receiving a stop signal. Gives the
        Persistence a chance to finish up saving or close a database connection gracefully.
        """
        self._update_database()
        if not self.on_flush:
            pass
            # self.logger.info("Closing database...")
