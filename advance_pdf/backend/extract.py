import os
import base64
from PIL import Image
from io import BytesIO
from langchain_unstructured import UnstructuredLoader

loader = UnstructuredLoader(
    file_path=["Frontend_enhacements.pdf"],
    api_key=os.getenv("UNSTRUCTURED_API_KEY"),
    partition_via_api=True,
    strategy="hi_res",
    extract_image_block_types=["Image", "Table"]
)

docs = loader.load()

image_list = []
table_list = []
text_list = []

for doc in docs:
    if doc.metadata['category'] == 'Image':
        image_list.append({
            'content': doc.page_content,
            'metadata': doc.metadata
        })
    elif doc.metadata['category'] == 'Table':
        table_list.append({
            'content': doc.page_content,
            'metadata': doc.metadata
        })
    else:
        text_list.append({
            'content': doc.page_content,
            'metadata': doc.metadata
        })

print(f"Number of images extracted: {len(image_list)}")
print(f"Number of tables extracted: {len(table_list)}")
print(f"Number of text elements extracted: {len(text_list)}")

print("\nSample text elements:")
for i, text in enumerate(text_list[:3]):
    print(f"{i+1}. Category: {text['metadata']['category']}")
    print(f"   Content: {text['content'][:100]}...")  # Print first 100 characters of each text

print("\nImage elements:")
for i, image in enumerate(image_list[:3]):
    print(f"{i+1}. Element ID: {image['metadata']['element_id']}")
    print(f"   Content sample: {image['content'][:50]}...")  # Print first 50 characters of content

print("\nTable elements:")
for i, table in enumerate(table_list[:3]):
    print(f"{i+1}. Element ID: {table['metadata']['element_id']}")
    print(f"   Content sample: {table['content'][:50]}...")  # Print first 50 characters of content

# If you want to save the images:
# for i, image in enumerate(image_list):
#     with open(f"extracted_image_{i}.txt", "w") as f:
#         f.write(image['content'])

# If you want to save the table data:
# for i, table in enumerate(table_list):
#     with open(f"extracted_table_{i}.txt", "w") as f:
#         f.write(table['content'])
