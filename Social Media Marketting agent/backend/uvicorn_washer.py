import json
import os
import sys
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
import aiofiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import openai
from typing import Any, Dict, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.chat_models import ChatAnthropic
# Add the parent directory to sys.path to import the API modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from smma_apis.linkedIn import LinkedinAutomate
from smma_apis import x_api2
from smma_apis import insta_api 
from smma_apis import facebook_api 
from smma_apis import upload_to_drive
from client.groq_llama_vision import take_screenshots, process_images
from langchain_openai import ChatOpenAI

load_dotenv()

app = FastAPI(
    title="Social Media Posting and Image Analysis API",
    description="API for posting content to various social media platforms and analyzing images using Groq LLaMA Vision",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
import os

def get_media_type(file_path: str) -> str:
    """Determines media type (image or video) based on file extension."""
    if not file_path:
        return "unknown"  # Return 'unknown' if file_path is None or empty

    ext = os.path.splitext(file_path)[1].lower()  # Extract and lowercase extension

    image_extensions = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp"}
    video_extensions = {".mp4", ".mov", ".avi", ".mkv", ".flv", ".wmv"}

    if ext in image_extensions:
        return "image"
    elif ext in video_extensions:
        return "video"
    else:
        return "unknown"  # Return 'unknown' for unsupported formats



@app.get("/health")
async def health_check():
    return {"status": "healthy"}

class PostRequest(BaseModel):
    content: str
    media_type: str

import tempfile
import shutil

# Existing endpoints...

@app.post("/analyze_media_and_gen_caption")
async def analyze_media(
    file_path: str = Form(...),
    is_video: bool = Form(False),
    interval: int = Form(30),
    llm_type: str = Form("gpt-4o"),
    api_key: str = Form(None),
    groq_api_key: str = Form(None)
):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    if llm_type == "gpt-4o" and not api_key:
        raise HTTPException(status_code=400, detail="OpenAI API key is required for gpt-4o")
    elif llm_type in ["llama-3.3-70b-versatile", "gemma2-9b-it"] and not groq_api_key:
        raise HTTPException(status_code=400, detail="Groq API key is required for Groq models")
    elif llm_type == "claude-3-sonnet" and not api_key:
        raise HTTPException(status_code=400, detail="Anthropic API key is required for Claude")

    client = openai.OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=groq_api_key,
    ) if groq_api_key else None

    try:
        if is_video:
            screenshot_paths = take_screenshots(file_path, interval)
            raw_results = process_images(screenshot_paths, client)
            results = {f"screenshot{i+1}": result for i, result in enumerate(raw_results)}
        else:
            raw_results = process_images([file_path], client)
            results = {"image": raw_results[0]}

        print("Results: ", results)

        system_prompt = """
        You are tasked to generate a caption based on an image description that you will be provided. 
        This is the image description: {image_description} 

        There may be multiple image descriptions provided at once, in that case analyse them all and come up with an eye catching caption for social media. 

        ALWAYS PROVIDE A JSON RESPONSE AS YOUR ANSWER!!
        ALWAYS PROVIDE FIVE OPTIONS FOR CAPTIONS!!
        Example: 
        image description: {{'screenshot1': 'The image depicts a narrow canyon with tall, orange rock formations on either side. The sky is bright blue and clear, with two birds flying in the distance. The overall atmosphere suggests a sunny day in a natural setting, possibly during the daytime when the sun is high in the sky.\n\n**Key Features:**\n\n* **Canyon Walls:** The canyon walls are made of orange rock formations that rise high into the sky.\n* **Sky:** The sky is bright blue and clear, with no clouds or obstructions visible.\n* **Birds:** Two birds can be seen flying in the distance, adding a sense of movement and life to the scene.\n* **Lighting:** The lighting is natural, with the sun shining down from above and casting shadows on the canyon walls.\n* **Atmosphere:** The atmosphere is peaceful and serene, with a sense of vastness and openness due to the expansive sky and towering canyon walls.\n\n**Mood and Emotion:**\n\n* The image evokes a feeling of awe and wonder at the natural beauty of the canyon and the vastness of the sky.\n* The peaceful atmosphere creates a sense of calmness and serenity, inviting the viewer to step into the scene and experience it for themselves.\n* The presence of the birds adds a sense of movement and life to the scene, suggesting that this is a place where nature thrives and flourishes.', 'screenshot2': 'This image depicts a photograph of two tall, reddish-orange rock formations with a bright blue sky between them. The rock formations are likely made of sandstone, a common geological feature in desert environments.\n\n**Key Features:**\n\n* **Rock Formations:** The rock formations dominate the image, characterized by their reddish-orange hue and rough texture.\n* **Blue Sky:** The bright blue sky is visible through the gap between the two rock formations, adding contrast to the scene.\n* **Desert Landscape:** The overall setting appears to be a desert or arid region, given the type of rock formations and the clear blue sky.\n\n**Composition:**\n\n* **Symmetry:** The photo is composed symmetrically, with the two rock formations roughly equal in size and shape on either side of the frame.\n* **Depth:** The image creates a sense of depth, with the rock formations receding into the distance and the blue sky fading towards the horizon.\n\n**Mood and Atmosphere:**\n\n* **Serenity:** The combination of the blue sky and the natural beauty of the rock formations evokes a sense of serenity and tranquility.\n* **Awe-Inspiring:** The sheer scale and grandeur of the rock formations likely inspire a sense of awe in the viewer.'}}
        Answer: {{
  "captions": [
    {{
      "title": "Nature's Timeless Canvas 🌄✨",
      "text": "Towering orange canyon walls rise high into a brilliant blue sky, framing a peaceful desert landscape. Two birds soar in the distance, adding a sense of movement to the serene, sunlit scene. The play of natural light and shadows enhances the breathtaking beauty of this arid wonder, where time and nature sculpt their masterpieces."
    }},
    {{
      "title": "Between Giants: A View to Remember 🏜️🔆",
      "text": "Two colossal reddish-orange sandstone formations stand tall, parting just enough to reveal an endless blue sky. Their rugged textures tell the story of time, wind, and erosion, shaping this awe-inspiring desert landscape. A moment of stillness, a sense of vastness—this is nature's quiet grandeur at its best."
    }},
    {{
      "title": "Silence, Sky, and Sandstone Wonders ⛰️🌤️",
      "text": "A peaceful canyon bathed in sunlight, its orange rock walls stretching toward a vibrant blue sky. The atmosphere is calm, the scene untouched—except for two birds gliding effortlessly overhead. With perfect symmetry and depth, the canyon draws you in, reminding us of nature's raw and timeless beauty."
    }},
    {{
      "title": "Where Earth Meets Sky: The Canyon's Grand Embrace 🌍💫",
      "text": "Massive rock formations stand side by side, creating a natural gateway to the heavens. The warm hues of sandstone contrast sharply against the clear, endless sky, making the scene feel both tranquil and powerful. A breathtaking blend of nature's artistry and the vastness of the wild."
    }}
  ]
}}
        """.format(
            image_description = str(results)
        )

        if llm_type == "gpt-4o":
            model = ChatOpenAI(model="gpt-4o", api_key=api_key)
            response = model.invoke(system_prompt)
            response = response.content
        elif llm_type in ["llama-3.3-70b-versatile", "gemma2-9b-it"]:
            response = client.chat.completions.create(
                model=llm_type,
                messages=[
                    {"role": "system", "content": system_prompt},
                ],
                temperature=0.7,
                max_tokens=1000
            )
            response = response.choices[0].message.content
        elif llm_type == "claude-3-sonnet":
            llm = ChatAnthropic(
                model="claude-3-sonnet-20240229",
                api_key=api_key
            )
            response = llm.invoke(system_prompt)
            response = response.content
        else:
            raise HTTPException(status_code=400, detail="Invalid LLM type")

        if response.startswith("```json"):
            striped_query = response[len("```json") :].strip()
            if striped_query.endswith("```"):
                striped_query = striped_query[: -len("```")].strip()

            json_query = json.loads(striped_query)

        else:
            json_query = json.loads(response)

        print("JSON CAPITONS\n", {"results": results, "generation": json_query})
        return {"results": results, "generation": json_query}
    finally:
        if is_video:
            for screenshot_path in screenshot_paths:
                os.unlink(screenshot_path)

