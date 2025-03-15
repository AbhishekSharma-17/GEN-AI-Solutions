import asyncio
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from dotenv import load_dotenv
import os
from jira import JIRA
import jira

from typing import TypedDict, Annotated, List, Union
from langchain_core.agents import AgentAction, AgentFinish
from langchain_core.messages import BaseMessage
import operator
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


load_dotenv()




os.environ["LANGCHAIN_API_KEY"] = os.getenv('LANGCHAIN_API_KEY')
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"
os.environ["LANGCHAIN_PROJECT"] = "jira"


JIRA_URL = ""
EMAIL = "company mail"
API_TOKEN ='' # Change this to your Jira API token


jira = JIRA(server=JIRA_URL, basic_auth=(EMAIL, API_TOKEN))
print("Connected to Jira successfully!")


embeddings = CohereEmbeddings(
    model="embed-english-v3.0"
)


llm=ChatGroq(model='llama-3.3-70b-versatile',
             temperature=0.1,
             api_key=os.getenv('GROQ_API_KEY'),
)



async def fetch_jira_issues(status=None, assignee=None, project=None, JIRA_BASE_URL=os.getenv('JIRA_URL'), JIRA_AUTH=os.getenv('JIRA_API_KEY'),EMAIL=os.getenv('EMAIL')):
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

                if "issues" not in data or not data["issues"]:
                    break  # No more issues, exit loop

                tasks = [fetch_issue_data(session, issue, JIRA_BASE_URL) for issue in data["issues"]]
                issue_data_list = await asyncio.gather(*tasks)
                results.extend(issue_data_list)

                start_at += max_results

    return results


async def fetch_issue_data(session, issue, JIRA_BASE_URL=os.getenv('JIRA_URL')):
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
pc=Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
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
    issues = await fetch_jira_issues(project="SCRUM")
    new_issues_list, updated_issues_list, deleted_issues_list = await get_updated_new_deleted_issues(issues)

    print(f"New Issues: {len(new_issues_list)}\nUpdated Issues: {len(updated_issues_list)}\nDeleted Issues: {len(deleted_issues_list)}")

    if new_issues_list:
        new_issue_documents = [
            Document(
                page_content=f"Summary: {issue['Summary']}\n\n"
                             f"Description: {issue['Description']}\n\n"
                             f"Issue Key: {issue['Issue Key']}\n"
                             f"Status: {issue['Summary']}\n"
                             f"Assignee: {issue['Assignee']}\n"
                             f"Project Key: {issue['Project Key']}\n"
                             f"Project Name: {issue['Project Name']}\n"
                             f"Project ID: {issue['Project ID']}\n"
                             f"Comments: {json.dumps(issue['Comments'])}\n"
                             f"Issue Link: {issue['Issue Link']}"
            )
            for issue in new_issues_list
        ]
        await vector_store.aadd_documents(documents=new_issue_documents, ids=[issue['Issue Key'] for issue in new_issues_list])

    if deleted_issues_list:
        await vector_store.adelete(ids=[issue["Issue Key"] for issue in deleted_issues_list])

    if updated_issues_list:
        await vector_store.adelete(ids=[issue["Issue Key"] for issue in updated_issues_list])

        updated_issue_documents = [
            Document(
                page_content=f"Summary: {issue['Summary']}\n\n"
                             f"Description: {issue['Description']}\n\n"
                             f"Issue Key: {issue['Issue Key']}\n"
                             f"Status: {issue['Status']}\n"
                             f"Assignee: {issue['Assignee']}\n"
                             f"Project Key: {issue['Project Key']}\n"
                             f"Project Name: {issue['Project Name']}\n"
                             f"Project ID: {issue['Project ID']}\n"
                             f"Comments: {json.dumps(issue['Comments'])}\n"
                             f"Issue Link: {issue['Issue Link']}"
            )
            for issue in updated_issues_list
        ]
        await vector_store.aadd_documents(documents=updated_issue_documents, ids=[issue['Issue Key'] for issue in updated_issues_list])

    await save_issues_to_json(issues)



asyncio.run(database())




@tool
def rag_search(query):
    """
    Retrieves relevant issue information from a vector store based on a natural language query.



    Args:
        query (str): The natural language query describing the issue or information to search for.
    """
    contexts = []

    retriever = vector_store.as_retriever(search_kwargs={"k": 20})

    compressor = CohereRerank(model="rerank-english-v3.0", top_n=3)
    compression_retriever = ContextualCompressionRetriever(
        base_compressor=compressor, base_retriever=retriever
    )
    docs = compression_retriever.invoke(query)

    for doc in docs:
        contexts.append(f"{doc.page_content}")
        context_str = "\n---\n".join(contexts)
    return context_str


