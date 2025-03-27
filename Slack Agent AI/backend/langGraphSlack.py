import base64
import io
import json
import os 
from pathlib import Path
import time
from typing import TypedDict, Annotated, List, Union 
from langchain_core.agents import AgentAction, AgentFinish 
from langchain_core.messages import BaseMessage 
import operator 
from dotenv import load_dotenv 
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
from chat_with_slack import answer
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from slack_metadata import get_metadata
from datetime import datetime, timezone


load_dotenv() 
channel_history = []

steps = []
agent_count = 0
def run_functions_stream(steps):
    # steps = []
    for i, step in enumerate(steps, 1):
        message = {"status": f"{step} is running", "step": i}
        yield json.dumps(message) + "\n"
    yield json.dumps({"status": "All functions completed", "step": 5}) + "\n"

class AgentState(TypedDict): 
    input: str 
    chat_history: list[BaseMessage] 
    intermediate_steps: Annotated[list[tuple[AgentAction, str]], operator.add] 


serpapi_params = {
    "engine" : "google", 
    "api_key": os.getenv("SER_PAPI_KEY") 
}
tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

client = boto3.client(
    "bedrock-runtime",
    aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name = "us-east-1"
)

@tool("web_image_search")
def web_image_search(query: str):
    """Finds images to include in a response using Google search"""


    params = {
    "q": query,
    "engine": "google_images",
    "ijn": "0",
    "api_key": os.getenv("SER_PAPI_KEY"), 
    "num": 1
    }

    search = GoogleSearch(params)
    results = search.get_dict()
    images_results = results["images_results"]

    print("IMAGE RESults: ",images_results)

    return {
        images_results[0]["title"]: images_results[0]["thumbnail"],
    }

@tool("web_search") 
def web_search(query: str):
    """Finds general knowledge information using Google search."""

    # search = GoogleSearch({
    #     **serpapi_params,
    #     "q": query,
    #     "num": 1
    # })

    # results = search.get_dict()
    # contexts = "\n---\n".join(
    #     ["\n".join([x["title"], x["snippet"], x["link"]]) for x in results]
    # )
    web_results  = tavily.search(query=query, max_results=2, use_cache=True)
    return web_results
    # return results 

@tool("create_slack_canvas")
def create_slack_canvas(content: str, channel_id: str):
    """Creates a Slack Canvas and uploads it to a specified channel. Takes content of the canvas and the channel_id as arguments."""
    USER_OAUTH_TOKEN = os.getenv("USER_OAUTH_TOKEN")
    client = WebClient(token=USER_OAUTH_TOKEN)
    try:
    # Replace with the Slack channel ID where you want to create the canvas

        # Create a channel-attached canvas
        response = client.conversations_canvases_create(
            channel_id=channel_id,
            document_content={
                "type": "markdown",
                "markdown": content
            } 
        )
        print(f"Channel canvas created successfully with ID: {response}")
    except SlackApiError as e:
        print(f"Error creating channel canvas: {e.response}")

@tool("draft_canvas_content") 
def draft_canvas_content(query: str):
    """This will help draft the content of a canvas that the user wants to create in slack."""

    #TO DO: Add guard-rails to the system_prompt
    system_prompt = """
Your job is to draft some content that will go in a slack canvas. Slack is a corporate communication platform.

 The content should always be in a markdown format. Only respond with the content and nothing else. The content should be based on the user query. 

"""

    prompt = ChatPromptTemplate.from_messages([
        ('system', system_prompt), 
        ("user", "{input}" )
    ])

    runnable = prompt | llm

    tone_change_output = runnable.invoke({"input": query})
    # print("=============================FINAL OUTPUT ==========================") 
    # print(final_output) 
    # print("RAW_DATA"+raw_data)
    # print("========================FInal output end ==========================")
    return tone_change_output.content

