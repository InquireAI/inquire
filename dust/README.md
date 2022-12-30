# Writing Apps to Dust 

(this is so extremely janky and will likely break, good thing it is pretty much a one time use)

Waiting on dust to have [import/export](https://github.com/dust-tt/dust/issues/113) functionality from a `.dust` file

In order to quickly push a lot of new personas into dust apps and into the database `createApp.py` and `pushDB.py` were created to handle the automation

- `createApp.py` reads from `app.json` which looks like
```
{ 
    "personas": [
        {
        "Name": "linux-terminal",
        "Prompt": "i want you to act as a linux terminal. I will type commands and you will reply with what the terminal should show. I want you to only reply with the terminal output inside one unique code block, and nothing else. do not write explanations. do not type commands unless I instruct you to do so. when i need to tell you something in english, i will do so by putting text inside curly brackets {like this}. my first command is pwd",
        "Description": "A Linux Terminal"
        }
    ]
}
```

Clones a base dust app (https://dust.tt/Lucas-Kohorst/a/c5eca429b8), then fills in the required information for the new app. It then outputs required information into `db.json`

Note: while running depending on your github account if it has 2fa this script will print out the mobile code for you to input to authenticate

- `editApp.py` reads from `db.json` and edits the app to add the persona

- `pushDB.py` reads from `db.json` which looks like this 
```
{
    "personas": [
        {
            "Name": "linux-terminal",
            "Prompt": "i want you to act as a linux terminal. I will type commands and you will reply with what the terminal should show. I want you to only reply with the terminal output inside one unique code block, and nothing else. do not write explanations. do not type commands unless I instruct you to do so. when i need to tell you something in english, i will do so by putting text inside curly brackets {like this}. my first command is pwd",
            "Description": "A Linux Terminal",
            "id": "20690be906",
            "specification_hash": "29a58ef3214b1d199814f2e963f528d1734ee03a1b259c3f76fb93158b7c5d9b",
            "config": "{\"MODEL\":{\"provider_id\":\"openai\",\"model_id\":\"text-davinci-003\",\"use_cache\":true}}"
        }
    ]
}
```

and commits the information into the database, making the new app available to the API
