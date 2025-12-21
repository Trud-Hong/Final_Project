package com.farm.backend.product.repository;

import com.farm.backend.product.entity.ProductQnA;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductQnaRepository extends MongoRepository<ProductQnA, String> {

    
    @Query(value = "{ productId: ?0, $or: [ { answer: null }, { answer: '' }, { answer: { $exists: false } } ] }", count = true)
    long countUnansweredByProduct(String productId);

    
    @Query(value = "{ sellerId: ?0, $or: [ { answer: null }, { answer: '' }, { answer: { $exists: false } } ] }", count = true)
    long countUnansweredBySeller(String sellerId);

    
    List<ProductQnA> findByProductId(String productId, Sort sort);
    
    Optional<ProductQnA> findById(String id);

    List<ProductQnA> findBySellerId(String sellerId);

    List<ProductQnA> findByUserId(String id); // 혜정 12/4추가    
}