@tool("search_in_slack")
def search_in_slack(query: str): 
    """Searches for relevant information in slack with respect to the user query. Fetches relevant information from slack."""
    x = answer(query)
    channel_history.append(f"Retrieved data: {answer(query)}")

    return str(x)

@tool("final_answer") 
def final_answer(raw_data: str): 
    """Simply returns the output of the last tool"""
    return raw_data

@tool("send_message_to_slack_channel")
def send_message_to_slack_channel(message: str, channel_id: str):
    """Posts messages on behalf of the user to a slack channel with specified channel_id. Takes channel_id and message parameters. """
    if not channel_id: 
        return "Please provide a channel id."
    # Replace with the user's OAuth token

    USER_OAUTH_TOKEN = os.getenv("USER_OAUTH_TOKEN")
    # CHANNEL_ID = "C08FCNVCZJB"  # Replace with your channel ID

    client = WebClient(token=USER_OAUTH_TOKEN)

    
    user_query = input(f"This message will be sent to slack on your behalf:\n [ {message} ] \n Are you sure: y/n: ")
    if user_query.lower() == "y":
        try:
            response = client.chat_postMessage(
                channel=channel_id,
                text=message,
                as_user=True  # Ensures it is sent as the user
            )
            print(f"Message sent: {response['ts']}")

            return f"Message has been sent successfully to slack channel. Channel id: {channel_id}!"
        except SlackApiError as e:
            print(f"Error sending message: {e.response['error']}")
    else: 
        return "Message is not satisfactory, Ask the user what they want to say!"

@tool("reply_to_a_message_in_slack_channel")
def reply_to_a_message_in_slack_channel(message: str, channel_id: str = None, thread_ts: str = None):
    """Replies to an existing thread in a Slack channel. Takes channel_id, message, and thread_ts."""
    if not channel_id:
        return "Please provide a channel ID."

    USER_OAUTH_TOKEN = os.getenv("USER_OAUTH_TOKEN")
    client = WebClient(token=USER_OAUTH_TOKEN)

    user_query = input(f"This reply will be sent to Slack on your behalf:\n [ {message} ] \n Are you sure? (y/n): ")
    if user_query.lower() == "y":
        try:
            response = client.chat_postMessage(
                channel=channel_id,
                text=message,
                thread_ts=thread_ts,  # If provided, message will be sent as a reply
                as_user=True  
            )
            print(f"Message sent: {response['ts']}")
            return f"Reply has been sent successfully to slack channel. Channel id: {channel_id}!"
        except SlackApiError as e:
            print(f"Error sending message: {e.response}")
    else:
        return "Reply is not satisfactory, Ask the user what they want to say!"



@tool("edit_response") 
def edit_response(raw_data: str, user_query: str): 
    """This will adjust the final response according to the user's query."""

    #TO DO: Add guard-rails to the system_prompt
    system_prompt = """
Just change the text according to the user query.

"""

    prompt = ChatPromptTemplate.from_messages([
        ('system', system_prompt), 
        ("user", "{input}" )
    ])

    runnable = prompt | llm

    tone_change_output = runnable.invoke({"input": raw_data, "user_query": user_query})
    # print("=============================FINAL OUTPUT ==========================") 
    # print(final_output) 
    # print("RAW_DATA"+raw_data)
    # print("========================FInal output end ==========================")
    return tone_change_output.content

def doc_upload():
    """This tool can convert a document uploaded by the user and convert it to a readable list[documents] format."""

    input_file_path = input("PASTE YOUR FILE PATH HERE: ")
    loader = UnstructuredAPIFileLoader(
        api_key=os.getenv("UNSTRUCTURE_API_KEY"),
        file_path=input_file_path,
        mode="elements",
        strategy="fast",
        url=os.getenv("API_URL")
    )

    documents = loader.load()
    return documents

