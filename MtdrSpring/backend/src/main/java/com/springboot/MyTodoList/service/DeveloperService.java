package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.dto.DeveloperSummaryDto;
import com.springboot.MyTodoList.repository.DeveloperRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DeveloperService {
    private final DeveloperRepository developerRepository;

    public DeveloperService(DeveloperRepository developerRepository) {
        this.developerRepository = developerRepository;
    }

    public List<DeveloperSummaryDto> getDeveloperSummaries() {
        return developerRepository.findDeveloperSummaries()
                .stream()
                .map(row -> new DeveloperSummaryDto(row.getDeveloperId(), row.getFullName()))
                .collect(Collectors.toList());
    }
}
