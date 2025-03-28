from pydantic import BaseModel
from fastapi import FastAPI
from langGraphSlack import ask_agent
import uvicorn
from fastapi.responses import StreamingResponse
from typing import Any, Dict
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse
import requests
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
load_dotenv()

SLACK_CLIENT_ID = os.getenv("SLACK_CLIENT_ID")
SLACK_CLIENT_SECRET = os.getenv("SLACK_CLIENT_SECRET")
REDIRECT_URI = "https://7b1036a6a055.ngrok.app/slack/oauth/callback"
ATL_REDIRECT_URI = "https://36a1-2401-4900-36c1-64b3-5cec-9505-a92c-56e7.ngrok-free.app/atlassian/oauth/callback"
# ATL_CLIENT_ID = os.getenv("ATL_CLIENT_ID")
ATL_CLIENT_ID = "kUCza8dbbpn9BmyGyoYiuIDfdLgefAtV"
ATL_CLIENT_SECRET = os.getenv("ATL_CLIENT_SECRET")
CODE_VERIFIER = "jira_CCC"
app = FastAPI(title='Slack Assistant')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", 'http://localhost:8000/ask'],  # Allow both frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#heloo

SLACK_TOKEN = ""
@app.get("/slack/oauth/callbackx")
async def slack_oauth_callback(request: Request):
    print("AAAAAAAAAAAAAAAAAAAAAaaasfsdf")
    code = request.query_params.get("code")
    token_url = "https://slack.com/api/oauth.v2.access"
    data = {
        "client_id": SLACK_CLIENT_ID,
        "client_secret": SLACK_CLIENT_SECRET,
        "code": code,
        "redirect_uri": REDIRECT_URI
    }

    try:
        response = requests.post(token_url, data=data)
        response.raise_for_status()
        response_data = response.json()

        if not response_data.get("ok"):
            error_message = response_data.get("error", "Unknown error")
            print(f"Error from Slack API: {error_message}")
            raise HTTPException(status_code=400, detail=f"Slack API error: {error_message}")

        access_token = response_data.get("access_token")
        bot_token = response_data.get("bot_token")
        print("Response: ", response_data)
        print(f"Authentication successful! Access Token: {access_token}, Bot Token: {bot_token}")
        
        # You might want to store these tokens securely here
        print({"message": "Authentication successful!", "bot_token": bot_token, "user_access_token": access_token})
        # SLACK_TOKEN = access_token

        return {"message": "Authentication successful!", "bot_token": bot_token, "user_access_token": access_token}

    except requests.RequestException as e:
        print(f"Error during token exchange: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during token exchange: {str(e)}")

from fastapi.responses import RedirectResponse

@app.get("/slack/oauth/callback")
async def slack_oauth_callback(request: Request):
    code = request.query_params.get("code")
    token_url = "https://slack.com/api/oauth.v2.access"
    data = {
        "client_id": SLACK_CLIENT_ID,
        "client_secret": SLACK_CLIENT_SECRET,
        "code": code,
        "redirect_uri": REDIRECT_URI
    }

    try:
        response = requests.post(token_url, data=data)
        response.raise_for_status()
        response_data = response.json()

        if not response_data.get("ok"):
            error_message = response_data.get("error", "Unknown error")
            print(f"Error from Slack API: {error_message}")
            raise HTTPException(status_code=400, detail=f"Slack API error: {error_message}")

        access_token = response_data.get("access_token")
        bot_token = response_data.get("bot_token")
        print("Response: access_token= ", access_token,"bot_token =", bot_token)

        return RedirectResponse(url="http://localhost:5173/streaming")

    except requests.RequestException as e:
        print(f"Error during token exchange: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during token exchange: {str(e)}")


@app.get("/atlassian/oauth/callbacka")
async def atlassian_oauth_callback(request: Request):
    code = request.query_params.get("code")

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    token_url = "https://auth.atlassian.com/oauth/token"

    data = {
        "grant_type": "authorization_code",
        "client_id": ATL_CLIENT_ID,
        "client_secret": ATL_CLIENT_SECRET,
        "code": code,
        "redirect_uri": ATL_REDIRECT_URI,
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(token_url, json=data, headers=headers)
        response.raise_for_status()
        token_data = response.json()
        print("TOKEN DATA: ", token_data)
        if "access_token" not in token_data:
            
            raise HTTPException(status_code=400, detail=f"Token exchange failed: {token_data}")

        access_token = token_data["access_token"]
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in")

        print() 
        print("TOKEN DATA: ", token_data) 
        print()
        print("Access Token:", access_token)
        print("Refresh Token:", refresh_token)
        print("Expires In:", expires_in)

        return {
            "message": "Atlassian OAuth successful!",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": expires_in
        }

    except requests.RequestException as e:
        print(f"Error during Atlassian token exchange: {str(e)}")
        raise HTTPException(status_code=500, detail="Token exchange failed")
    
from fastapi import Request, HTTPException
import requests

@app.get("/atlassian/oauth/callback")
async def atlassian_oauth_callback(request: Request):
    code = request.query_params.get("code")

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    token_url = "https://auth.atlassian.com/oauth/token"

    data = {
        "grant_type": "authorization_code",
        "client_id": ATL_CLIENT_ID,
        "client_secret": ATL_CLIENT_SECRET,
        "code": code,
        "redirect_uri": ATL_REDIRECT_URI,
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        # Step 1: Exchange code for token
        response = requests.post(token_url, json=data, headers=headers)
        response.raise_for_status()
        token_data = response.json()

        if "access_token" not in token_data:
            raise HTTPException(status_code=400, detail=f"Token exchange failed: {token_data}")

        access_token = token_data["access_token"]
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in")

        auth_headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json"
        }

        # Step 2: Get user info (/me)
        user_info_resp = requests.get("https://api.atlassian.com/me", headers=auth_headers)
        user_info_resp.raise_for_status()
        user_info = user_info_resp.json()
        email = user_info.get("email")  # May be None if email scope not granted

        # Step 3: Get Jira site info
        site_resp = requests.get("https://api.atlassian.com/oauth/token/accessible-resources", headers=auth_headers)
        site_resp.raise_for_status()
        sites = site_resp.json()
        print("SITES: ", site_resp) 
        jira_url = sites[0]["url"] if sites else None

        return {
            "message": "Atlassian OAuth successful!",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": expires_in,
            "email": email,
            "jira_url": jira_url
        }

    except requests.RequestException as e:
        print(f"Error during Atlassian token exchange: {str(e)}")
        raise HTTPException(status_code=500, detail="Token exchange failed")




@app.post('/ask')
async def ask_endpoint(body: Dict[str, Any]):
    question = body.get("question", "")
    if body.get("question"):
        return StreamingResponse(ask_agent(question), media_type="text/event-stream")
    else:
        raise HTTPException(status_code=400, detail="Question not provided")
    


# if _name_ == "_main_":
#     uvicorn.run(app, host="localhost", port=9999, reload= True)
# Run using: uvicorn bot_server:app --reload