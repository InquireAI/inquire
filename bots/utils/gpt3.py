import os
import openai
import dotenv
import logging

dotenv.load_dotenv()

class GPT3:
  def __init__(self): 
    # Enable logging
    logging.basicConfig(
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
    )
    self.logger = logging.getLogger(__name__)

    self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

  def ask(self, query):
    try:
      openai.api_key = self.OPENAI_API_KEY
      response = openai.Completion.create(model="text-davinci-003",
          prompt=query,
          temperature=0.9,
          max_tokens=4000,
          top_p=1,
          frequency_penalty=0,
          presence_penalty=0.6)
      return response.choices[0].text
    except Exception as e:
      self.logger.error(e)
      return "Error in GPT3 API"