import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from uuid import uuid4

from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from typing import List, Any, Annotated, Dict, Optional
from langchain.prompts import ChatPromptTemplate
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
from langchain_core.output_parsers import JsonOutputParser
import asyncio
from typing import List, Any
from typing import TypedDict, List, Dict, Any
from langchain_core.tools import tool, StructuredTool
from pydantic import BaseModel, Field
from tools import WikipediaTool, ArXivTool, WebScrapeTool, search_web, RAGTool, DataAnalysisTool, FileReadTool, FileWriteTool
import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import Tool
from langchain_core.output_parsers import JsonOutputParser
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.agents import AgentAction
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage, HumanMessage
import datetime
from langgraph.graph import StateGraph, END

load_dotenv()

TEMP_DIR = "temp_data"
os.makedirs(TEMP_DIR, exist_ok=True)

# Input Schemas
class WebScrapeInput(BaseModel):
    url: str = Field(..., description="The URL to scrape")
    formats: List[str] = Field(default=["markdown"], description="Output formats: markdown, html, structured_data")

class RAGInput(BaseModel):
    query: str = Field(..., description="The query to answer")
    context: str = Field(default=None, description="Optional context to add to the document store")

def create_tools() -> List:
    wiki_tool = WikipediaTool()
    arxiv_tool = ArXivTool()
    web_scrape_tool = WebScrapeTool()
    data_analysis_tool = DataAnalysisTool()
    file_read_tool = FileReadTool()
    file_write_tool = FileWriteTool()
    rag_tool = RAGTool()

    tools = [
        Tool(name="search_wikipedia", func=wiki_tool.search, description="Search Wikipedia. Input: query string."),
        Tool(name="fetch_arxiv", func=arxiv_tool.fetch, description="Fetch ArXiv abstract. Input: ArXiv ID."),
        Tool(name="web_scrape", func=web_scrape_tool.scrape, description="Scrape a webpage. Input: URL string."),
        Tool(name="tavily_search", func=search_web, description="Search the web using Tavily. Input: query string."),
        Tool(name="data_analysis", func=data_analysis_tool.analyze, description="Analyze CSV data. Input: dict with 'query', 'csv_path' or 'csv_content'."),
        Tool(name="file_read", func=file_read_tool.read, description="Read a file. Input: file path string."),
        Tool(name="file_write", func=file_write_tool.write, description="Write to a file. Input: dict with 'file_path', 'content', 'append'."),
        Tool(name="rag_tool", func=rag_tool.retrieve_and_generate, description="Generate answer with retrieved docs. Input: query string or dict.")
    ]
    return tools

all_tools = create_tools()
tool_dict = {tool.name: tool for tool in all_tools}

class WorkflowState(TypedDict):
    user_id: str
    query: str
    selected_agents: List[str]
    agent_results: Dict[str, List[str]]  # List to store multiple outputs per agent
    shared_memory: Dict[str, Any]
    intermediate_steps: List[Dict[str, str]]
    chat_history: List[Any]
    final_answer: str | None

