package com.farm.backend.repository;

import com.farm.backend.domain.Review;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ReviewRepository extends MongoRepository<Review, String> {

    // date 기준 최신순 정렬해서 가져오기
    List<Review> findAllByOrderByDateDesc();

    List<Review> findBySellerUserId(String sellerUserId);

    void deleteAllByUser(String user); // 기존 삭제

    void deleteAllBySeller(String seller);

    void deleteAllByProduct(String product);

    // 회원이 작성한 모든 리뷰 삭제 (user 값이 뭐든 상관없이)
    // void deleteAllByUserContaining(String user);
    void deleteAllByUserId(String userId);

}
