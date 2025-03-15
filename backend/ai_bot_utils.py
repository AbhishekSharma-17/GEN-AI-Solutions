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


# Load environment variables
load_dotenv()

def download_and_save_file(download_link, title, extension):
    """Download a file from the given link, save it in the slack_files folder, and parse it with BeautifulSoup if it's HTML."""
    try:
        headers = {'Authorization': f'Bearer {SLACK_TOKEN}'}
        response = requests.get(download_link, headers=headers)
        response.raise_for_status()  # Raises a HTTPError if the status is 4xx, 5xx

        # Ensure the file has an extension based on content type
        content_type = response.headers.get('Content-Type', '')
        extension = extension
        
        # Clean the title to make it a valid filename
        clean_title = re.sub(r'[^\w\-_\. ]', '_', title)
        file_name = f"{clean_title}{extension}"
        
        # Create the slack_files directory if it doesn't exist
        os.makedirs(os.path.join('slack_files'), exist_ok=True)
        
        file_path = os.path.join('slack_files', file_name)

        with open(file_path, 'wb') as file:
            file.write(response.content)
        
        print(f"File downloaded and saved as: {file_path}")

        # Parse the file based on its extension
        with open(file_path, 'r', encoding='utf-8') as file:
            if extension == '.html':
                soup = BeautifulSoup(file, 'html.parser')
                # Extract text content from HTML
                text_content = soup.get_text(separator=' ', strip=True)
                return text_content
            elif extension == '.csv':
                df = pd.read_csv(file)
                return df
            else:
                # For other file types, return the raw content
                return file.read()

    except requests.RequestException as e:
        print(f"Error downloading file: {e}")

SLACK_TOKEN = os.environ["SLACK_TOKEN"]
client = WebClient(token=SLACK_TOKEN)

# Cache user IDs to names to avoid multiple API calls
USER_CACHE = {}

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

def join_channel(channel_id):
    """Make the bot join a channel (if not already a member)."""
    try:
        client.conversations_join(channel=channel_id)
        print(f"Joined channel: {channel_id}")
    except SlackApiError as e:
        if e.response['error'] == "method_not_supported_for_channel_type":
            print(f"Cannot join channel {channel_id}: It's a private channel.")
        elif e.response['error'] == "already_in_channel":
            pass  # Bot is already in the channel
        else:
            print(f"Error joining channel {channel_id}: {e.response['error']}")
chunk_dict = {}
def list_channels():
    """Fetch all channels and join them before reading messages."""
    try:
        response = client.conversations_list(types="public_channel,private_channel")
        channels = response["channels"]
        print("CHANNNNNNNNNNELLLLLLLLLLLLLLLLLLSSSSSSSSSSSSSS", channels)
        print("000000000000000000000000000000000000000000000000")
        chunk_size = 2000
        
        print("\nSlack Channels:")
        for channel in channels:
            chunks = []

            channel_messages = ""
            context_team_id = channel['context_team_id']
            channel_id = channel['id']
            channel_link = f"https://app.slack.com/client/{context_team_id}/{channel_id}"
            print(f"- Channel Name: {channel['name']} (ID: {channel['id']})")
            # channel_messages += f"- Channel Name: {channel['name']} (ID: {channel['id']})\n"
            # channel_messages += f"- Channel link: {channel_link}\n"
            join_channel(channel['id'])  # Ensure bot is a member
            messages = get_channel_messages(channel['id'], channel['name'])  # Fetch messages
            channel_messages += messages
            current_chunk = ""
            sentences = sent_tokenize(channel_messages) 
            for sentence in sentences:
                if len(current_chunk) + len(sentence) <= chunk_size:
                    current_chunk += sentence + " "
                    print("HEREE++++++++++++++++")
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = sentence + " "
                    print("here====================")
            if current_chunk:
                chunks.append(current_chunk.strip())
                print("aaaaaaaaaaaaaaaaa")
            for i, chunk in enumerate(chunks, 1):
                # Create a metadata string that includes the source and file name.
                chunk_texts = []

                metadata_str = (
                    f"Channel name: {channel['name']}\n"
                    f"Channel id: {channel['id']}\n"
                    f"Channel link: {channel_link}\n"
                    f"Chunk: {i}/{len(chunks)}"
                )
                # Combine the metadata with the chunk content.
                combined_chunk = f"{metadata_str}\n\n{chunk}"
                chunk_texts.append(combined_chunk)
                chunk_dict.update({channel["id"]+"_"+str(i): chunk_texts})

        # f = open(f"channel_messages.txt", "a")
        # f.write(str(chunk_dict) + "\n")

        # f.close()
        return chunk_dict
    except SlackApiError as e:
        print(f"Error fetching channels: {e.response['error']}")

