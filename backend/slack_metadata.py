from datetime import datetime
import pandas as pd
import json
import mimetypes
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
import os
from dotenv import load_dotenv
import html
import requests
import re
from bs4 import BeautifulSoup
from nltk.tokenize import sent_tokenize
from pinecone_client import PineconeClient

USER_CACHE = {}
CHANNEL_CACHE = {"None": ""}
client = WebClient(token=os.environ["SLACK_TOKEN"])

def get_username(user_id):
    """Fetch and return the username for a given user ID."""
    if user_id in USER_CACHE:
        return USER_CACHE[user_id]  # Return cached name

    try:
        response = client.users_info(user=user_id)
        user_name = response["user"]["real_name"]  # Get real name
        USER_CACHE[user_id] = user_name  # Store in cache
        return user_name
    except SlackApiError as e:
        print(f"Error fetching user info for {user_id}: {e.response['error']}")
        return "Unknown User"
def get_metadata(): 
    metadata = "CHANNEL METADATA: \n"

    response = client.conversations_list(types="public_channel,private_channel")
    channels = response["channels"]
    print("CHANNNNNNNNNNELLLLLLLLLLLLLLLLLLSSSSSSSSSSSSSS", channels)
    print("000000000000000000000000000000000000000000000000")
    
    print("\nSlack Channels:")
    for channel in channels:
        CHANNEL_CACHE[channel['id']] = channel['name']  # Store in cache
            
        metadata += f"| Channel ID: {channel['id']}, Channel Name: {channel['name']} \n"
        metadata += f"   Members of channel[{channel['name']}]: "
        response = client.conversations_members(channel=channel['id'])
        user_ids = response["members"]
        for user_id in user_ids:
            
            metadata +=f"{get_username(user_id)}, "
            
        metadata += " |\n\n"

    response = client.files_list(types = "canvas")
    list_response = client.files_list(types = 'list')
    lists = list_response.get("files", [])
    canvases = response.get("files", [])
    metadata += "CANVASES IN CHANNELS METADATA: \n"
    for canvas in canvases:
        
        canvas_id = canvas["id"]
        title = canvas.get("title", "Untitled")
        creator_id = canvas["user"]
        created_time = datetime.fromtimestamp(float(canvas["created"]))
        creator_name = get_username(creator_id)
        try:
            response = client.files_info(file=canvas_id)
            canvas_channel = response["file"]["channels"]  # List of channel IDs
        except SlackApiError as e:
            print(f"Error: {e.response['error']}")

        metadata += f"| Canvas ID: {canvas_id}, Canvas Name: {title} \n"
        metadata += f"    Belongs to the channel[{CHANNEL_CACHE[canvas_channel[0] if canvas_channel else 'None']}]\n "
        metadata += f"    Created by: {creator_name} on {created_time.strftime('%Y-%m-%d %H:%M:%S')} |\n"
    metadata += "LISTS IN CHANNELS METADATA: \n"
    
    for list in lists:

        title = list.get("title", "Untitled")
        list_id = list['id']
        creator_id = list["user"]
        created_time = datetime.fromtimestamp(float(canvas["created"]))
        creator_name = get_username(creator_id)
        try:
            response = client.files_info(file=list_id)
            list_channel = response["file"]["channels"]  # List of channel IDs

        except SlackApiError as e:
            print(f"Error: {e.response['error']}")

        metadata += f"| List ID: {list_id}, List Name: {title} \n"
        metadata += f"    Belongs to the channel[{CHANNEL_CACHE[list_channel[0] if canvas_channel else 'None']}]\n "
        metadata += f"    Created by: {creator_name} on {created_time.strftime('%Y-%m-%d %H:%M:%S')} |\n"
        

    return metadata