@tool
def create_jira_issue(
    project_key, summary, description, issue_type="Epic", assignee=None
):
    """
    Creates a new issue in Jira.


    Args:
        project_key (str): The key of the Jira project where the issue will be created.
        summary (str): A brief summary of the issue.
        description (str): A detailed description of the issue.
        issue_type (str, optional): The type of the issue (e.g., "Bug", "Task", "Story", "Epic"). Defaults to "Epic".
        assignee (str, optional): The username or email of the user to assign the issue to. Defaults to None.
    """
    if assignee:
        if assignee.lower() == "unassigned":
            assignee = None
    issue_dict = {
        "project": {"key": project_key},
        "summary": summary,
        "description": description,
        "issuetype": {"name": issue_type},
    }

    if assignee:

        issue_dict["assignee"] = {
            "id": jira.search_users(query=assignee)[0].accountId
        }  # Ensure the assignee exists

    try:
        new_issue = jira.create_issue(fields=issue_dict)
        asyncio.run(database())
        return f"✅✅Success! Success! Issue {new_issue.key} named it {summary} created successfully!"
    except Exception as e:
        return f"Failed to create issue: {e}"


@tool
def delete_jira_issue(issue_key):
    """
    Deletes a Jira issue by its issue key.


    Args:
        issue_key (str): The unique key of the Jira issue to be deleted (e.g., "PROJ-123").
    """
    try:
        issue = jira.issue(issue_key)
        issue.delete()
        asyncio.run(database())
        return f"✅✅Success! Success! Issue {issue_key} deleted successfully!"
    except Exception as e:
        return f"Failed to delete issue {issue_key}: {e}"


@tool
def update_jira_issue(
    issue_key, summary=None, description=None, status=None, assignee=None
):
    """
    Updates an existing Jira issue with new details.


    Args:
        issue_key (str): The unique key of the Jira issue to be updated (e.g., "PROJ-123").
        summary (str, optional): The new summary for the issue. Defaults to None.
        description (str, optional): The new description for the issue. Defaults to None.
        status (str, optional): The new status to transition the issue to (e.g., "In Progress", "Done"). Defaults to None.
        assignee (str, optional): The username of the new assignee. Defaults to None. if no assignee keep it None
    """

    try:
        issue = jira.issue(issue_key)

        update_fields = {}

        if summary:
            update_fields["summary"] = summary
        if description:
            update_fields["description"] = description
        if assignee:
            update_fields["assignee"] = {"name": assignee}  # Ensure the assignee exists

        # Apply updates
        issue.update(fields=update_fields)

        # Change status if provided
        if status:
            jira.transition_issue(issue, status)
            asyncio.run(database())

        return f"✅✅Success! Success! Issue {issue_key} updated successfully with {update_fields} update!"

    except Exception as e:
        return f"Failed to update issue {issue_key}: {e}"


@tool
def add_comment_to_issue(issue_key, comment):
    """
    Adds a comment to a Jira issue.


    Args:
        issue_key (str): The unique key of the Jira issue to which the comment should be added (e.g., "PROJ-123").
        comment (str): The text of the comment to be added.
    """

    try:
        jira.add_comment(issue_key, comment)
        asyncio.run(database())
        return f"✅✅Success! Success! {comment} comment added to issue {issue_key} successfully!"
    except Exception as e:
        return f"Failed to add comment to issue {issue_key}: {e}"


@tool
def final_answer(answer):
    """
    Returns the final answer to be provided to the user.When the tool has been run successfully and the task is achieved use this to give answer to the user



    Args:
        answer (str): The final answer to be returned.
    """

    return {"answer": answer}



tools=[
    create_jira_issue,
    delete_jira_issue,
    update_jira_issue,
    add_comment_to_issue,
    rag_search,
    final_answer
]

tool_str_to_func = {
    "create_jira_issue": create_jira_issue,
    "delete_jira_issue": delete_jira_issue,
    "update_jira_issue": update_jira_issue,
    "add_comment_to_issue": add_comment_to_issue,
    "rag_search":rag_search,

    "final_answer": final_answer
}

