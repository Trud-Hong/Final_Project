package com.farm.backend.repository;

import com.farm.backend.domain.Wishlist;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface WishlistRepository extends MongoRepository<Wishlist, String> {
    List<Wishlist> findByUserId(String userId);
    void deleteByUserIdAndProductId(String userId, String productId);
    boolean existsByUserIdAndProductId(String userId, String productId);
    
}
