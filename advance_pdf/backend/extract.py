import os
from langchain_unstructured import UnstructuredLoader
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
import json

load_dotenv()

loader = UnstructuredLoader(
    file_path=["Latest-Smartphone-Trends-A-Deep-Dive.pptx"],
    api_key=os.getenv("UNSTRUCTURED_API_KEY"),
    url=os.getenv("UNSTRUCTURED_API_URL"),
    partition_via_api=True,
    strategy="hi_res"
    
)

docs = loader.load()

class ContentMetadataSplitter(RecursiveCharacterTextSplitter):
    def split_text(self, text):
        content, metadata = text.split("METADATA_SEPARATOR")
        content_chunks = super().split_text(content)
        metadata_dict = json.loads(metadata)
        return [f"{chunk}METADATA_SEPARATOR{json.dumps(metadata_dict)}" for chunk in content_chunks]

text_splitter = ContentMetadataSplitter(chunk_size=1000, chunk_overlap=200, length_function=len)

combined_docs = [f"{doc.page_content}METADATA_SEPARATOR{json.dumps(doc.metadata)}" for doc in docs]
split_docs = text_splitter.create_documents(combined_docs)

for doc in split_docs:
    print("--------------------")
    print(doc.page_content)

with open("document_chunks.txt", "w", encoding="utf-8") as f:
    for doc in split_docs:
        f.write(f"{doc.page_content}\n")
        f.write("-" * 50 + "\n")  # Separator line between chunks

print(f"Total number of chunks: {len(split_docs)}")
print("Chunks have been written directly to 'document_chunks.txt'")