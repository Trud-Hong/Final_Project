package com.farm.backend.repository;

import com.farm.backend.domain.WithdrawRequest;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface WithdrawRequestRepository extends MongoRepository<WithdrawRequest, String> {
    List<WithdrawRequest> findByUserIdOrderByRequestedAtDesc(String userId);
    List<WithdrawRequest> findByStatusOrderByRequestedAtDesc(String status);
    List<WithdrawRequest> findAllByOrderByRequestedAtDesc();
}

