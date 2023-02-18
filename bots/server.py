from clients.telegram.bot import Telegram
from pythonjsonlogger import jsonlogger
import logging
import datetime
import dotenv
dotenv.load_dotenv()


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super(CustomJsonFormatter, self).add_fields(
            log_record, record, message_dict)

        log_record['app'] = 'bots'
        log_record['msg'] = record.message

        if not log_record.get('time'):
            # this doesn't use record.created, so it is slightly off
            now = int((datetime.datetime.utcnow() -
                      datetime.datetime(1970, 1, 1)).total_seconds() * 1000)
            log_record['time'] = now
        if log_record.get('level'):
            log_record['level'] = log_record['level'].upper()
        else:
            log_record['level'] = record.levelname


if __name__ == "__main__":
    # start telegram bot
    logHandler = logging.StreamHandler()
    formatter = CustomJsonFormatter('%(level)s %(time)s %(msg)s %(name)s')
    logHandler.setFormatter(formatter)
    logging.basicConfig(level=logging.INFO, handlers=[
        logHandler
    ])

    telegram = Telegram()
