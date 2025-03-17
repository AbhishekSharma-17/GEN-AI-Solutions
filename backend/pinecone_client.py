from langchain_openai import OpenAIEmbeddings
from pinecone.grpc import PineconeGRPC as Pinecone
from langchain_pinecone import PineconeVectorStore
import os 
from dotenv import load_dotenv 

load_dotenv() 


class PineconeClient:
    def __init__(self):
        self.pinecone_api_key = os.getenv("PINECONE_API_KEY")
        self.pinecone = Pinecone(api_key=self.pinecone_api_key)

    def DeleteIndexNameSpace(self, index_name, namespace, meta_key, meta_value):
        index = self.pinecone.Index(index_name)
        # Use the correct method to delete vectors by metadata
        print(
            "==============================DELETIONS ARE HAPPENING================================"
        )
        query_filter = {meta_key: meta_value}

        delete_flag = True

        while delete_flag:
            ids_to_delete = []
            vectors_to_delete = index.query(
                vector=[0] * 1536,
                namespace=namespace,
                filter=query_filter,
                top_k=10000,
                include_metadata=False,
                include_values=False,
            )

            # Extract the IDs to delete
            ids_to_delete = [match["id"] for match in vectors_to_delete["matches"]]
            if len(ids_to_delete) == 0:
                delete_flag = False

            if ids_to_delete:
                # Delete the vectors by IDs
                index.delete(namespace=namespace, ids=ids_to_delete)

    
    def CreateIndexNameSpaceForUniversalSearch(
        self,
        index_name=None,
        input_data=None,
        namespace=None,
        namespace_ids=None,
        replace=False,
        meta_key=None,
        user_id=None, 
        platform_specific_id = "confluence_file_id"
    ):
    
        vectorstore = PineconeVectorStore(
            index_name=index_name,
            embedding=OpenAIEmbeddings(
            openai_api_key=os.getenv("OPEN_AI_KEY"),
            model="text-embedding-3-small",
        ),
            namespace=namespace,
            pinecone_api_key=os.getenv("PINECONE_KEY")
        )
        if replace:
            self.DeleteIndexNameSpace(index_name, namespace, meta_key, user_id)

        metadatas = [{meta_key: ns_id, "user_id": user_id, platform_specific_id: ns_id.split("_")[0] } for ns_id in namespace_ids]
            
        vectorstore.add_texts(texts=input_data, metadatas=metadatas, async_req=False)

        return vectorstore

    
    def RetrieveIndexNameSpaceForUniversalSearch(
        self, index_name=None, namespace=None, user_id=None, k=3
    ):
        vectorstore = PineconeVectorStore(
            index_name=index_name,
            embedding=OpenAIEmbeddings(
            openai_api_key=os.getenv("OPEN_AI_KEY"),
            model="text-embedding-3-small",
        ),
            namespace=namespace,
            pinecone_api_key=os.getenv("PINECONE_API_KEY")
        )
        retriever = vectorstore.as_retriever(
            search_type="similarity_score_threshold",
            search_kwargs={
                "score_threshold": 0.5,
                "k": k,
                "filter": {"user_id": user_id},
            },
        )

        return retriever

    
   