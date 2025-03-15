import streamlit as st
import base64
import io
import json
import os 
from pathlib import Path
from typing import TypedDict, Annotated, List, Union 
from langchain_core.agents import AgentAction, AgentFinish 
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
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

# Load environment variables
load_dotenv()

# Check for required environment variables
required_env_vars = ["OPEN_AI_KEY", "SER_PAPI_KEY", "TAVILY_API_KEY", "GROQ_API_KEY"]
missing_env_vars = [var for var in required_env_vars if not os.getenv(var)]

if missing_env_vars:
    st.error(f"Missing required environment variables: {', '.join(missing_env_vars)}")
    st.stop()

# Streamlit UI setup
st.set_page_config(layout="wide", page_title="Slack AI Assistant")
st.title("Slack AI Assistant")

# Initialize session state
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
if 'intermediate_steps' not in st.session_state:
    st.session_state.intermediate_steps = []

# Sidebar for user input and actions
st.sidebar.title("Actions")
user_input = st.sidebar.text_area("Enter your message:", height=100)
send_button = st.sidebar.button("Send")

# Main content area
chat_container = st.container()

# Display chat history
with chat_container:
    for message in st.session_state.chat_history:
        if isinstance(message, HumanMessage):
            st.text_area("You:", value=message.content, height=100, disabled=True)
        elif isinstance(message, AIMessage):
            st.text_area("AI:", value=message.content, height=100, disabled=True)

# Agent setup
class AgentState(TypedDict): 
    input: str 
    chat_history: list[BaseMessage] 
    intermediate_steps: Annotated[list[tuple[AgentAction, str]], operator.add] 

serpapi_params = {
    "engine": "google", 
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
    return {
        images_results[0]["title"]: images_results[0]["thumbnail"],
    }

@tool("web_search") 
def web_search(query: str):
    """Finds general knowledge information using Google search."""
    web_results = tavily.search(query=query, max_results=2, use_cache=True)
    return web_results

@tool("create_slack_canvas")
def create_slack_canvas(content: str, channel_id: str):
    """Creates a Slack Canvas and uploads it to a specified channel."""
    USER_OAUTH_TOKEN = os.getenv("SLACK_USER_OAUTH_TOKEN")
    client = WebClient(token=USER_OAUTH_TOKEN)
    try:
        response = client.conversations_canvases_create(
            channel_id=channel_id,
            document_content={
                "type": "markdown",
                "markdown": content
            } 
        )
        return f"Channel canvas created successfully with ID: {response}"
    except SlackApiError as e:
        return f"Error creating channel canvas: {e.response}"

@tool("draft_canvas_content") 
def draft_canvas_content(query: str):
    """This will help draft the content of a canvas that the user wants to create in slack."""
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
    return tone_change_output.content

@tool("search_in_slack")
def search_in_slack(query: str): 
    """Searches for relevant information in slack with respect to the user query."""
    return answer(query)

@tool("final_answer") 
def final_answer(raw_data: str): 
    """Simply returns the output of the last tool"""
    return raw_data

@tool("send_message_to_slack_channel")
def send_message_to_slack_channel(message: str, channel_id: str):
    """Posts messages on behalf of the user to a slack channel with specified channel_id."""
    USER_OAUTH_TOKEN = os.getenv("SLACK_USER_OAUTH_TOKEN")
    client = WebClient(token=USER_OAUTH_TOKEN)
    try:
        response = client.chat_postMessage(
            channel=channel_id,
            text=message,
            as_user=True
        )
        return f"Message has been sent successfully to slack channel. Channel id: {channel_id}!"
    except SlackApiError as e:
        return f"Error sending message: {e.response['error']}"

@tool("reply_to_a_message_in_slack_channel")
def reply_to_a_message_in_slack_channel(message: str, channel_id: str, thread_ts: str):
    """Replies to an existing thread in a Slack channel."""
    USER_OAUTH_TOKEN = os.getenv("SLACK_USER_OAUTH_TOKEN")
    client = WebClient(token=USER_OAUTH_TOKEN)
    try:
        response = client.chat_postMessage(
            channel=channel_id,
            text=message,
            thread_ts=thread_ts,
            as_user=True  
        )
        return f"Reply has been sent successfully to slack channel. Channel id: {channel_id}!"
    except SlackApiError as e:
        return f"Error sending message: {e.response}"

@tool("edit_response") 
def edit_response(raw_data: str, user_query: str): 
    """This will adjust the final response according to the user's query."""
    system_prompt = "Just change the text according to the user query."
    prompt = ChatPromptTemplate.from_messages([
        ('system', system_prompt), 
        ("user", "{input}" )
    ])
    runnable = prompt | llm
    tone_change_output = runnable.invoke({"input": raw_data, "user_query": user_query})
    return tone_change_output.content

# Load Slack metadata
slack_metadata = get_metadata()
current_date = datetime.now(timezone.utc).strftime("%b %d, %Y")

system_prompt = f"""
You are an AI assistant for Slack. Your main goal is to help users interact with Slack.
Current date: {current_date}
Slack metadata: {slack_metadata}

The current user is Siddhant Dawande with the email id dawandesiddhant8@gmail.com.

When the user wants to perform an action in Slack:
1. Identify the action (send message, reply to message, create canvas, etc.)
2. Determine the required information (channel, message content, etc.)
3. Guide the user to provide any missing information
4. Confirm the action before executing it

Remember:
- Always provide clear, concise responses
- Respect user privacy and Slack workspace guidelines
- If unsure, ask for clarification
- Use the appropriate tool for each action
- Do not use the same tool with the same query more than once
- You can only use reply_to_a_message_in_slack_channel, edit_response, web_search, web_image_search, search_in_slack, send_message_to_slack_channel, create_slack_canvas, and draft_canvas_content once each

Follow these guidelines for specific actions:
[Include guidelines for sending messages, replying to messages, creating canvases, etc.]
"""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    ("ai", "scratchpad: {scratchpad}")
])

