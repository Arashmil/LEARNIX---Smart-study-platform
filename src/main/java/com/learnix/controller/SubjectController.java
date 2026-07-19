package com.learnix.controller;

import com.learnix.dto.SubjectDto;
import com.learnix.model.Subject;
import com.learnix.service.SubjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@CrossOrigin(origins = "*")
public class SubjectController {

    @Autowired
    private SubjectService subjectService;

    @PostMapping("/user/{userId}")
    public ResponseEntity<SubjectDto> addSubject(@PathVariable Long userId, @RequestBody Subject subject) {
        SubjectDto createdSubject = subjectService.addSubject(userId, subject);
        return ResponseEntity.ok(createdSubject);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SubjectDto>> getSubjectsByUser(@PathVariable Long userId) {
        List<SubjectDto> subjects = subjectService.getSubjectsByUser(userId);
        return ResponseEntity.ok(subjects);
    }

    @DeleteMapping("/{subjectId}")
    public ResponseEntity<Void> deleteSubject(@PathVariable Long subjectId) {
        subjectService.deleteSubject(subjectId);
        return ResponseEntity.noContent().build();
    }
}
