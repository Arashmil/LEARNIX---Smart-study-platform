package com.learnix.service;

import com.learnix.dto.SubjectDto;
import com.learnix.exception.ResourceNotFoundException;
import com.learnix.model.Subject;
import com.learnix.model.User;
import com.learnix.repository.SubjectRepository;
import com.learnix.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubjectService {
    @Autowired
    private SubjectRepository subjectRepository;
    
    @Autowired
    private UserRepository userRepository;

    public SubjectDto addSubject(Long userId, Subject subject) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        subject.setUser(user);
        Subject savedSubject = subjectRepository.save(subject);
        return mapToDto(savedSubject);
    }

    public List<SubjectDto> getSubjectsByUser(Long userId) {
        return subjectRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public void updateStudyTime(Long subjectId, Long additionalTime) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
        subject.setStudyTime(subject.getStudyTime() + additionalTime);
        subjectRepository.save(subject);
    }

    private SubjectDto mapToDto(Subject subject) {
        SubjectDto dto = new SubjectDto();
        dto.setId(subject.getId());
        dto.setName(subject.getName());
        dto.setUserId(subject.getUser().getId());
        dto.setStudyTime(subject.getStudyTime());
        return dto;
    }
}
