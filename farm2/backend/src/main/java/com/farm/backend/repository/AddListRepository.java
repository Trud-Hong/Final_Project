package com.farm.backend.repository;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.farm.backend.domain.AddrList;

//몽고디비와 자동으로 연결해주는 인터페이스야
public interface AddListRepository extends MongoRepository<AddrList, String> {

    //배송지 목록 조회
    //메서드 이름 정해주면 자동으로 쿼리만들어줘
    List<AddrList> findByUserId(String userId);

    //수정할때 사용할 특정 배송지 조회기능
    AddrList findByIdAndUserId(String id, String userId);
    
}
