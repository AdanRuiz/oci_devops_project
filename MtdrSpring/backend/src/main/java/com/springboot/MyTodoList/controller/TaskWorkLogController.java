package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.TaskWorkLog;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.service.TaskWorkLogService;
import com.springboot.MyTodoList.service.ToDoItemService;
import com.springboot.MyTodoList.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/tasks/{taskId}/work-logs")
public class TaskWorkLogController {

    @Autowired
    private TaskWorkLogService taskWorkLogService;

    @Autowired
    private ToDoItemService toDoItemService;

    @Autowired
    private UserService userService;

    @GetMapping
    public List<TaskWorkLog> getWorkLogs(@PathVariable UUID taskId) {
        return taskWorkLogService.findByTaskId(taskId);
    }

    @PostMapping
    public ResponseEntity<TaskWorkLog> addWorkLog(@PathVariable UUID taskId,
                                                   @RequestBody Map<String, Object> body,
                                                   @AuthenticationPrincipal Jwt jwt) {
        Task task = toDoItemService.getToDoItemById(taskId);
        if (task == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);

        String ociIamId = jwt.getSubject();
        String email    = jwt.getClaimAsString("email");
        if (email == null) email = ociIamId.contains("@") ? ociIamId : ociIamId + "@unknown";
        User user = userService.findOrProvision(ociIamId, email);

        TaskWorkLog workLog = new TaskWorkLog();
        workLog.setTask(task);
        workLog.setUser(user);
        workLog.setWorkDate(LocalDate.now());
        Object hw = body.get("hoursWorked");
        workLog.setHoursWorked(hw instanceof Number
            ? BigDecimal.valueOf(((Number) hw).doubleValue())
            : new BigDecimal(hw.toString()));
        if (body.get("note") != null) workLog.setNote((String) body.get("note"));

        TaskWorkLog saved = taskWorkLogService.save(workLog);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Boolean> deleteWorkLog(@PathVariable UUID taskId,
                                                  @PathVariable UUID id) {
        boolean deleted = taskWorkLogService.delete(id);
        return new ResponseEntity<>(deleted, deleted ? HttpStatus.OK : HttpStatus.NOT_FOUND);
    }
}
