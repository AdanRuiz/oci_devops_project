package com.springboot.MyTodoList.dto;

public class TaskStatusUpdateRequest {
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
