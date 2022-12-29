import os
import logging
import traceback
from functools import wraps

import requests
from uuid import uuid4
from html import escape
import json

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
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, InlineQueryResultArticle, InputTextMessageContent
from telegram.constants import ParseMode
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ContextTypes, AIORateLimiter, MessageHandler, filters, InlineQueryHandler

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

        # Help text
        self.help_text = f"""
Inquire is a converstational chatbot that can take the form of just about any persona.
            
To list all personas available, use the `/list` command select who you would like to talk to. To query the persona, simply send a message to the bot. 
            
You can change the persona at any time by using the `/list` command again or directly by using /set followed by the persona name (e.g. `/set trainer`).

Learn more about Inquire at https://inquire.run
        """

        # Create the Application and pass it your bot's token.
        self.application = Application.builder().token(self.telegramApiKey).rate_limiter(AIORateLimiter(
                overall_max_rate=1, overall_time_period=1, group_max_rate=1, group_time_period=1, max_retries=0
            )).concurrent_updates(True).arbitrary_callback_data(True).build()

        # direct handlers 
        self.application.add_handler(CommandHandler("start", self.start))
        self.application.add_handler(CommandHandler("help", self.help_command))

        # inline handlers
        self.application.add_handler(CommandHandler("list", self.list_personas))
        self.application.add_handler(CommandHandler("set", self.set_persona))
        self.application.add_handler(CallbackQueryHandler(self.set_persona_callback))

        # general chat handler 
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.query_persona))

        # inline query handler, this is run when you type: @botusername <query>
        # @TODO: add inline query handler for when interaction is via a group chat
        # self.application.add_handler(InlineQueryHandler(self.inline_query))

        # Register error handlers
        self.application.add_error_handler(self.error_handler)

        # Run the bot until the user presses Ctrl-C
        self.application.run_polling()

    # @TODO: track users and groups

    # Error handler to capture errors
    async def error_handler(self, update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Error handler for the bot to log errors
        :param update: Update object
        :param context: CallbackContext object
        """

        # traceback.format_exception returns the usual python message about an exception, but as a
        # list of strings rather than a single string, so we have to join them together.
        tb_list = traceback.format_exception(None, context.error, context.error.__traceback__)
        tb_string = "".join(tb_list)

        # Build the message with some markup and additional information about what happened.
        # You might need to add some logic to deal with messages longer than the 4096 character limit.
        update_str = update.to_dict() if isinstance(update, Update) else str(update)
        message = (
            f"An exception was raised while handling an update\n"
            f"update = {json.dumps(update_str, indent=2, ensure_ascii=False)}"
            f"context.chat_data = {str(context.chat_data)}\n\n"
            f"context.user_data = {str(context.user_data)}\n\n"
            f"{tb_string}"
        )
        
        # Log errors
        # self.logger.error(msg="Exception while handling an update:", exc_info=context.error)
        # self.logger.error(msg=message)

        # @TODO: handle subscription and limit errors better with response to sign up

        # Handle API Errors
        (error_code, message) = context.error.args
        if error_code == 400:
            self.logger.error(f"""Bad Request: {error_code}""")
            await update.message.reply_text('Bad Request')
        elif error_code == 401:
            self.logger.error(f"""Unauthorized: {error_code}""")
            await update.message.reply_text('Unauthorized')
        elif error_code == 403:
            self.logger.error(f"""Forbidden: {error_code}""")
            await update.message.reply_text('Forbidden')
        elif error_code == 404:
            self.logger.error(f"""Not Found: {error_code}""")
            await update.message.reply_text('Not Found')
        elif error_code == 500:
            self.logger.error(f"""Internal Server Error: {error_code}""")
            await update.message.reply_text('Internal Server Error')
        else:
            self.logger.error(f"""Unknown Error: {error_code}""")
            await update.message.reply_text('Unknown Error')

        # self.client.ingest_events('query_data', [{"error": message}])

    # Chat Commands

    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Sends a message with three inline buttons attached."""
        # set the menu button, which is changed via /setcommands in @botfather
        await self.application.bot.set_chat_menu_button(update.effective.chat.id)

        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        await update.message.reply_text(self.help_text)
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Displays info on how to use the bot."""
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        await update.message.reply_text(self.help_text)
        
    async def set_persona(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Parses the CallbackQuery and updates the message text to greeting with a persona"""
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        # @TODO: handle any errors

        chat_data = update.message.text.split(" ")
        persona = chat_data[1]
        self.persona = persona
        await update.message.reply_text(f"You are now chatting with a {self.persona} bot, any chat will be returned with an answer")

    async def set_persona_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Parses the CallbackQuery and updates the message text to greeting with a persona"""
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

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

        # handle api errors
        if response.status_code != 200:
            raise Exception(response.status_code, response.text)

        await update.message.reply_text(response.json()['data'])
    
    async def list_personas(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Displays info on how to use the bot."""
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        url = self.inquireApi + "/inquiries"
        headers = {
            "x-api-key": self.inquireApiKey,
        }

        response = requests.get(url, headers=headers)

        # handle api errors
        if response.status_code != 200:
            raise Exception(response.status_code, response.text)

        keyboard = [ ]
        for key in response.json()['data']:
            keyboard.append(
                [
                    InlineKeyboardButton(key['name'], callback_data=key["name"]),
                ],
            )

        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text("List of Personas", reply_markup=reply_markup)