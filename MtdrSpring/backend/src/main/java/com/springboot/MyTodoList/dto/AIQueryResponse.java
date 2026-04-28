package com.springboot.MyTodoList.dto;

import java.util.List;

public class AIQueryResponse {

    public static class Source {
        private String sourceType;
        private long sourceId;
        private double score;

        public Source() {}
        public Source(String sourceType, long sourceId, double score) {
            this.sourceType = sourceType;
            this.sourceId = sourceId;
            this.score = score;
        }
        public String getSourceType() { return sourceType; }
        public void setSourceType(String sourceType) { this.sourceType = sourceType; }
        public long getSourceId() { return sourceId; }
        public void setSourceId(long sourceId) { this.sourceId = sourceId; }
        public double getScore() { return score; }
        public void setScore(double score) { this.score = score; }
    }

    private String answer;
    private List<Source> sources;

    public AIQueryResponse() {}
    public AIQueryResponse(String answer, List<Source> sources) {
        this.answer = answer;
        this.sources = sources;
    }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    public List<Source> getSources() { return sources; }
    public void setSources(List<Source> sources) { this.sources = sources; }
}