system_prompt = """You are the oracle, the great AI decision maker.
Given the user's query you must decide what to do with it based on the
list of tools provided to you.
<Very Important Instruction>
If you see `create_jira_issue`,`delete_jira_issue` , `add_comment_to_issue` , `update_jira_issue`, `rag_search` has been used (in the scratchpad) with a particular
query, do NOT use that same tool with the same query again. Also, do NOT use
any tool more than once (ie, if the tool appears in the scratchpad once, do
not use it again).

Invoke `final_answer` after invoking any of the  `create_jira_issue`,`delete_jira_issue` , `add_comment_to_issue` , `update_jira_issue`, `rag_search` tools
IF YOU SEE ✅ MENTIONED IN A TOOL OUTPUT DONT USE IT AGAIN

DO NOT INVOKE THE SAME TOOL CONSECUTIVELY

</Very Important Instruction>

<Example>

Example Behavior:
Correct Flow:
User Input: "Delete issue CCS-146"
Invocation:
delete_jira_issue ->final_answer

Incorrect Flow:
(Repeating the same tool  multiple times)
delete_jira_issue -> delete_jira_issue (Incorrect)


</Example>


You should aim to collect information from a diverse range of sources before
providing the answer to the user.

You are a Jira Assistant which will be given details of the issues in Jira and you have to act according to the user query
{issue_details}


"""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    MessagesPlaceholder(variable_name="chat_history"),
    ("user", """Input :{input}"""),
    ("assistant", "scratchpad: {scratchpad}"),
])

oracle = (
    {
        "input": lambda x: x["input"],
        "chat_history": lambda x: x["chat_history"],
        "scratchpad": lambda x: create_scratchpad(
            intermediate_steps=x["intermediate_steps"]
        ),
        "issue_details": lambda x: x['issue_details']
    }
    | prompt
    | llm.bind_tools(tools, tool_choice="any")
)

def create_scratchpad(intermediate_steps: list[AgentAction]):
    research_steps = []
    for i, action in enumerate(intermediate_steps):
        if action.log != "TBD":
            # this was the ToolExecution
            research_steps.append(
                f"Tool: {action.tool}, input: {action.tool_input}\n"
                f"Output: {action.log}"
            )
    return "\n---\n".join(research_steps)


def run_oracle(state: list):
    
    print("run_oracle")
    print(f"intermediate_steps: {state['intermediate_steps']}")
    out = oracle.invoke(state)
    tool_name = out.tool_calls[0]["name"]
    tool_args = out.tool_calls[0]["args"]
    action_out = AgentAction(
        tool=tool_name,
        tool_input=tool_args,
        log="TBD"
    )
    return {
        "intermediate_steps": [action_out]
    }
def router(state: list):
    # return the tool name to use
    if isinstance(state["intermediate_steps"], list):
        return state["intermediate_steps"][-1].tool
    else:
        # if we output bad format go to final answer
        print("Router invalid format")
        return "final_answer"

def rag(state):
  return {"issue_details":rag_search.invoke({'query':state['input']})}


def run_tool(state: list):
    # use this as helper function so we repeat less code
    tool_name = state["intermediate_steps"][-1].tool
    tool_args = state["intermediate_steps"][-1].tool_input
    print(f"{tool_name}.invoke(input={tool_args})")
    # run tool
    out = tool_str_to_func[tool_name].invoke(input=tool_args)
    action_out = AgentAction(
        tool=tool_name,
        tool_input=tool_args,
        log=str(out)

    )

    return {"intermediate_steps": [action_out]}



class AgentState(TypedDict):
  input: str
  chat_history: list[BaseMessage]
  intermediate_steps: Annotated[list[tuple[AgentAction, str]], operator.add]
  issue_details:list[Document]
  answer:str



graph=StateGraph(AgentState)
graph.add_node('oracle',run_oracle)
graph.add_node('rag',rag)
graph.add_node('add_comment_to_issue',run_tool)
graph.add_node('create_jira_issue',run_tool)
graph.add_node('delete_jira_issue',run_tool)
graph.add_node('update_jira_issue',run_tool)
graph.add_node('rag_search',run_tool)
graph.add_node('final_answer',run_tool)
graph.set_entry_point('rag')
graph.add_edge('rag','oracle')
graph.add_conditional_edges(
        "oracle",  # where in graph to start
        router
    )
for tool in tools:
  if tool.name!='final_answer':
    graph.add_edge(tool.name,'oracle')

graph.add_edge('final_answer',END)
app=graph.compile()


query=input('Please enter the Query: ')
inputs = {
    "input":query ,
    "chat_history": [],
    "intermediate_steps": [],
}
out = app.invoke(inputs)
print(out)