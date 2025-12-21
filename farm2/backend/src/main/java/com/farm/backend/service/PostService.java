package com.farm.backend.service;

import com.farm.backend.domain.Member;
import com.farm.backend.domain.Post;
import com.farm.backend.dto.PostResponseDto;
import com.farm.backend.repository.LikeRepository;
import com.farm.backend.repository.MemberRepository;
import com.farm.backend.repository.PostRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final MemberRepository memberRepository;
    private final LikeRepository likeRepository;

    private final MongoTemplate mongoTemplate;

    // 단일 게시글 상세 조회
    public PostResponseDto getPostDetail(String id) {

        Post post = postRepository.findById(id).orElse(null);
        if (post == null) return null;

        post.setViews(post.getViews() + 1);
        postRepository.save(post);

        return convertToDto(post);
    }

    // Post → DTO 변환
    public PostResponseDto convertToDto(Post post) {

        PostResponseDto dto = new PostResponseDto();
        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setContent(post.getContent());
        dto.setImageUrl(post.getImageUrl());

        dto.setViews(post.getViews());
        dto.setCommentCount(post.getCommentCount());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setUpdatedAt(post.getUpdatedAt());
        dto.setUserId(post.getUserId());

        // 닉네임
        Member member = memberRepository.findByUserId(post.getUserId()).orElse(null);
        dto.setNickname(member != null ? member.getNickname() : "익명");

        // 좋아요 개수
        dto.setLikeCount(likeRepository.countByPostId(post.getId()));

        return dto;
    }

    // 🔥 페이징 + 제목 검색 + userId 필터
    public Page<PostResponseDto> searchPosts(String keyword, int page, int size, String userId) {

        Pageable pageable = PageRequest.of(page, size);

        Query query = new Query().with(pageable)
                                 .with(Sort.by(Sort.Direction.DESC, "createdAt"));

        Query countQuery = new Query();

        // 🔍 제목 검색
        if (keyword != null && !keyword.isEmpty()) {
            Criteria titleCriteria = Criteria.where("title").regex(keyword, "i");
            query.addCriteria(titleCriteria);
            countQuery.addCriteria(titleCriteria);
        }

        // 👤 userId 필터 (내 게시글만 보기용)
        if (userId != null && !userId.isEmpty()) {
            Criteria idCriteria = Criteria.where("userId").is(userId);
            query.addCriteria(idCriteria);
            countQuery.addCriteria(idCriteria);
        }

        long total = mongoTemplate.count(countQuery, Post.class);
        List<Post> posts = mongoTemplate.find(query, Post.class);

        // Post 엔티티를 PostResponseDto로 변환
        List<PostResponseDto> dtoList = posts.stream()
                .map(this::convertToDto)
                .collect(java.util.stream.Collectors.toList());

        return new PageImpl<>(dtoList, pageable, total);
    }
}
