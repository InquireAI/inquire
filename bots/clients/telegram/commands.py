import logging
import requests
from uuid import uuid4

import random
import time

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
from telegram.ext import ContextTypes

class Commands:
    def __init__(self, application, personas, api_keys):
         # Enable logging
        logging.basicConfig(
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
        )
        self.logger = logging.getLogger(__name__)

        self.application = application
        self.personas = personas
        # setting initial persona to `chat`
        self.persona = "chat"

        self.logger.info(f"""Starting Inquire Telegram Bot with persona {self.persona}""")

        (self.inquireApiKey, self.inquireApi) = api_keys

        # Help text
        self.help_text = f"""
Inquire is a converstational chatbot that can take the form of just about any persona.
            
To list all personas available, use the `/list` command select who you would like to talk to. To query the persona, simply send a message to the bot. 
            
You can change the persona at any time by using the `/list` command again or directly by using /set followed by the persona name (e.g. `/set trainer`).

Learn more about Inquire at https://inquire.run
        """

    # Send a message to a chat
    async def send_message(self, update: Update, text: str, **kwargs):
        """
        Send a message to a chat, splitting it into multiple messages if it's too long see https://github.com/python-telegram-bot/python-telegram-bot/issues/768
        :param update: Update object
        :param chat_id: Chat ID
        :param text: Text to send
        """
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        MAX_TEXT_LENGTH = 4096
        if len(text) <= MAX_TEXT_LENGTH:
            return await update.message.reply_text(text, **kwargs)

        parts = []
        while len(text) > 0:
            if len(text) > MAX_TEXT_LENGTH:
                part = text[:MAX_TEXT_LENGTH]
                first_lnbr = part.rfind('\n')
                if first_lnbr != -1:
                    parts.append(part[:first_lnbr])
                    text = text[first_lnbr:]
                else:
                    parts.append(part)
                    text = text[MAX_TEXT_LENGTH:]
            else:
                parts.append(text)
                break

        msg = None
        for part in parts:
            msg = await self.send_message(update, part, **kwargs)
            time.sleep(1)
        return msg  # return only the last message

    # Chat Commands

    # Help command handler
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Sends the help text to the user
        :param update: Update object
        :param context: CallbackContext object
        """
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        await update.message.reply_text(self.help_text)
    
    # Sets the persona for a chat
    async def set_persona_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Sets the persona for a chat, used to query the correct persona
        :param update: Update object
        :param context: CallbackContext object
        """
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        chat_data = update.message.text.split('/')[1].split(' ')
        persona_data = chat_data[1]

        self.persona = persona_data

        # if chat_data is > 3 then the user also sent a query with the command
        # also query the persona
        if len(chat_data) > 3:
            await update.message.reply_text(f"You are now chatting with a {self.persona} bot, answering your question...")
            await self.query_persona(update, context)
        else:
            await update.message.reply_text(f"You are now chatting with a {self.persona} bot, any chat will be returned with an answer")

    # List a random 10 personas for the user
    async def random_personas_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        List a random 10 personas for the user
        :param update: Update object
        :param context: CallbackContext object
        """
        keyboard = [ ]
        persona_count = 0

        # randomise the personas
        random.shuffle(self.personas)

        for key in self.personas:
            if persona_count< 10:
                keyboard.append(
                    [
                        InlineKeyboardButton(key['name'], callback_data=key["name"]),
                    ],
                )
                persona_count += 1
            else:
                break

        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text("List of 10 Random Personas", reply_markup=reply_markup)

    # List all commands and personas that can be used
    async def list_all_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        List all commands and personas that can be used
        :param update: Update object
        :param context: CallbackContext object
        """
        with open("personas.txt", "r") as f:
            await self.send_message(update, f.read())
            # await update.message.reply_text(f.read())

        # When a user selects a persona from the list set it
    async def set_persona_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Sets the persona for a chat, used to query the correct persona
        :param update: Update object
        :param context: CallbackContext object
        """
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        query = update.callback_query

        # CallbackQueries need to be answered, even if no notification to the user is needed
        # Some clients may have trouble otherwise. See https://core.telegram.org/bots/api#callbackquery
        await query.answer()

        self.persona = query.data
        await query.edit_message_text(text=f"You are now chatting with a {query.data} bot, any chat will be returned with an answer")

    # Call the Inquire API to query the persona
    async def query_persona(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Call the Inquire API to query the persona
        :param update: Update object
        :param context: CallbackContext object
        """
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

        await self.send_message(update, response.json()['data'])
    
    # Handle the inline query
    async def inline_query(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Handle the inline query. This is run when you type: @botusername <query>
        :param update: Update object
        :param context: CallbackContext object
        """
        query = update.inline_query.query

        if query == "":
            return

        # search personas for the query
        results = [ ]
        for key in self.personas:
            if query.lower() in key['name'].lower():
                results.append(
                    InlineQueryResultArticle(
                        id=str(uuid4()),
                        title=key['name'],
                        input_message_content=InputTextMessageContent(f"/set {key['name']}"),
                        description=f"{key['description']}",
                    ),
                )

        await update.inline_query.answer(results)