package com.farm.backend.repository;

import com.farm.backend.domain.Contact;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactRepository extends MongoRepository<Contact, String> {
    
    // 사용자 ID로 문의 목록 조회
    List<Contact> findByUserId(String userId, org.springframework.data.domain.Sort sort);
    
    // 상태로 문의 목록 조회
    List<Contact> findByStatus(String status);
    
    // 사용자 ID와 상태로 문의 목록 조회
    List<Contact> findByUserIdAndStatus(String userId, String status); 

    // 카테고리로 문의 목록 조회
    List<Contact> findByCategory(String category); 
    
    // 관리자 ID로 답변 목록 조회
    List<Contact> findByAdminId(String adminId);
}

