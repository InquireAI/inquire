from serpapi import GoogleSearch
import requests
import os
import json
import dotenv

dotenv.load_dotenv()

class Google:
  def __init__(self): 
    pass

  def googleSearch(self, query):
    params = {
      "q": query,
      "hl": "en",
      "gl": "us",
      "api_key": os.getenv("SERP_API_KEY")
    }

    search = GoogleSearch(params)
    results = search.get_dict()
    print(f"Got google search results for {query}")
    print(json.dumps(results, indent=2))

    parsed_response = self.parse_response(query, results)
    print(parsed_response)
    return parsed_response

  def parse_response(self, query, response_dict):
    textual_response = f"Search results for `{query}`:\n"
    if 'related_questions' in response_dict:
      textual_response += "Related Questions:\n"
      for related_question in response_dict['related_questions']:
        textual_response += f"""
          Q: {related_question['question']}
          Snippet: {related_question.get('snippet', 'NA')}
          Date: {related_question.get('date', 'NA')}
          Link: {related_question.get('link', 'NA')}\n
          """
        if 'rich_list' in related_question:
          textual_response += "List of info:\n"
          for rich_list_item in related_question['rich_list']:
            textual_response += f"""{rich_list_item['title']},"""

    if 'organic_results' in response_dict:
      textual_response += "Organic Results:\n"
      for organic_result in response_dict['organic_results']:
        textual_response += f"""
          Title: {organic_result.get('title', 'NA')}
          Date: {organic_result.get('date', 'NA')}
          Snippet: {organic_result.get('snippet', 'NA')}

          Link: {organic_result.get('link', 'NA')}\n
          """
    if 'knowledge_graph' in response_dict:
      textual_response += f"Knowledge Graph: {json.dumps(response_dict['knowledge_graph'])}"
    return textual_response