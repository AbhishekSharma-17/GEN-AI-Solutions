import asyncio
import sys
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from dotenv import load_dotenv
import os
from jira import JIRA
import jira

from typing import TypedDict, Annotated, List, Union
from langchain_core.agents import AgentAction, AgentFinish
from langchain_core.messages import BaseMessage
import operator
from langchain_openai import OpenAIEmbeddings
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_groq import ChatGroq
import time
from langchain_core.documents import Document
from langgraph.graph import StateGraph, END
from langchain_cohere import CohereEmbeddings
from langchain_core.tools import tool
from langchain_cohere import CohereRerank
from langchain.retrievers.contextual_compression import ContextualCompressionRetriever
import aiohttp
import asyncio
import json
import aiofiles
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import ToolCall, ToolMessage
from langgraph.graph import StateGraph, END
from langchain_core.agents import AgentAction, AgentFinish
from nltk.tokenize import sent_tokenize

sys.path.append(os.path.abspath(".."))
from backend.pinecone_client import PineconeClient

load_dotenv() 

JIRA_URL = "https://testing123232.atlassian.net"
EMAIL = "company mail"
API_TOKEN ='' # Change this to your Jira API token


jira = JIRA(server=JIRA_URL, basic_auth=(EMAIL, API_TOKEN))
print("Connected to Jira successfully!")
projects = jira.projects()
print("PROJECTS: ", projects)
for project in projects:
    print(f"Name: {project.name}, Key: {project.key}")

embeddings = OpenAIEmbeddings(
            openai_api_key=os.getenv("OPEN_AI_KEY"),
            model="text-embedding-3-small",
        ),


# llm=ChatGroq(model='llama-3.3-70b-versatile',
#              temperature=0.1,
#              api_key=os.getenv('GROQ_API_KEY'),
# )



async def fetch_jira_issues(status=None, assignee=None, project=None, JIRA_BASE_URL=JIRA_URL, JIRA_AUTH=API_TOKEN,EMAIL=EMAIL):
    """Fetch all Jira issues asynchronously using direct API calls and pagination."""
    auth = aiohttp.BasicAuth(EMAIL, JIRA_AUTH)
    jql_query = []


    if project:
        jql_query.append(f'project="{project}"')
    if status:
        jql_query.append(f'status="{status}"')
    if assignee:
        jql_query.append(f'assignee="{assignee}"')

    final_jql = " AND ".join(jql_query) if jql_query else ""

    print("finaljql",final_jql)
    start_at = 0
    max_results = 50
    results = []

    async with aiohttp.ClientSession(auth=auth) as session:
        while True:
            url = f"{JIRA_BASE_URL}/rest/api/2/search"
            params = {
                "jql": final_jql,
                "startAt": start_at,
                "maxResults": max_results,
                "fields": "key,summary,status,assignee,description,project"
            }

            async with session.get(url, params=params) as response:
                data = await response.json()
                print("DATA: ", data)
                if "issues" not in data or not data["issues"]:
                    break  # No more issues, exit loop

                tasks = [fetch_issue_data(session, issue, JIRA_BASE_URL) for issue in data["issues"]]
                issue_data_list = await asyncio.gather(*tasks)
                results.extend(issue_data_list)

                start_at += max_results

    return results


async def fetch_issue_data(session, issue, JIRA_BASE_URL=JIRA_URL):
    """Fetch detailed issue data asynchronously."""
    issue_data = {
        "Project Key": issue["fields"]["project"]["key"],
        "Project Name": issue["fields"]["project"]["name"],
        "Project ID": issue["fields"]["project"]["id"],
        "Issue Link": f"{JIRA_BASE_URL}/browse/{issue['key']}",
        "Issue Key": issue["key"],
        "Summary": issue["fields"]["summary"],
        "Status": issue["fields"]["status"]["name"],
        "Description": issue["fields"].get("description", "No description"),
        "Assignee": issue["fields"]["assignee"]["displayName"] if issue["fields"].get("assignee") else "Unassigned",
        
        "Comments": []
    }

    # Fetch comments asynchronously
    comments_url = f"{JIRA_BASE_URL}/rest/api/2/issue/{issue['key']}/comment"
    
    async with session.get(comments_url) as response:
        comments_data = await response.json()

    if "comments" in comments_data:
        issue_data["Comments"] = [
            {
                "Author": comment["author"]["displayName"],
                "Comment": comment["body"],
                "Created": comment["created"]
            }
            for comment in comments_data["comments"]
        ]

    return issue_data



async def save_issues_to_json(issues, filename="stored_issues.json"):
    """Save fetched Jira issues to a JSON file asynchronously."""
    try:
        async with aiofiles.open(filename, "w") as f:
            await f.write(json.dumps(issues, indent=4))
        print(f"Issues saved to {filename}")
    except Exception as e:
        print(f"Error saving issues to {filename}: {e}")


async def load_existing_issues(filename="stored_issues.json"):
    """Load previously stored Jira issues from a JSON file asynchronously."""
    if os.path.exists(filename):
        try:
            async with aiofiles.open(filename, "r") as f:
                content = await f.read()
                return json.loads(content)
        except Exception as e:
            print(f"Error loading issues from {filename}: {e}")
            return []
    return []

