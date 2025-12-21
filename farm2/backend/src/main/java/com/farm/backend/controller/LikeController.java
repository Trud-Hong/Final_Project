package com.farm.backend.controller;

import com.farm.backend.domain.Like;
import com.farm.backend.repository.LikeRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/likes")
public class LikeController {

    private final LikeRepository likeRepository;

    // ⭐ 좋아요 토글 (로그인한 사용자만 가능)
    @PostMapping("/{postId}")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable String postId,
            @RequestBody Map<String, String> body
    ) {
        String userId = body.get("userId");
        Map<String, Object> res = new HashMap<>();

        // 1) 로그인 안 했으면 좋아요 금지
        if (userId == null || userId.isEmpty()) {
            res.put("success", false);
            res.put("message", "로그인이 필요합니다.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(res);
        }

        // 2) 이미 좋아요 눌렀는지 확인
        boolean exists = likeRepository.existsByPostIdAndUserId(postId, userId);

        if (exists) {
            // 좋아요 취소
            likeRepository.deleteByPostIdAndUserId(postId, userId);
            res.put("liked", false);
        } else {
            // 좋아요 추가
            Like like = new Like();
            like.setPostId(postId);
            like.setUserId(userId);
            likeRepository.save(like);

            res.put("liked", true);
        }

        // 3) 최신 좋아요 수 반환
        long count = likeRepository.countByPostId(postId);
        res.put("likeCount", count);
        res.put("success", true);

        return ResponseEntity.ok(res);
    }

    // ⭐ 좋아요 개수 조회
    @GetMapping("/count/{postId}")
    public ResponseEntity<Long> getLikeCount(@PathVariable String postId) {
        long count = likeRepository.countByPostId(postId);
        return ResponseEntity.ok(count);
    }

    // ⭐ 특정 사용자가 좋아요 눌렀는지 확인
    @PostMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkLiked(@RequestBody Map<String, String> body) {
        String postId = body.get("postId");
        String userId = body.get("userId");

        boolean liked = false;
        if (userId != null && !userId.isEmpty()) {
            liked = likeRepository.existsByPostIdAndUserId(postId, userId);
        }

        Map<String, Boolean> res = new HashMap<>();
        res.put("liked", liked);
        return ResponseEntity.ok(res);
    }
}
