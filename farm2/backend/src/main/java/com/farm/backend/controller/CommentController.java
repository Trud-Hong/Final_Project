package com.farm.backend.controller;

import com.farm.backend.dto.CommentResponseDto;
import com.farm.backend.service.CommentService;
import com.farm.backend.domain.Comment;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/comments")
public class CommentController {

    private final CommentService commentService;

    // 댓글 조회 (DTO 리스트)
    @GetMapping("/{postId}")
    public List<CommentResponseDto> getComments(@PathVariable String postId) {
        return commentService.getComments(postId);
    }

    // 댓글 생성 (DTO 반환)
    @PostMapping
    public CommentResponseDto createComment(@RequestBody Map<String, String> body) {

        Comment comment = new Comment();
        comment.setPostId(body.get("postId"));
        comment.setUserId(body.get("userId"));     // ← userId 설정
        comment.setContent(body.get("content"));

        return commentService.create(comment);
    }

    // 댓글 수정 (본인만 가능)
    @PutMapping("/{id}")
    public CommentResponseDto updateComment(
            @PathVariable String id,
            @RequestBody Map<String, String> body
    ) {
        String currentUserId = body.get("userId");      // ← 본인인지 확인할 userId 추가
        String newContent = body.get("content");

        return commentService.update(id, newContent, currentUserId);
    }

    // 댓글 삭제 (본인 또는 관리자만 가능)
    @DeleteMapping("/{id}")
    public void deleteComment(
            @PathVariable String id,
            Authentication authentication
    ) {
        if (authentication == null) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        
        String currentUserId = (String) authentication.getPrincipal();
        
        // 관리자 권한 체크
        boolean isAdmin = authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
        
        commentService.delete(id, currentUserId, isAdmin);
    }
}
