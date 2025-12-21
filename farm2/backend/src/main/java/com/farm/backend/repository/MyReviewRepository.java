package com.farm.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.farm.backend.product.entity.ProductReview;

public interface MyReviewRepository extends MongoRepository<ProductReview, String> {

    List<ProductReview> findByUserIdOrderByCreatedAtDesc(String userId);
}
