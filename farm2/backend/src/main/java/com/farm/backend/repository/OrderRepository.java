// 혜정 11/17 구매내역을 검색하기 위한 인터페이스
package com.farm.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.farm.backend.domain.Order;

//몽고DB와 통신하는 인터페이스
@Repository
public interface OrderRepository extends MongoRepository<Order, String> {

    // 로그인한 전체 구매내역검색
    List<Order> findByUserId(String userId);

    // 날짜로 구매내역검색
    List<Order> findByUserIdAndOrderDateBetween(String userId, LocalDateTime startDate, LocalDateTime endDate);

    // 날짜, 키워드 모두 포함 된것 찾기
    // 전체 회원 날짜로 구매내역검색
    List<Order> findAllByOrderDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    // 전체 회원 날짜로 구매내역검색
    List<Order> findByStatusAndOrderDateBetween(String status, LocalDateTime startDate, LocalDateTime endDate);

    // 키워드가 포함된것 모두찾기
     @Query("{ 'userId': ?0, 'pName': { $regex: ?1, $options: 'i' } }")
    List<Order> findByUserIdAndPnameContaining(String userId, String pname);

    // 날짜, 키워드 모두 포함 된것 찾기
    @Query("{ 'userId': ?0, 'pName': { $regex: ?1, $options: 'i' }, 'orderDate': { $gte: ?2, $lte: ?3 } }")
    List<Order> findByUserIdAndPnameContainingAndOrderDateBetween(
            String userId, String pname,
            LocalDateTime startDate, LocalDateTime endDate);

    void deleteByUserId(String userId);

    List<Order> findBySellerId(String sellerId);

}