#!/usr/bin/env python
# pylint: disable=unused-argument, wrong-import-position
# This program is dedicated to the public domain under the CC0 license.

"""
Basic example for a bot that uses inline keyboards. For an in-depth explanation, check out
 https://github.com/python-telegram-bot/python-telegram-bot/wiki/InlineKeyboard-Example.
"""
import logging
import os

import requests

from telegram import __version__ as TG_VER

try:
    from telegram import __version_info__
except ImportError:
    __version_info__ = (0, 0, 0, 0, 0)  # type: ignore[assignment]

if __version_info__ < (20, 0, 0, "alpha", 1):
    raise RuntimeError(
        f"This example is not compatible with your current PTB version {TG_VER}. To view the "
        f"{TG_VER} version of this example, "
        f"visit https://docs.python-telegram-bot.org/en/v{TG_VER}/examples.html"
    )
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ContextTypes, AIORateLimiter, MessageHandler, filters

import dotenv
import nest_asyncio
dotenv.load_dotenv()

class Telegram:
    def __init__(self):
        # Enable logging
        logging.basicConfig(
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
        )
        self.logger = logging.getLogger(__name__)

        # enviroment variables
        self.telegramApiKey = os.environ.get('TELEGRAM_API_KEY')
        self.inquireApiKey = os.environ.get('INQUIRE_API_KEY')
        self.inquireApi = os.environ.get('INQUIRE_API')

        # setting initial persona to `chat`
        self.persona = "chat"

        # Create the Application and pass it your bot's token.
        self.application = Application.builder().token(self.telegramApiKey).rate_limiter(AIORateLimiter(
                overall_max_rate=1, overall_time_period=1, group_max_rate=1, group_time_period=1, max_retries=0
            )).concurrent_updates(True).arbitrary_callback_data(True).build()

        # direct handlers 
        self.application.add_handler(CommandHandler("start", self.start))
        self.application.add_handler(CommandHandler("help", self.help_command))

        # inline handlers
        self.application.add_handler(CommandHandler("list", self.list_personas))
        self.application.add_handler(CallbackQueryHandler(self.set_persona))

        # general chat handler 
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.query_persona))

        # Run the bot until the user presses Ctrl-C
        self.application.run_polling()

    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Sends a message with three inline buttons attached."""
        keyboard = [
            [
                InlineKeyboardButton("Option 1", callback_data="1"),
                InlineKeyboardButton("Option 2", callback_data="2"),
            ],
            [InlineKeyboardButton("Option 3", callback_data="3")],
        ]

        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text("Please choose:", reply_markup=reply_markup)
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Displays info on how to use the bot."""
        await update.message.reply_text("Use /start to test this bot.")

    async def set_persona(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Parses the CallbackQuery and updates the message text to greeting with a persona"""
        query = update.callback_query

        # CallbackQueries need to be answered, even if no notification to the user is needed
        # Some clients may have trouble otherwise. See https://core.telegram.org/bots/api#callbackquery
        await query.answer()

        self.persona = query.data
        await query.edit_message_text(text=f"You are now chatting with a {query.data} bot, any chat will be returned with an answer")

    async def query_persona(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Queries the set persona."""
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        url = self.inquireApi + "/inquiries"
        headers = {
            "x-api-key": self.inquireApiKey,
        }

        payload = {
            "connectionType": "TELEGRAM",
            "connectionUserId": update.message.chat.id,
            "queryType": self.persona,
            "query": update.message.text
        }

        response = requests.post(url, headers=headers, data=payload)

        print(response.json())

        await update.message.reply_text(response.json()['data']['response'])

    async def list_personas(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Displays info on how to use the bot."""
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        url = self.inquireApi + "/inquiries"
        headers = {
            "x-api-key": self.inquireApiKey,
        }

        response = requests.get(url, headers=headers)

        keyboard = [ ]
        for key in response.json()['data']:
            keyboard.append(
                [
                    InlineKeyboardButton(key['name'], callback_data=key["name"]),
                ],
            )

        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text("List of Personas", reply_markup=reply_markup)