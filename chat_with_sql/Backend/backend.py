import json
from typing import Any, Dict
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.utilities import SQLDatabase
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_openai import ChatOpenAI
from langchain_aws import ChatBedrock
from langchain_anthropic import ChatAnthropic
from huggingface_hub import InferenceClient
from openpyxl import Workbook, load_workbook
import gspread
from google.oauth2.service_account import Credentials
import boto3
import openai
import os
import re
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Pydantic model for connection request body
class ConnectionRequest(BaseModel):
    db_uri: str
    llm_type: str
    api_key: str = None
    aws_access_key_id: str = None
    aws_secret_access_key: str = None

# Pydantic model for query request body
class QueryRequest(BaseModel):
    question: str
    db_uri: str
    llm_type: str
    api_key: str = None
    aws_access_key_id: str = None
    aws_secret_access_key: str = None

class Questions(BaseModel):
    schema: str
    num_queries: int

class NoiceRequest(BaseModel):
    noice: bool
    output: str = None 
    input: str = None 
    

# Function to get database connection
def get_database_connection(db_uri):
    try:
        return SQLDatabase.from_uri(db_uri)
    
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        raise

# Function to get schema
def get_schema(db):
    return db.get_table_info()

# Function to clean SQL query
def clean(sql_query):
    return sql_query.replace('\n', ' ')

# Function to extract SQL query from LLM response
def extract_sql_query(response):
    # Look for SQL query between triple backticks
    match = re.search(r'```sql\s*(.*?)\s*```', response, re.DOTALL)
    if match:
        return match.group(1).strip()
    # If not found, look for the first SELECT statement
    match = re.search(r'\bSELECT\b.*', response, re.DOTALL | re.IGNORECASE)
    if match:
        sql_query = match.group(0).strip()
        # Remove anything after the last backticks if it exists
        if "```" in sql_query:
            sql_query = sql_query.split("```")[0].strip()
        return sql_query
    # If still not found, return the original response
    return response

@app.post("/connect")
async def connect(request: ConnectionRequest):
    logger.info(f"Received connection request for database URI: {request.db_uri}")
    try:
        db = get_database_connection(request.db_uri)
        schema = get_schema(db)
        logger.info("Successfully connected to the database and retrieved schema")
        return {"schema": schema}
    except Exception as e:
        logger.error(f"Failed to connect to the database: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Database connection failed: {str(e)}")


