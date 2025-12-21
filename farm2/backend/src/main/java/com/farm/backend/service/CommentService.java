package com.farm.backend.service;

import com.farm.backend.domain.Comment;
import com.farm.backend.domain.Member;
import com.farm.backend.domain.Post;
import com.farm.backend.dto.CommentResponseDto;
import com.farm.backend.repository.CommentRepository;
import com.farm.backend.repository.MemberRepository;
import com.farm.backend.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final MemberRepository memberRepository;
    private final PostRepository postRepository;

    // 댓글 목록 DTO 변환
    public List<CommentResponseDto> getComments(String postId) {
        return commentRepository
                .findByPostIdOrderByCreatedAtDesc(postId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // 댓글 저장
    public CommentResponseDto create(Comment comment) {
        comment.setCreatedAt(LocalDateTime.now());
        Comment saved = commentRepository.save(comment);

        // 댓글 개수 증가
        Post post = postRepository.findById(comment.getPostId()).orElse(null);
        if (post != null) {
            post.setCommentCount(post.getCommentCount() + 1);
            postRepository.save(post);
        }

        return toDto(saved);
    }

    // 댓글 수정 (본인만 가능)
    public CommentResponseDto update(String commentId, String newContent, String currentUserId) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));

        // 🔥 본인 확인
        if (!comment.getUserId().equals(currentUserId)) {
            throw new RuntimeException("본인 댓글만 수정할 수 있습니다.");
        }

        comment.setContent(newContent);                 // 내용 변경
        Comment updated = commentRepository.save(comment);  // DB 저장

        return toDto(updated);
    }

    // 댓글 삭제 (본인 또는 관리자만 가능)
    public void delete(String commentId, String currentUserId, boolean isAdmin) {

        Comment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null) return;

        // 관리자인 경우 삭제 허용
        if (isAdmin) {
            // 댓글 수 감소
            Post post = postRepository.findById(comment.getPostId()).orElse(null);
            if (post != null) {
                post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
                postRepository.save(post);
            }
            commentRepository.deleteById(commentId);
            return;
        }

        // 🔥 본인 확인
        if (!comment.getUserId().equals(currentUserId)) {
            throw new RuntimeException("본인 댓글만 삭제할 수 있습니다.");
        }

        // 댓글 수 감소
        Post post = postRepository.findById(comment.getPostId()).orElse(null);
        if (post != null) {
            post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
            postRepository.save(post);
        }

        commentRepository.deleteById(commentId);
    }

    // 엔티티 -> DTO 변환
    private CommentResponseDto toDto(Comment comment) {
        CommentResponseDto dto = new CommentResponseDto();
        dto.setId(comment.getId());
        dto.setPostId(comment.getPostId());
        dto.setUserId(comment.getUserId());
        dto.setContent(comment.getContent());
        dto.setCreatedAt(comment.getCreatedAt());

        // Member에서 닉네임 가져오기 (올바른 userId 기준 검색)
        Optional<Member> memberOpt = memberRepository.findByUserId(comment.getUserId());
        dto.setNickname(memberOpt.isPresent() ? memberOpt.get().getNickname() : "익명");

        return dto;
    }

}
