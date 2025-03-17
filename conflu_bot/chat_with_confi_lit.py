from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
import json
import re
from typing import Any, Dict, List
from datetime import datetime, timezone, timedelta
import pandas as pd
import logging
import plotly.express as px
import plotly.graph_objects as go
import plotly.io
import pytz
from bson import ObjectId
from client.pinecone_client import PineconeClient
from client.portkey import PortKeyClient
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain
from app.settings import settings, db, db_motor
from langchain.chains.history_aware_retriever import create_history_aware_retriever

# from client.spacy_client import check_task_query_for_status_or_priority
from client.redis_memory import RedisMemory
from utils import project_utils
import asyncio
import random
import re
from langchain_community.callbacks.manager import get_openai_callback
from utils.token_cost_manager import TokenCostManager
from client.tavily_search import TavilySearchClient
import re
from client.web_scrape import WebScrape
from client.youtube_transcribe import YouTubeHelper
from client.s3_loader import s3Loader
from utils.token_utils import insert_llm_tokens_to_db
from utils import board_utils
from confluence_utils_copy import page_content_list, workspace, space_list, construct_data

def clear_history(user_id, organization_id): 
    RedisMemory().clear_history_from_redis(
        user_id, organization_id, "universal_search", "u_s"
    )
    return 'history cleared'

def answer(user_query, organization_id, user_id):
    retriever = PineconeClient().RetrieveIndexNameSpace(
                    index_name=settings.PINECONE_PROJECT_INDEX,
                    namespace=organization_id,
                    namespace_id= user_id,
                    meta_key= "user_id",
                )
    RedisMemory().store_dialogue_in_redis(
        user_id, organization_id, "universal_search", "User: " + user_query, "u_s"
    )
    metadata = RedisMemory().get_last_dialogues_from_redis(
        "john_doe", "universal_search", "confluence", "u_s"
    )
    corpus = retriever.get_relevant_documents(user_query)
    print("ITEM NAME CORPUS: ", corpus)
    print() 
    print()
    print("META DATA: ", metadata)
    print() 
    print() 

    system_prompt = """
                            Answer based on the user query. This is the text for you to search the answer in. 
                            Always include the link that you receive in the corpus. 
                            Keep your answers short and to the point. 

                            Do not say things like 'based on the text corpus'. Just answer the user query by looking at the information in the text corpus. 

                            Example: 
                            ```
                            User: Are there any documents related to ai in my confluence app? 
                            Answer: Yes, there is a document related to AI in your Confluence app. There is a document titled "AI doc" in the Software development space of your Confluence workspace.

                            The document link is: https://testing123232.atlassian.net/wiki/spaces/SD/pages/229555/AI+doc

                            This document contains information about AI predictions and trends for the year 2025, including insights from various industry experts on topics such as smaller purpose-driven AI models, AI integration in workplaces, sustainability applications, computational power advancements, and potential challenges like deepfakes.
```                         
                            This is the metadata about the files in the user's workspace: {metadata}
                            This is the text corpus for you to search the answer in: 
                            ```{corpus}```


                            This is the conversation context for you to answer any subsequent questions by the user: ```{conversation_context}```
        """

    prompt = ChatPromptTemplate.from_messages(
                [("system", system_prompt), ("human", "{input}")]
            )
    llm = PortKeyClient().dynamic_llm(
            provider="openai", model="gpt-4o"
        )
    name_chain = prompt | llm

    conversation_context = ""
    last_dialogues = RedisMemory().get_last_dialogues_from_redis(
        user_id, organization_id, "universal_search", "u_s"
    )
    conversation_context = "\n".join(reversed(last_dialogues))
    activity = name_chain.invoke(
                {
                    "input": user_query,
                    "user_query": user_query,
                    "corpus": corpus, 
                    "metadata": metadata, 
                    "conversation_context": conversation_context
                }
            )
    
    RedisMemory().store_dialogue_in_redis(
        user_id, organization_id, "universal_search", "AI: " + activity.content, "u_s"
    )
    return activity.content

# Main execution
if __name__ == "__main__":
    print("Welcome to the chat! Type 'exit' to end the conversation.")
    organization_id = input("Enter organization ID: ")
    user_id = input("Enter user ID: ")
    
    while True:
        user_query = input("You: ")
        if user_query.lower() == "exit":
            print("Goodbye!")
            break
        response = answer(user_query, organization_id, user_id)
        print("AI:", response)
