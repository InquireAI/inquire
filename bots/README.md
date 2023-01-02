# Inquire

Inquire is a converstational chatbot that can take the form of just about any persona. Learn more at [inquire.run](https://inquire.run)

## Features 
- Chat with any persona available on inquire
- Chats and groupchats are tracked and saved
- Inline commands are supported, message the bot in a groupchat with `@BotName <command>` to use it
- Full command menu with a list of all personas available

### Full Set of Commands
Inquire's full set of commands available are listed below 
```
help - Show a help message
random - Show random personas
set - Set the persona to talk to
all - view a list of all personas and their descriptions that are available
<list of all personas as commands>
```

## Installation and Setup
### Prerequisites
- [Docker](https://docs.docker.com/install/)
- [Inquire API Key](https://inquire.run)
- [Telegram Bot Token](###Creating-and-setting-up-the-Telegram-Bot)

### Building and Deploying 
The Telegram bot can be built and deployed via a docker container
```
docker build -t inquire-bot .
docker run --env-file .env -d inquire-bot
```

### Creating and setting up the Telegram Bot
1. Create a new bot by messaging [@BotFather](https://t.me/BotFather) on Telegram
2. Copy the bot token and add it to the `.env` file
3. Confiigure the bot by messaging [@BotFather](https://t.me/BotFather) on Telegram with the following commands 
    - `/setprivacy` - set to disable
    - `/setcommands` - set to the full set of commands, which you can find by messaging the inquire bot `/all` this is a full list of base commands and personas
    - `/setdescription` - set to a description of the bot, this will be displayed when a user clicks on the bot's profile
    - `/setabouttext` - set to a description of the bot, this will be displayed when a user starts the bot
    - `/setuserpic` - set to a profile picture for the bot
    - `/setinlinefeedback` - set to enable, to allow a user in a groupchat to use the bot inline (i.e. @BotName <command>)
4. Start chatting!