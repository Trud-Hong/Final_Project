package com.farm.backend.repository;

import com.farm.backend.domain.Notice;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NoticeRepository extends MongoRepository<Notice, String> {
}
