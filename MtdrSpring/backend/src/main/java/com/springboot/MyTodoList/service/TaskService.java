package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.dto.TaskRequestDTO;
import com.springboot.MyTodoList.dto.TaskResponseDTO;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.TaskGroup;
import com.springboot.MyTodoList.model.TaskPriority;
import com.springboot.MyTodoList.model.TaskStatus;
import com.springboot.MyTodoList.model.TodoList;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.TaskGroupRepository;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.repository.TodoListRepository;
import com.springboot.MyTodoList.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final TodoListRepository todoListRepository;
    private final TaskGroupRepository taskGroupRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository,
                       TodoListRepository todoListRepository,
                       TaskGroupRepository taskGroupRepository,
                       UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.todoListRepository = todoListRepository;
        this.taskGroupRepository = taskGroupRepository;
        this.userRepository = userRepository;
    }

    public TaskResponseDTO createTask(TaskRequestDTO dto) {
        TodoList todoList = todoListRepository.findById(dto.getListId())
                .orElseThrow(() -> new RuntimeException("TodoList not found"));

        User createdBy = null;
        if (dto.getCreatedById() != null) {
            createdBy = userRepository.findById(dto.getCreatedById())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }

        Task task = new Task();
        task.setTodoList(todoList);
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());

        if (dto.getStatus() != null) {
            task.setStatus(TaskStatus.valueOf(dto.getStatus()));
        }

        if (dto.getPriority() != null) {
            task.setPriority(TaskPriority.valueOf(dto.getPriority()));
        }

        task.setDueDate(dto.getDueDate());
        task.setCreatedBy(createdBy);

        Task savedTask = taskRepository.save(task);
        return mapToResponseDTO(savedTask);
    }

    public List<TaskResponseDTO> getAllTasks() {
        return taskRepository.findAll()
                .stream()
            .sorted(Comparator
                .comparing((Task task) -> task.getTodoList() != null && task.getTodoList().getGroup() != null
                    ? task.getTodoList().getGroup().getName()
                    : "")
                .thenComparing(Task::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public TaskResponseDTO getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        return mapToResponseDTO(task);
    }

    public TaskResponseDTO updateTask(Long taskId, TaskRequestDTO dto) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (dto.getTitle() != null) {
            task.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            task.setDescription(dto.getDescription());
        }
        if (dto.getStatus() != null) {
            task.setStatus(TaskStatus.valueOf(dto.getStatus()));
        }
        if (dto.getPriority() != null) {
            task.setPriority(TaskPriority.valueOf(dto.getPriority()));
        }
        if (dto.getDueDate() != null) {
            task.setDueDate(dto.getDueDate());
        }

        return mapToResponseDTO(taskRepository.save(task));
    }

    public TaskResponseDTO updateTaskStatus(Long taskId, TaskStatus status) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setStatus(status);
        return mapToResponseDTO(taskRepository.save(task));
    }

    public void deleteTask(Long taskId) {
        taskRepository.deleteById(taskId);
    }

    public List<Task> getTasksByGroupId(Long groupId) {
        return taskRepository.findByTodoListGroupId(groupId);
    }

    public TaskResponseDTO createTaskInGroup(Long groupId, String title) {
        TaskGroup group = taskGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("TaskGroup not found"));

        TodoList targetList = todoListRepository.findByGroupId(groupId).stream().findFirst().orElseGet(() -> {
            TodoList createdList = new TodoList();
            createdList.setGroup(group);
            createdList.setName("General");
            createdList.setCreatedBy(group.getCreatedBy());
            return todoListRepository.save(createdList);
        });

        Task task = new Task();
        task.setTodoList(targetList);
        task.setTitle(title);
        task.setDescription(title);
        task.setStatus(TaskStatus.pending);
        task.setPriority(TaskPriority.medium);
        task.setCreatedBy(group.getCreatedBy());

        return mapToResponseDTO(taskRepository.save(task));
    }

    private TaskResponseDTO mapToResponseDTO(Task task) {
        String assigneeName = task.getCreatedBy() != null ? task.getCreatedBy().getName() : null;
        String todoListName = task.getTodoList() != null ? task.getTodoList().getName() : null;
        String groupName = null;

        if (task.getTodoList() != null && task.getTodoList().getGroup() != null) {
            groupName = task.getTodoList().getGroup().getName();
        }

        return new TaskResponseDTO(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus() != null ? task.getStatus().name() : null,
                task.getPriority() != null ? task.getPriority().name() : null,
                task.getCreatedAt(),
                groupName,
                todoListName,
                assigneeName
        );
    }
}