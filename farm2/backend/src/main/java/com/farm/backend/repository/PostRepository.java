package com.farm.backend.repository;

import com.farm.backend.domain.Post;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PostRepository extends MongoRepository<Post, String> {

    List<Post> findAllByOrderByCreatedAtDesc();

    List<Post> findTop3ByOrderByCreatedAtDesc();

    List<Post> findByUserIdOrderByCreatedAtDesc(String userId);

    void deleteByUserId(String userId);


}
