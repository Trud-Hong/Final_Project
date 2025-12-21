package com.farm.backend.service;

import com.farm.backend.domain.Wishlist;
import com.farm.backend.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;

    // 찜 추가 (중복 체크 포함) → true = 새로 추가됨 / false = 이미 존재
    public boolean addWishlist(String userId, String productId) {
        // 이미 존재하는지 확인
        if (wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            return false; // 이미 있음
        }

        Wishlist wishlist = Wishlist.builder()
                .userId(userId)
                .productId(productId)
                .createdAt(LocalDateTime.now())
                .build();

        wishlistRepository.save(wishlist);
        return true; // 새로 추가됨
    }

    // 찜 리스트 조회
    public List<Wishlist> getWishlist(String userId) {
        return wishlistRepository.findByUserId(userId);
    }

    // 찜 취소
    public void removeWishlist(String userId, String productId) {
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
    }
}
