package com.farm.backend.repository;

import com.farm.backend.domain.Seller;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SellerRepository extends MongoRepository<Seller, String> {

  void deleteByUserId(String userId);

  Seller findByUserId(String userId);
}