def get_channel_messages(channel_id, channel_name):
    """Fetch latest messages from a given channel, including Slackbot and Canvas updates."""
    try:
        all_messages = ""

        response = client.conversations_history(channel=channel_id)
        messages = response["messages"]
        forwarded_checklist = []
        print(f"\nMessages from Channel: {channel_name}\n")
        # print("RESPONSE: ", response["messages"])
        for msg in reversed(messages):
            user_id = msg.get("user", "Unknown User")
            user_name = get_username(user_id) if user_id != "USLACKBOT" else "Slackbot"  # Handle Slackbot messages
            text = msg.get("text", "")
            text = html.unescape(text) 
            text = replace_user_ids_with_names(text)
            # If Slackbot message has no direct text, extract it from "blocks"
            if not text and "blocks" in msg:
                text = extract_text_from_blocks(msg["blocks"])

            # Handle Slackbot canvas updates (tabbed_canvas_updated subtype)
            if msg.get("subtype") == "tabbed_canvas_updated":
                file_id = msg.get("canvas_update_canvas_id", "")
                if file_id:
                    file_name = get_file_name(file_id)
                    text = f"{text} {file_name}"
            
            # Handle bot messages and special message subtypes
            if "subtype" in msg:
                subtype = msg["subtype"]
                if subtype == "bot_message" and "attachments" in msg:
                    text = msg["attachments"][0].get("text", "[No Text]")
                elif subtype == "channel_join":
                    text = f"{user_name} joined the channel"
                elif subtype == "channel_leave":
                    text = f"{user_name} left the channel"
                elif subtype == "message_deleted":
                    text = "[Message Deleted]"
                elif subtype == "file_share":
                    text = "[Shared a file]"
                elif subtype == "channel_topic":
                    text = f"Changed topic to: {msg.get('topic', '[No Topic]')}"
                elif subtype == "channel_purpose":
                    text = f"Changed purpose to: {msg.get('purpose', '[No Purpose]')}"
                elif subtype == "tabbed_canvas_updated":
                    text = f"{text}"
                else:
                    text = f"[{subtype.replace('_', ' ').capitalize()}]"


            if 'files' in msg: 
                if msg['files'][0]['id'] not in forwarded_checklist: 
                    if 'transcription' in msg['files'][0]: 
                        text = f"Transcription: {msg['files'][0]['transcription']['preview']['content']} | Sent an audio message: {msg['files'][0]['url_private_download']}"
                    else: 
                        text = f"{text} | Shared a file: {msg['files'][0]['url_private_download']}"
                    forwarded_checklist.append(msg['files'][0]['id'])
                else: 
                    if 'transcription' in msg['files'][0]: 
                        text = f"Transcription: {msg['files'][0]['transcription']['preview']['content']} | Forwarded an audio message: {msg['files'][0]['url_private_download']}"
                    else: 
                        text = f"{text} | Forwarded a file: {msg['files'][0]['url_private_download']}"

                

            timestamp = msg.get("ts", "Unknown Time")
            readable_time = datetime.utcfromtimestamp(float(timestamp)).strftime('%Y-%m-%d %H:%M:%S')
            print(f"[{readable_time}] {user_name}: {text}")
            all_messages += f"[{readable_time}] [thread_ts: {timestamp}] {user_name}: {text} \n"
            if "thread_ts" in msg and msg.get("reply_count", 0) > 0:
                thread_messages = get_thread_replies(channel_id, msg["thread_ts"])
                all_messages += thread_messages
        return all_messages 

    except SlackApiError as e:
        print(f"Error fetching messages: {e.response['error']}")

def get_thread_replies(channel_id, thread_ts):
    """Fetch replies to a thread in a Slack channel."""
    try:
        response = client.conversations_replies(channel=channel_id, ts=thread_ts)
        replies = response.get("messages", [])[1:]  # Skip the first message (original)

        thread_messages = ""
        thread_messages += f"    [Replies][ \n"

        for reply in replies:
            user_id = reply.get("user", "Unknown User")
            user_name = get_username(user_id) if user_id != "USLACKBOT" else "Slackbot"
            text = reply.get("text", "")
            text = html.unescape(text)
            text = replace_user_ids_with_names(text)

            timestamp = reply.get("ts", "Unknown Time")
            readable_time = datetime.utcfromtimestamp(float(timestamp)).strftime('%Y-%m-%d %H:%M:%S')

            print(f"    ↳ [{readable_time}] {user_name}: {text}")
            thread_messages += f"    [{readable_time}] [thread_ts: {timestamp}] {user_name}: {text} \n"
        thread_messages += f"    ]\n"
        return thread_messages

    except SlackApiError as e:
        print(f"Error fetching thread replies: {e.response['error']}")
        return ""

