package com.springboot.MyTodoList.dto;

public class DeveloperSummaryDto {
    private Integer developerId;
    private String fullName;

    public DeveloperSummaryDto(Integer developerId, String fullName) {
        this.developerId = developerId;
        this.fullName = fullName;
    }

    public Integer getDeveloperId() {
        return developerId;
    }

    public void setDeveloperId(Integer developerId) {
        this.developerId = developerId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
}
