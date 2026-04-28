package com.springboot.MyTodoList.service.rag.source;

public final class DocumentRow {
    private final String sourceType;
    private final long sourceId;
    private final String content;

    public DocumentRow(String sourceType, long sourceId, String content) {
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.content = content;
    }

    public String getSourceType() { return sourceType; }
    public long getSourceId() { return sourceId; }
    public String getContent() { return content; }
}
