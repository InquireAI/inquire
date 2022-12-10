FROM python:3.8

WORKDIR /app

# Create the environment:
COPY server.py .
COPY requirements.txt .
COPY .env .
COPY ./utils /app/utils/ 
COPY ./clients /app/clients/

# Install requirements
RUN python -m pip install --upgrade pip
RUN pip install -r requirements.txt
RUN pip install python-telegram-bot[rate-limiter]
RUN pip install python-telegram-bot[callback-data]

# Install playwright
RUN playwright install
RUN playwright install-deps

# The code to run when container is started:
ENTRYPOINT ["python", "server.py"]