import os
import requests
import axiom

class Stability:
  def __init__(self):
    # create instance of axiom client
    self.client = axiom.Client(os.environ.get('AXIOM_TOKEN'))

  async def drawWithStability(self, prompt):
    # Available engines: stable-diffusion-v1 stable-diffusion-v1-5 stable-diffusion-512-v2-0 stable-diffusion-768-v2-0 
    # stable-diffusion-512-v2-1 stable-diffusion-768-v2-1 stable-inpainting-v1-0 stable-inpainting-512-v2-0
    engine_id = "stable-diffusion-v1-5"
    api_host = os.getenv('API_HOST', 'https://api.stability.ai')
    url = f"{api_host}/v1alpha/generation/{engine_id}/text-to-image"

    apiKey = os.getenv("STABILITY_API_KEY")
    if apiKey is None:
      raise Exception("Missing Stability API key.")

    payload = {
      "cfg_scale": 7,
      "clip_guidance_preset": "FAST_BLUE",
      "height": 512,
      "width": 512,
      "samples": 1,
      "sampler": "K_EULER_ANCESTRAL",
      "seed": 0,
      "steps": 50,
      "text_prompts": [
        {
          "text": prompt,
          "weight": 1
        }
      ],
    }

    headers = {
      "Content-Type": "application/json",
      "Accept": "image/png",
      "Authorization": apiKey
    }

    response = requests.post(url, json=payload, headers=headers)

    if response.status_code != 200:
       self.client.ingest_events('query_data', [{"error": response.text}])
       return "I'm sorry, I'm having trouble understanding you. Please try again later."

    # Write the bytes from response.content to a file
    return response.content
