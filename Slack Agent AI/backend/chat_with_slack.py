import os
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
import json
import re
from typing import Any, Dict, List
from datetime import datetime, timezone, timedelta
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
import pandas as pd
import logging
from langchain_core.prompts import ChatPromptTemplate
import re
from pinecone_client import PineconeClient
from dotenv import load_dotenv 
from slack_metadata import get_metadata
load_dotenv()


def answer(user_query):
    organization_id = "Hugh_slack_search"
    user_id = "Jackmanaa"
    retriever = PineconeClient().RetrieveIndexNameSpaceForUniversalSearch(
                    index_name='testsid',
                    namespace=organization_id,
                    user_id= user_id,
                )
    
    corpus = retriever.get_relevant_documents(user_query)
    print("ITEM NAME CORPUS: ", corpus)
    print() 
    print()
    # print("META DATA: ", metadata)
    print() 
    print() 
    # metadata = get_metadata()
    system_prompt = """
                            Answer based on the user query. 
                            ALWAYS INCLUDE THE LINK THAT YOU RECEIVE IN THE CORPUS. 
                            ALWAYS INCLUDE THE LINK THAT YOU RECEIVE IN THE CORPUS. 
                            Keep your answers short and to the point. 

                            Do not say things like 'based on the text corpus'. Just answer the user query by looking at the information in the text corpus. 

                            Example: 
                            ```
                            User: Are there any documents related to ai in my slack app? 
                            Answer: Yes, there is a document related to AI in your slack app. There is a document titled "AI doc".

                            The document link is: https://xyz/AI+doc
                            The channel link is: xyz...
                            ```
```                         
                            
                            This is the text corpus for you to search the answer in: 
                            ```{corpus}```


                            
        """
# This is the conversation context for you to answer any subsequent questions by the user: ```{conversation_context}```
    # prompt = ChatPromptTemplate.from_messages(
    #             [("system", system_prompt), ("human", "{input}")]
    #         )
    # llm = ChatOpenAI(
    #     api_key=os.getenv("OPEN_AI_KEY"),
    #     model="gpt-4o",
    #     temperature=0.1
    # )     
    # name_chain = prompt | llm

    # # conversation_context = ""
    
    # activity = name_chain.invoke(
    #             {
    #                 "input": user_query,
    #                 "user_query": user_query,
    #                 "corpus": corpus, 
    #                 "metadata": metadata, 
    #                 "conversation_context": conversation_context
    #             }
    #         )
    
   
    # return activity.content
    return corpus

def jira_answer(user_query, conversation_context):
    organization_id = "Hugha_slack_search"
    user_id = "Jackmanaa"
    retriever = PineconeClient().RetrieveIndexNameSpaceForUniversalSearch(
                    index_name='testabhishek',
                    namespace=organization_id,
                    user_id= user_id,
                )
    
    corpus = retriever.get_relevant_documents(user_query)
    print("TYPE: ", type(conversation_context))
    conversation_context.insert(-2, corpus)
    print("ITEM NAME CORPUS: ", corpus)
    print() 
    print()
    # print("META DATA: ", metadata)
    print() 
    print() 
    # metadata = get_metadata()
    system_prompt = """
                            Answer based on the user query. 
                            ALWAYS INCLUDE THE LINK THAT YOU RECEIVE IN THE CORPUS. 
                            ALWAYS INCLUDE THE LINK THAT YOU RECEIVE IN THE CORPUS. 
                            Keep your answers short and to the point. 

                            Do not say things like 'based on the text corpus'. Just answer the user query by looking at the information in the text corpus. 

                            Example: 
                            ```
                            User: Are there any issues related to ai in my jira app? 
                            Answer: Yes, there is an related to AI in your jira app. There is an issue with the summary  "Insert summary here".

                            The issue link is: https://xyz/AI+doc
                            ```
```                         
                            
                            This is the text corpus for you to search the answer in: 
                            ```{corpus}```


                            
                This is the conversation context for you to answer any subsequent questions by the user: ```{conversation_context}```
        """
    prompt = ChatPromptTemplate.from_messages(
                [("system", system_prompt), ("human", "{input}")]
            )
    # llm = ChatOpenAI(
    #     api_key=os.getenv("OPEN_AI_KEY"),
    #     model="gpt-4o",
    #     temperature=0.1
    # )     
    llm=ChatGroq(model='llama-3.3-70b-versatile',
             temperature=0.1,
             api_key=os.getenv('GROQ_API_KEY'),
)
    name_chain = prompt | llm

    # conversation_context = ""
    
    activity = name_chain.invoke(
                {
                    "input": user_query,
                    "user_query": user_query,
                    "corpus": corpus, 
                    # "metadata": metadata, 
                    "conversation_context": conversation_context
                }
            )
    
   
    return activity.content
# # Main execution
# if __name__ == "__main__":
#     print("Welcome to the chat! Type 'exit' to end the conversation.")
#     organization_id = input("Enter organization ID: ")
#     user_id = input("Enter user ID: ")
    
#     while True:
#         user_query = input("You: ")
#         if user_query.lower() == "exit":
#             print("Goodbye!")
#             break
#         response = answer(user_query, organization_id, user_id)
#         print("AI:", response)