@app.post("/query")
async def process_query(request: QueryRequest):
    try:
        db = get_database_connection(request.db_uri)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database connection failed: {str(e)}")
    
    groq_models = ["llama-3.3-70b-versatile", "gemma2-9b-it"]

    # Get the schema information
    schema = get_schema(db)
    print()
    # Set up LLM based on the request
    if request.llm_type == "gpt-4o":
        if not request.api_key:
            raise HTTPException(status_code=400, detail="OpenAI API key is required")
        os.environ["OPENAI_API_KEY"] = request.api_key
        llm = ChatOpenAI(temperature=0, model="gpt-4o")
    elif request.llm_type == "gpt-4o-mini":
        if not request.api_key: 
            raise HTTPException(status_code= 400, detail="OpenAI API key is required")
        llm = ChatOpenAI(temperature=0, model="gpt-4o-mini")
        
    # elif request.llm_type == "AWS Bedrock":
    #     if not request.aws_access_key_id or not request.aws_secret_access_key:
    #         raise HTTPException(status_code=400, detail="AWS credentials are required")
    #     client = boto3.client(
    #         "bedrock-runtime",
    #         aws_access_key_id=request.aws_access_key_id,
    #         aws_secret_access_key=request.aws_secret_access_key,
    #         region_name="us-east-1"
    #     )
    #     llm = ChatBedrock(
    #         client=client,
    #         model="anthropic.claude-3-sonnet-20240229-v1:0",
    #         region="us-east-1"
    #     )
    elif request.llm_type == "claude-3-sonnet":
        if not request.api_key:
            raise HTTPException(status_code=400, detail="Anthropic API key is required")
        llm = ChatAnthropic(
            model="claude-3-sonnet-20240229",
            api_key=request.api_key
        )
    elif request.llm_type in groq_models:
        client = openai.OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.environ.get("GROQ_API_KEY"),
        )
    elif request.llm_type == "Phi-3.5-mini-instruct":
        print()
        phi3_client = InferenceClient(token=os.getenv("HUGGING_FACE_API_KEY"), timeout=5000)

        # TODO: add code here
    
    else:
        raise HTTPException(status_code=400, detail="Invalid LLM type")

    clean_sql = RunnableLambda(func=clean)

    template = """
    You are an expert SQL query generator. Based on the table schema provided below, write a syntactically correct SQL query.

Guidelines:
Provide only and ONLY the SQL query as the response. Do not include any explanation, comments, or additional information.
Ensure the SQL query is syntactically correct and answers the provided question accurately.
Always return sql queries only.
If there are multiple sql queries, seperate them by a semicolon '|'.
Schema:
{schema}

Question:
{question}

SQL Query Examples:

Example 1:
```
Schema:
Table: employees  
Columns: id (INTEGER), name (TEXT), department (TEXT), salary (INTEGER)

Question:
"Find the names of employees in the 'HR' department."

SQL Query:
SELECT name FROM employees WHERE department = 'HR'; 
```

Example 2:
```
Schema:
Table: orders  
Columns: order_id (INTEGER), customer_id (INTEGER), amount (DECIMAL), order_date (DATE)

Question:
"Retrieve the total amount of orders placed after 2022-01-01."

SQL Query:
SELECT SUM(amount) FROM orders WHERE order_date > '2022-01-01';
```

Example 3:
```
Schema:
Table: products  
Columns: product_id (INTEGER), product_name (TEXT), price (DECIMAL), stock (INTEGER)

Question:
"Find the names of all products priced over 50."

SQL Query:
SELECT product_name FROM products WHERE price > 50;
```
Example 4:
```
Schema:
Table: orders  
Columns: order_id (INTEGER), customer_id (INTEGER), amount (DECIMAL), order_date (DATE)
Question:
"Retrieve the total number of orders placed and the total amount of all orders."
SQL Query:
SELECT COUNT(*) FROM orders | SELECT SUM(amount) FROM orders;
```

Example 5:
```
Schema:
Table: products  
Columns: product_id (INTEGER), product_name (TEXT), price (DECIMAL), stock (INTEGER)
Question:
"Find the names of products priced over 50 and also find the total stock for those products."
SQL Query:
SELECT product_name FROM products WHERE price > 50 | SELECT SUM(stock) FROM products WHERE price > 50;
```
Schema:
{schema}

Question:
{question}

SQL Query:
    """

    prompt = ChatPromptTemplate.from_template(template)

    
    
    # Extract the actual SQL query
    print("SCHEMA ==========================================") 
    print(schema) 
    print("=================================================")
    
   
    template_response = """
    Based on the table schema, question and SQL response, write a concise response.
    Include relevant numbers, names, and any other specific information from the SQL response.
    If multiple queries were executed, summarize the results of all queries.
    The database schema shown below contains some example rows, they are only there for your understanding. 
    ```
    {schema}
    ```


    Question: {question} 

    The sql response below is a direct answer to the question asked by the user. Use it in your response. 
    SQL response: {response}

    Detailed Answer:
    """

    prompt_response = ChatPromptTemplate.from_template(template_response)

    def run_query(final_query): 
        print("FINAL QUERY: ", final_query)
        queries = final_query.split('|')
        results = []
        try: 
            for query in queries:
                if query.strip():
                    try: 
                        results_str = " sql query: " + query, "database response: " + str(db.run(query))
                        results.append(results_str)
                    except: 
                        print("INVALID QUERY: ", query)
            print("RESULTS", results)            
            return results
        except Exception as e: 
            print("Something went wrong")
            return ""

    
    


    if request.llm_type in groq_models:

        answer = client.chat.completions.create(
            messages = [
                {"role": "system",
                  "content": template.format(schema = schema, question = request.question)
                  }
            ],
            model=request.llm_type,  # Specify the model
            temperature=0.1,  # Lower randomness for precise query generation
            max_tokens=1000,  # Adjust max tokens for the output
        )
        groq_sql_query = answer.choices[0].message.content

        extracted_sql_query = extract_sql_query(groq_sql_query)

        print("QUERY ===========================================")
        print(extracted_sql_query) 
        print("==========================================")
        response = run_query(extracted_sql_query)   
        print("QUERY RESPONSE===========================================")
        print(response) 
        print("==========================================")
        answer = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": template_response.format(schema= schema, question = request.question, response = response),
                }
            ],
            model=request.llm_type,  # Specify the model
            temperature=0.1,  # Lower randomness for precise query generation
            max_tokens=4000,  # Adjust max tokens for the output
            )
    # raw_query = query.content
        result = answer.choices[0].message.content

    elif request.llm_type == "Phi-3.5-mini-instruct":
        completion = phi3_client.chat.completions.create(
            model="microsoft/Phi-3.5-mini-instruct", 
            messages=[
	                    {
                            "role": "system",
                            "content": template.format(schema = schema, question = request.question)
	                    }
                    ], 
            max_tokens=2000
        )

        phi3_sql_query = completion.choices[0].message.content

        extracted_sql_query = extract_sql_query(phi3_sql_query)

        print("QUERY ===========================================")
        print(extracted_sql_query) 
        print("==========================================")
        response = run_query(extracted_sql_query)   
        print("QUERY RESPONSE===========================================")
        print(response) 
        print("==========================================")

        completion = phi3_client.chat.completions.create(
            model="microsoft/Phi-3.5-mini-instruct", 
            messages=[
	                    {
                            "role": "system",
                            "content": template_response.format(schema= schema, question = request.question, response = response),
	                    }
                    ], 
            max_tokens=2000
        )

        result = completion.choices[0].message.content
    
    else: 
        sql_chain = (
        RunnablePassthrough.assign(schema=lambda _: schema)
        | prompt 
        | llm
        | StrOutputParser()
        | clean_sql
        )

    # Generate the SQL query
        sql_query = sql_chain.invoke({"question": request.question, "schema": schema})
        extracted_sql_query = extract_sql_query(sql_query)

        response = run_query(extracted_sql_query) 
        full_chain = (
        RunnablePassthrough.assign(
            # query=lambda _: extracted_sql_query,
            schema=lambda _: schema,
            response=lambda _: run_query(extracted_sql_query),
        )
        | prompt_response
        | llm
    )
        result = full_chain.invoke({"question": request.question})
        result = result.content
        
    instruction = '"Generate an SQL query based on the following schema and user request.If there are multiple sql queries, seperate them by a semicolon \'|\'."'
    inputi = f'"SCHEMA: {schema}, user question: {request.question}"'
    output = f'"{extracted_sql_query}"'

    data = f'{{\n"instruction": {instruction},\n "input": {inputi},\n "output": {output}\n}}, '
    with open("sql_training_dataset.txt", "a") as f:
        f.write(data + "\n")
    # f = open("sql_training_dataset.txt", "w")
    # f.write(f"")
    # f.close()
    return {
        "sql_query": extracted_sql_query,
        "answer": result
    }

@app.post("/noice")
async def noice(request: NoiceRequest):


    def update_gsheets(
        input, 
        output,
        sheet_name = "Sheet1",
        instruction = "Generate an SQL query based on the following schema and user request.If there are multiple sql queries, seperate them by a semicolon '|'.",
    ):
        scopes = ["https://www.googleapis.com/auth/spreadsheets"]

        creds = Credentials.from_service_account_file("credentials.json", scopes=scopes)

        client = gspread.authorize(creds)

        sheet_id = "1jlNLEZEoJUp-6AfaP1kAQU_Lre41yGSnd9XDMszHIeA"

        workbook = client.open_by_key(sheet_id)

        # values_list = workbook.sheet1.row_values(1)
        # print(values_list)
        
        sheet = workbook.worksheet(sheet_name)
        new_row = [
            instruction, 
            input, 
            output
        ]

        # Append the row to the sheet
        sheet.append_row(new_row)
    
    if request.noice == True: 
        update_gsheets(input = request.input, output=request.output)
    elif request.noice == False:
        pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
