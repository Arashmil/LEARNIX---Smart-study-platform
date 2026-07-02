package com.learnix.dto;

import lombok.Data;

@Data
public class SubjectDto {
    private Long id;
    private String name;
    private Long userId;
    private Long studyTime;
}