def analyze_image():
    """This tool can convert the contents of an image into a readable text format."""

    file_path = input("PASTE YOUR FILE PATH HERE: ")
    media_types = {
        "jpeg": "image/jpeg",
        "jpg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp"
    }
    file_extension = Path(file_path).suffix[1:].lower()
    if file_extension not in media_types:
        raise ValueError(f"Unsupported file type: {file_extension}")
    
    groq_client = openai.OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.environ.get("GROQ_API_KEY"),
    )
    def encode_image(image_path):
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
        
    base64_image = encode_image(file_path) 

    chat_completion = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": f"What's in this image?"},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                },
                            },
                        ],
                    }
                ],
                model="llama-3.2-90b-vision-preview",
            )
    results = chat_completion.choices[0].message.content
    return results
    # media_type = media_types[file_extension]
    
    # with open(file_path, "rb") as image_file:
    #     image_data = image_file.read()
        
    # base64_image = base64.b64encode(image_data).decode('utf-8')
    
    # payload = {
    #     "anthropic_version": "bedrock-2023-05-31",
    #     "max_tokens": 1001,
    #     "messages": [
    #         {
    #             "role": "user",
    #             "content": [
    #                 {
    #                     "type": "image",
    #                     "source": {
    #                         "type": "base64",
    #                         "media_type": media_type,
    #                         "data": base64_image
    #                     }
    #                 },
    #                 {
    #                     "type": "text",
    #                     "text": "Please describe this image in detail, as if you were explaining it to someone who can't see it. Focus on the main elements, colors, and any notable features or patterns. What's the overall mood or atmosphere of the image?"
    #                 }
    #             ]
    #         }
    #     ]
    # }

    # response = client.invoke_model(
    #     modelId="anthropic.claude-3-sonnet-20240229-v1:0",
    #     contentType='application/json',
    #     accept='application/json',
    #     body=json.dumps(payload)
    # )
    
    # result = json.loads(response['body'].read())    
    # return result['content'][0]['text']

def analyze_video():
    """This tool can convert the contents of a video into a readable text format."""

    # file_path = input("PASTE YOUR FILE PATH HERE: ")
    video_path = input("Enter the path to your video: ")
    video_media_types = {
    "mp4": "video/mp4",
    "mov": "video/quicktime",
    "avi": "video/x-msvideo",
    "mkv": "video/x-matroska",
    "flv": "video/x-flv",
    "wmv": "video/x-ms-wmv",
    "webm": "video/webm",
    "mpeg": "video/mpeg",
    "3gp": "video/3gpp",
    "3g2": "video/3gpp2"
}
    file_extension = Path(video_path).suffix[1:].lower()

    if file_extension not in video_media_types:
        raise ValueError(f"Unsupported file type: {file_extension}")
    
    interval = int(input("Enter the interval for screenshots in seconds (e.g., 30 or 60): "))
    groq_client = openai.OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.environ.get("GROQ_API_KEY"),
    )
    def take_screenshots(video_path, interval):
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_interval = int(fps * interval)
        screenshots = []
        
        # Create video_screenshots folder if it doesn't exist
        os.makedirs("video_screenshots", exist_ok=True)
        
        frame_count = 0
        screenshot_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % frame_interval == 0:
                pil_image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                screenshot_path = f"video_screenshots/screenshot_{screenshot_count:03d}.jpg"
                pil_image.save(screenshot_path)
                screenshots.append(screenshot_path)
                screenshot_count += 1
            
            frame_count += 1
        
        cap.release()
        return screenshots
    
    def encode_pil_image(pil_image):
        buffered = io.BytesIO()
        pil_image.save(buffered, format="JPEG")
        return base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    def process_images(image_paths, groq_client):
        results = []
        for i, image_path in enumerate(image_paths):
            with Image.open(image_path) as img:
                base64_image = encode_pil_image(img)
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": f"What's in this image? (Image {i+1})"},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                },
                            },
                        ],
                    }
                ],
                model="llama-3.2-90b-vision-preview",
            )
            results.append(chat_completion.choices[0].message.content)
        return results
    
    
    screenshot_paths = take_screenshots(video_path, interval)
    
    results = process_images(screenshot_paths, groq_client)

    system_prompt = """
    Your task is consolidate all the information that you will receive about a video. 
    The information about the video is gathered by taking screenshots of the video at specific intervals.
    You will receive the descriptions of said screenshots.

    Summarize all the descriptions about the screenshots. 
    DO NOT OMIT ANY CRITICAL DETAILS!!
    ONLY PROVIDE THE SUMMARY IN YOUR RESPONSE.

    The content is given below:
"""

    prompt = ChatPromptTemplate.from_messages([
        ('system', system_prompt), 
        ("user", "{input}" )
    ])

    runnable = prompt | llm

    final_output = runnable.invoke({"input": str(results)})

    return final_output.content
