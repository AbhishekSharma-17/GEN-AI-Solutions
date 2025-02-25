import requests
import os
import time
from dotenv import load_dotenv
load_dotenv()

def post_to_instagram(caption, media_url, media_type='image'):
    IG_ACCESS_TOKEN = os.environ.get("IG_ACCESS_TOKEN")
    IG_ID = os.environ.get("IG_ID")

    if not IG_ACCESS_TOKEN or not IG_ID:
        print("Error: Instagram access token or user ID not found in environment variables.")
        return

    # Step 1: Create media container
    create_media_url = f"https://graph.facebook.com/v18.0/{IG_ID}/media"
    media_payload = {
        "caption": caption,
        "access_token": IG_ACCESS_TOKEN
    }

    if media_type == 'image':
        media_payload["image_url"] = media_url
    elif media_type == 'video':
        media_payload["media_type"] = "REELS"
        media_payload["video_url"] = media_url
    else:
        print("Error: Invalid media type. Use 'image' or 'video'.")
        return

    response = requests.post(create_media_url, data=media_payload)
    response_json = response.json()

    if 'id' in response_json:
        media_id = response_json['id']
        print(f"Media container created successfully. ID: {media_id}")

        # Step 2: Check status for video uploads
        if media_type == 'video':
            status_url = f"https://graph.facebook.com/v18.0/{media_id}?fields=status_code&access_token={IG_ACCESS_TOKEN}"
            while True:
                status_response = requests.get(status_url)
                status_json = status_response.json()
                if status_json.get('status_code') == 'FINISHED':
                    print("Video processing completed.")
                    break
                elif status_json.get('status_code') == 'ERROR':
                    print("Error processing video:")
                    print(status_json)
                    return
                print("Video still processing. Waiting...")
                time.sleep(5)

        # Step 3: Publish media
        publish_url = f"https://graph.facebook.com/v18.0/{IG_ID}/media_publish"
        publish_payload = {
            "creation_id": media_id,
            "access_token": IG_ACCESS_TOKEN
        }
        publish_response = requests.post(publish_url, data=publish_payload)
        publish_json = publish_response.json()
        
        if 'id' in publish_json:
            print(f"Post published successfully. Post ID: {publish_json['id']}")
        else:
            print("Error publishing post:")
            print(publish_json)
    else:
        print("Error creating media container:")
        print(response_json)

# Example usage (commented out)
# post_to_instagram("Check out this cool image!", "https://example.com/image.jpg", "image")
# post_to_instagram("Check out this awesome video!", "https://example.com/video.mp4", "video")