def replace_user_ids_with_names(text):
    result = ""
    i = 0

    while i < len(text):
        if text[i] == "<":  # Found opening bracket
            end = text.find(">", i)  # Find closing bracket
            if end != -1:  # Ensure closing bracket exists
                user_id = text[i+1:end]  # Extract user ID
                if "@" in user_id:
                    user_id = user_id.lstrip("@")
                    user_name = get_username(user_id)  # Convert to username
                    result += f"<@{user_name}>"  # Replace with @username
                    i = end + 1  # Move index past '>'
                else: 
                    i = end + 1  # Move index past '>'

            else:
                result += text[i]  # If no closing bracket, add as is
                i += 1
        else:
            result += text[i]  # Add normal characters
            i += 1

    return result

def extract_text_from_blocks(blocks):
    """Extracts meaningful text from message blocks."""
    text_parts = []
    for block in blocks:
        if block.get("type") == "rich_text":
            for element in block.get("elements", []):
                if element.get("type") == "rich_text_section":
                    
                    text_parts.extend(
                        sub_element["text"] for sub_element in element.get("elements", []) if sub_element["type"] == "text"
                    )
    return " ".join(text_parts) if text_parts else "[No Text]"

def get_file_name(file_id):
    """Fetch the file name from Slack using file_id."""
    try:
        response = client.files_info(file=file_id)
        return response["file"].get("title", "Unknown File")
    except SlackApiError as e:
        print(f"Error fetching file info for {file_id}: {e.response['error']}")
        return "Unknown File"


