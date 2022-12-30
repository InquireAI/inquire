from clients.telegram.commands import Commands

import os
import logging
import traceback

import requests
from typing import Optional, Tuple
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
from telegram import ChatMember, ChatMemberUpdated, Chat, Update
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ContextTypes, AIORateLimiter, MessageHandler, filters, InlineQueryHandler, ChatMemberHandler

import dotenv
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

        # load all personas from the db
        url = self.inquireApi + "/inquiries"
        headers = {
            "x-api-key": self.inquireApiKey,
        }

        response = requests.get(url, headers=headers)

        # handle api errors
        if response.status_code != 200:
            self.logger.error('Error loading personas: %s', response.text)
            raise Exception(response.status_code, response.text)

        self.personas = response.json()['data']

        # write personas to file this can be send to @botfather for the /setcommands
        with open('./personas.txt', 'w') as f:
            # set base commands
            f.write(f"""
help - Show a help message
chat - Directly chat with the bot
random - Show random personas
persona - Show the current persona
set - Set the persona to talk to
""")
            for persona in self.personas:
                f.write(f"""{persona['name']} - {persona['description']}\n""")
            self.logger.info("Personas loaded")

        # Create the Application and pass it your bot's token.
        self.application = Application.builder().token(self.telegramApiKey).rate_limiter(AIORateLimiter(
                overall_max_rate=1, overall_time_period=1, group_max_rate=1, group_time_period=1, max_retries=0
            )).concurrent_updates(True).arbitrary_callback_data(True).build()

        # Base set of commands for the bot (will be changed with a /start command)
        base_persona = "chat"
        self.commands = Commands(self.application, base_persona, self.personas, (self.inquireApiKey, self.inquireApi))

        # direct handlers 
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("help", self.commands.help_command))
        self.application.add_handler(CommandHandler("random", self.commands.random_personas_command))
        self.application.add_handler(CommandHandler("set", self.commands.set_persona_command))
        self.application.add_handler(CommandHandler("chat", self.commands.chat_command))
        self.application.add_handler(CommandHandler("all", self.commands.list_all_command))
        self.application.add_handler(CommandHandler("persona", self.commands.current_persona_command))

        # inline handlers
        self.application.add_handler(CallbackQueryHandler(self.commands.set_persona_callback))

        # generic command handler 
        self.application.add_handler(MessageHandler(filters.COMMAND, self.commands.set_persona_command))

        # general chat handler 
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.commands.query_persona))

        # chat stats handler
        self.application.add_handler(ChatMemberHandler(self.start_command, ChatMemberHandler.CHAT_MEMBER))
        self.application.add_handler(ChatMemberHandler(self.track_chats, ChatMemberHandler.MY_CHAT_MEMBER))

        # inline query handler, this is run when you type: @botusername <query>
        self.application.add_handler(InlineQueryHandler(self.commands.inline_query))

        # Register error handlers
        self.application.add_error_handler(self.error_handler)

        # Run the bot until the user presses Ctrl-C
        self.application.run_polling()

    # Start command handler
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Starts the bot with a new set of commands
        :param update: Update object
        :param context: CallbackContext object
        """
        # set the menu button, which is changed via /setcommands in @botfather
        await self.application.bot.set_chat_menu_button(update.effective_chat.id)

        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        # check if an persona was set via a deep link
        command = update.message.text.split(" ")
        if len(command) > 1:
            deep_link = command[1]
            # Create a new set of commands for each chat
            self.commands = Commands(self.application, deep_link, self.personas, (self.inquireApiKey, self.inquireApi))
            await self.commands.set_deeplink_persona(deep_link, update, context)
        else:
            self.logger.info(f"""Bot Started from: {update.effective_chat.id}""")
            # Create a new set of commands for each chat
            base_persona = "chat"
            self.commands = Commands(self.application, base_persona, self.personas, (self.inquireApiKey, self.inquireApi))
            await update.message.reply_text(f"""Inquire is a conversational chatbot that can take the form of just about any persona. For example, you can talk to a doctor, a lawyer, a therapist, or even a fictional character. Inquire is a work in progress, so please be patient as we add more personas. Check out the /help command for more information or sign up for an unrestricted account at https://inquire.chat.""")

    # Extract the status change from a ChatMemberUpdated object
    def extract_status_change(self, chat_member_update: ChatMemberUpdated) -> Optional[Tuple[bool, bool]]:
        """
        Extract the status change from a ChatMemberUpdated object
        :param chat_member_update: ChatMemberUpdated object
        :return: Tuple of (was_member, is_member)
        """
        status_change = chat_member_update.difference().get("status")
        old_is_member, new_is_member = chat_member_update.difference().get("is_member", (None, None))

        if status_change is None:
            return None

        old_status, new_status = status_change
        was_member = old_status in [
            ChatMember.MEMBER,
            ChatMember.OWNER,
            ChatMember.ADMINISTRATOR,
        ] or (old_status == ChatMember.RESTRICTED and old_is_member is True)
        is_member = new_status in [
            ChatMember.MEMBER,
            ChatMember.OWNER,
            ChatMember.ADMINISTRATOR,
        ] or (new_status == ChatMember.RESTRICTED and new_is_member is True)

        return was_member, is_member

    # Track the chats the bot is in
    async def track_chats(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Tracks the chat ids of the chats the bot is in
        :param update: Update object
        :param context: CallbackContext object
        """
        result = self.extract_status_change(update.my_chat_member)
        if result is None:
            return
        was_member, is_member = result

        # Handle chat types differently:
        chat = update.effective_chat
        if chat.type == Chat.PRIVATE:
            if not was_member and is_member:
                context.bot_data.setdefault("user_ids", set()).add(chat.id)
                self.logger.info(f"New user: {update.effective_user.id}")
            elif was_member and not is_member:
                context.bot_data.setdefault("user_ids", set()).discard(chat.id)
                self.logger.info(f"Removed user: {update.effective_user.id}")
        elif chat.type in [Chat.GROUP, Chat.SUPERGROUP]:
            if not was_member and is_member:
                context.bot_data.setdefault("group_ids", set()).add(chat.id)
                self.logger.info(f"New group: {chat.id}")
            elif was_member and not is_member:
                context.bot_data.setdefault("group_ids", set()).discard(chat.id)
                self.logger.info(f"Removed group: {chat.id}")

    # Error handler to capture errors
    async def error_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Error handler for the bot to log errors
        :param update: Update object
        :param context: CallbackContext object
        """
        # handle codes and errors
        message = None
        try:
            (error_code, message) = context.error.args
        except:
            (error_code,) = context.error.args

        self.logger.error(f"""Update {update} caused error {context.error}""")

        # if message if defined, handle it more specifically
        # if there is not a specific message fallback on the error code
        if message is not None:
            message = json.loads(message)
            message_code = message['code']
            message_message = message['message']

            if message_code == "NOT_FOUND":
                self.logger.error(f"""Persona Not Found: {context.chat_data}""")
                await update.message.reply_text('Persona Not Found, please use /list to see available personas')
            if message_code == 'INVALID_SUBSCRIPTION' and message_message == 'Limit has been reached and subscription not found':
                self.logger.error(f"""Subscription Limit Reached: {context.chat_data}""")
                await update.message.reply_text(f"""@{update.message.from_user.username}  your subscription limit has been reached, please sign up at https://inquire.run for only $5/mo to continue using Inquire""")
            if message_code == 'INVALID_SUBSCRIPTION' and message_message == 'Subscription not found':
                self.logger.error(f"""Subscription Not Found: {context.chat_data}""")
                await update.message.reply_text(f"""@{update.message.from_user.username} your subscription is not found, please check your account at https://inquire.run""")
            if message_code == 'QUOTA_REACHED':
                self.logger.error(f"""Quota Reached: {context.chat_data}""")
                await update.message.reply_text(f"""@{update.message.from_user.username} your free tier number of inquries have been reached, please sign up at https://inquire.run for only $5/mo to continue using Inquire""")
            if message_code == 'UNAUTHORIZED':
                self.logger.error(f"""Unauthorized: {context.chat_data}""")
                await update.message.reply_text('Unauthorized')

        # traceback.format_exception returns the usual python message about an exception, but as a
        # list of strings rather than a single string, so we have to join them together.
        tb_list = traceback.format_exception(None, context.error, context.error.__traceback__)
        tb_string = "".join(tb_list)

        # Build the message with some markup and additional information about what happened.
        update_str = update.to_dict() if isinstance(update, Update) else str(update)
        user_message = (
            f"An exception was raised while handling an update\n"
            f"Error Code = {error_code}\n"
            f"Error Message = {message}\n"
            f"update = {json.dumps(update_str, indent=2, ensure_ascii=False)}"
            f"context.chat_data = {str(context.chat_data)}\n\n"
            f"context.user_data = {str(context.user_data)}\n\n"
            f"{tb_string}"
        )

        # Log errors
        self.logger.error(msg="Exception while handling an update:", exc_info=context.error)
        self.logger.error(msg=user_message)