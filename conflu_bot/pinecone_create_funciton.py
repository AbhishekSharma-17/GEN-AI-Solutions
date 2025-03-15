def CreateIndexNameSpaceForUniversalSearch(
        self,
        index_name=None,
        input_data=None,
        namespace=None,
        namespace_ids=None,
        replace=False,
        meta_key=None,
        user_id=None
    ):
    
        vectorstore = PineconeVectorStore(
            index_name=index_name,
            embedding=PortKeyClient().Embeddings(use_openai=True),
            namespace=namespace,
            pinecone_api_key=settings.PINECONE_API_KEY,
        )
        if replace:
            self.DeleteIndexNameSpace(index_name, namespace, meta_key, namespace_ids[0])

        metadatas = [{meta_key: ns_id, "user_id": user_id, "confluence_file_id": ns_id.split("_")[0] } for ns_id in namespace_ids]
            
        vectorstore.add_texts(texts=input_data, metadatas=metadatas, async_req=False)

        return vectorstore