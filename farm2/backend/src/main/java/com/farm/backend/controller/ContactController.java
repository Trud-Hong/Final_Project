package com.farm.backend.controller;

import com.farm.backend.domain.Contact;
import com.farm.backend.service.ContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/contact")
public class ContactController {
    
    @Autowired
    private ContactService contactService;
    
    // 모든 문의 조회 (관리자용)
    @GetMapping
    public ResponseEntity<List<Contact>> getAllContacts() {
        List<Contact> contacts = contactService.getAllContacts();
        return ResponseEntity.ok(contacts);
    }
    
    // 문의 저장 (사용자용)
    @PostMapping("/save")
    public ResponseEntity<Contact> saveContact(@RequestBody Map<String, Object> requestData) {
        Contact contact = new Contact();
        contact.setUserId((String) requestData.getOrDefault("userId", "guest"));
        contact.setCategory((String) requestData.getOrDefault("category", "주문 문의"));
        contact.setTitle((String) requestData.getOrDefault("title", ""));
        contact.setContent((String) requestData.get("content"));
        contact.setStatus((String) requestData.getOrDefault("status", "문의 완료"));
        
        Contact savedContact = contactService.createContact(contact);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedContact);
    }
    
    // id별 문의 목록 조회
    @GetMapping("/inquire/{id}")
    public ResponseEntity<Contact> getContactById(@PathVariable String id) {
        Optional<Contact> contact = contactService.getContactById(id);
        if (contact.isPresent()) {
            return ResponseEntity.ok(contact.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // 사용자별 문의 목록 조회
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Contact>> getContactsByUserId(@PathVariable String userId) {
        List<Contact> contacts = contactService.getContactsByUserId(userId);
        return ResponseEntity.ok(contacts);
    }

    // 상태별 문의 조회 (쿼리 파라미터 사용)
    @GetMapping("/status")
    public ResponseEntity<List<Contact>> getContactsByStatus(@RequestParam String status) {
        // 공백 제거 및 정규화 (URL 디코딩 후 공백 처리)
        String normalizedStatus = status != null ? status.trim() : "";
        List<Contact> contacts = contactService.getContactsByStatus(normalizedStatus);
        return ResponseEntity.ok(contacts);
    }
    
    // 관리자 답변 등록
    @PostMapping("/reply/{id}")
    public ResponseEntity<Contact> replyContact(
            @PathVariable String id,
            @RequestParam String adminId,
            @RequestParam String replyContent) {
        try {
            Contact repliedContact = contactService.replyContact(id, adminId, replyContent);
            return ResponseEntity.ok(repliedContact);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // 문의 수정
    @PutMapping("/updateInquire")
    public ResponseEntity<Contact> updateInquire(@RequestBody Map<String, Object> requestData) {
        try {
            String id = (String) requestData.get("id");
            if (id == null) {
                return ResponseEntity.badRequest().build();
            }
            
            Contact updatedContact = new Contact();
            updatedContact.setTitle((String) requestData.get("title"));
            updatedContact.setCategory((String) requestData.get("category"));
            updatedContact.setContent((String) requestData.get("content"));
            
            Contact result = contactService.updateContact(id, updatedContact);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // 문의 삭제
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteContact(@PathVariable String id) {
        boolean deleted = contactService.deleteContact(id);
        return deleted ? ResponseEntity.noContent().build() 
                      : ResponseEntity.notFound().build();
    }
}

