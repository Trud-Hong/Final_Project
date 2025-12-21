package com.farm.backend.product.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.farm.backend.product.entity.SeasonInfo;

public interface SeasonInfoRepository extends MongoRepository<SeasonInfo, String> {
}
