package com.farm.backend.SearchKeyword.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * 검색어 정보를 저장하는 MongoDB Document 클래스
 */
@Data // getter, setter, toString 등 자동 생성
@NoArgsConstructor // 파라미터가 없는 기본 생성자
@AllArgsConstructor // 모든 필드를 파라미터로 받는 생성자
@Document(collection = "search_keywords") // MongoDB 컬렉션 이름 지정
public class SearchKeyword {
    
    /**
     * MongoDB의 고유 ID (_id 필드)
     */
    @Id
    private String id;
    
    /**
     * 검색어 (중복 불가, 인덱스 설정)
     */
    @Indexed(unique = true) // 유니크 인덱스 생성 (중복 방지)
    private String keyword;
    
    /**
     * 검색 횟수
     */
    @Indexed // 인덱스 생성 (인기검색어 조회 성능 향상)
    private Integer count;
    
    /**
     * 마지막 검색 시간
     */
    @Indexed // 인덱스 생성 (최근 검색어 조회 성능 향상)
    private LocalDateTime lastSearchedAt;
    
    /**
     * 생성 시간
     */
    private LocalDateTime createdAt;
    
    /**
     * 수정 시간
     */
    private LocalDateTime updatedAt;
    
    /**
     * 새로운 검색어 생성 시 초기값 설정을 위한 생성자
     */
    public SearchKeyword(String keyword) {
        this.keyword = keyword;
        this.count = 1;
        this.lastSearchedAt = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * 검색 횟수 증가 메서드
     */
    public void incrementCount() {
        this.count++;
        this.lastSearchedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}