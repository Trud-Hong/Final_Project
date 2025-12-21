package com.farm.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.farm.backend.domain.SellerWithdrawRequest;

public interface SellerWithdrawRequestRepository
        extends MongoRepository<SellerWithdrawRequest, String> {

    List<SellerWithdrawRequest> findBySellerId(String sellerId);

    List<SellerWithdrawRequest> findByStatus(String status);
}
