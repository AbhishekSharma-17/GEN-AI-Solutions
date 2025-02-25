import requests
import os 
import time
from dotenv import load_dotenv

load_dotenv()

def get_page_access_token(page_id, user_access_token):
    """
    Function to retrieve the Page Access Token using the user access token and page ID.
    """
    version = 'v20.0'
    api_url_token = f'https://graph.facebook.com/{version}/{page_id}?fields=access_token&access_token={user_access_token}'
    
    try:
        response = requests.get(api_url_token)
        response.raise_for_status()
        data = response.json()
        return data['access_token']
    except requests.exceptions.RequestException as e:
        print("Error retrieving Page Access Token:", e)
        return None

def post_fb(page_id, page_access_token, message, media_url=None, media_type='image'):
    """
    Function to publish a post to the Facebook Page using the Page Access Token.
    Supports text, image, and video posts.
    """
    if media_url:
        if media_type == 'image':
            url = f'https://graph.facebook.com/v20.0/{page_id}/photos'
            payload = {
                'message': message,
                'url': media_url,
                'access_token': page_access_token
            }
        elif media_type == 'video':
            url = f'https://graph.facebook.com/v20.0/{page_id}/videos'
            payload = {
                'description': message,
                'file_url': media_url,
                'access_token': page_access_token
            }
        else:
            print("Error: Invalid media type. Use 'image' or 'video'.")
            return None
    else:
        url = f'https://graph.facebook.com/v20.0/{page_id}/feed'
        payload = {
            'message': message,
            'access_token': page_access_token
        }
    
    try:
        response = requests.post(url, data=payload)
        response.raise_for_status()
        response_json = response.json()
        
        if media_type == 'video':
            video_id = response_json.get('id')
            if video_id:
                status_url = f"https://graph.facebook.com/v20.0/{video_id}?fields=status&access_token={page_access_token}"
                while True:
                    status_response = requests.get(status_url)
                    status_json = status_response.json()
                    if status_json.get('status', {}).get('video_status') == 'ready':
                        print("Video processing completed.")
                        break
                    elif status_json.get('status', {}).get('video_status') == 'error':
                        print("Error processing video:")
                        print(status_json)
                        return None
                    print("Video still processing. Waiting...")
                    time.sleep(5)
        
        print("Post successfully published!")
        return response_json
    except requests.exceptions.RequestException as e:
        print(f"Failed to post: {e}")
        if response:
            print(response.json())
        return None


# user_access_token = os.environ.get("FACEBOOK_USER_ACCESS_TOKEN")
# page_id = os.environ.get("FACEBOOK_PAGE_ID")
    
# page_access_token = get_page_access_token(page_id, user_access_token) 


