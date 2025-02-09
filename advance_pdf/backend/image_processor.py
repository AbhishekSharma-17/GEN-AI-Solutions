import os
import asyncio
import tempfile
import base64
import io
import logging
from typing import List, Tuple, Dict, Any
import fitz  # PyMuPDF
from PIL import Image
from openai import OpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

async def extract_images_from_pdf(pdf_path: str) -> Tuple[str, List[Tuple[str, str]]]:
    temp_dir = tempfile.mkdtemp()
    
    pdf_document = await asyncio.to_thread(fitz.open, pdf_path)
    
    extracted_images = []
    
    for page_num in range(len(pdf_document)):
        page = pdf_document[page_num]
        image_list = await asyncio.to_thread(page.get_images, full=True)
        
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = await asyncio.to_thread(pdf_document.extract_image, xref)
            image_bytes = base_image["image"]
            
            image_ext = base_image["ext"]
            
            image = await asyncio.to_thread(Image.open, io.BytesIO(image_bytes))
            image_filename = f"page{page_num+1}_img{img_index+1}.{image_ext}"
            image_path = os.path.join(temp_dir, image_filename)
            await asyncio.to_thread(image.save, image_path)
            
            extracted_images.append((image_filename, image_path))
            logging.info(f"Saved: {image_filename}")
    
    await asyncio.to_thread(pdf_document.close)
    logging.info(f"Extracted images saved to temporary directory: {temp_dir}")
    
    return temp_dir, extracted_images

async def process_images_with_vision_model(images: List[Tuple[str, str]], api_key: str) -> List[Tuple[str, str]]:
    client = OpenAI(api_key=api_key)
    image_explanations = []
    
    async def process_single_image(image_name: str, image_path: str) -> Tuple[str, str]:
        try:
            with open(image_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            
            response = await asyncio.to_thread(
                client.chat.completions.create,
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Provide a detailed explanation of this image."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            },
                        ],
                    }
                ],
                max_tokens=290,
            )
            
            explanation = response.choices[0].message.content
            return image_name, explanation
        except Exception as e:
            logging.error(f"Error processing image {image_name}: {str(e)}")
            return image_name, f"Error processing image: {str(e)}"
    
    tasks = [process_single_image(image_name, image_path) for image_name, image_path in images]
    image_explanations = await asyncio.gather(*tasks)
    
    return image_explanations

def create_explanation_document(image_explanations: List[Tuple[str, str]]) -> Document:
    content = "Image Explanations\n\n"
    for image_name, explanation in image_explanations:
        content += f"Image: {image_name}\n"
        content += f"Explanation: {explanation}\n\n"
    return Document(page_content=content, metadata={"source": "image_explanations"})

async def split_document(document: Document) -> List[Document]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    split_image = await asyncio.to_thread(text_splitter.split_documents, [document])
    return split_image

async def cleanup_temp_dir(temp_dir: str):
    for file in os.listdir(temp_dir):
        file_path = os.path.join(temp_dir, file)
        if os.path.isfile(file_path):
            await asyncio.to_thread(os.unlink, file_path)
    await asyncio.to_thread(os.rmdir, temp_dir)
    logging.info(f"Temporary directory cleaned up: {temp_dir}")

async def process_image(pdf_path: str, api_key: str) -> Dict[str, Any]:
    temp_dir, extracted_images = await extract_images_from_pdf(pdf_path)
    
    try:
        image_explanations = await process_images_with_vision_model(extracted_images, api_key)
        document = create_explanation_document(image_explanations)
        chunks = await split_document(document)
        
        # Save image chunks to a text file
        output_file = f"{os.path.splitext(pdf_path)[0]}_image_chunks.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            for chunk in chunks:
                f.write(f"{chunk.page_content}\n\n")
        
        logging.info(f"Image chunks saved to {output_file}")
        
        return {
            "image_chunks": chunks,
            "image_count": len(extracted_images)
        }
    finally:
        await cleanup_temp_dir(temp_dir)