# Oracle Node: Select multiple agents and allow parallel execution
async def oracle_node(state: WorkflowState) -> WorkflowState:
    query = state["query"]
    user_id = state["user_id"]
    file_path = os.path.join(TEMP_DIR, f"{user_id}.json")
    
    try:
        with open(file_path, "r") as json_file:
            user_data = json.load(json_file)
    except FileNotFoundError:
        state["intermediate_steps"].append({"step": "Oracle Error", "details": f"No config for user {user_id}"})
        state["final_answer"] = "Error: User configuration not found."
        return state
    
    agents = user_data["agents"]
    system_prompt = """You are the oracle. Given the query, select one or more DISTINCT agents to invoke in parallel.
    Available agents: {agent_names}. Tools: {tool_names}.
    Use shared memory: {shared_memory}.
    Select multiple agents if diverse perspectives (e.g., research and summarization) are needed. 
    For queries requiring data collection and synthesis, prefer 'Researcher' for gathering data and 'Summarizer' for refining it.
    Use 'final_answer' only if sufficient data exists in shared memory to answer directly without further agent invocation."""
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("user", "{input}"),
        ("assistant", "Scratchpad: {agent_scratchpad}"),
    ])
    
    llm = ChatOpenAI(api_key=os.getenv("OPENAI_API_KEY"), model="gpt-4o")
    agent_tools = [Tool(name=a["agent_name"], func=lambda x: a["agent_name"], description=a["system_prompt"])
                   for a in agents] + [Tool(name="final_answer", func=lambda x: x, description="Provide final answer")]
    tool_names_str = ", ".join(tool_dict.keys())
    agent_names_str = ", ".join(a["agent_name"] for a in agents)

    def create_scratchpad(steps):
        return "\n".join(f"{s['step']}: {s['details']}" for s in steps) if steps else "No prior steps."

    chain = prompt | llm.bind_tools(agent_tools)
    response = await chain.ainvoke({
        "input": query,
        "chat_history": state.get("chat_history", []),
        "agent_names": agent_names_str,
        "tool_names": tool_names_str,
        "shared_memory": str(state["shared_memory"]),
        "agent_scratchpad": create_scratchpad(state["intermediate_steps"])
    })

    tool_calls = response.additional_kwargs.get("tool_calls", [])
    selected_agents = []
    seen_agents = set()
    for call in tool_calls:
        tool_name = call["function"]["name"]
        if tool_name == "final_answer":
            try:
                state["final_answer"] = json.loads(call["function"]["arguments"]).get("__arg1", "No answer")
            except json.JSONDecodeError:
                state["final_answer"] = "Error: Invalid final answer format"
            state["intermediate_steps"].append({"step": "Oracle", "details": f"Final answer: {state['final_answer']}"})
            return state
        if tool_name not in seen_agents:
            selected_agents.append(tool_name)
            seen_agents.add(tool_name)

    if not selected_agents:
        selected_agents = [agents[0]["agent_name"]]
    elif len(selected_agents) == 1 and "Researcher" in selected_agents and "Summarizer" in [a["agent_name"] for a in agents]:
        selected_agents.append("Summarizer")

    state["selected_agents"] = selected_agents
    state["intermediate_steps"].append({"step": "Oracle", "details": f"Selected agents: {', '.join(selected_agents)}"})
    state["chat_history"] = state.get("chat_history", []) + [HumanMessage(content=query), AIMessage(content=str(response))]
    return state

# Agent Execution Node: Allow multiple tool calls per agent
async def agent_execution_node(state: WorkflowState) -> WorkflowState:
    user_id = state["user_id"]
    query = state["query"]
    file_path = os.path.join(TEMP_DIR, f"{user_id}.json")
    try:
        with open(file_path, "r") as json_file:
            user_data = json.load(json_file)
    except FileNotFoundError:
        state["intermediate_steps"].append({"step": "Agent Error", "details": f"No config for user {user_id}"})
        state["final_answer"] = "Error: User configuration not found."
        return state

    async def execute_agent(agent_name: str) -> List[str]:
        agent_config = next(a for a in user_data["agents"] if a["agent_name"] == agent_name)
        available_tools = [t for t in agent_config["tools"] if t in tool_dict] + ["store_in_memory", "retrieve_from_memory"]
        # Use double braces to escape JSON example
        system_prompt = f"""{agent_config["system_prompt"]}
        Available tools: {', '.join(available_tools)}.
        Shared memory: {state['shared_memory']}.
        For file_write, use: {{\"file_path\": \"path\", \"content\": \"text\", \"append\": false}}.
        Use retrieve_from_memory to access shared_memory before rag_tool if data exists.
        Before using rag_tool, retrieve data from shared_memory with retrieve_from_memory if available.
        Respond with a JSON list of actions using ONLY the tools listed above:
        [
            {{"thought": "reasoning", "action": "tool_name", "input": "tool_input"}},
            {{"thought": "next step", "action": "store_in_memory", "input": "key:value"}},
            {{"thought": "done", "final_answer": "result"}}
        ]
        """.replace("{", "{{").replace("}", "}}")

        def store_in_memory(input_str: str) -> Dict[str, Any]:
            try:
                if ":" in input_str:
                    key, value = input_str.split(":", 1)
                    state["shared_memory"][key] = value
                else:
                    state["shared_memory"][input_str] = "N/A"
                return {"result": "Stored", "intermediate_steps": [], "status": "success"}
            except Exception as e:
                return {"result": f"Error storing: {str(e)}", "intermediate_steps": [], "status": "error"}

        tools = [tool_dict[name] for name in agent_config["tools"] if name in tool_dict] + [
            Tool(name="store_in_memory", func=store_in_memory, description="Store key:value in shared memory"),
            Tool(name="retrieve_from_memory", func=lambda x: {"result": state["shared_memory"].get(x, "Not found"), "intermediate_steps": [], "status": "success"}, description="Retrieve value by key")
        ]
        
        state["intermediate_steps"].append({"step": f"Agent {agent_name} Tools", "details": f"Available: {', '.join(t.name for t in tools)}"})
        
        llm = ChatOpenAI(api_key=os.getenv("OPENAI_API_KEY"), model="gpt-4o", temperature=0.1)
        prompt = ChatPromptTemplate.from_messages([("system", system_prompt), ("user", "{input}")])
        chain = prompt | llm
        response = await chain.ainvoke({"input": query})
        
        state["intermediate_steps"].append({"step": f"Agent {agent_name} Response", "details": response.content[:100] + "..."})
        
        try:
            actions = json.loads(response.content)
            if not isinstance(actions, list):
                raise ValueError("Response must be a list")
        except (json.JSONDecodeError, ValueError) as e:
            state["intermediate_steps"].append({"step": f"Agent {agent_name}", "details": f"Invalid JSON: {str(e)}"})
            return ["Agent failed to format response"]
        
        results = []
        for action in actions:
            state["intermediate_steps"].append({"step": f"Agent {agent_name}", "details": action.get("thought", "No thought")})
            if "action" in action:
                try:
                    tool = next(t for t in tools if t.name == action["action"])
                    input_data = action["input"]
                    if tool.name == "web_scrape":
                        result = await tool.func(input_data if isinstance(input_data, str) else input_data.get("url", ""))
                    elif tool.name in ["data_analysis", "file_write"] and isinstance(input_data, dict):
                        result = tool.func(**input_data)
                    else:
                        result = tool.func(input_data)
                    if isinstance(result, dict) and "result" in result:
                        results.append(result["result"])
                        state["intermediate_steps"].append({"step": f"Agent {agent_name} Tool", "details": f"{tool.name}: {str(result['result'])[:100]}..."})
                        if tool.name not in ["store_in_memory", "retrieve_from_memory"]:
                            state["shared_memory"][f"{query}_result"] = result["result"]
                    else:
                        results.append(str(result))
                        state["intermediate_steps"].append({"step": f"Agent {agent_name} Tool", "details": f"{tool.name}: {str(result)[:100]}..."})
                except Exception as e:
                    error_msg = f"{action['action']} failed: {str(e)}"
                    state["intermediate_steps"].append({"step": f"Agent {agent_name} Tool Error", "details": error_msg})
                    results.append(error_msg)
            elif "final_answer" in action:
                results.append(action["final_answer"])
        return results

    tasks = [execute_agent(agent_name) for agent_name in state["selected_agents"]]
    agent_outputs = await asyncio.gather(*tasks)
    state["agent_results"] = {agent_name: outputs for agent_name, outputs in zip(state["selected_agents"], agent_outputs)}
    return state