def sort_comments(comments):
    """Sort comments by creation timestamp for accurate comparison."""
    return sorted(comments, key=lambda x: x.get("Created", ""))


async def get_updated_new_deleted_issues(new_issues, filename="stored_issues.json"):
    """Identify new, updated, and deleted issues asynchronously by comparing with previous data."""
    old_issues = await load_existing_issues(filename)  # Await async file loading

    # Convert issues into dictionaries for efficient lookup
    old_issues_dict = {issue["Issue Key"]: issue for issue in old_issues}
    new_issues_dict = {issue["Issue Key"]: issue for issue in new_issues}

    new_issues_list = []
    updated_issues_list = []
    deleted_issues_list = []

    # Check for new or updated issues
    for issue in new_issues:
        issue_key = issue["Issue Key"]

        if issue_key not in old_issues_dict:
            new_issues_list.append(issue)  # New issue
        else:
            old_issue = old_issues_dict[issue_key]

            # Sort comments only once at retrieval time
            old_issue.setdefault("Comments", [])
            issue.setdefault("Comments", [])

            if (old_issue.get("Summary") != issue.get("Summary") or
                old_issue.get("Description") != issue.get("Description") or
                old_issue.get("Status") != issue.get("Status") or
                old_issue.get("Assignee") != issue.get("Assignee") or
                sort_comments(old_issue["Comments"]) != sort_comments(issue["Comments"])):

                updated_issues_list.append(issue)

    # Identify deleted issues efficiently
    deleted_issues_list = [old_issues_dict[key] for key in set(old_issues_dict) - set(new_issues_dict)]

    return new_issues_list, updated_issues_list, deleted_issues_list




index_name = 'jira'  # change if desired
pc=Pinecone(api_key="pcsk_2L6M7f_S7AwCL3RcZenDqdjPtPzBKAMFZVyRBB58ScZpJgaTutMtVS6vmDYLWbS3eJYWib")
existing_indexes = [index_info["name"] for index_info in pc.list_indexes()]

if index_name not in existing_indexes:
  pc.create_index(
      name=index_name,
      dimension=1024,
      metric="cosine",
      spec=ServerlessSpec(cloud="aws", region="us-east-1"),
  )
  while not pc.describe_index(index_name).status["ready"]:
      time.sleep(1)
  
vector_store = PineconeVectorStore(index=pc.Index(index_name), embedding=embeddings)

async def database():
    chunk_dict = {}
    issues = await fetch_jira_issues(project="SCRUM")
    print("ISSes", issues) 
    chunk_size = 2000

    for issue in issues: 
        chunks = []
        issue_text = ""
        issue_text += f"Description: {issue['Description']}\n"
        issue_text += f"Comments: {issue['Comments']}\n"

        current_chunk = ""
        sentences = sent_tokenize(issue_text) 
        for sentence in sentences:
            if len(current_chunk) + len(sentence) <= chunk_size:
                current_chunk += sentence + " "
                print("HEREE++++++++++++++++")
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + " "
                print("here====================")
        if current_chunk:
            chunks.append(current_chunk.strip())
            print("aaaaaaaaaaaaaaaaa")
        for i, chunk in enumerate(chunks, 1):
            # Create a metadata string that includes the source and file name.
            chunk_texts = []

            metadata_str = (
                f"Project_name: {issue['Project Name'] }\n"
                f"Issue link: {issue['Issue Link']}\n"
                f"Issue status: {issue['Status']}\n"
                f"Issue is assigned to: {issue['Assignee']}\n"
                f"Issue summary: {issue['Summary']}\n"
                f"Chunk: {i}/{len(chunks)}"
            )
            # Combine the metadata with the chunk content.
            combined_chunk = f"{metadata_str}\n\n{chunk}"
            chunk_texts.append(combined_chunk)
            chunk_dict.update({issue["Issue Key"]+"_"+str(i): chunk_texts})

    f = open(f"jira_messages.txt", "w", encoding= 'utf-8')
    f.write(str(chunk_dict) + "\n")

    f.close()
    return chunk_dict

async def embed_item_list_to_pinecone(organization_id, user_id):
    chunks = await database()
    print("========================ITEM LIST ==================================")
    if chunks is None:
        print("Where the f..freak is my chunks at!!")

    keys = list(chunks.keys())
    values = [item for sublist in chunks.values() for item in sublist]
    
    print("VALues", values)

    PineconeClient().CreateIndexNameSpaceForUniversalSearch(
        index_name="testabhishek",
        input_data=values,
        namespace=f"{organization_id}_slack_search",
        namespace_ids=keys,
        replace=True,
        user_id = user_id,
        meta_key="chunk_id", 
        platform_specific_id= "issue_key"
    )
    print("OKKKKAAAAAAAAAAAYYYYYYY DONEEEEEEEEEE")


asyncio.run(embed_item_list_to_pinecone("Hugha", "Jackmanaa"))

# asyncio.run(database())