package com.springboot.MyTodoList.service.rag.source;

import java.util.List;

public interface SourceReader {
    String sourceType();
    List<DocumentRow> readAll();
}
