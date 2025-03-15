import requests
import os 
from dotenv import load_dotenv 

import base64
import io
import json
from pathlib import Path
from typing import TypedDict, Annotated, List, Union 
from langchain_core.agents import AgentAction, AgentFinish 
from langchain_core.messages import BaseMessage 
import operator 
import openai
from serpapi import GoogleSearch 
from langchain_core.tools import tool 
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import ToolCall, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from tavily import TavilyClient
from langchain_community.document_loaders import UnstructuredAPIFileLoader
import boto3
import cv2
import numpy as np
from PIL import Image
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
load_dotenv() 

# # Replace with your Slack Bot Token
SLACK_BOT_TOKEN = ""

# # Slack API URLs
# FILES_LIST_URL = "https://slack.com/api/files.list"

# # Headers for authentication
# HEADERS = {
#     "Authorization": f"Bearer {SLACK_BOT_TOKEN}",
#     "Content-Type": "application/json"
# }

# def get_canvas_files():
#     """Fetches canvas files from Slack."""
#     params = {"types": "canvas"}
#     response = requests.get(FILES_LIST_URL, headers=HEADERS, params=params)
    
#     if response.status_code == 200:
#         data = response.json()
#         if data.get("ok"):
#             return data.get("files", [])
#         else:
#             print("Error:", data.get("error"))
#     else:
#         print("Failed to fetch canvas files:", response.status_code)
#     return []

# def get_canvas_content(file_id):
#     """Fetches the content of a specific canvas file."""
#     FILE_INFO_URL = f"https://slack.com/api/files.info?file={file_id}"
#     response = requests.get(FILE_INFO_URL, headers=HEADERS)
    
#     if response.status_code == 200:
#         data = response.json()
#         if data.get("ok"):
#             return data["file"].get("content", "No content available")
#         else:
#             print("Error:", data.get("error"))
#     else:
#         print("Failed to fetch canvas content:", response.status_code)
#     return None

# if __name__ == "__main__":
#     # Step 1: Get all canvas files
#     canvas_files = get_canvas_files()
    
#     if not canvas_files:
#         print("No canvas files found.")
#     else:
#         # Step 2: Retrieve content for the first canvas file
#         first_canvas = canvas_files[0]
#         file_id = first_canvas["id"]
#         content = get_canvas_content(file_id)
        
#         if content:
#             print("Canvas Content:\n", content)

USER_OAUTH_TOKEN = ""
client = WebClient(token=USER_OAUTH_TOKEN)
def create_slack_canvas(title, content, channel_id):
    """Creates a Slack Canvas and uploads it to a specified channel. Takes title of the canvas, content of the canvas and the channel_id as arguments."""
    
    try:
    # Replace with the Slack channel ID where you want to create the canvas
        channel_id = "C08GR3SJ8BB"  

        # Create a channel-attached canvas
        response = client.conversations_canvases_create(
            channel_id=channel_id,
            document_content={
                "type": "markdown",
                "markdown": content
            }, 
            title= title
        )
        print(f"Channel canvas created successfully with ID: {response}")
    except SlackApiError as e:
        print(f"Error creating channel canvas: {e.response}")
    

create_slack_canvas("xyzddzee", "# Welcome to your new Slack Canvas!\n\nThis is a test canvas created using the Slack SDK.", "C08G74EH7PG")

def block_list(): 
    try:
    # Define the list blocks
        blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*To-Do List:*\n\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3"
                }
            }
        ]

        # Post the list to a channel
        response = client.chat_postMessage(
            channel="C08GR3SJ8BB",  # Replace with your channel ID
            blocks=blocks,
            text="Here's your to-do list:"
        )
        print(f"Message posted successfully: {response['ts']}")
    except SlackApiError as e:
        print(f"Error posting message: {e.response['error']}")

block_list()