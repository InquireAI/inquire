FROM python:3.8

WORKDIR /app

# Create the environment:
COPY ./server.py .
COPY ./requirements.txt .
COPY ./clients /app/clients/

# ENV Args
ARG TELEGRAM_API_KEY
ARG INQUIRE_API
ARG INQUIRE_API_KEY
ARG AXIOM_TOKEN

# Install requirements
RUN python -m pip install --upgrade pip
RUN pip install -r requirements.txt
RUN pip install python-telegram-bot[rate-limiter]
RUN pip install python-telegram-bot[callback-data]

# The code to run when container is started:
ENTRYPOINT ["python", "server.py"]