llm = ChatOpenAI(
    model="gpt-4",
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

def run_oracle(state: AgentState): 
    out = oracle.invoke(state)
    if out.tool_calls:
        tool_name = out.tool_calls[0]["name"] 
        tool_args = out.tool_calls[0]["args"]
        action_out = AgentAction(
            tool = tool_name, 
            tool_input = tool_args,
            log = "TBD"
        )
        return {"intermediate_steps": [action_out]}
    
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

def run_tool(state: AgentState): 
    tool_name = state["intermediate_steps"][-1].tool 
    tool_args = state["intermediate_steps"][-1].tool_input
    out = tool_str_to_func[tool_name].invoke(input = tool_args)

    if tool_name == "final_answer":
        action_out = AgentFinish(
            return_values={"answer": out},
            log=str(out)
        )
        return {"intermediate_steps": [action_out]}
    
    action_out = AgentAction(
        tool=tool_name, 
        tool_input=tool_args, 
        log=str(out)
    )
    return {"intermediate_steps": [action_out]}

def router(state: AgentState): 
    if isinstance(state["intermediate_steps"], list): 
        return state["intermediate_steps"][-1].tool
    else: 
        return "final_answer"

graph = StateGraph(AgentState) 

graph.add_node("oracle", run_oracle) 
for tool_name in tool_str_to_func.keys():
    graph.add_node(tool_name, run_tool)

graph.set_entry_point("oracle")
graph.add_conditional_edges(
    source="oracle", 
    path = router
)

for tool_name in tool_str_to_func.keys():
    if tool_name != "final_answer":
        graph.add_edge(tool_name, "oracle")

graph.add_edge("final_answer", END)

run = graph.compile() 

def build_report(output: dict): 
    answer = output["answer"]
    return answer 

# Handle user input
if send_button and user_input:
    st.session_state.chat_history.append(HumanMessage(content=user_input))
    
    out = run.invoke({
        "input": user_input,
        "chat_history": st.session_state.chat_history,
        "intermediate_steps": st.session_state.intermediate_steps
    })
    
    final_step = out["intermediate_steps"][-1]
    if isinstance(final_step, AgentFinish):
        response = build_report(output=final_step.return_values)
        st.session_state.chat_history.append(AIMessage(content=response))
    else:
        st.session_state.chat_history.append(AIMessage(content="I'm still processing your request. Please ask another question."))
    
    # Clear the input area
    st.sidebar.empty()
    
    # Rerun the app to update the chat display
    st.experimental_rerun()

# Add a section for displaying Slack metadata
st.sidebar.title("Slack Workspace Info")
st.sidebar.json(slack_metadata)

# Footer
st.sidebar.markdown("---")
st.sidebar.markdown("Powered by LangChain and OpenAI")
