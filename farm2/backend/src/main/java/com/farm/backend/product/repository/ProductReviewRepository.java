package com.farm.backend.product.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.farm.backend.product.entity.ProductReview;

public interface ProductReviewRepository extends MongoRepository<ProductReview, String> {
    List<ProductReview> findByProductId(String productId);
}
