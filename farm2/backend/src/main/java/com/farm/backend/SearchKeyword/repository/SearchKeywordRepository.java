package com.farm.backend.SearchKeyword.repository;

import com.farm.backend.SearchKeyword.entity.SearchKeyword;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 검색어 Repository
 * MongoDB와의 데이터 통신을 담당
 */
@Repository
public interface SearchKeywordRepository extends MongoRepository<SearchKeyword, String> {
    
    /**
     * 검색어로 문서 찾기
     * @param keyword 검색어
     * @return 검색어 문서 (Optional)
     */
    Optional<SearchKeyword> findByKeyword(String keyword);
    
    /**
     * 검색 횟수 기준 내림차순으로 상위 N개 조회 (인기검색어)
     * @return 인기검색어 목록
     */
    List<SearchKeyword> findTop10ByOrderByCountDesc();
    
    /**
     * 마지막 검색 시간 기준 내림차순으로 상위 N개 조회 (최근 검색어)
     * @return 최근 검색어 목록
     */
    List<SearchKeyword> findTop10ByOrderByLastSearchedAtDesc();
    
    /**
     * 검색어 존재 여부 확인
     * @param keyword 검색어
     * @return 존재 여부
     */
    boolean existsByKeyword(String keyword);
}