import os
import base64
from langchain_unstructured import UnstructuredLoader

loader = UnstructuredLoader(
    file_path=["test1.pdf"],
    api_key=os.getenv("UNSTRUCTURED_API_KEY"),
    partition_via_api=True,
    strategy="hi_res",
)

docs = loader.load()

image_list = []
text_list = []

for doc in docs:
    if doc.metadata['category'] == 'Image':
        # Encode image content as base64
        base64_content = base64.b64encode(doc.page_content.encode('utf-8')).decode('utf-8')
        image_list.append({
            'content': base64_content,
            'metadata': doc.metadata
        })
    else:
        text_list.append({
            'content': doc.page_content,
            'metadata': doc.metadata
        })

print(f"Number of images extracted: {len(image_list)}")
print(f"Number of text elements extracted: {len(text_list)}")

print("\nSample text elements:")
for i, text in enumerate(text_list[:5]):
    print(f"{i+1}. Category: {text['metadata']['category']}")
    print(f"   Content: {text['content'][:100]}...")  # Print first 100 characters of each text

print("\nImage elements:")
for i, image in enumerate(image_list):
    print(f"{i+1}. Element ID: {image['metadata']['element_id']}")
    print(f"   Base64 content length: {len(image['content'])} characters")
    print(f"   Base64 content sample: {image['content'][:50]}...")  # Print first 50 characters of base64 content

# If you want to save the base64 image content to files:
# for i, image in enumerate(image_list):
#     with open(f"base64_image_{i}.txt", "w") as f:
#         f.write(image['content'])
