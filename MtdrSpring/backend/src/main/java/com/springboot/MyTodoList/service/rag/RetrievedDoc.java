package com.springboot.MyTodoList.service.rag;

public final class RetrievedDoc {
    private final String sourceType;
    private final long sourceId;
    private final String content;
    private final double score;

    public RetrievedDoc(String sourceType, long sourceId, String content, double score) {
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.content = content;
        this.score = score;
    }

    public String getSourceType() { return sourceType; }
    public long getSourceId() { return sourceId; }
    public String getContent() { return content; }
    public double getScore() { return score; }
}
