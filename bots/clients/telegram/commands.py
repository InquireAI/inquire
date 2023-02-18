import logging
import requests
from uuid import uuid4

import random
import time
import json
import polling2

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
    def __init__(self, application, persona, personas, api_keys):
        # Enable logging
        self.logger = logging.getLogger(__name__)

        self.application = application
        self.personas = personas
        self.persona_list = list()
        for persona in self.personas:
            self.persona_list.append(persona['name'])
        # setting initial persona to `chat`
        self.persona = persona

        (self.inquireApiKey, self.inquireApi) = api_keys

        # Help text
        self.help_text = f"""
Inquire is a conversational chatbot that can take the form of just about any persona.

To get started start typing `@inquireai_bot` followed by the persona you want to chat with (e.g. `@inquireai_bot math-teacher`). Any message after will be answered!

If you are in a group chat you will need to preface your inquiry with `/chat`

Learn more about Inquire at https://inquire.run
        """

    # Send a message to a chat
    async def send_message(self, update: Update, text: str, **kwargs):
        self.logger.info("Sending message")

        """
        Send a message to a chat, splitting it into multiple messages if it's too long see https://github.com/python-telegram-bot/python-telegram-bot/issues/768
        :param update: Update object
        :param chat_id: Chat ID
        :param text: Text to send
        """
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        MAX_TEXT_LENGTH = 4096
        if len(text) <= MAX_TEXT_LENGTH:
            self.logger.info("Message is below max length. Sending reply")
            msg = await update.message.reply_text(text, **kwargs, parse_mode="Markdown")
            self.logger.info("Reply sent")
            return msg

        self.logger.info("Message is above max size. Sending in parts.")
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
            self.logger.info("Message sent")
            time.sleep(1)
        self.logger.info("All message parts sent")
        return msg  # return only the last message

    # Put chat related data https://github.com/python-telegram-bot/python-telegram-bot/wiki/Storing-bot,-user-and-chat-related-data
    async def put(self, data, update, context):
        """
        Put chat related data
        :param update: Update object
        :param context: CallbackContext object
        """
        # response could either be a chat or a callback
        # query, so we need to check which one it is
        try:
            key = update.message.chat_id
        except:
            key = update.callback_query.message.chat.id

        # Store value
        context.chat_data[key] = data

    # Get chat related data https://github.com/python-telegram-bot/python-telegram-bot/wiki/Storing-bot,-user-and-chat-related-data
    async def get(self, update, context):
        """
        Get chat related data
        :param update: Update object
        :param context: CallbackContext object
        """
        # response could either be a chat or a callback
        # query, so we need to check which one it is
        try:
            key = update.message.chat_id
        except:
            key = update.callback_query.message.chat.id

        # Load value and send it to the user
        value = context.chat_data.get(key, 'Not found')

        return value

    # Chat Commands

    # Help command handler
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Sends the help text to the user
        :param update: Update object
        :param context: CallbackContext object
        """
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        await update.message.reply_text(self.help_text, parse_mode="Markdown")

    # Set deeplink persona
    async def set_deeplink_persona(self, new_persona, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        self.logger.info('Setting deeplink persona')
        """
        Set the deeplink persona
        :param update: Update object
        :param context: CallbackContext object
        """
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        # set the persona
        await self.put(new_persona, update, context)

        # get the persona
        persona = await self.get(update, context)

        await update.message.reply_text(f"You are now chatting with a {persona} bot, any chat will be returned with an answer")
        self.logger.info('Deep link persona set')

    # Sets the persona for a chat
    async def set_persona_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Sets the persona for a chat, used to query the correct persona
        :param update: Update object
        :param context: CallbackContext object
        """
        self.logger.info('Setting persona')

        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        chat_data = update.message.text.split('/')[1].split(' ')

        # check if the `/set` command was empty
        if len(chat_data) == 1:
            await update.message.reply_text("Please specify a persona to chat with, e.g. `/set math-teacher`", parse_mode="Markdown")
            return

        # if a chat is simply `/<persona>` it should still be accepted
        try:
            persona_data = chat_data[1]
        except:
            persona_data = chat_data[0]

        # if its in a group chat the set command will look like either
        # `math-teacher@inquireai_bot` or `/set math-teacher@inquireai_bot`
        # remove @inquireai_bot
        persona_data = persona_data.split('@')[0]

        # set the persona
        await self.put(persona_data, update, context)

        # get the persona
        persona = await self.get(update, context)

        # check to see if persona exists
        if persona not in self.persona_list:
            await update.message.reply_text(f"Sorry, {persona} is not a valid persona")
            return

        # if chat_data is > 3 then the user also sent a query with the command
        # also query the persona
        if len(chat_data) >= 3:
            await update.message.reply_text(f"You are now chatting with a {persona} bot, answering your question...", parse_mode="Markdown")
            await self.query_persona(update, context)
        else:
            await update.message.reply_text(f"You are now chatting with a {persona} bot, any chat will be returned with an answer")

        self.logger.info('Persona set')

    # List a random 10 personas for the user
    async def random_personas_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        List a random 10 personas for the user
        :param update: Update object
        :param context: CallbackContext object
        """
        self.logger.info('Setting random persona')

        keyboard = []
        persona_count = 0

        # randomise the personas
        random.shuffle(self.personas)

        for key in self.personas:
            if persona_count < 10:
                keyboard.append(
                    [
                        InlineKeyboardButton(
                            key['name'], callback_data=key["name"]),
                    ],
                )
                persona_count += 1
            else:
                break

        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text("List of 10 Random Personas", reply_markup=reply_markup)

        self.logger.info('Random persona sets')

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

        self.logger.info('List command message sent')

    # Sends the current persona to the user
    async def current_persona_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Sends the current persona to the user
        :param update: Update object
        :param context: CallbackContext object
        """
        self.logger.info('Getting current persona')

        # get the persona
        persona = await self.get(update, context)

        if persona == 'Not found':
            await update.message.reply_text("You are currently not chatting with a persona. To get started start typing `@inquireai_bot` followed by the persona you want to chat with (e.g. `@inquireai_bot math-teacher`). Any message after will be answered!", parse_mode="Markdown")
        else:
            await update.message.reply_text(f"You are currently chatting with a {persona} bot")

        self.logger.info('Sent current persona message')

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

        # set the persona
        await self.put(query.data, update, context)

        # get the persona
        persona = await self.get(update, context)

        await query.edit_message_text(text=f"You are now chatting with a {persona} bot, any chat will be returned with an answer")

    # check if the response is correct
    def is_correct_response(self, response):
        """Check if the API returns 'COMPLETED'"""
        content = json.loads(response.content)
        return content['data']['status'] == 'COMPLETED'

    # Call the Inquire API to query the persona
    async def query_persona(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Call the Inquire API to query the persona
        :param update: Update object
        :param context: CallbackContext object
        """
        self.logger.info('Completing inquiry')

        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        query = update.message.text

        # if the user is using the `/chat` command then remove it
        if query.startswith("/chat"):
            query = query.split(" ")
            if len(query) <= 1:
                await update.message.reply_text("Specify a query after such as `/chat who are you?`", parse_mode="Markdown")
                return

        query = update.message.text

        url = self.inquireApi + "/inquiries"
        headers = {
            "x-api-key": self.inquireApiKey,
        }

        # get the persona
        persona = await self.get(update, context)

        payload = {
            "connectionType": "TELEGRAM",
            "connectionUserId": update.message.from_user.id,
            "queryType": persona,
            "query": query
        }

        response = requests.post(url, headers=headers, data=payload)
        content = json.loads(response.content)

        self.logger.info('Inquiry completion started')

        # poll the API until the response is ready
        poll_url = self.inquireApi + "/inquiries/" + content['data']['id']

        self.logger.info('Begin polling inquiry status')
        try:
            poll = polling2.poll(
                lambda: requests.get(
                    poll_url,
                    headers=headers
                ),
                check_success=self.is_correct_response,
                step=0.5,
                timeout=30
            )
            self.logger.info('Inquiry polling completed')
            await self.send_message(update, poll.json()['data']['result'])
        except polling2.TimeoutException:
            await self.send_message(update, 'Sorry, I am having trouble answering your question. Please try again later.')
            raise Exception("Timeout waiting for response")

        self.logger.info('Sent completed inquiry')

    # Chat command to handle chats in groups
    async def chat_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Chat command to handle chats in groups
        :param update: Update object
        :param context: CallbackContext object
        """
        self.logger.info('Handling chat command')
        await self.application.bot.send_chat_action(update.effective_chat.id, "typing")

        # get the persona
        persona = await self.get(update, context)

        if persona == "":
            await update.message.reply_text("You need to set a persona first, use `/set <persona>` or with `@inquireai_bot <persona>`", parse_mode="Markdown")
        else:
            await self.query_persona(update, context)

        self.logger.info('Chat command completed')

    # Handle the inline query
    async def inline_query(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """
        Handle the inline query. This is run when you type: @botusername <query>
        :param update: Update object
        :param context: CallbackContext object
        """
        self.logger.info('Handling inline query')
        query = update.inline_query.query

        if query == "":
            return

        # search personas for the query
        results = []
        for key in self.personas:
            if query.lower() in key['name'].lower():
                results.append(
                    InlineQueryResultArticle(
                        id=str(uuid4()),
                        title=key['name'],
                        input_message_content=InputTextMessageContent(
                            f"/set {key['name']}"),
                        description=f"{key['description']}",
                    ),
                )

        await update.inline_query.answer(results)

        self.logger.info('Inline query handled')
