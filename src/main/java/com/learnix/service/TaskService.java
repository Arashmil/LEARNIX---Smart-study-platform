package com.learnix.service;

import com.learnix.dto.SubjectDto;
import com.learnix.dto.TaskDto;
import com.learnix.exception.ResourceNotFoundException;
import com.learnix.model.Subject;
import com.learnix.model.Task;
import com.learnix.repository.SubjectRepository;
import com.learnix.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {
    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    public TaskDto addTask(Long subjectId, Task task) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
                
        task.setSubject(subject);
        task.setStatus("PENDING");
        Task savedTask = taskRepository.save(task);
        return mapToDto(savedTask);
    }

    public List<TaskDto> getTasksBySubject(Long subjectId) {
        return taskRepository.findBySubjectId(subjectId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<TaskDto> getTasksByUser(Long userId) {
        return taskRepository.findBySubjectUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public TaskDto markComplete(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
                
        task.setStatus("COMPLETED");
        Task savedTask = taskRepository.save(task);
        return mapToDto(savedTask);
    }

    public void deleteTask(Long taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new ResourceNotFoundException("Task not found");
        }
        taskRepository.deleteById(taskId);
    }

    private TaskDto mapToDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDeadline(task.getDeadline());
        dto.setPriority(task.getPriority());
        dto.setStatus(task.getStatus());
        
        SubjectDto subjectDto = new SubjectDto();
        subjectDto.setId(task.getSubject().getId());
        subjectDto.setName(task.getSubject().getName());
        subjectDto.setUserId(task.getSubject().getUser().getId());
        subjectDto.setStudyTime(task.getSubject().getStudyTime());
        dto.setSubject(subjectDto);
        
        return dto;
    }
}