# Compare the user query and the context you have been provided to ask questions that aren't answered by the context.
# You are a helpful research agent.
# ---
# Only provide one tool with one argument. 
# DO NOT ASK THE SAME QUERY MORE THAN ONCE. DO NOT ASK THE SAME QUERY MORE THAN ONCE.

# WORK WITH AND TRY TO ADD TO THE INFORMATION YOU HAVE.
# You can call the analyze_image tool only once. If it is already there in the scratchpad 
# do not call it again.
# You can call the document_upload tool only once. If it is already there in the scratchpad
# do not call it again.
slack_metadata = get_metadata()
print()
print("SLACK METADATA: ", slack_metadata)
print()
current_date = datetime.now(timezone.utc).strftime("%b %d, %Y")
system_prompt = """
You are the oracle, the great AI decision maker.
Given the user's query you must decide what to do with it based on the
list of tools provided to you.
This is the current data: {current_date}

This is the slack metadata: {slack_metadata}

The current user is Siddhant Dawande with the email id dawandesiddhant8@gmail.com.
Your main goal is to help the user interact with slack(communication application)  
If you see that a tool has been used (in the scratchpad) with a particular
query, do NOT use that same tool with the same query again. Also, do NOT use
any tool more than once (ie, if the tool appears in the scratchpad once, do
not use it again).

If you are unsure of what the user is asking then invoke the final_answer tool with your clarification request/question. 
YOU CAN NOT USE ANY TOOL TWICE IN A ROW!!
YOU CAN ONLY USE THE reply_to_a_message_in_slack_channel ONLY ONCE!!.
YOU CAN CALL THE EDIT_RESPONSE, WEB_SEARCH, WEB_IMAGE_SEARCH, SEARCH_IN_SLACK, SEND_MESSAGE_TO_SLACK_CHANNEL, REPLY_TO_A_MESSAGE_IN_SLACK_CHANNEL, CREATE_SLACK_CANVAS, DRAFT_CANVAS_CONTENT TOOLS ONLY ONCE!. If it is already there in the scratchpad 
do not call it again.

What do to when the user wants to send a message: 
``` If the user requires to send a message to slack, then you need to have the following details before calling the send_message_to_slack_channel tool: 
        - channel message to be sent. (message) 
        - channel id. (channel_id)
    You can get the channel name from the user by listing them out to the user. Then using the metadata get the channel_id corresponding to the channel name selected by the user. ```

What do to when the user wants to reply to a message: 
```
If the user requires to REPLY a message in slack, then you need to have the following details before calling the reply_to_a_message_in_slack_channel tool: 
    - who the user wants to reply to. 
    - thread_ts (variable name = thread_ts)
    - channel reply to be sent. (variable name = message) 
    - channel id. (variable name = channel_id)

You can get the channel name from the user by listing them out to the user. Then using the metadata get the channel_id corresponding to the channel name selected by the user.
You will need to ask the user who they want to reply to, by listing out the members of the channel they just selected. 
Based on the selected user retrieve the messages sent by the selected user, by using the search_in_slack tool. 
You will find the thread_ts with every message sent by the selected user. 
Get the user to confirm what specific message to reply to and then use the thread_ts from that message, channel_id, reply to be sent and use the reply_to_a_message_in_slack_channel tool.
Suggest some replies to the user first befroe using the reply_to_a_message_in_slack_channel tool.
 ```

What to do when the user wants to create a canvas in slack: ```
First you need to get the topic and the idea of what the user wants the content to look like in the canvas by asking them 1 question that can guage the idea/topic of the content.
THEN USE THE DRAFT_CANVAS_CONTENT TOOL TO GET THE CONTENT OF THE CANVAS and then use the create_slack_canvas tool followed by final_answer.
The create_slack_canvas tool takes two arguments: 
    - content
    - channel_id

You can get the channel name from the user by listing them out to the user. Then using the metadata get the channel_id corresponding to the channel name selected by the user.
Content is the output of the draft_canvas_content tool.
```
When using the edit_response, give the user query plus previous response as raw_data (raw_data = user_query+previousResponse) and then call the final_answer tool.

Once you have collected plenty of information
to answer the user's question (stored in the scratchpad) use the final_answer
tool.
""".format(
    slack_metadata = str(slack_metadata), 
    current_date = str(current_date)
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    MessagesPlaceholder(variable_name="chat_history"),
    ("user", "{input}"),
    ("assistant", "scratchpad: {scratchpad}")
])

