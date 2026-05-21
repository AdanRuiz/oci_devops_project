package com.springboot.MyTodoList.agent;

import java.time.LocalDate;

public class SprintInfo {

    private final String name;
    private final LocalDate startDate;
    private final LocalDate endDate;

    /** Create sprint information with name, start and end dates. */
    public SprintInfo(String name, LocalDate startDate, LocalDate endDate) {
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    /** Return the sprint name. */
    public String getName() {
        return name;
    }

    /** Return the sprint start date. */
    public LocalDate getStartDate() {
        return startDate;
    }

    /** Return the sprint end date. */
    public LocalDate getEndDate() {
        return endDate;
    }
}
