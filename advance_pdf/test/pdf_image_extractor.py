import fitz  # PyMuPDF
from PIL import Image
import io
import os
import tempfile
import base64
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=openai_api_key)

def extract_images_from_pdf(pdf_path):
    # Create a temporary directory
    temp_dir = tempfile.mkdtemp()
    
    # Open the PDF
    pdf_document = fitz.open(pdf_path)
    
    extracted_images = []
    
    # Iterate through each page
    for page_num in range(len(pdf_document)):
        page = pdf_document[page_num]
        image_list = page.get_images(full=True)
        
        # Iterate through each image on the page
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = pdf_document.extract_image(xref)
            image_bytes = base_image["image"]
            
            # Get the image extension
            image_ext = base_image["ext"]
            
            # Save the image to the temporary directory
            image = Image.open(io.BytesIO(image_bytes))
            image_filename = f"page{page_num+1}_img{img_index+1}.{image_ext}"
            image_path = os.path.join(temp_dir, image_filename)
            image.save(image_path)
            
            extracted_images.append((image_filename, image_path))
            print(f"Saved: {image_filename}")
    
    pdf_document.close()
    print(f"Extracted images saved to temporary directory: {temp_dir}")
    
    return temp_dir, extracted_images

def process_images_with_vision_model(images):
    image_explanations = []
    
    for image_name, image_path in images:
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
        
        response = client.chat.completions.create(
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
            max_tokens=300,
        )
        
        explanation = response.choices[0].message.content
        image_explanations.append((image_name, explanation))
    
    return image_explanations

def create_explanation_document(image_explanations):
    document = "Image Explanations\n\n"
    for image_name, explanation in image_explanations:
        document += f"Image: {image_name}\n"
        document += f"Explanation: {explanation}\n\n"
    return document

def cleanup_temp_dir(temp_dir):
    for file in os.listdir(temp_dir):
        file_path = os.path.join(temp_dir, file)
        if os.path.isfile(file_path):
            os.unlink(file_path)
    os.rmdir(temp_dir)
    print(f"Temporary directory cleaned up: {temp_dir}")

# Example usage
pdf_path = "test1.pdf"

temp_dir, extracted_images = extract_images_from_pdf(pdf_path)
try:
    image_explanations = process_images_with_vision_model(extracted_images)
    document = create_explanation_document(image_explanations)
    print("Document created with all image explanations.")
    print("Document content:")
    print(document)
finally:
    cleanup_temp_dir(temp_dir)

# The 'document' variable now contains a single string with all image explanations
# You can use this string for further processing, such as splitting and embedding
