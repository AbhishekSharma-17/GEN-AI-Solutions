
import base64
import openai
import os
from dotenv import load_dotenv
import cv2
import numpy as np
from PIL import Image
import io

load_dotenv()

# Function to encode the image
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Function to encode a PIL Image
def encode_pil_image(pil_image):
    buffered = io.BytesIO()
    pil_image.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

# Function to take screenshots from a video and save them
def take_screenshots(video_path, interval):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps * interval)
    screenshots = []
    
    # Create video_screenshots folder if it doesn't exist
    os.makedirs("video_screenshots", exist_ok=True)
    
    frame_count = 0
    screenshot_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_count % frame_interval == 0:
            pil_image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            screenshot_path = f"video_screenshots/screenshot_{screenshot_count:03d}.jpg"
            pil_image.save(screenshot_path)
            screenshots.append(screenshot_path)
            screenshot_count += 1
        
        frame_count += 1
    
    cap.release()
    return screenshots

def process_images(image_paths, client):
    results = []
    for i, image_path in enumerate(image_paths):
        with Image.open(image_path) as img:
            base64_image = encode_pil_image(img)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"What's in this image? (Image {i+1})"},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                            },
                        },
                    ],
                }
            ],
            model="llama-3.2-90b-vision-preview",
        )
        results.append(chat_completion.choices[0].message.content)
    return results

def main():
    client = openai.OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.environ.get("GROQ_API_KEY"),
    )

    choice = input("Enter '1' to process a single image or '2' to process video screenshots: ")

    if choice == '1':
        image_path = input("Enter the path to your image: ")
        results = process_images([image_path], client)
    elif choice == '2':
        video_path = input("Enter the path to your video: ")
        interval = int(input("Enter the interval for screenshots in seconds (e.g., 30 or 60): "))
        screenshot_paths = take_screenshots(video_path, interval)
        results = process_images(screenshot_paths, client)
    else:
        print("Invalid choice. Please run the script again and enter either '1' or '2'.")
        return

    for i, result in enumerate(results):
        print(f"\nResult for image {i+1}:")
        print(result)

if __name__ == "__main__":
    main()
