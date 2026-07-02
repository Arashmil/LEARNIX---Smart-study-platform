package com.learnix.controller;

import com.learnix.service.SubjectService;
import com.learnix.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/study-time")
@CrossOrigin(origins = "*")
public class StudyTimeController {

    @Autowired
    private UserService userService;

    @Autowired
    private SubjectService subjectService;

    @PostMapping("/user/{userId}")
    public ResponseEntity<?> updateUserStudyTime(@PathVariable Long userId, @RequestBody Map<String, Long> payload) {
        Long duration = payload.get("duration");
        if (duration != null) {
            userService.updateStudyTime(userId, duration);
            return ResponseEntity.ok().body(Map.of("message", "User study time updated"));
        }
        return ResponseEntity.badRequest().body("Duration not provided");
    }

    @PostMapping("/subject/{subjectId}")
    public ResponseEntity<?> updateSubjectStudyTime(@PathVariable Long subjectId, @RequestBody Map<String, Long> payload) {
        Long duration = payload.get("duration");
        if (duration != null) {
            subjectService.updateStudyTime(subjectId, duration);
            return ResponseEntity.ok().body(Map.of("message", "Subject study time updated"));
        }
        return ResponseEntity.badRequest().body("Duration not provided");
    }
}
