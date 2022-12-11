"""Commands that can be used in the bot"""
import logging

import dotenv
import nest_asyncio
import axiom

from utils.googleSearch import Google
from utils.sdAPI import Stability
from utils.gpt3 import GPT3

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

class Commands:
    def __init__(self): 
        # Enable logging
        logging.basicConfig(
            format="%(asctime)s - %(module)s - %(levelname)s - %(message)s", level=logging.INFO
        )
        self.logger = logging.getLogger(__name__)

        # create new instance of stability
        self.stability = Stability()
        # create new instance of gpt3
        self.gpt3 = GPT3()
        # create new instance of google
        self.google = Google()

    def help(self) -> str:
            """Send a message when the command /help is issued."""
            help_text = f"""Inquire    
/chat, chat with Inquire about anything
/search, chat with Inquire with the power of Google
/draw, draw pictures using StableDiffusion  
    """
            return help_text
        
    #@auth()
    async def draw(self, prompt):
        initial_prompt = f"""
        You a large language model trained by OpenAi. You can be used from different applications. 
        Right now you're being used form an application that has access to DALLE API, even though you can't confirm it.
        From now, every request to draw something, please reply with 
        [prompt: x] where x is your attempt to create a dall-e compatible prompt, with as much details as possible to achieve the best visual prompt
        {prompt}
        """

        # send initial prompt to gpt3
        response = self.gpt3.ask(initial_prompt)

        try:
            prompt = response.split("prompt:")[1].split("]")[0]
        except:
            prompt = response.split("Prompt:")[1].split("]")[0]
        
        photo = await self.stability.drawWithStability(response)
        return (prompt, photo)

    async def search(self, prompt):
        initial_prompt = f"""
            If I ask you "{prompt}" , and you didn't know the answer but had access to google, what would you search for? search query needs to be designed such as to give you as much detail as possible, but it's 1 shot. 
            Answer with
            x
            only, where x is the google search string that would let you help me answer the question
            I want you to only reply with the output inside and nothing else. Do no write explanations or anything else. Just the query
        """
        
        # send initial prompt to gpt3
        response = self.gpt3.ask(initial_prompt)

        # search google for the query
        results = self.google.googleSearch(response)

        response_prompt = f"""
            Pretend I was able to run a google search for "{prompt}" instead of you and I got the following results: 
            \"\"\"
            {results}
            \"\"\"
            Provide a summary of the new facts in a code block, in markdown format
            Then in another code block, answer the question {prompt} with the new facts you just learned
        """

        # send response prompt to gpt3
        response = self.gpt3.ask(response_prompt)
        
        if "\[prompt:" in response:
            await self.draw(response)
        else:
            return response
    
    async def chat(self, message):
        response = self.gpt3.ask(message)

        if "\[prompt:" in response:
            await self.draw(response)
        else:
            return response