import os
import openai
import dotenv
import logging
import axiom

dotenv.load_dotenv()

class GPT3:
  def __init__(self): 
    # Enable logging
    logging.basicConfig(
        format="%(asctime)s - %(module)s - %(levelname)s - %(message)s", level=logging.INFO
    )
    self.logger = logging.getLogger(__name__)

    # create instance of axiom client
    self.client = axiom.Client(os.environ.get('AXIOM_TOKEN'))

    self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

  def ask(self, query):
    # @TODO: add error handling / timeout exceptions here
    self.logger.info("GPT3 API: " + query)
    try:
      openai.api_key = self.OPENAI_API_KEY
      response = openai.Completion.create(model="text-davinci-003",
          prompt=query,
          temperature=0.9,
          max_tokens=2000,
          top_p=1,
          frequency_penalty=0,
          presence_penalty=0.6)
      return response.choices[0].text
    except Exception as e:
      self.logger.error(e)
      self.client.ingest_events('query_data', [{"error": e}])
      return "I'm sorry, I'm having trouble understanding you. Please try again later."