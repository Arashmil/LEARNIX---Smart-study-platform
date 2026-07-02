package com.learnix.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class TaskDto {
    private Long id;
    private String title;
    private LocalDate deadline;
    private String priority;
    private String status;
    private SubjectDto subject;
}
