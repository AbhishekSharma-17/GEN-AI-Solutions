# import os
# from langchain_unstructured import UnstructuredLoader

# loader = UnstructuredLoader(
#     file_path = ["Frontend_enhacements.pdf"],
#     api_key=os.getenv("UNSTRUCTURED_API_KEY"),
#     partition_via_api=True,
#     strategy="hi_res"
# )


# docs = loader.load()

# print(docs)

# from unstructured.partition.api import partition_via_api
# import os

# print("Start")
# loader = partition_via_api(
#     filename="complex_table.pdf",
#     api_key=os.getenv("UNSTRUCTURED_API_KEY"),
#     api_url="https://api.unstructuredapp.io/general/v0/general",
#     strategy = "hi_res"    
# )
# print("PDF Content:")
# for element in loader:
#     print(element)

print("Start")
from unstructured.partition.pdf import partition_pdf

print("Initiate PDF Processing...")
chunk = partition_pdf(
    filename="Frontend_enhacements.pdf",
    infer_table_structure=True,
    strategy="hi_res",
    extract_image_block_types = ["Image, Table"],
    extract_image_block_to_payload = True
)

print("PDF Content:")
for element in chunk:
    print(element)

