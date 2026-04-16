package com.springboot.MyTodoList.dto;

import java.math.BigDecimal;

public class DeveloperStatDto {

    private String email;
    private int totalAssigned;
    private int tasksCompleted;
    private BigDecimal totalDaysWorked;

    public DeveloperStatDto(String email, int totalAssigned, int tasksCompleted, BigDecimal totalDaysWorked) {
        this.email = email;
        this.totalAssigned = totalAssigned;
        this.tasksCompleted = tasksCompleted;
        this.totalDaysWorked = totalDaysWorked;
    }

    public String getEmail() { return email; }
    public int getTotalAssigned() { return totalAssigned; }
    public int getTasksCompleted() { return tasksCompleted; }
    public BigDecimal getTotalDaysWorked() { return totalDaysWorked; }
}