from pydantic import BaseModel

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Ensure the 'uploads' directory exists
        os.makedirs("uploads", exist_ok=True)
        
        file_path = f"uploads/{file.filename}"
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()  # Read the file
            await out_file.write(content)  # Write the file

        # Upload to Google Drive
        # with open(file_path, "rb") as file_content:
        file_id = upload_to_drive.upload_photo(file_path)
        media_url = upload_to_drive.get_download_link(file_id)

        # Keep the file in the uploads folder
        # We don't need to do anything here as the file is already saved

        return {"file_path": file_path, "media_url": media_url}
    except Exception as e:
        # If an error occurs, try to remove the file if it was created
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"An error occurred while uploading the file: {str(e)}")

@app.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    file_path = f"uploads/{filename}"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

@app.post("/post/   in")
async def post_to_linkedin(data: Dict[str, Any]):
    content = data.get("content", None)
    file_path = data.get("file_path", None) 
    media_type = data.get("media_type", None) 

    access_token = os.environ.get("LINKEDIN_ACCESS_TOKEN")
    title = content.split("\n")[0]  # Get only the first line

    try:
        LinkedinAutomate(access_token, file_path, title, content, media_type).main_func()
        return {"message": "Posted successfully to LinkedIn"}
    except Exception as e:
        return {"error": f"Failed to post to LinkedIn: {str(e)}"}

