package com.learnix.dto;

import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String grade;
    private String status;
    private Long totalStudyTime;
}
