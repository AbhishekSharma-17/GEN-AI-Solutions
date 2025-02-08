import tweepy
import os 
from dotenv import load_dotenv 

load_dotenv() 

api_key = os.environ.get("X_API_KEY")
api_secret = os.environ.get("X_API_KEY_SECRET")

bearer_token = os.environ.get("X_BEARER_TOKEN")

access_token = os.environ.get("X_ACCESS_TOKEN")
access_token_secret =os.environ.get("X_ACCESS_TOKEN_SECRET")

client = tweepy.Client(bearer_token, api_key, api_secret, access_token, access_token_secret)

auth = tweepy.OAuth1UserHandler(api_key, api_secret, access_token, access_token_secret)

api = tweepy.API(auth)

def post_tweet_with_image(text, image_url=None):
    if image_url:
        # Upload the image
        media = api.media_upload(filename=image_url)
        # Create a tweet with text and image
        response = client.create_tweet(text=text, media_ids=[media.media_id])
    else:
        # Create a tweet with only text
        response = client.create_tweet(text=text)
    
    print(f"Tweet posted successfully. Tweet ID: {response.data['id']}")




