"""Make some requests to OpenAI's chatbot"""
import json
import time
import os

from playwright.sync_api import sync_playwright
from playwright.async_api import async_playwright
import logging

import dotenv
import nest_asyncio

from functools import wraps

from telegram.helpers import escape, escape_markdown
from telegram import Update
from telegram.ext import ContextTypes

nest_asyncio.apply()
dotenv.load_dotenv()

class ChatGPT:
    def __init__(self): 
        self.user_data = '/tmp/playwright'

        self.OPENAI_EMAIL = ''
        if os.environ.get('OPENAI_EMAIL'):
            self.OPENAI_EMAIL = os.environ.get('OPENAI_EMAIL')

        self.OPENAI_PASSWORD = ''
        if os.environ.get('OPENAI_PASSWORD'):
            self.OPENAI_PASSWORD = os.environ.get('OPENAI_PASSWORD')

        # Enable logging
        logging.basicConfig(
            format="%(asctime)s - %(module)s - %(levelname)s - %(message)s", level=logging.INFO
        )
        self.logger = logging.getLogger(__name__)

        # check if /tmp/playwright exists prior to running  
        self.prompt_bypass = False
        if not os.path.exists(self.user_data):
            self.prompt_bypass = True

        self.PLAY = sync_playwright().start()
        self.BROWSER = self.PLAY.chromium.launch_persistent_context(
            user_data_dir=self.user_data,
            headless=True,
            user_agent='Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; en-us) AppleWebKit/534.50 (KHTML, like Gecko) Version/5.1 Safari/534.50'
        )
        self.PAGE = self.BROWSER.new_page()

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

    async def get_input_box(self):
        """Get the child textarea of `PromptTextarea__TextareaWrapper`"""
        self.logger.info('Getting Input')
        try:
            textarea = await asyncio.wait_for(self.PAGE.query_selector('textarea'), timeout=self.MAX_TIMEOUT)
        except TimeoutError:
            self.logger.error('The task was cancelled due to a timeout')
            await update.message.reply_text(f"OpenAI is taking too long to respond to prompt: `{update.message.text}`")
            return None
        self.logger.info('Got Input')

        return textarea

    def is_logged_in(self):
        # See if we have a textarea with data-id="root"
        return self.get_input_box() is not None

    def send_message(self, message):
        # Send the message
        try:
            box = self.get_input_box()
            self.logger.info("Box: " + box)
            box.click()
            box.fill(message)
            box.press("Enter")
            self.logger.info("Sent message: " + message)
        except Exception as e:
            self.logger.error("Error sending message: " + str(e))
    
    @auth()
    async def reload(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Send a message when the command /help is issued."""
        self.logger.info(f"Got a reload command from user {update.effective_user.id}")
        self.PAGE.reload()
        await update.message.reply_text("Reloaded the browser!")

    def get_last_message(self):
        """Get the latest message"""
        page_elements = self.PAGE.query_selector_all("div[class*='request-']")
        last_element = page_elements[-1]
        prose = last_element

        # checking that there is text in the response
        try:
            code_blocks = prose.query_selector_all("pre")
        except Exception as e:
            response = 'Server probably disconnected, try running /reload'
            return response

        # if there are code blocks, we need to format them
        if len(code_blocks) > 0:
            # get all children of prose and add them one by one to respons
            response = ""
            for child in prose.query_selector_all('p,pre'):
                if str(child.get_property('tagName')) == "PRE":
                    code_container = child.query_selector("code")
                    response += f"\n```\n{escape_markdown(code_container.inner_text(), version=2)}\n```"
                else:
                    #replace all <code>x</code> things with `x`
                    text = child.inner_html()
                    response += escape_markdown(text, version=2)
            response = response.replace("<code\>", "`")
        else:
            response = escape_markdown(prose.inner_text(), version=2)
        
        # initial clean
        self.logger.info('Received Response\n ' + response)
        return response

    async def check_loading(self, update, application):
        #button has an svg of submit, if it's not there, it's likely that the three dots are showing an animation
        submit_button = self.PAGE.query_selector_all("textarea+button")[0]
        # with a timeout of 90 seconds, created a while loop that checks if loading is done
        loading = submit_button.query_selector_all(".text-2xl")
        #keep checking len(loading) until it's empty or 45 seconds have passed
        await application.bot.send_chat_action(update.effective_chat.id, "typing")

        start_time = time.time()
        while len(loading) > 0:
            # Wait 5 seconds before timeout
            if time.time() - start_time > 90:
                break
            time.sleep(0.5)
            loading = submit_button.query_selector_all(".text-2xl")
            await application.bot.send_chat_action(update.effective_chat.id, "typing")

    def start_browser(self):
        self.PAGE.goto("https://chat.openai.com/")
        if not self.is_logged_in():
            self.logger.info("Logging into ChatGPT")
            self.PAGE.goto('https://chat.openai.com/auth/login')
            self.PAGE.locator(r'//*[@id="__next"]/div/div/div[4]/button[1]').click()
            self.PAGE.get_by_label("Email address").fill(self.OPENAI_EMAIL)
            self.PAGE.locator('button[name=\"action\"]').click()
            self.PAGE.get_by_label("Password").fill(self.OPENAI_PASSWORD)
            self.PAGE.locator('button[name=\"action\"]').click()

            # check if /tmp/playwright is empty
            if self.prompt_bypass:
                self.PAGE.locator(r'//*[@id="headlessui-dialog-panel-:r1:"]/div[2]/div[4]/button').click()
                self.PAGE.locator(r'//*[@id="headlessui-dialog-panel-:r1:"]/div[2]/div[4]/button[2]').click()
                self.PAGE.locator(r'//*[@id="headlessui-dialog-panel-:r1:"]/div[2]/div[4]/button[2]').click()
                self.logger.info("Passed intro messages on first start")
            
            self.logger.info("ChatGPT Logged in and Ready for Queries")
        else:
            self.logger.info("ChatGPT Ready for Queries")