llm = ChatOpenAI(
    model="gpt-4o",
    openai_api_key = os.environ["OPEN_AI_KEY"],
    temperature=0
)

tools = [web_search, final_answer, search_in_slack, web_image_search, send_message_to_slack_channel, reply_to_a_message_in_slack_channel, create_slack_canvas, draft_canvas_content, edit_response] 


def create_scratchpad(intermediate_steps: list[AgentAction]):
    research_steps = []
    for i, action in enumerate(intermediate_steps):
        if action.log != "TBD":
            research_steps.append(
                f"Tool: {action.tool}, input: {action.tool_input}\n"
                f"Output: {action.log}"
            )
    # print("=============================RESEARCH STEPS START ++++++++++++++++++++++++++++++") 
    # print("\n---\n".join(research_steps))
    # print("====================================RESEARCH STEPS END ____________________________________________") 

    return "\n --- \n".join(research_steps)

oracle = (
    {
        "input": lambda x: x["input"],
        "chat_history": lambda x: x["chat_history"],
        "scratchpad": lambda x: create_scratchpad(
            intermediate_steps = x["intermediate_steps"]
        )
    }
    | prompt 
    | llm.bind_tools(tools, tool_choice="any")
)

def run_oracle(state: list): 
    print("run_oracle") 
    out = oracle.invoke(state)
    if out.tool_calls:
        
        tool_name = out.tool_calls[0]["name"] 
        tool_args = out.tool_calls[0]["args"]

        action_out = AgentAction(
            tool = tool_name, 
            tool_input = tool_args,
            log = "TBD"

        )
        return {"intermediate_steps" : [action_out]}
    
tool_str_to_func = {
    "web_search": web_search, 
    "final_answer": final_answer,
    "web_image_search": web_image_search, 
    "edit_response": edit_response, 
    "search_in_slack": search_in_slack, 
    "send_message_to_slack_channel": send_message_to_slack_channel, 
    "reply_to_a_message_in_slack_channel": reply_to_a_message_in_slack_channel, 
    "create_slack_canvas": create_slack_canvas, 
    "draft_canvas_content": draft_canvas_content
}

def run_tool(state: list): 
    
    #TO DO NOW: Iterate through the tool_call list
    tool_name = state["intermediate_steps"][-1].tool 
    tool_args = state["intermediate_steps"][-1].tool_input
    print(f"{tool_name}.invoke(input={tool_args})")

    # if tool_name == "final_answer": 
    #     # raw_data = state["intermediate_steps"][-1].log
    #     out = tool_str_to_func[tool_name].invoke(input = tool_args) 
    # else: 
    out = tool_str_to_func[tool_name].invoke(input = tool_args)

    # Add a if statement here for no internet/ other tool problem

    if tool_name == "final_answer":
        action_out = AgentFinish(
            return_values={"answer": out},
            log=str(out)
        )
        return {"intermediate_steps": [action_out]}
    
    if tool_name == "create_slack_canvas": 
        channel_id = tool_args['channel_id']
    action_out = AgentAction(
        tool=tool_name, 
        tool_input=tool_args, 
        log=str(out)
    )

    return {"intermediate_steps": [action_out]}
