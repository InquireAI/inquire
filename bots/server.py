import asyncio
from clients.telegram.bot import Telegram
from clients.telegram.webhook import Telegram

# if __name__ == "__main__":
#     # create telegram bot
#     telegram = Telegram()
#     # start telegram bot and webserver
#     asyncio.run(telegram.main())

if __name__ == "__main__":
    asyncio.run(Telegram().main())