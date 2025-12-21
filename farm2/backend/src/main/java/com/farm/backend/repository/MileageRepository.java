package com.farm.backend.repository;

import com.farm.backend.domain.Mileage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MileageRepository extends MongoRepository<Mileage, String> {
    Optional<Mileage> findByUserId(String userId);
}

