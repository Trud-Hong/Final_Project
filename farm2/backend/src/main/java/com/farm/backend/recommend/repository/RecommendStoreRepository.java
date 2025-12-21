package com.farm.backend.recommend.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.farm.backend.recommend.entity.RecommendStore;

public interface RecommendStoreRepository extends MongoRepository<RecommendStore, String> {
}
