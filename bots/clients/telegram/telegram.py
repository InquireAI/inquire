# @TODO: convert all logging into a single logger file

"""Make some requests to OpenAI's chatbot"""
import os

import logging
from typing import Optional, Tuple
import traceback
import json

import dotenv
import nest_asyncio

from utils.commands import Commands
from functools import wraps

import axiom

nest_asyncio.apply()
dotenv.load_dotenv()

import telegram
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
from telegram import ForceReply, Update, Chat, ChatMember, ChatMemberUpdated

from telegram.ext import (
    Application, 
    CommandHandler, 
    ContextTypes, 
    AIORateLimiter,    
    CommandHandler,
    ContextTypes,
    ChatMemberHandler
)

class Telegram:
    def __init__(self): 
        # Create the Application and pass it your bot's token.
        self.application = Application.builder().token(os.environ.get('TELEGRAM_API_KEY')).rate_limiter(AIORateLimiter(
                overall_max_rate=1, overall_time_period=1, group_max_rate=1, group_time_period=1, max_retries=0
            )).concurrent_updates(True).arbitrary_callback_data(True).build()

        # Enable logging
        logging.basicConfig(
            format="%(asctime)s - %(module)s - %(levelname)s - %(message)s", level=logging.INFO
        )
        self.logger = logging.getLogger(__name__)

        # set the USER_ID for Telegram for Auth controls
        self.USER_ID = ''
        if os.environ.get('TELEGRAM_USER_ID'):
            self.USER_ID = int(os.environ.get('TELEGRAM_USER_ID'))

        # create instance of axiom client
        self.client = axiom.Client(os.environ.get('AXIOM_TOKEN'))
        
        self.MAX_TIMEOUT = 30

        # create new instance of commands
        self.commands = Commands()
        
    # @TODO fix the authetication when ready to add rate limits per user account
    def auth(self):
        def decorator(func):
            @wraps(func)
            async def wrapper(self, update, context):
                if update.effective_user.id == self.USER_ID:
                    await func(update, context)
                else:
                    await update.message.reply_text("You are not authorized to use this bot")
            return wrapper
        return decorator

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
        self.logger.error(msg="Exception while handling an update:", exc_info=context.error)
        self.logger.error(msg=message)
        self.client.ingest_events('query_data', [{"error": message}])
        
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
                # Log new users to axiom
                self.client.ingest_events('user_data', [
                    {
                        "user_id": update.effective_user.id, 
                        "is_bot": update.effective_user.is_bot,
                        "first_name": update.effective_user.first_name,
                        "last_name": update.effective_user.last_name,
                        "username": update.effective_user.username,
                        "language_code": update.effective_user.language_code,
                        "is_premium": update.effective_user.is_premium,
                        "removed": False
                    }
                ])

                self.logger.info(f"New user: {update.effective_user.id}")
            elif was_member and not is_member:
                context.bot_data.setdefault("user_ids", set()).discard(chat.id)
                # Remove users to axiom
                self.client.ingest_events('user_data', [
                    {
                        "user_id": update.effective_user.id, 
                        "is_bot": update.effective_user.is_bot,
                        "first_name": update.effective_user.first_name,
                        "last_name": update.effective_user.last_name,
                        "username": update.effective_user.username,
                        "language_code": update.effective_user.language_code,
                        "is_premium": update.effective_user.is_premium,
                        "removed": True,
                        "group_id": -1
                    }
                ])

                self.logger.info(f"Removed user: {update.effective_user.id}")
        elif chat.type in [Chat.GROUP, Chat.SUPERGROUP]:
            if not was_member and is_member:
                context.bot_data.setdefault("group_ids", set()).add(chat.id)

                # Log new groups to axiom
                self.client.ingest_events('user_data', [
                    {
                        "user_id": update.effective_user.id, 
                        "is_bot": update.effective_user.is_bot,
                        "first_name": update.effective_user.first_name,
                        "last_name": update.effective_user.last_name,
                        "username": update.effective_user.username,
                        "language_code": update.effective_user.language_code,
                        "is_premium": update.effective_user.is_premium,
                        "removed": False,
                        "group_id": chat.id,
                    }
                ])

                self.logger.info(f"New group: {chat.id}")
            elif was_member and not is_member:
                context.bot_data.setdefault("group_ids", set()).discard(chat.id)

                # Remvove groups to axiom
                self.client.ingest_events('user_data', [
                    {
                        "user_id": update.effective_user.id, 
                        "is_bot": update.effective_user.is_bot,
                        "first_name": update.effective_user.first_name,
                        "last_name": update.effective_user.last_name,
                        "username": update.effective_user.username,
                        "language_code": update.effective_user.language_code,
                        "is_premium": update.effective_user.is_premium,
                        "removed": True,
                        "group_id": chat.id,
                    }
                ])

                self.logger.info(f"Removed group: {chat.id}")

    # @auth()
    # Start command for the bot
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Send a message when the command /start is issued. 
        Welcomes the user with what they can do
        :param update: Update object
        :param context: CallbackContext object
        """
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")
        self.logger.info(f"User: {update.effective_user.id} started the bot")

        # track users and chats
        try:
            result = self.extract_status_change(update.chat_member)
            if result is None:
                return
        except:
            pass

        user = update.effective_user
        await update.message.reply_html(
            f"Hi {user.mention_html()}! Welcome to Inquire. Get started by using the following commands:\n\n"
f"/chat, chat with Inquire about anything\n"
f"/search, chat with Inquire with the power of Google\n"
f"/draw, draw pictures using StableDiffusion\n\n"
f"inquire.run\n",
            reply_markup=ForceReply(selective=True),
        )

    # Help command for the bot
    # @auth()
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Send a message when the command /help is issued.
        :param update: Update object
        :param context: CallbackContext object
        """
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")
        self.logger.info(f"User: {update.effective_user.id} used /help")

        response = self.commands.help()
        await update.message.reply_text(response, parse_mode=telegram.constants.ParseMode.MARKDOWN)

    # Draw command for the bot
    # @auth()
    async def draw_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Send a message when the command /draw is issued. The steps are:
        - takes a prompt, passes to OpenAI to receive a more descriptive prompt 
        - takes the new prompt and passes it to stability to receive an image
        :param update: Update object
        :param context: CallbackContext object
        """
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")
        message = update.message.text.replace('/draw','')
        self.logger.info(f"User: {update.effective_user.id} used /draw with prompt {message}")

        self.client.ingest_events('query_data', [{"draw": message}])

        (prompt, photo) = await self.commands.draw(message)
        if photo is None:
            await update.message.reply_text(prompt)
        else:
            await update.message.reply_photo(photo=photo, caption=f"Prompt: {prompt}")

    # Search command for the bot
    # @auth()
    async def search_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")
        message = update.message.text.replace('/search','')
        self.logger.info(f"User: {update.effective_user.id} used /search with prompt {message}")

        self.client.ingest_events('query_data', [{"search": message}])

        response = await self.commands.search(message)
        await update.message.reply_text(response, parse_mode=telegram.constants.ParseMode.MARKDOWN)

    # Chat command for the bot
    # @auth()
    async def chat_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Send a message when the command /chat is issued by querying the GPT3 API
        :param update: Update object
        :param context: CallbackContext object
        """
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")
        message = update.message.text.replace('/chat','')
        self.logger.info(f"User: {update.effective_user.id} used /chat with prompt {message}")

        self.client.ingest_events('query_data', [{"chat": message}])

        response = await self.commands.chat(message)
        await update.message.reply_text(response, parse_mode=telegram.constants.ParseMode.MARKDOWN)

    def build(self) -> None:
        """Start the bot."""

        # TODO: integrate auth with planetscale
        # TODO: fix typing on all commands, it periodically stops working for /draw and /search
        # TODO: integrate with dust.tt
        # TODO: raise type errors all the way back to return a message to the user
        
        # Register command handlers
        # block-False allows for concurrent execution
        self.application.add_handler(CommandHandler("start", self.start_command, block=False))
        self.application.add_handler(CommandHandler("help", self.help_command, block=False))
        self.application.add_handler(CommandHandler("draw", self.draw_command, block=False))
        self.application.add_handler(CommandHandler("search", self.search_command, block=False))
        self.application.add_handler(CommandHandler("chat", self.chat_command, block=False))

        # Register status handlers
        self.application.add_handler(ChatMemberHandler(self.start_command, ChatMemberHandler.CHAT_MEMBER))
        self.application.add_handler(ChatMemberHandler(self.track_chats, ChatMemberHandler.MY_CHAT_MEMBER))

        # Register error handlers
        self.application.add_error_handler(self.error_handler)

        # Run the bot until the user presses Ctrl-C
        self.application.run_polling(allowed_updates=Update.ALL_TYPES)