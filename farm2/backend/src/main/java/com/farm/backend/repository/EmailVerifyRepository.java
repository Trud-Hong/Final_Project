package com.farm.backend.repository;

import com.farm.backend.domain.EmailVerify;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface EmailVerifyRepository extends MongoRepository<EmailVerify, String> {

    Optional<EmailVerify> findTopByEmailOrderByCreatedAtDesc(String email);
    
    void deleteByEmail(String email);

}
