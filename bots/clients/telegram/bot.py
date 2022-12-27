import os
import logging

import requests
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

import telegram
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    AIORateLimiter,
)

import dotenv
import nest_asyncio

nest_asyncio.apply()
dotenv.load_dotenv()

# Stages
START_ROUTES, END_ROUTES = range(2)
# Callback data
ONE, TWO, THREE, FOUR = range(4)

class Telegram:
    def __init__(self) -> None:
        """Run the bot."""
        # Enable logging
        logging.basicConfig(
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
        )
        self.logger = logging.getLogger(__name__)

        # Collect enviroment variables 
        self.telegram_api_key = os.environ.get('TELEGRAM_API_KEY')
        self.inquire_api = os.environ.get('INQUIRE_API')
        self.inquire_api_key = os.environ.get('INQUIRE_API_KEY')

        # Define Inquire Headers 
        self.inquire_headers =  {
            "Content-Type": "application/json",
            "x-api-key": self.inquire_api_key
        }

        self.application = Application.builder().token(self.telegram_api_key).rate_limiter(AIORateLimiter(
                overall_max_rate=1, overall_time_period=1, group_max_rate=1, group_time_period=1, max_retries=0
        )).concurrent_updates(True).arbitrary_callback_data(True).build()

        # Setup conversation handler with the states FIRST and SECOND
        # Use the pattern parameter to pass CallbackQueries with specific
        # data pattern to the corresponding handlers.
        # ^ means "start of line/string"
        # $ means "end of line/string"
        # So ^ABC$ will only allow 'ABC'
        conv_handler = ConversationHandler(
            entry_points=[CommandHandler("start", self.start, block=False)],
            states={
                START_ROUTES: [
                    CallbackQueryHandler(self.one, pattern="^" + str(ONE) + "$"),
                    CallbackQueryHandler(self.two, pattern="^" + str(TWO) + "$"),
                    CallbackQueryHandler(self.three, pattern="^" + str(THREE) + "$"),
                    CallbackQueryHandler(self.four, pattern="^" + str(FOUR) + "$"),
                ],
                END_ROUTES: [
                    CallbackQueryHandler(self.start_over, pattern="^" + str(ONE) + "$"),
                    CallbackQueryHandler(self.end, pattern="^" + str(TWO) + "$"),
                ],
            },
            fallbacks=[CommandHandler("start", self.start)],
        )

        # Add ConversationHandler to application that will be used for handling updates
        self.application.add_handler(conv_handler)

        # Direct chats
        self.application.add_handler(CommandHandler("help", self.help_command, block=False))
        self.application.add_handler(CommandHandler("list", self.list_personas, block=False))

        # Run the bot until the user presses Ctrl-C
        self.application.run_polling(allowed_updates=Update.ALL_TYPES)

    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Send message on `/start`."""
        # Get user that sent /start and log his name
        user = update.message.from_user
        self.logger.info("User %s started the conversation.", user.first_name)
        # Build InlineKeyboard where each button has a displayed text
        # and a string as callback_data
        # The keyboard is a list of button rows, where each row is in turn
        # a list (hence `[[...]]`).
        keyboard = [
            [
                InlineKeyboardButton("1", callback_data=str(ONE)),
                InlineKeyboardButton("2", callback_data=str(TWO)),
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        # Send message with text and appended InlineKeyboard
        await update.message.reply_text("Start handler, Choose a route", reply_markup=reply_markup)
        # Tell ConversationHandler that we're in state `FIRST` now
        return START_ROUTES

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

        response =  help_text = f"""Inquire    
/chat, chat with Inquire about anything
/search, chat with Inquire with the power of Google
/draw, draw pictures using StableDiffusion  
    """
        await update.message.reply_text(response, parse_mode=telegram.constants.ParseMode.MARKDOWN)

    async def start_over(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Prompt same text & keyboard as `start` does but not as new message"""
        # Get CallbackQuery from Update
        query = update.callback_query
        # CallbackQueries need to be answered, even if no notification to the user is needed
        # Some clients may have trouble otherwise. See https://core.telegram.org/bots/api#callbackquery
        await query.answer()
        keyboard = [
            [
                InlineKeyboardButton("1", callback_data=str(ONE)),
                InlineKeyboardButton("2", callback_data=str(TWO)),
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        # Instead of sending a new message, edit the message that
        # originated the CallbackQuery. This gives the feeling of an
        # interactive menu.
        await query.edit_message_text(text="Start handler, Choose a route", reply_markup=reply_markup)
        return START_ROUTES

    async def list_personas(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        url = self.inquire_api + "/inquiries"
        response = requests.get(url, headers=self.inquire_headers)

        if response.status_code != 200:
            await update.message.reply_text("Inquire API Error")
        else:
            personas = response.json()

            keyboard = [[]]
            for key in personas['data']:
                keyboard[0].append(InlineKeyboardButton(key['name'], callback_data=str(ONE)))

            reply_markup = InlineKeyboardMarkup(keyboard)
            await update.message.reply_text("List of Personas", reply_markup=reply_markup)

    async def one(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Show new choice of buttons"""
        query = update.callback_query
        await query.answer()
        keyboard = [
            [
                InlineKeyboardButton("3", callback_data=str(THREE)),
                InlineKeyboardButton("4", callback_data=str(FOUR)),
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(
            text="First CallbackQueryHandler, Choose a route", reply_markup=reply_markup
        )
        return START_ROUTES


    async def two(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Show new choice of buttons"""
        query = update.callback_query
        await query.answer()
        keyboard = [
            [
                InlineKeyboardButton("1", callback_data=str(ONE)),
                InlineKeyboardButton("3", callback_data=str(THREE)),
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(
            text="Second CallbackQueryHandler, Choose a route", reply_markup=reply_markup
        )
        return START_ROUTES


    async def three(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Show new choice of buttons. This is the end point of the conversation."""
        query = update.callback_query
        await query.answer()
        keyboard = [
            [
                InlineKeyboardButton("Yes, let's do it again!", callback_data=str(ONE)),
                InlineKeyboardButton("Nah, I've had enough ...", callback_data=str(TWO)),
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(
            text="Third CallbackQueryHandler. Do want to start over?", reply_markup=reply_markup
        )
        # Transfer to conversation state `SECOND`
        return END_ROUTES


    async def four(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Show new choice of buttons"""
        query = update.callback_query
        await query.answer()
        keyboard = [
            [
                InlineKeyboardButton("2", callback_data=str(TWO)),
                InlineKeyboardButton("3", callback_data=str(THREE)),
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(
            text="Fourth CallbackQueryHandler, Choose a route", reply_markup=reply_markup
        )
        return START_ROUTES


    async def end(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Returns `ConversationHandler.END`, which tells the
        ConversationHandler that the conversation is over.
        """
        query = update.callback_query
        await query.answer()
        await query.edit_message_text(text="See you next time!")
        return ConversationHandler.END