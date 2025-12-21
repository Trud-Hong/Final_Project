package com.farm.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.farm.backend.domain.Cart;

@Repository //몽고디비와 연결
public interface CartRepository extends MongoRepository<Cart, String> {

    List<Cart> findByUserId(String userId); //로그인사용자의 장바구니조회

    Cart findByUserIdAndProductId(String userId, String productId); //장바구니에 같은 상품있는지 확인
    
    // 같은 상품 + 같은 옵션 조합 찾기
    Cart findByUserIdAndProductIdAndSelectedUnit(String userId, String productId, String selectedUnit);

    void deleteByUserId(String userId); //장바구니모두 삭제   
}
