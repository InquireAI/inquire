from dotenv import load_dotenv
import pymysql
import os
import json

load_dotenv()
connection = pymysql.connect(
    host="localhost",
    user="root",
    passwd="root",
    db="inquire",
    ssl={
        'ca': os.getenv("SSL_CERT")
    }
)
cursor = connection.cursor()

# Open db.json to write to db 
with open('db.json', 'r') as f:
    data = json.load(f)
    for key in data['personas']:
        name = key["Name"]
        prompt = key["Prompt"]
        description = key["Description"]
        id = key["id"]
        specification_hash = key["specification_hash"]
        config = key["config"]

        print(name, prompt, description, id, specification_hash, config)

        try:
            cursor.execute("INSERT INTO Persona (id, name, prompt, description, specificationHash, config) VALUES (%s, %s, %s, %s, %s, %s)", (id, name, prompt, description, specification_hash, config))
            connection.commit()
        except:
            print("Error: unable to insert data, entry probably already exists.")

connection.close()