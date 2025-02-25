import requests
import json
import os
import time
from dotenv import load_dotenv

load_dotenv()

class LinkedinAutomate:
    def __init__(self, access_token, media_url, title, description, media_type='image'):
        self.access_token = access_token
        self.media_url = media_url
        self.title = title
        self.description = description
        self.media_type = media_type
        self.headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json',
        }

    def get_user_id(self):
        url = "https://api.linkedin.com/v2/userinfo"
        response = requests.get(url, headers=self.headers)
        jsonData = response.json()
        print("JSONDATA: ", jsonData)
        return jsonData["sub"]

    def register_upload(self):
        url = "https://api.linkedin.com/v2/assets?action=registerUpload"
        payload = {
            "registerUploadRequest": {
                "recipes": [f"urn:li:digitalmediaRecipe:feedshare-{self.media_type}"],
                "owner": f"urn:li:person:{self.user_id}",
                "serviceRelationships": [
                    {
                        "relationshipType": "OWNER",
                        "identifier": "urn:li:userGeneratedContent"
                    }
                ]
            }
        }
        response = requests.post(url, json=payload, headers=self.headers)
        if response.status_code == 200:
            data = response.json()
            return data["value"]["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]["uploadUrl"], data["value"]["asset"]
        else:
            print("Error registering upload:", response.text)
            return None, None

    def upload_media(self, upload_url):
        headers = {'Authorization': f'Bearer {self.access_token}'}
        
        if self.media_url.startswith(('http://', 'https://')):
            # If it's a URL, download the media first
            response = requests.get(self.media_url)
            if response.status_code == 200:
                media_content = response.content
            else:
                print(f"Error downloading media from URL: {response.status_code}")
                return False
        else:
            # If it's a local file path
            try:
                with open(self.media_url, 'rb') as media_file:
                    media_content = media_file.read()
            except IOError as e:
                print(f"Error reading local media file: {e}")
                return False

        files = {'file': (f'media.{self.media_type}', media_content, f'{self.media_type}/{self.media_type}')}
        response = requests.post(upload_url, files=files, headers=headers)
        
        if response.status_code != 201:
            print(f"Error uploading {self.media_type}:", response.text)
            return False
        return True

    def create_post(self, asset):
        url = "https://api.linkedin.com/v2/ugcPosts"
        payload = {
            "author": f"urn:li:person:{self.user_id}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": self.description
                    },
                    "shareMediaCategory": self.media_type.upper(),
                    "media": [
                        {
                            "status": "READY",
                            "description": {
                                "text": self.description
                            },
                            "media": asset,
                            "title": {
                                "text": self.title
                            }
                        }
                    ]
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }
        response = requests.post(url, json=payload, headers=self.headers)
        return response.json()

    def main_func(self):
        self.user_id = self.get_user_id()
        print("User ID:", self.user_id)

        upload_url, asset = self.register_upload()
        if not upload_url or not asset:
            return

        if self.upload_media(upload_url):
            print(f"{self.media_type.capitalize()} uploaded successfully")
            
            # Wait for the media to be processed
            time.sleep(10)  # You might need to adjust this waiting time

            post_response = self.create_post(asset)
            print("Post response:", post_response)
        else:
            print(f"Failed to upload {self.media_type}")

# if __name__ == "__main__":
#     access_token = os.getenv('LINKEDIN_ACCESS_TOKEN')
    
    # Example for image upload
    # image_url = "C:/Users/Siddhant Dawande/OneDrive/Desktop/MY BRAIN/UPWORK/social_media_script/media_for_twitter/insta_test.jpg"  # Replace with the actual path to your image file
    # image_title = "My Image Post"
    # image_description = "Check out this awesome image!"
    # linkedin_image = LinkedinAutomate(access_token, image_url, image_title, image_description, media_type='image')
    # linkedin_image.main_func()

    # Example for video upload
    # video_url = "C:/Users/Siddhant Dawande/OneDrive/Desktop/MY BRAIN/UPWORK/social_media_script/media_for_twitter/Recording 2025-01-18 230252.mp4"  # Replace with the actual path to your video file
    # video_title = "My Video Post"
    # video_description = "Check out this awesome video!"
    # linkedin_video = LinkedinAutomate(access_token, video_url, video_title, video_description, media_type='video')
    # linkedin_video.main_func()
