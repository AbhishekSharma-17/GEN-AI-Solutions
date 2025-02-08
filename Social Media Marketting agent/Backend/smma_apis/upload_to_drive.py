#pip install google-api-python-client
from googleapiclient.discovery import build
from google.oauth2 import service_account
import os

SCOPES = ['https://www.googleapis.com/auth/drive']
SERVICE_ACCOUNT_FILE = 'social_media_script/upload_to_drive_creds.json'
PARENT_FOLDER_ID = "1vKJCWzipjtbkHY4Zjc-4EobN5wBBtwgY"

def authenticate():
    creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    return creds

def upload_photo(file_path):
    creds = authenticate()
    service = build('drive', 'v3', credentials=creds)

    file_name = os.path.basename(file_path)
    file_metadata = {
        'name': file_name,
        'parents': [PARENT_FOLDER_ID]
    }

    file = service.files().create(
        body=file_metadata,
        media_body=file_path
    ).execute()

    # Set the file permission to 'anyone with the link'
    permission = {
        'type': 'anyone',
        'role': 'reader'
    }
    service.permissions().create(
        fileId=file['id'],
        body=permission
    ).execute()

    return file.get('id')

def get_download_link(file_id):
    creds = authenticate()
    service = build('drive', 'v3', credentials=creds)

    file = service.files().get(fileId=file_id, fields='webContentLink').execute()
    return file.get('webContentLink')

# Example usage
# if __name__ == "__main__":
#     uploaded_file_id = upload_photo("media_for_twitter\Recording 2025-01-18 230252.mp4")
#     download_link = get_download_link(uploaded_file_id)
#     print(f"Direct download link: {download_link}")
