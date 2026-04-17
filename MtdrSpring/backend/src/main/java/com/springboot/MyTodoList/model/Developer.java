package com.springboot.MyTodoList.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "DEVELOPER")
public class Developer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DEVELOPERID")
    private Integer developerID;

    @Column(name = "USERID", nullable = false)
    private Integer userID;

    @Column(name = "MANAGERID", nullable = false)
    private Integer managerID;

    @Column(name = "TEAMID", nullable = false)
    private Integer teamID;

    public Integer getDeveloperID() {
        return developerID;
    }

    public void setDeveloperID(Integer developerID) {
        this.developerID = developerID;
    }

    public Integer getUserID() {
        return userID;
    }

    public void setUserID(Integer userID) {
        this.userID = userID;
    }

    public Integer getManagerID() {
        return managerID;
    }

    public void setManagerID(Integer managerID) {
        this.managerID = managerID;
    }

    public Integer getTeamID() {
        return teamID;
    }

    public void setTeamID(Integer teamID) {
        this.teamID = teamID;
    }
}
