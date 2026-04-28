package com.springboot.MyTodoList.service.rag;

import com.springboot.MyTodoList.repository.VectorStoreRepository;
import com.springboot.MyTodoList.service.embedding.OCIEmbeddingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RAGRetrievalService {

    private final OCIEmbeddingService embeddings;
    private final VectorStoreRepository store;

    @Autowired
    public RAGRetrievalService(OCIEmbeddingService embeddings, VectorStoreRepository store) {
        this.embeddings = embeddings;
        this.store = store;
    }

    public List<RetrievedDoc> retrieve(String question, int k) {
        float[] qvec = embeddings.embed(question);
        return store.searchTopK(qvec, k);
    }
}
