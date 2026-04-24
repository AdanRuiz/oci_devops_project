package com.springboot.MyTodoList.dto;

import java.math.BigDecimal;

public class DeveloperStatDto {

    private String email;
    private int totalAssigned;
    private int tasksCompleted;
    private BigDecimal totalHoursWorked;

    public DeveloperStatDto(String email, int totalAssigned, int tasksCompleted, BigDecimal totalHoursWorked) {
        this.email = email;
        this.totalAssigned = totalAssigned;
        this.tasksCompleted = tasksCompleted;
        this.totalHoursWorked = totalHoursWorked;
    }

    public String getEmail() { return email; }
    public int getTotalAssigned() { return totalAssigned; }
    public int getTasksCompleted() { return tasksCompleted; }
    public BigDecimal getTotalHoursWorked() { return totalHoursWorked; }
}