# Combine Results Node: Synthesize final answer
async def combine_results_node(state: WorkflowState) -> WorkflowState:
    if state["final_answer"]:
        return state

    system_prompt = """Synthesize a final answer from agent results and shared memory.
    Query: {query}
    Agent Results: {agent_results}
    Shared Memory: {shared_memory}
    Provide a concise, cohesive answer. If data is insufficient, say so."""
    
    llm = ChatOpenAI(api_key=os.getenv("OPENAI_API_KEY"), model="gpt-4o")
    prompt = ChatPromptTemplate.from_messages([("system", system_prompt), ("user", "Synthesize now")])
    response = await (prompt | llm).ainvoke({
        "query": state["query"],
        "agent_results": str(state["agent_results"]) if state["agent_results"] else "No agent results",
        "shared_memory": str(state["shared_memory"]) if state["shared_memory"] else "No shared memory"
    })
    
    state["final_answer"] = response.content
    state["intermediate_steps"].append({"step": "Synthesis", "details": f"Final answer: {state['final_answer'][:100]}..."})
    state["chat_history"] = state.get("chat_history", []) + [AIMessage(content=state["final_answer"])]
    return state

# Workflow Setup
workflow = StateGraph(WorkflowState)
workflow.add_node("oracle", oracle_node)
workflow.add_node("agent_execution", agent_execution_node)
workflow.add_node("combine_results", combine_results_node)

workflow.set_entry_point("oracle")
workflow.add_conditional_edges("oracle", lambda s: "combine_results" if s["final_answer"] else "agent_execution")
workflow.add_edge("agent_execution", "combine_results")
workflow.add_edge("combine_results", END)

multi_agent_workflow = workflow.compile()

async def stream_workflow(inputs: WorkflowState):
    seen_steps = 0
    async for chunk in multi_agent_workflow.astream(inputs, stream_mode="values"):
        state = chunk
        current_steps = state.get("intermediate_steps", [])
        new_steps = current_steps[seen_steps:]
        for step in new_steps:
            if "Tool" in step["step"]:
                # Assuming details are in the form "tool_name: result"
                tool_name, output = step["details"].split(": ", 1)
                yield f"Tool Used: {tool_name}\n\nTool Output: {output}\n\n\n"
            else:
                yield f"{step['step']}: {step['details']}\n\n"
        seen_steps = len(current_steps)
        if state.get("final_answer") is not None:
            yield f"Final Answer: {state['final_answer']}"
            break
        
        


