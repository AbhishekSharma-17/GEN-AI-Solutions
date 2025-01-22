import os
import json
from typing import List, Dict, Any
from langchain_unstructured import UnstructuredLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

class ContentMetadataSplitter(RecursiveCharacterTextSplitter):
    def split_text(self, text):
        content, metadata = text.split("METADATA_SEPARATOR")
        content_chunks = super().split_text(content)
        metadata_dict = json.loads(metadata)
        return [f"{chunk}METADATA_SEPARATOR{json.dumps(metadata_dict)}" for chunk in content_chunks]

async def process_unstructured(file_path: str, unstructured_api_key: str, unstructured_api_url: str, mode: str = "hi_res") -> Dict[str, Any]:
    if mode not in ["fast", "hi_res"]:
        raise ValueError("Mode must be either 'fast' or 'hi_res'")

    loader = UnstructuredLoader(
        file_path=file_path,
        api_key=unstructured_api_key,
        url=unstructured_api_url,
        partition_via_api=True,
        strategy=mode
    )

    docs = loader.load()

    text_splitter = ContentMetadataSplitter(chunk_size=1000, chunk_overlap=200, length_function=len)

    combined_docs = [f"{doc.page_content}METADATA_SEPARATOR{json.dumps(doc.metadata)}" for doc in docs]
    split_docs = text_splitter.create_documents(combined_docs)

    # Count tables
    table_count = sum(1 for doc in docs if doc.metadata.get('category') == 'Table')

    # Save split documents to a text file
    output_file = f"{os.path.splitext(file_path)[0]}_unstructured_chunks.txt"
    with open(output_file, 'w', encoding='utf-8') as f:
        for doc in split_docs:
            f.write(f"{doc.page_content}\n\n")
    print(f"Processed {len(split_docs)} documents and saved to {output_file}")

    return {
        "split_docs": split_docs,
        "table_count": table_count
    }
