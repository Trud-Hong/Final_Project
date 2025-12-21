package com.farm.backend.repository;

import com.farm.backend.domain.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CommentRepository extends MongoRepository<Comment, String> {
    void deleteByPostId(String postId);
    List<Comment> findByPostIdOrderByCreatedAtDesc(String postId);

    
    void deleteByUserId(String userId);

}