app = FastAPI(title="Multi-Agent LangGraph API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React app origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/prompt-generation")
async def process_query(data: Dict[str, Any]):
    user_id = data.get("user_id")
    description = data.get("description")
    goal = data.get("goal")
    tools = data.get("tools")
    personality = data.get("personality")
    tone = data.get("tone")
    domain_expertise = data.get("domain_expertise")
    
    if not all([user_id, description, goal, tools, personality, tone, domain_expertise]):
        raise HTTPException(
            status_code=400, 
            detail="description, user_id, goal, tools, personality, tone and domain_expertise are required"
        )
        
    system_prompt = """
     Prompt Generator for AI Agents

You are an expert prompt engineer tasked with creating system prompts for AI agents. Your goal is to generate concise, effective, and safe prompts based on the provided information.

Given Inputs:
Description: {description}
Goal: {goal}
Tools: {tools}
Personality: {personality}
Tone: {tone}
Domain Expertise: {domain_expertise}

## Input Parameters:
- Description: Brief overview of the agent's purpose
- Goal: The primary objective of the agent
- Tools: List of tools the agent can use
- Personality: Desired character traits of the agent
- Tone: Communication style (e.g., formal, casual, technical)
- Domain Expertise: Specific field(s) of knowledge

## Guidelines:
1. Keep the prompt under 2 lines for clarity and efficiency explicitly mention the tools attached quiet clearly.
2. Incorporate all provided parameters into the prompt.
3. Emphasize the agent's goal and how to achieve it using the given tools.
4. Reflect the specified personality and tone in the prompt's language.
5. Highlight the domain expertise to guide the agent's knowledge focus.
6. Include clear instructions on what the agent should and should not do.
7. Implement ethical guidelines and safety measures in the prompt.
8. Use concise language and avoid unnecessary verbosity.
9. Structure the prompt logically for easy comprehension by the agent.
10. Ensure the prompt encourages helpful and appropriate responses.
11. Include the response format section in the prompt according to the usecase.

Response format:

{{"Agent_name": "name_of_the_agent",
"system_prompt": "The_whole_system_prompt"}}


## Output Format:
Generate prompt in the Json format only along with the agent name.

Remember: Your task is to create a prompt that will guide an AI agent effectively and safely. Prioritize clarity, relevance, and ethical considerations in your generated prompt.
    """
    
    prompt = ChatPromptTemplate.from_template(system_prompt)
    
    llm = ChatOpenAI(api_key= os.getenv("OPENAI_API_KEY"), model="gpt-4o")
    output_parser = JsonOutputParser()
    
    chain = prompt | llm | output_parser
    
    try:
        result = await chain.ainvoke({
            "description": description,
            "goal": goal,
            "tools": tools,
            "personality": personality,
            "tone": tone,
            "domain_expertise": domain_expertise
        })
        
        agent_name = result.get("Agent_name", f"Agent_{len(tools)}")
        system_prompt = result.get("system_prompt", "")

        new_agent_data = {
            "agent_name": agent_name,
            "system_prompt": system_prompt,
            "tools": tools
        }

        # File path for the user's data
        file_path = os.path.join(TEMP_DIR, f"{user_id}.json")

        # Load existing data if file exists, else create new
        if os.path.exists(file_path):
            with open(file_path, "r") as json_file:
                user_data = json.load(json_file)
        else:
            user_data = {"user_id": user_id, "agents": []}

        # Append the new agent to the existing list
        user_data["agents"].append(new_agent_data)

        # Save updated JSON
        with open(file_path, "w") as json_file:
            json.dump(user_data, json_file, indent=4)
        
        
        
        return JSONResponse(content={
            "message": "Agent prompt generated and stored successfully.",
            "agent_name": agent_name,
            "system_prompt": system_prompt
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    

@app.post("/query")
async def handle_query(data: Dict[str, Any]):
    if "user_id" not in data or "query" not in data:
        raise HTTPException(status_code=400, detail="user_id and query are required")
    
    initial_state = WorkflowState(
        user_id=data["user_id"],
        query=data["query"],
        selected_agents=[],
        agent_results={},
        shared_memory={},
        intermediate_steps=[],
        chat_history=[],
        final_answer=None
    )
    
    async def stream_response():
        async for chunk in stream_workflow(initial_state):
            yield chunk
    
    return StreamingResponse(stream_response(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
    