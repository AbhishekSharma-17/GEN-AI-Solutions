import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from uuid import uuid4

from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI

# Import tool functions from tools.py
from tools import (
    tavily_search,
    web_crawler,
    read_file_tool,
    write_file_tool,
    get_current_time_tool,
    search_wikipedia_tool,
    read_pdf_tool,
)

# Map tool names to actual tool functions.
TOOLS_MAPPING = {
    "tavily_search": tavily_search,
    "web_crawler": web_crawler,
    "read_file": read_file_tool,
    "write_file": write_file_tool,
    "get_current_time": get_current_time_tool,
    "search_wikipedia": search_wikipedia_tool,
    "read_pdf": read_pdf_tool,
}

# Create a global language model instance.
model = ChatOpenAI(model="gpt-4o", temperature=0)

# In-memory storage for agents.
agents_db = {}

app = FastAPI(title="Multi-Agent LangGraph API")

# ---------------- Pydantic Models ---------------- #

class Agent(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    goal: Optional[str] = None
    tools: List[str]
    personality: Optional[str] = None
    tone: Optional[str] = None
    domain_expertise: Optional[str] = None
    system_prompt: Optional[str] = None
    language: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    tool_priority: Optional[List[str]] = None
    memory_type: Optional[str] = None
    tags: Optional[List[str]] = None
    references: Optional[List[str]] = None

class AgentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    goal: Optional[str] = None
    tools: List[str]
    personality: Optional[str] = None
    tone: Optional[str] = None
    domain_expertise: Optional[str] = None
    system_prompt: Optional[str] = None
    language: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    tool_priority: Optional[List[str]] = None
    memory_type: Optional[str] = None
    tags: Optional[List[str]] = None
    references: Optional[List[str]] = None

class Prompt(BaseModel):
    prompt: str

# A simplified agent summary model for listing.
class AgentSummary(BaseModel):
    id: str
    name: str

# ---------------- Admin Endpoints ---------------- #

@app.post("/admin/agents", response_model=Agent)
def create_agent(agent_data: AgentCreate):
    agent_id = str(uuid4())
    selected_tools = []
    if agent_data.tool_priority:
        for tool_name in agent_data.tool_priority:
            if tool_name in TOOLS_MAPPING:
                selected_tools.append(TOOLS_MAPPING[tool_name])
            else:
                raise HTTPException(status_code=400, detail=f"Tool '{tool_name}' not found")
        for tool_name in agent_data.tools:
            if tool_name not in agent_data.tool_priority:
                if tool_name in TOOLS_MAPPING:
                    selected_tools.append(TOOLS_MAPPING[tool_name])
                else:
                    raise HTTPException(status_code=400, detail=f"Tool '{tool_name}' not found")
    else:
        for tool_name in agent_data.tools:
            if tool_name in TOOLS_MAPPING:
                selected_tools.append(TOOLS_MAPPING[tool_name])
            else:
                raise HTTPException(status_code=400, detail=f"Tool '{tool_name}' not found")
    
    checkpointer = MemorySaver()
    default_prompt = agent_data.system_prompt or "You are a helpful assistant."
    agent_instance = create_react_agent(model, selected_tools, checkpointer=checkpointer)
    
    agents_db[agent_id] = {
        "id": agent_id,
        "name": agent_data.name,
        "description": agent_data.description,
        "goal": agent_data.goal,
        "tools": agent_data.tools,
        "personality": agent_data.personality,
        "tone": agent_data.tone,
        "domain_expertise": agent_data.domain_expertise,
        "system_prompt": default_prompt,
        "language": agent_data.language,
        "temperature": agent_data.temperature,
        "max_tokens": agent_data.max_tokens,
        "tool_priority": agent_data.tool_priority,
        "memory_type": agent_data.memory_type,
        "tags": agent_data.tags,
        "references": agent_data.references,
        "instance": agent_instance,
    }
    return Agent(**agents_db[agent_id])

# ---------------- User Endpoints ---------------- #

@app.get("/agents", response_model=List[AgentSummary])
def list_agents():
    """Return a list of all agents (only id and name)."""
    return [AgentSummary(id=agent["id"], name=agent["name"]) for agent in agents_db.values()]

import json
from fastapi import HTTPException
from typing import List
from pydantic import BaseModel

# Simplified agent summary model for listing.
class AgentSummary(BaseModel):
    id: str
    name: str

# Assume Prompt model and agents_db, model are already defined in your code.
# Example Prompt model:
class Prompt(BaseModel):
    prompt: str

@app.post("/agents/search", response_model=List[AgentSummary])
def search_agents(prompt: Prompt):
    """
    Uses an LLM to semantically match the user's query against available agents.
    The LLM is provided with a list of agents (id, name, description, tags)
    and is instructed to return a JSON array of objects with only 'id' and 'name'.
    """
    # Gather metadata from all agents
    agents_list = []
    for agent in agents_db.values():
        agents_list.append({
            "id": agent["id"],
            "name": agent["name"],
            "description": agent.get("description", ""),
            "tags": agent.get("tags", []),
        })

    # Construct the LLM prompt that includes the agents list and the user query.
    system_prompt = (
        "You are an expert matching engine. Below is a list of available AI agents along with their metadata.\n"
        "Given the user's query, please select the agent(s) that best match the query and return a JSON array containing only the 'id' and 'name' of each matching agent. "
        "If no agent is relevant, return an empty JSON array.\n\n"
        "Agents:\n"
    )
    for agent in agents_list:
        system_prompt += json.dumps(agent) + "\n"
    system_prompt += "\nUser Query: " + prompt.prompt + "\n"
    system_prompt += "Return only a JSON array of objects with keys 'id' and 'name'."

    # Invoke the LLM with the constructed prompt.
    llm_response = model.invoke([{"role": "system", "content": system_prompt}])
    
    try:
        # Access the LLM output using the .content attribute.
        matching_agents = json.loads(llm_response.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail="LLM response parsing failed: " + str(e))
    
    if not isinstance(matching_agents, list):
        raise HTTPException(status_code=500, detail="LLM did not return a JSON array")
    
    # Return only the id and name for each matching agent.
    return [AgentSummary(**agent) for agent in matching_agents]


@app.post("/agents/{agent_id}/execute")
def execute_agent(agent_id: str, prompt: Prompt):
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent_instance = agents_db[agent_id]["instance"]
    input_state = {"messages": [{"role": "user", "content": prompt.prompt}]}
    config = {"configurable": {"thread_id": 42}}  # Example config; adjust as needed.
    try:
        result = agent_instance.invoke(input_state, config=config)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------- Main Entry ---------------- #

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
