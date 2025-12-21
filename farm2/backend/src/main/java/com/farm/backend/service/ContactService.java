package com.farm.backend.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.farm.backend.domain.Contact;
import com.farm.backend.repository.ContactRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepository contactRepository;

    // 문의 생성
    public Contact createContact(Contact contact) {
        // 생성 날짜 자동 설정
        if (contact.getCreatedAt() == null) {
            contact.setCreatedAt(LocalDateTime.now());
        }
        
        // 상태 기본값 설정
        if (contact.getStatus() == null || contact.getStatus().isEmpty()) {
            contact.setStatus("문의 완료");
        }
        
        return contactRepository.save(contact);
    }

    // 전체 문의 조회 (최신순)
    public List<Contact> getAllContacts() {
        return contactRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }
    
    // 이름으로 검색 (사용하지 않지만 호환성을 위해 유지)
    public List<Contact> searchContactsByName(String name) {
        // Contact 엔티티에 name 필드가 없으므로 빈 리스트 반환
        // 필요시 userId나 content로 검색하도록 수정 가능
        return Collections.emptyList();
    }

    // ID로 문의 조회
    public Optional<Contact> getContactById(String id) {
        return contactRepository.findById(id);
    }

    // 사용자별 문의 목록 조회
    public List<Contact> getContactsByUserId(String userId) {
        return contactRepository.findByUserId(userId, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    // 상태별 문의 목록 조회
    public List<Contact> getContactsByStatus(String status) {
        return contactRepository.findByStatus(status);
    }

    // 사용자별 특정 상태 문의 조회
    public List<Contact> getContactsByUserIdAndStatus(String userId, String status) {
        return contactRepository.findByUserIdAndStatus(userId, status);
    }

    // 카테고리별 문의 조회
    public List<Contact> getContactsByCategory(String category) {
        return contactRepository.findByCategory(category);
    }

    // 관리자별 답변 목록 조회
    public List<Contact> getContactsByAdminId(String adminId) {
        return contactRepository.findByAdminId(adminId);
    }

    // 문의 수정
    public Contact updateContact(String id, Contact updatedContact) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("문의를 찾을 수 없습니다: " + id));
        
        // 수정 가능한 필드 업데이트
        if (updatedContact.getTitle() != null) {
            contact.setTitle(updatedContact.getTitle());
        }
        if (updatedContact.getCategory() != null) {
            contact.setCategory(updatedContact.getCategory());
        }
        if (updatedContact.getContent() != null) {
            contact.setContent(updatedContact.getContent());
        }
        if (updatedContact.getStatus() != null) {
            contact.setStatus(updatedContact.getStatus());
        }
        
        return contactRepository.save(contact);
    }

    // 관리자 답변 처리
    public Contact replyContact(String id, String adminId, String replyContent) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("문의를 찾을 수 없습니다: " + id));
        
        // 답변 정보 설정
        contact.setAdminId(adminId);
        contact.setStatus("답변 완료");
        contact.setRepliedAt(LocalDateTime.now());
        contact.setReplyContent(replyContent);
        
        // 답변 내용이 있으면 replyContent에 추가
        if (replyContent != null && !replyContent.trim().isEmpty()) {
            String originalContent = contact.getReplyContent() != null ? contact.getReplyContent() : "";
            contact.setContent(contact.getContent());
            contact.setReplyContent(originalContent);
        }
        
        return contactRepository.save(contact);
    }

    // 문의 삭제
    public boolean deleteContact(String id) {
        if (!contactRepository.existsById(id)) {
            return false;
        }
        contactRepository.deleteById(id);
        return true;
    }
}

