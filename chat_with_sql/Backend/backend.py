from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.utilities import SQLDatabase
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_anthropic import ChatAnthropic
# from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
import gspread
from google.oauth2.service_account import Credentials
from huggingface_hub import InferenceClient
import os
import re
import logging
from token_cost_manager import TokenCostManager
from langchain_community.callbacks.manager import get_openai_callback
import time
from decimal import Decimal

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize cumulative usage
cumulative_tokens = 0
cumulative_cost = Decimal('0')

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

# Pydantic model for query request body
class QueryRequest(BaseModel):
    question: str
    db_uri: str
    llm_type: str
    model:str
    api_key: str = None

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
    # Look for SQL query between triple backticks with 'sql' prefix
    match = re.search(r'```sql\s*(.*?)\s*```', response, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    # If not found, look for the first SELECT statement
    match = re.search(r'\bSELECT\b.*', response, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(0).strip()
    
    # If still not found, return the original response
    return response.strip()

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
    global cumulative_tokens, cumulative_cost
    start_time = time.time()
    
  
    try:
        db = get_database_connection(request.db_uri)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database connection failed: {str(e)}")

    # Get the schema information
    schema = get_schema(db)

    # Set up LLM based on the request
    if request.llm_type == "OpenAI":
        if not request.api_key:
            raise HTTPException(status_code=400, detail="OpenAI API key is required")
        
        os.environ["OPENAI_API_KEY"] = request.api_key
        llm = ChatOpenAI(temperature=0, model= request.model)

    elif request.llm_type == "Anthropic":
        if not request.api_key:
            raise HTTPException(status_code=400, detail="Anthropic API key is required")
        llm = ChatAnthropic(
            model=request.model,
            api_key=request.api_key
        )

    elif request.llm_type == "Groq":
        if not request.api_key:
            raise HTTPException(status_code=400, detail="Groq API key is required")
        llm = ChatGroq(
            model=request.model,
            api_key=request.api_key
        )

    elif request.llm_type == "HuggingFace":
        if not request.api_key:
            raise HTTPException(status_code=400, detail="Huggingface token API key is required")
       
        phi3_client = InferenceClient(token=request.api_key, timeout=5000)

    else:
        raise HTTPException(status_code=400, detail="Invalid LLM type")
    def run_query(final_query): 
        print("FINAL QUERY: ", final_query)
        queries = final_query.split('|')
        results = []
        try: 
            for query in queries:
                if query.strip():
                    try: 
                        results_str = "query: " + query, "response: " + str(db.run(query))
                        results.append(results_str)
                    except: 
                        print("INVALID QUERY: ", query)
            print("RESULTS", results)            
            return results
        except Exception as e: 
            print("Something went wrong")
            return ""
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

Schema:
Table: employees  
Columns: id (INTEGER), name (TEXT), department (TEXT), salary (INTEGER)

Question:
"Find the names of employees in the 'HR' department."

SQL Query:
SELECT name FROM employees WHERE department = 'HR'; 


Example 2:

Schema:
Table: orders  
Columns: order_id (INTEGER), customer_id (INTEGER), amount (DECIMAL), order_date (DATE)

Question:
"Retrieve the total amount of orders placed after 2022-01-01."

SQL Query:
SELECT SUM(amount) FROM orders WHERE order_date > '2022-01-01';


Example 3:

Schema:
Table: products  
Columns: product_id (INTEGER), product_name (TEXT), price (DECIMAL), stock (INTEGER)

Question:
"Find the names of all products priced over 50."

SQL Query:
SELECT product_name FROM products WHERE price > 50;

Example 4:

Schema:
Table: orders  
Columns: order_id (INTEGER), customer_id (INTEGER), amount (DECIMAL), order_date (DATE)
Question:
"Retrieve the total number of orders placed and the total amount of all orders."
SQL Query:
SELECT COUNT(*) FROM orders | SELECT SUM(amount) FROM orders;


Example 5:

Schema:
Table: products  
Columns: product_id (INTEGER), product_name (TEXT), price (DECIMAL), stock (INTEGER)
Question:
"Find the names of products priced over 50 and also find the total stock for those products."
SQL Query:
SELECT product_name FROM products WHERE price > 50 | SELECT SUM(stock) FROM products WHERE price > 50;

Schema:
{schema}

Question:
{question}

SQL Query:
    """
    template_response = """
        Based on the table schema, question and SQL response, write a concise response.
        Include relevant numbers, names, and any other specific information from the SQL response.
        If multiple queries were executed, summarize the results of all queries.

        {schema}

        Question: {question} 
        SQL response: {response}

        Detailed Answer:
        """
    prompt = ChatPromptTemplate.from_template(template)
    
    if request.llm_type == "HuggingFace":
        combined_input_tokens = 0,
        combined_output_tokens= 0,
        combined_total_tokens= 0,
        combined_input_cost= 0.0,
        combined_output_cost= 0.0,
        combined_total_cost= 0.0,
        response_time = 0.0,
        cumulative_tokens= 0,
        cumulative_cost = 0.0
        completion = phi3_client.chat.completions.create(
            model=request.model, 
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
            model=request.model, 
            messages=[
	                    {
                            "role": "system",
                            "content": template_response.format(schema= schema, question = request.question, response = response),
	                    }
                    ], 
            max_tokens=2000
        )

        result = completion.choices[0].message

       

    else: 

        sql_chain = (
            RunnablePassthrough.assign(schema=lambda _: schema)
            | prompt 
            | llm.bind(stop="\nSQL Result:")
            | StrOutputParser()
            | clean_sql
        )

        # Generate the SQL query
        with get_openai_callback() as cb:
        
            sql_query = sql_chain.invoke({"question": request.question, "schema": schema})
            sql_input_tokens = cb.prompt_tokens
            sql_output_tokens = cb.completion_tokens
            sql_total_tokens = cb.total_tokens
            
            (
                    sql_total_cost,
                    sql_input_cost,
                    sql_output_cost,
                ) = await TokenCostManager().calculate_cost(
                    sql_input_tokens, sql_output_tokens, model_name=request.model
                )
        # Extract the actual SQL query
        extracted_sql_query = extract_sql_query(sql_query)

        print("extracted sql query+++++++++++++++") 
        print(sql_query) 
        print("----------------------------------")

        prompt_response = ChatPromptTemplate.from_template(template_response)

       

        full_chain = (
            RunnablePassthrough.assign(
                # query=lambda _: extracted_sql_query,
                schema=lambda _: schema,
                response=lambda _: run_query(extracted_sql_query),
            )
            | prompt_response
            | llm
        )


        with get_openai_callback() as cb:
            
            result = full_chain.invoke({"question": request.question})
            full_input_tokens = cb.prompt_tokens
            full_output_tokens = cb.completion_tokens
            full_total_tokens = cb.total_tokens
            
            (
                    full_total_cost,
                    full_input_cost,
                    full_output_cost,
                ) = await TokenCostManager().calculate_cost(
                    full_input_tokens, full_output_tokens, model_name=request.model
                )
            
        # Combine token and cost calculations
        combined_input_tokens = sql_input_tokens + full_input_tokens
        combined_output_tokens = sql_output_tokens + full_output_tokens
        combined_total_tokens = sql_total_tokens + full_total_tokens
        combined_input_cost = sql_input_cost + full_input_cost
        combined_output_cost = sql_output_cost + full_output_cost
        combined_total_cost = sql_total_cost + full_total_cost
        
        end_time = time.time()
        response_time = end_time - start_time
            
        # Update cumulative usage
        cumulative_tokens += combined_total_tokens
        cumulative_cost += Decimal(str(combined_total_cost))

    return {
        "sql_query": extracted_sql_query,
        "answer": result.content,
        "input_tokens": combined_input_tokens,
        "output_tokens": combined_output_tokens,
        "total_tokens": combined_total_tokens,
        "input_cost": combined_input_cost,
        "output_cost": combined_output_cost,
        "total_cost": combined_total_cost,
        "response_time": response_time,
        "cumulative_tokens": cumulative_tokens,
        "cumulative_cost": float(cumulative_cost)
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
        return {"OKAY": "liked"}

    elif request.noice == False:
        return{"OKAY": "disliked"}
    
    else:
        return{"NOT OKAY": "Something went wrong"}


if __name__ == "_main_":
    import uvicorn
    uvicorn.run("backend:app", host="localhost", port=8001)
    
# uvicorn backend:app --host localhost --port 8001 --reload