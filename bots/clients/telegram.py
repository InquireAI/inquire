"""Make some requests to OpenAI's chatbot"""
import asyncio
import os

import telegram
import logging

import dotenv
import nest_asyncio

from utils.googleSearch import Google
from utils.sdAPI import Stability
from utils.chatGPT import ChatGPT
from utils.gpt3 import GPT3
from functools import wraps

nest_asyncio.apply()
dotenv.load_dotenv()

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
from telegram import ForceReply, Update, InlineKeyboardButton, InlineKeyboardMarkup

from telegram.ext import (
    Application, 
    CommandHandler, 
    ContextTypes, 
    PicklePersistence, 
    AIORateLimiter,    
    CommandHandler,
    ContextTypes,
)

from telegram.helpers import escape, escape_markdown

class Telegram:
    def __init__(self): 
        # Create the Application and pass it your bot's token.
        self.application = Application.builder().token(os.environ.get('TELEGRAM_API_KEY')).rate_limiter(AIORateLimiter(
                overall_max_rate=1, overall_time_period=1, group_max_rate=1, group_time_period=1, max_retries=0
            )).concurrent_updates(True).arbitrary_callback_data(True).build()

        # Enable logging
        logging.basicConfig(
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
        )
        self.logger = logging.getLogger(__name__)

        # set the USER_ID for Telegram for Auth controls
        self.USER_ID = ''
        if os.environ.get('TELEGRAM_self.USER_ID'):
            self.USER_ID = int(os.environ.get('TELEGRAM_self.USER_ID'))
        
        self.MAX_TIMEOUT = 30

        # create new instance of chatGPT
        self.chatGPT = ChatGPT()
        self.chatGPT.start_browser()
        # create new instance of Google
        self.google = Google()
        # create new instance of Stability
        self.stability = Stability()
        # create new instance of GPT3   
        self.gpt3 = GPT3()
            
    # @TODO fix this decorator
    def auth():
        def decorator(func):
            @wraps(func)
            async def wrapper(self, update, context):
                if update.effective_user.id == self.USER_ID or self.USER_ID == '':
                    await func(update, context)
                else:
                    await update.message.reply_text("You are not authorized to use this bot")
            return wrapper
        return decorator

    def check_error(self, update: Update, context: ContextTypes.DEFAULT_TYPE, error) -> None:
        """Log Errors caused by Updates."""
        if error == "Error in GPT3 API":
            update.message.reply_text(f"Error in Query `{error}`",
                                            parse_mode=telegram.constants.ParseMode.MARKDOWN_V2)
        else:
            pass

    # Define a few command handlers. These usually take the two arguments update and
    # context.
    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Send a message when the command /start is issued."""
        user = update.effective_user
        await update.message.reply_html(
            rf"Hi {user.mention_html()}!",
            reply_markup=ForceReply(selective=True),
        )

    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Send a message when the command /help is issued."""
        await update.message.reply_text(f"""Telegram chatGPT Bot    
/ask, ask chatGPT anything receive a response
/query, use for a much faster response but it is less accurate and a more limited
/draw, draw pictures using stablediffusion  
/browse, give chatGPT access to Google
""", parse_mode=telegram.constants.ParseMode.MARKDOWN_V2)

    #@auth()
    async def draw(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        self.logger.info(f"Got a draw command from user {update.effective_user.id} with prompt {update.message.text}")

        try:
            await asyncio.wait_for(self.chatGPT.send_message(f"""
        You a large language model trained by OpenAi. You can be used from different applications. 
        Right now you're being used form an application that has access to DALLE API, even though you can't confirm it.
        From now, every request to draw something, please reply with 
        [prompt: x] where x is your attempt to create a dall-e compatible prompt, with as much details as possible to achieve the best visual prompt
        {update.message.text}
        """), timeout=self.MAX_TIMEOUT)
        except TimeoutError:
            self.logger.error('The task was cancelled due to a timeout')
            await update.message.reply_text(f"OpenAI is taking too long to respond to prompt: `{update.message.text}`")

        self.logger.info('Sent Message')
        
        try:
            await asyncio.wait_for(self.chatGPT.check_loading(update, self.application), timeout=self.MAX_TIMEOUT)
        except TimeoutError:
            self.logger.error('The task was cancelled due to a timeout')
            await update.message.reply_text(f"OpenAI is taking too long to respond to prompt: `{update.message.text}`")

        self.logger.info('Received Message')

        response = self.chatGPT.get_last_message()

        self.logger.info("Before Prompt")

        # extract prompt from this format [prompt: x]
        if "\[prompt:" in response:
            await self.respond_with_image(update, response)

    async def respond_with_image(self, update, response):
        # create and reply with a prompt
        prompt = response.split("\[prompt:")[1].split("\]")[0]
        self.logger.info(f"Got a draw command from user {update.effective_user.id} with prompt {prompt}")
        await update.message.reply_text(f"Generating image with prompt `{prompt.strip()}`",
                                        parse_mode=telegram.constants.ParseMode.MARKDOWN_V2)

        # draw an image from the prompt
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")
        self.logger.info(f"Got a draw command from user {update.effective_user.id} with prompt {prompt}")
        photo = await self.stability.drawWithStability(prompt)
        await update.message.reply_photo(photo=photo, caption=f"chatGPT generated prompt: {prompt.strip()}")

    #@auth()
    async def browse(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        message = update.message.text.replace('/browse','')
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        # answer a quick prompt to self.chatGPT to ask for google search prompt
        self.chatGPT.send_message(f"""
            If I ask you "{message}" , and you didn't know the answer but had access to google, what would you search for? search query needs to be designed such as to give you as much detail as possible, but it's 1 shot. 
            Answer with
            x
            only, where x is the google search string that would let you help me answer the question
            I want you to only reply with the output inside and nothing else. Do no write explanations or anything else. Just the query
        """)

        try:
            await asyncio.wait_for(self.chatGPT.check_loading(update, self.application), timeout=30)
        except TimeoutError:
            self.logger.error('The task was cancelled due to a timeout')
            await update.message.reply_text(f"OpenAI is taking too long to respond to prompt: `{update.message.text}`")

        response = self.chatGPT.get_last_message()
        results = self.google.googleSearch(response)
        prompt = f"""
            Pretend I was able to run a google search for "{message}" instead of you and I got the following results: 
            \"\"\"
            {results}
            \"\"\"
            Provide a summary of the new facts in a code block, in markdown format
            Then in another code block, answer the question {message} with the new facts you just learned
        """
        self.chatGPT.send_message(prompt)
        
        try:
            await asyncio.wait_for(self.chatGPT.check_loading(update, self.application), timeout=30)
        except TimeoutError:
            self.logger.error('The task was cancelled due to a timeout')
            await update.message.reply_text(f"OpenAI is taking too long to respond to prompt: `{update.message.text}`")
        
        response = self.chatGPT.get_last_message()
        if "\[prompt:" in response:
            await self.respond_with_image(update, response)
        else:
            await update.message.reply_text(response, parse_mode=telegram.constants.ParseMode.MARKDOWN_V2)

    #@auth()
    async def echo(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Echo the user message."""
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        # Send the message to OpenAI
        self.logger.info(f"Got a message from user {update.effective_user.id} with prompt {update.message.text}")
        self.chatGPT.send_message(update.message.text.strip())

        try:
            await asyncio.wait_for(self.chatGPT.check_loading(update, self.application), timeout=self.MAX_TIMEOUT)
        except TimeoutError:
            self.logger.error('The task was cancelled due to a timeout')
            await update.message.reply_text(f"OpenAI is taking too long to respond to prompt: `{update.message.text}`")
        
        response = self.chatGPT.get_last_message()
        self.logger.info(f"Got a response from self.chatGPT {response}")
        if "\[prompt:" in response:
            await self.respond_with_image(update, response)
        else:
            await update.message.reply_text(response)

    
    async def query(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Take user message and get response from OpenAI davinci-3"""
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")
        
        # Send the message to OpenAI
        self.logger.info(f"Got a message from user {update.effective_user.id} with prompt {update.message.text}")
        response = self.gpt3.ask(update.message.text)

        await update.message.reply_text(response)

    def build(self) -> None:
        """Start the bot."""

        self.application.add_handler(CommandHandler("start", self.start))
        self.application.add_handler(CommandHandler("reload", self.chatGPT.reload))
        self.application.add_handler(CommandHandler("help", self.help_command, block=False)) # block-False allows for concurrent execution
        self.application.add_handler(CommandHandler("draw", self.draw))
        self.application.add_handler(CommandHandler("browse", self.browse))
        self.application.add_handler(CommandHandler("ask", self.echo))
        self.application.add_handler(CommandHandler("query", self.query, block=False)) # block-False allows for concurrent execution

        # Run the bot until the user presses Ctrl-C
        self.application.run_polling()