# def state_updater_after_tool_call(state: list): 

def router(state: list): 

    if isinstance(state["intermediate_steps"], list): 
        return state["intermediate_steps"][-1].tool
    else: 
        print("Router invalid formate") 
        return "final_answer"

graph = StateGraph(AgentState) 

graph.add_node("oracle", run_oracle) 
graph.add_node("web_search", run_tool) 
graph.add_node("final_answer", run_tool)
graph.add_node("search_in_slack", run_tool)
graph.add_node("web_image_search", run_tool)
graph.add_node("edit_response", run_tool) 
graph.add_node("send_message_to_slack_channel", run_tool)
graph.add_node("reply_to_a_message_in_slack_channel", run_tool) 
graph.add_node("create_slack_canvas", run_tool) 
graph.add_node("draft_canvas_content", run_tool)
graph.set_entry_point("oracle")
graph.add_conditional_edges(
    source="oracle", 
    path = router
)

for tool_obj in tools:
    if tool_obj.name != "final_answer":
        graph.add_edge(tool_obj.name, "oracle")

graph.add_edge("final_answer", END)


def build_report(output: dict): 
    answer = output["answer"]
    return answer 

def ask_agent(query: str):
    inputs = {
        "input": query,
        "chat_history": channel_history,
        "intermediate_steps": [],
    }

    run = graph.compile() 

    channel_history.append(f"User: {query}")
    for chunk in run.stream(inputs, stream_mode="updates"):
        print("CHNK: : ", chunk)
        # final_step = chunk['oracle']["intermediate_steps"][-1]

        

        # if str(list(chunk.keys())[0])=="final_answer":
        #     channel_history.append(f"AI: {list(chunk.values())[0]['intermediate_steps'][0].tool_args['answer']}")

        #     for s in  f"Final Answer : {list(chunk.values())[0]['intermediate_steps'][0].tool_args['answer']}":
        #         yield(s)
        #         time.sleep(0.1)
        if list(chunk.keys())[0] == "final_answer":
            answer = list(chunk.values())[0]['intermediate_steps'][0].return_values['answer']
            channel_history.append(f"AI: {answer}")

            for s in f"\n\n{answer}":
                yield s
                time.sleep(0.01)

        else: 
            mod_chunk=f"Tool Used : {list(chunk.keys())[0]} \n\nAgent Action: {list(chunk.values())[0]['intermediate_steps'][0].tool}\n\n\n"
            yield(mod_chunk)
            # print( f"Final Answer : {list(chunk.values())[0]['intermediate_steps'][0].tool_input['answer']}")


    
        # if isinstance(final_step, AgentFinish):
        #     response = build_report(output=final_step.return_values)
        #     print(f"Final Answer: {response}")
        # else:
        # #     # Handle cases where the final answer isn't reached yet
        #     print(f"Intermediate Step: {final_step.log}")


# while True: 
#     user_input = input("User: ") 
    
#     if user_input.lower() == "exit":
#         break 
#     out = run.invoke({
#         "input": user_input,
#         "chat_history": channel_history,
#         "intermediate_steps": []
#     })
#     channel_history.append(f"User: {user_input}")
#     final_step = out["intermediate_steps"][-1]
    
#     if isinstance(final_step, AgentFinish):
#         response = build_report(output=final_step.return_values)
#         channel_history.append(f"AI: {response}")
#         print(f"Final Answer: {response}")
#     else:
#         # Handle cases where the final answer isn't reached yet
#         print(f"Intermediate Step: {final_step.log}")