def list_canvases():
    """Fetch and display all canvases with their content."""
    try:
        chunk_size = 2000
        # Fetch canvases using the files.list method
        response = client.files_list(types = "canvas")
        list_response = client.files_list(types = 'list')
        lists = list_response.get("files", [])
        canvases = response.get("files", [])
        print()
        print()

        if not canvases:
            print("No canvases found.")
            return

        for canvas in canvases:
            chunks = []
            print()
            print()
            print()
            print("CANVASSSSSSSSSSSSSS: ", canvas) 
            print()
            print()
            print()
            canvas_data = ""

            canvas_id = canvas["id"]
            title = canvas.get("title", "Untitled")
            download_link = canvas.get("url_private_download", "")
            redirect_link = canvas.get("permalink", "")
            creator_id = canvas["user"]
            created_time = datetime.fromtimestamp(float(canvas["created"]))
            creator_name = get_username(creator_id)

            print(f"\nCanvas Title: {title}")
            # canvas_data += f"\n\nCanvas Title: {title}\n"
            print(f"Created by: {creator_name} on {created_time.strftime('%Y-%m-%d %H:%M:%S')}")
            # canvas_data += f"Created by: {creator_name} on {created_time.strftime('%Y-%m-%d %H:%M:%S')}\n"
            print(f"Download link: {download_link}")
            # canvas_data += f"Download link: {download_link}\n"
            print(f"Redirect link: {redirect_link}")
            # canvas_data += f"Redirect link: {redirect_link}\n"
            # print("Content:")
            # display_canvas_content(canvas_id)
            
            # Download and save the canvas file
            print(f"Extracted data: {download_and_save_file(download_link, title, '.html')}")
            canvas_data += f"{download_and_save_file(download_link, title, '.html')}"
            current_chunk = ""
            sentences = sent_tokenize(canvas_data) 
            for sentence in sentences:
                if len(current_chunk) + len(sentence) <= chunk_size:
                    current_chunk += sentence + " "
                    print("HEREE++++++++++++++++")
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = sentence + " "
                    print("here====================")
            if current_chunk:
                chunks.append(current_chunk.strip())
                print("aaaaaaaaaaaaaaaaa")
            for i, chunk in enumerate(chunks, 1):
                # Create a metadata string that includes the source and file name.
                chunk_texts = []

                metadata_str = (
                    f"Canvas name: {title}\n"
                    f"Created by: {creator_name} on {created_time.strftime('%Y-%m-%d %H:%M:%S')}"
                    f"Canvas download link: {download_link}\n"
                    f"Canvas redirect link: {redirect_link}\n"
                    f"Chunk: {i}/{len(chunks)}"
                    "Content: "
                )
                # Combine the metadata with the chunk content.
                combined_chunk = f"{metadata_str}\n\n{chunk}"
                chunk_texts.append(combined_chunk)
                chunk_dict.update({canvas_id+"_"+str(i): chunk_texts})

            #     f = open(f"channel_messages.txt", "a", encoding= 'utf-8')
            #     f.write(str(chunk_dict) + "\n")

            # f.close()

        if not lists: 
            print("No lists found.")
            return 
        
        for list in lists: 
            list_data = ""
            chunks = []

            title = list.get("title", "Untitled")
            download_link = list.get("list_csv_download_url", "")
            redirect_link = list.get("permalink", "")
            creator_id = list["user"]
            created_time = datetime.fromtimestamp(float(canvas["created"]))
            creator_name = get_username(creator_id)

            print(f"\n\nList Title: {title}")
            # list_data += f"\n\nList Title: {title}\n"
            print(f"Created by: {creator_name} on {created_time.strftime('%Y-%m-%d %H:%M:%S')}")
            # list_data += f"Created by: {creator_name} on {created_time.strftime('%Y-%m-%d %H:%M:%S')}"
            print(f"Download link: {download_link}")
            # list_data += f"Download link: {download_link}"
            print(f"Redirect link: {redirect_link}")
            # list_data += f"Redirect link: {redirect_link}"
            print(f"Extracted data: {download_and_save_file(download_link, title, '.csv')}")
            list_data += f"{download_and_save_file(download_link, title, '.csv')}"
            current_chunk = ""
            sentences = sent_tokenize(list_data) 
            for sentence in sentences:
                if len(current_chunk) + len(sentence) <= chunk_size:
                    current_chunk += sentence + " "
                    print("HEREE++++++++++++++++")
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = sentence + " "
                    print("here====================")
            if current_chunk:
                chunks.append(current_chunk.strip())
                print("aaaaaaaaaaaaaaaaa")
            for i, chunk in enumerate(chunks, 1):
                # Create a metadata string that includes the source and file name.
                chunk_texts = []

                metadata_str = (
                    f"List name: {title}\n"
                    f"List download link: {download_link}\n"
                    f"List redirect link: {redirect_link}\n"
                    f"Created by: {creator_name} on {created_time.strftime('%Y-%m-%d %H:%M:%S')}"
                    f"Chunk: {i}/{len(chunks)}"
                )
                # Combine the metadata with the chunk content.
                combined_chunk = f"{metadata_str}\n\n{chunk}"
                chunk_texts.append(combined_chunk)
                chunk_dict.update({list['id']+"_"+str(i): chunk_texts})

        # f = open(f"channel_messages.txt", "a", encoding= 'utf-8')
        # f.write(str(chunk_dict) + "\n")

        # f.close()

        return chunk_dict
    except SlackApiError as e:
        print(f"Error fetching canvases: {e.response}")

def display_canvas_content(canvas_id):
    """Fetch and display the content of a canvas."""
    try:
        criteria = {
            "section_types": ["any_header"],  # Specify the section types you're interested in
            "contains_text": "Action items"  # Optionally, filter sections containing specific text
        }
        # Fetch canvas sections using the canvases.sections.lookup method
        response = client.api_call(
            api_method='canvases.sections.lookup',
            json={'canvas_id': canvas_id, 'criteria': criteria
}
        )
        sections = response.get("sections", [])

        if not sections:
            print("[No Content]")
            return

        for section in sections:
            content = section.get("content", "[No Content]")
            print(content)

    except SlackApiError as e:
        print(f"Error fetching canvas content: {e.response}")

# Run functions
def combine(): 
    x = list_channels()
    y = list_canvases()

    final = x | y 

    f = open(f"channel_messages.txt", "w", encoding= 'utf-8')
    f.write(str(final) + "\n")

    f.close()

    return final
# combine() 

def embed_item_list_to_pinecone(organization_id, user_id):
    chunks = combine()
    print("========================ITEM LIST ==================================")
    if chunks is None:
        print("Where the f..freak is my chunks at!!")

    keys = list(chunks.keys())
    values = [item for sublist in chunks.values() for item in sublist]
    
    print("VALues", values)

    PineconeClient().CreateIndexNameSpaceForUniversalSearch(
        index_name="testsid",
        input_data=values,
        namespace=f"{organization_id}_slack_search",
        namespace_ids=keys,
        replace=True,
        user_id = user_id,
        meta_key="chunk_id"
    )
    print("OKKKKAAAAAAAAAAAYYYYYYY DONEEEEEEEEEE")


embed_item_list_to_pinecone("Hugh", "Jackmanaa")