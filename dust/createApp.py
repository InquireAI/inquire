from playwright.sync_api import sync_playwright
import os
from time import sleep
import json
from dotenv import load_dotenv

load_dotenv()

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('https://dust.tt')

        # Login 
        page.click('text="Sign in with Github"')
        page.wait_for_selector('input[name="login"]')
        page.fill('input[name="login"]', os.getenv('GITHUB_USERNAME'))
        page.fill('input[name="password"]', os.getenv('GITHUB_PASSWORD'))
        page.click('text="Sign in"')
        page.goto('https://github.com/sessions/two-factor/mobile?auto=true')
        print(page.locator('xpath=//*[@id="github-mobile-authenticate-prompt"]/h1').text_content())

        sleep(10)

        print('Authenticated')

        # open app.json file and iterate over each persona
        with open("app.json") as f:
            data = json.load(f)
            out_data = {"personas": []}

            # TODO: check if app aleady exists, if it does simply edit it
            # otherwise clone and create a new app

            for persona in data['personas']:
                name = persona['Name']
                description = persona['Description']
                prompt = persona['Prompt']

                # clone base app
                page.goto('https://dust.tt/dustuser/a/bf1cc57a90')
                page.click('text="Clone"')
                page.fill('input[id="appName"]', name)
                page.fill('input[id="appDescription"]', description)
                page.click('input[id="appVisibilityPrivate"]')
                page.click('xpath=//*[@id="__next"]/main/div/div/div[2]/div/form/div[2]/div/button')

                # fill in persona prompt information 
                page.fill('xpath=//*[@id="__next"]/main/div/div/div[2]/div/div[3]/div[2]/div[1]/div[2]/div/div[3]/div[2]/div[1]/div[2]/textarea', prompt)

                # record information
                id = page.url.split('/')[-1]

                print(f"""ID: {id}""")

                page.click('xpath=//*[@id="__next"]/main/div/div/div[2]/div/div[1]/div[2]/button')
                sleep(3)
                page.click('xpath=//*[@id="__next"]/main/div/div/div[2]/div/div[1]/div[4]/div/button')

                content = page.content()

                specification_hash = content.split('"specification_hash": "')[1].split('"')[0]
                config = content.split('"config": ')[1].split(',<br>')[0]

                sleep(2)

                print(f"""
                App Created with: name {name}, id {id}, specification_hash: {specification_hash}, config: {config}
                """)

                persona['id'] = id
                persona['specification_hash'] = specification_hash
                persona['config'] = config
                out_data['personas'].append(persona)
            
            # Write out to a file to be uploaded to the db
            with open('db.json', 'w') as out:
                out.write(json.dumps(out_data))
            
            browser.close()

if __name__ == '__main__':
    main()