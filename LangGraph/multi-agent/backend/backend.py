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

load_dotenv()

TEMP_DIR = "temp_data"
os.makedirs(TEMP_DIR, exist_ok=True)

app = FastAPI(title="Multi-Agent LangGraph API")

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
1. Keep the prompt under 30 lines for clarity and efficiency.
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