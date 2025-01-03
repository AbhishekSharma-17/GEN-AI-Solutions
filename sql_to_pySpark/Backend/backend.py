import time
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from typing import List
from pydantic import BaseModel
import os
from token_cost_manager import TokenCostManager
from langchain_community.callbacks.manager import get_openai_callback
from fastapi.middleware.cors import CORSMiddleware

from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_anthropic import ChatAnthropic
from huggingface_hub import InferenceClient
import json
from decimal import Decimal

# class DecimalEncoder(json.JSONEncoder):
#     def default(self, obj):
#         if isinstance(obj, Decimal):
#             return float(obj)
#         return super(DecimalEncoder, self).default(obj)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize cumulative usage
cumulative_tokens = 0
cumulative_cost = Decimal('0')

# class ConversionRequest(BaseModel):
#     choice: str
#     api_key: str
#     model: str = None

def read_sql_files(files: List[UploadFile]):
    sql_file_list = []
    for file in files:
        sql_content = file.file.read().decode()
        sql_file_list.append(sql_content)
    return sql_file_list

def create_prompt(sql_content):
    return f"""
    ONLY RESPOND WITH A VALID PYTHON CODE. THE CODE IN RESPONSE SHOULD BE IMMEDIATELY RUNNABLE.DO NOT ADD ANY TEXT OTHER THAN THE PYTHON CODE EVER. 
    If there is no code provided below then respond with -> print('Empty'). 
    Make sure to define/initialize any variables that you may use. 
    Make all the necessary imports. 
    Make sure the code is runnable in python version 3.11.9. 
    Your entire response is going to be run by a python compiler. 
    DO NOT ADD python or any other text besides the code. 
    You are tasked with converting .sql file code to .py with PySpark code files. 

    Convert the following SQL file content to PySpark python code:\n\n{sql_content}
    """

async def process_with_gpt_claude_groq(sql_contents, llm, model, start_time):
    try:
        results = {}
        for i, sql_content in enumerate(sql_contents):
            prompt = create_prompt(sql_content)
            with get_openai_callback() as cb: 
                response = llm.invoke(prompt)   
                full_input_tokens = cb.prompt_tokens
                full_output_tokens = cb.completion_tokens
                full_total_tokens = cb.total_tokens
                
                (
                    full_total_cost,
                    full_input_cost,
                    full_output_cost,
                ) = await TokenCostManager().calculate_cost(
                    full_input_tokens, full_output_tokens, model_name=model
                )
                
            code_block = response.content
            if code_block.startswith("```python"):
                code_block = code_block[len("```python"):].strip()
            if code_block.endswith("```"):
                code_block = code_block[:-len("```")].strip()
            end_time = time.time()

            response_time = end_time - start_time
            results.update({f"{i}": {
                "pysparkCode": code_block, 
                "input_tokens": full_input_tokens,
                "output_tokens": full_output_tokens,
                "total_tokens": full_total_tokens,
                "input_cost": float(full_input_cost),
                "output_cost": float(full_output_cost),
                "total_cost": float(full_total_cost),
                "response_time": response_time,
            }}) 
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing with GPT: {str(e)}")

def process_with_huggingface(sql_contents, hf_api_key, model, start_time):
    try:
        client = InferenceClient(api_key=hf_api_key, model=model)
        results = {}
        
        for i, sql_content in enumerate(sql_contents):
            prompt = create_prompt(sql_content)
            response = client.post(
                json={
                    "inputs": prompt,
                    "parameters": {"max_new_tokens": 400},
                    "task": "text-generation",
                }
            )
            end_time = time.time()
            response_time = end_time - start_time

            data = json.loads(response.decode())[0]["generated_text"]
            code_block = data
            if code_block.startswith(prompt):
                code_block = code_block[len(prompt):].strip()
            if code_block.endswith("```"):
                code_block = code_block[:-len("```")].strip()
                
            results.update({
                "pysparkCode": code_block, 
                "response_time": response_time}
                )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing with Hugging Face: {str(e)}")

@app.post("/convert")
async def convert_sql_to_pyspark(
    files: List[UploadFile] = File(...),
    llm_type: str = Form(...),
    api_key: str = Form(...),
    model: str = Form(...)
):
    start_time = time.time()
    if not files:
        raise HTTPException(status_code=400, detail="No SQL files provided")
    
    sql_contents = read_sql_files(files)
    # Set up LLM based on the request
    if llm_type == "OpenAI":
        if not api_key:
            raise HTTPException(status_code=400, detail="OpenAI API key is required")
        llm = ChatOpenAI(temperature=0, model=model, api_key=api_key)    
    elif llm_type == "Anthropic":
        if not api_key:
            raise HTTPException(status_code=400, detail="Anthropic API key is required")
        llm = ChatAnthropic(model=model, api_key=api_key)
    elif llm_type == "Groq":
        if not api_key:
            raise HTTPException(status_code=400, detail="Groq API key is required")
        llm = ChatGroq(model=model, api_key=api_key)
    elif llm_type == "HuggingFace":
        if not api_key:
            raise HTTPException(status_code=400, detail="Huggingface token API key is required")
    else:
        raise HTTPException(status_code=400, detail="Invalid LLM type")
    
    if llm_type in ("OpenAI", "Anthropic", "Groq"):
        results = await process_with_gpt_claude_groq(sql_contents, llm, model, start_time)
    else: 
        results = process_with_huggingface(sql_contents, api_key, model, start_time)
    
    conversion_results = []
    for i, file in enumerate(files):
        conversion_results.append({
            "filename": file.filename,
            "conversion": results[str(i)]
        })
    
    return JSONResponse(content={"results": conversion_results})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