@app.post("/post/twitter")
async def post_to_twitter(data: Dict[str, Any]):
    content = data.get("content", None)
    file_path = data.get("file_path", None) 
    media_type = data.get("media_type", None) 

    try:
        x_api2.post_tweet_with_image(content, file_path)
        return {"message": "Posted successfully to Twitter"}
    except Exception as e:
        return {"error": f"Failed to post to Twitter: {str(e)}"}

@app.post("/post/instagram")
async def post_to_instagram(data: Dict[str, Any]):
    content = data.get("content", None)
    media_url = data.get("media_url", None) 
    media_type = ""
    file_path = data.get("file_path", None) 

    media_type = get_media_type(file_path=file_path)

    try:
        insta_api.post_to_instagram(content, media_url, media_type)
        return {"message": "Posted successfully to Instagram"}
    except Exception as e:
        return {"error": f"Failed to post to Instagram: {str(e)}"}

@app.post("/post/facebook")
async def post_to_facebook(data: Dict[str, Any]):
    content = data.get("content", None)
    media_url = data.get("media_url", None) 
    file_path = data.get("file_path", None) 
    media_type = get_media_type(file_path=file_path)
    user_access_token = os.environ.get("FACEBOOK_USER_ACCESS_TOKEN")
    page_id = os.environ.get("FACEBOOK_PAGE_ID")
    
    if not user_access_token or not page_id:
        return {"error": "Facebook user access token or page ID not found in environment variables."}

    page_access_token = facebook_api.get_page_access_token(page_id, user_access_token)
    
    if page_access_token:
        try:
            facebook_api.post_fb(page_id, page_access_token, content, media_url, media_type)
            return {"message": "Posted successfully to Facebook"}
        except Exception as e:
            return {"error": f"Failed to post to Facebook: {str(e)}"}
    else:
        return {"error": "Failed to obtain Page Access Token."}

@app.post("/post/all")
async def post_to_all(data: Dict[str, Any]):
    content = data.get("content", None)
    media_url = data.get("media_url", None) 
    media_type = data.get("media_type", None) 
    file_path = data.get("file_path", None) 


    results = {}
    
    # Upload to Google Drive and get the download link
    # file_id = upload_to_drive.upload_photo(file_path)
    # media_url_for_graph = upload_to_drive.get_download_link(file_id)
    
    # Post to Facebook
    try:
        await post_to_facebook(data)
        results["facebook"] = "Success"
    except Exception as e:
        results["facebook"] = f"Error: {str(e)}"

    # Post to Instagram
    try:
        await post_to_instagram(data)
        results["instagram"] = "Success"
    except Exception as e:
        results["instagram"] = f"Error: {str(e)}"

    # Post to Twitter
    try:
        await post_to_twitter(data)
        results["twitter"] = "Success"
    except Exception as e:
        results["twitter"] = f"Error: {str(e)}"

    # Post to LinkedIn
    try:
        await post_to_linkedin(data)
        results["linkedin"] = "Success"
    except Exception as e:
        results["linkedin"] = f"Error: {str(e)}"

    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "uvicorn_washer:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=[".", "smma_apis"],
        reload_includes=["*.py"],
    )
