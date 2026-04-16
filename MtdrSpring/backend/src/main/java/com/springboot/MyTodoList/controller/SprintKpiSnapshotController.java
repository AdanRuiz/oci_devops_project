package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.dto.DeveloperStatDto;
import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.SprintKpiSnapshot;
import com.springboot.MyTodoList.service.SprintKpiSnapshotService;
import com.springboot.MyTodoList.service.SprintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/sprints/{sprintId}/kpi")
public class SprintKpiSnapshotController {

    @Autowired
    private SprintKpiSnapshotService sprintKpiSnapshotService;

    @Autowired
    private SprintService sprintService;

    @GetMapping
    public ResponseEntity<SprintKpiSnapshot> getKpi(@PathVariable UUID sprintId) {
        return sprintKpiSnapshotService.findBySprintId(sprintId)
            .map(kpi -> new ResponseEntity<>(kpi, HttpStatus.OK))
            .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PostMapping("/compute")
    public ResponseEntity<SprintKpiSnapshot> computeKpi(@PathVariable UUID sprintId) {
        Sprint sprint = sprintService.findById(sprintId).orElse(null);
        if (sprint == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        SprintKpiSnapshot snapshot = sprintKpiSnapshotService.compute(sprint);
        return new ResponseEntity<>(snapshot, HttpStatus.OK);
    }

    @GetMapping("/developer-stats")
    public ResponseEntity<List<DeveloperStatDto>> getDeveloperStats(@PathVariable UUID sprintId) {
        return ResponseEntity.ok(sprintKpiSnapshotService.getDeveloperStats(sprintId));
    }
}
