package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.dto.DeveloperSummaryDto;
import com.springboot.MyTodoList.service.DeveloperService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/developers")
public class DeveloperController {
    private final DeveloperService developerService;

    public DeveloperController(DeveloperService developerService) {
        this.developerService = developerService;
    }

    @GetMapping
    public List<DeveloperSummaryDto> getDeveloperSummaries() {
        return developerService.getDeveloperSummaries();
    }
}
