package com.farm.backend.repository;

import com.farm.backend.domain.MileageTransaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MileageTransactionRepository extends MongoRepository<MileageTransaction, String> {
    List<MileageTransaction> findByUserIdOrderByCreatedAtDesc(String userId);
    List<MileageTransaction> findByOrderId(String orderId);
}

