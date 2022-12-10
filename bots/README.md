# Inquire

Inquire is a generalized chatbot ready to handle anything you throw at it. 

## Features
You can view all features by sending `/help` to the bot
- `/ask`, ask chatGPT anything receive a response
- `/draw`, draw pictures using stablediffusion
- `/search`, give chatGPT access to Google

## Install
### Locally
```bash
# make sure to have python>3.8
python3.8 -m venv .venv
source .venv/bin/activate

# make sure to have pip >22, upgrade with
python -m pip install --upgrade pip

# setup environment
pip install -r requirements.txt

# install additional packages
pip install python-telegram-bot[rate-limiter]
pip install python-telegram-bot[callback-data]

# install playwright for headless browser
playwright install 
playwright install-deps
```

### Docker 
Build and run your Dockerfile
```bash
docker build . --tag inquire
```

## Telegram Bot Setup
Copy `.env.example` and fill it in with the relevant API keys
```bash
cp .env.example .env
```

The `.env` file is layed out with the following keys
```bash
TELEGRAM_API_KEY=# (required) used to identify and control your bot
#TELEGRAM_USER_ID=# (optional) used to authenticate access to your bot to just a given account

OPENAI_EMAIL=# (required) email to access the openai account that is being used for chatgpt
OPENAI_PASSWORD=#(required) password to access the openai account that is being used for chatgpt

STABILITY_API_KEY=# (required) API key for stablediffusion to generate drawings
SERP_API_KEY=# (required) API key for google searches
```

You can obtain the required API Keys below
- [Telegram](https://core.telegram.org/bots/tutorial#obtain-your-bot-token)
- [Dream Studio StableDiffusion](https://beta.dreamstudio.ai/membership?tab=home)
- [SERP API Google Searches](https://serpapi.com/)

## Running 
### Locally 
```bash
# if your environment is installed correct
python server.py
```

### Docker
```bash
docker run -d --name inquire inquire
```

You will also need to go the bot that you created via `@Botfather`, start a chat with it, and click start. 

## Credits and Libraries Used
- [OpenAI](https://openai.com/)
- [StableDiffusion](https://github.com/Stability-AI/StableDiffusion)
- [SerpAPI](https://serpapi.com/)
- [PTB](https://docs.python-telegram-bot.org/en/stable/index.html)

- Original Creator [@Altryne](https://twitter.com/altryne/status/1598902799625961472) on Twitter
- Based on [Daniel Gross's whatsapp gpt](https://github.com/danielgross/whatsapp-gpt) package.