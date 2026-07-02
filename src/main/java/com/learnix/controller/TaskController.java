package com.learnix.controller;

import com.learnix.dto.TaskDto;
import com.learnix.model.Task;
import com.learnix.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @PostMapping("/subject/{subjectId}")
    public ResponseEntity<TaskDto> addTask(@PathVariable Long subjectId, @RequestBody Task task) {
        TaskDto createdTask = taskService.addTask(subjectId, task);
        return ResponseEntity.ok(createdTask);
    }

    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<List<TaskDto>> getTasksBySubject(@PathVariable Long subjectId) {
        List<TaskDto> tasks = taskService.getTasksBySubject(subjectId);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TaskDto>> getTasksByUser(@PathVariable Long userId) {
        List<TaskDto> tasks = taskService.getTasksByUser(userId);
        return ResponseEntity.ok(tasks);
    }

    @PutMapping("/{taskId}/complete")
    public ResponseEntity<TaskDto> markTaskComplete(@PathVariable Long taskId) {
        TaskDto completedTask = taskService.markComplete(taskId);
        return ResponseEntity.ok(completedTask);
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }
}
