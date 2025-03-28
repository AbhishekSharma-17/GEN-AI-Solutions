from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage
from langchain_core.agents import AgentAction, AgentFinish
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import operator
from typing import TypedDict, Annotated
import logging
from datetime import datetime, timezone
import json

# Import necessary functions and tools from langGraphSlack.py
from langGraphSlack import (
    web_search, final_answer, search_in_slack, web_image_search,
    send_message_to_slack_channel, reply_to_a_message_in_slack_channel,
    create_slack_canvas, draft_canvas_content, edit_response,
    get_metadata, channel_history
)

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# WebSocket connections
active_connections: Dict[str, WebSocket] = {}

class AgentState(TypedDict):
    input: str
    chat_history: list[BaseMessage]
    intermediate_steps: Annotated[list[tuple[AgentAction, str]], operator.add]

class UserInput(BaseModel):
    message: str

# Initialize the LLM and other necessary components
llm = ChatOpenAI(
    model="gpt-4",
    openai_api_key=os.environ["OPEN_AI_KEY"],
    temperature=0
)

tools = [web_search, final_answer, search_in_slack, web_image_search,
         send_message_to_slack_channel, reply_to_a_message_in_slack_channel,
         create_slack_canvas, draft_canvas_content, edit_response]

# Define the system prompt
current_date = datetime.now(timezone.utc).strftime("%b %d, %Y")
slack_metadata = get_metadata()

system_prompt = f"""
You are the oracle, the great AI decision maker.
Given the user's query you must decide what to do with it based on the
list of tools provided to you.
This is the current date: {current_date}

This is the slack metadata: {slack_metadata}

The current user is Siddhant Dawande with the email id dawandesiddhant8@gmail.com.
Your main goal is to help the user interact with slack(communication application)  

[Your existing system prompt content here]
"""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    MessagesPlaceholder(variable_name="chat_history"),
    ("user", "{input}"),
    ("assistant", "scratchpad: {scratchpad}")
])

# Define the oracle function
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
            intermediate_steps=x["intermediate_steps"]
        )
    }
    | prompt
    | llm.bind_tools(tools, tool_choice="any")
)

# Define the run_oracle function
def run_oracle(state: AgentState):
    out = oracle.invoke(state)
    if out.tool_calls:
        tool_name = out.tool_calls[0]["name"]
        tool_args = out.tool_calls[0]["args"]
        action_out = AgentAction(
            tool=tool_name,
            tool_input=tool_args,
            log="TBD"
        )
        return {"intermediate_steps": [action_out]}
    else:
        # If no tool calls, assume it's a final answer
        return {"intermediate_steps": [AgentFinish(return_values={"answer": out.content}, log=out.content)]}

# Define the run_tool function
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

async def send_tool_update(connection_id: str, tool_name: str):
    if connection_id in active_connections:
        await active_connections[connection_id].send_json({"tool": tool_name})

def run_tool(state: AgentState):
    tool_name = state["intermediate_steps"][-1].tool
    tool_args = state["intermediate_steps"][-1].tool_input
    try:
        # Send tool invocation update
        connection_id = state.get("connection_id")
        if connection_id:
            import asyncio
            asyncio.create_task(send_tool_update(connection_id, tool_name))

        out = tool_str_to_func[tool_name].invoke(input=tool_args)

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
    except Exception as e:
        logger.error(f"Error executing tool {tool_name}: {str(e)}")
        return {"intermediate_steps": [AgentFinish(return_values={"answer": f"Error executing tool {tool_name}: {str(e)}"}, log=str(e))]}

# Define the router function
def router(state: AgentState):
    if isinstance(state["intermediate_steps"], list):
        return state["intermediate_steps"][-1].tool
    else:
        return "final_answer"

# Create the graph
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
    path=router
)

for tool_obj in tools:
    if tool_obj.name != "final_answer":
        graph.add_edge(tool_obj.name, "oracle")

graph.add_edge("final_answer", END)

run = graph.compile()

def build_report(output: dict):
    answer = output["answer"]
    return answer

@app.websocket("/ws/{connection_id}")
async def websocket_endpoint(websocket: WebSocket, connection_id: str):
    await websocket.accept()
    active_connections[connection_id] = websocket
    try:
        while True:
            await websocket.receive_text()
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        del active_connections[connection_id]

@app.post("/chat")
async def chat(user_input: UserInput):
    try:
        logger.info(f"Received user input: {user_input.message}")
        out = run.invoke({
            "input": user_input.message,
            "chat_history": channel_history,
            "intermediate_steps": [],
            "connection_id": user_input.connection_id
        })
        channel_history.append(f"User: {user_input.message}")
        final_step = out["intermediate_steps"][-1]

        if isinstance(final_step, AgentFinish):
            response = build_report(output=final_step.return_values)
            channel_history.append(f"AI: {response}")
            logger.info(f"AI response: {response}")
            return {"response": response}
        else:
            logger.info(f"Intermediate step: {final_step.log}")
            return {"response": f"Intermediate Step: {final_step.log}"}
    except Exception as e:
        logger.error(f"Error processing chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI server")
    uvicorn.run(app, host="0.0.0.0", port=8000)
