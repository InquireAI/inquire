from clients.telegram.bot import Telegram
from pythonjsonlogger import jsonlogger
import logging
from datetime import datetime


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super(CustomJsonFormatter, self).add_fields(
            log_record, record, message_dict)

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
    logging.basicConfig(level=logging.DEBUG)
    logHandler = logging.StreamHandler()
    formatter = CustomJsonFormatter('%(time)s %(level)s %(msg)s')
    logHandler.setFormatter(formatter)
    telegram = Telegram()
