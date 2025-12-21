package com.farm.backend.repository;

import com.farm.backend.domain.Like;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface LikeRepository extends MongoRepository<Like, String> {

    // 특정 게시글에 대한 좋아요 여부 조회
    //Like findByPostId(String postId);

    // 게시글의 좋아요 모두 삭제 (옵션)
    //void deleteByPostId(String postId);
    void deleteByPostId(String postId); 
    boolean existsByPostIdAndUserId(String postId, String userId);
    
    void deleteByPostIdAndUserId(String postId, String userId);

    long countByPostId(String postId);

    void deleteByUserId(String userId);

}
