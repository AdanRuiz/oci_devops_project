package com.springboot.MyTodoList.service.rag;

public final class EmbeddingEntry {
    private final String sourceType;
    private final long sourceId;
    private final String content;
    private final float[] embedding;
    private final double norm;

    public EmbeddingEntry(String sourceType, long sourceId, String content, float[] embedding) {
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.content = content;
        this.embedding = embedding;
        this.norm = VectorMath.norm(embedding);
    }

    public String getSourceType() { return sourceType; }
    public long getSourceId() { return sourceId; }
    public String getContent() { return content; }
    public float[] getEmbedding() { return embedding; }
    public double getNorm() { return norm; }

    public String key() { return sourceType + ":" + sourceId; }
}
