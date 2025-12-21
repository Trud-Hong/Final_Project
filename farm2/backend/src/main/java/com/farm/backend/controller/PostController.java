package com.farm.backend.controller;

import com.farm.backend.dto.PostResponseDto;
import com.farm.backend.service.PostService;
import com.farm.backend.file.util.FileUtils;
import com.farm.backend.domain.Post;
import com.farm.backend.repository.PostRepository;
import com.farm.backend.repository.CommentRepository;
import com.farm.backend.repository.LikeRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/posts")
public class PostController {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final FileUtils fileUtils;

    // 추가된 DTO/Service
    private final PostService postService;   // ← 추가됨

    @PostMapping(value = "", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Post createPost(
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam("nickname") String nickname,
            @RequestParam("userId") String userId,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "type", defaultValue = "blog") String type
    ) {

        Post post = new Post();
        post.setTitle(title);
        post.setContent(content);
        post.setNickname(nickname);
        post.setUserId(userId);
        post.setViews(0);
        post.setCommentCount(0);
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());

        if (image != null && !image.isEmpty()) {
            List<MultipartFile> files = new ArrayList<>();
            files.add(image);
            List<String> urls = fileUtils.saveFiles(files, type);
            if (!urls.isEmpty()) post.setImageUrl(urls.get(0));
        }

        return postRepository.save(post);
    }

    @GetMapping
    public List<Post> getPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/latest")
    public List<Post> getLatestPosts() {
        return postRepository.findTop3ByOrderByCreatedAtDesc();
    }

    // 🔥 DTO 적용된 상세조회
    @GetMapping("/{id}")
    public PostResponseDto getPost(@PathVariable String id) {
        return postService.getPostDetail(id);
    }

    @GetMapping("/user/{userId}")
    public List<Post> getPostsByUser(@PathVariable String userId) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Post updatePost(
            @PathVariable String id,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam("userId") String userId,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "type", defaultValue = "blog") String type
    ) {

        Post post = postRepository.findById(id).orElseThrow(() ->
                new RuntimeException("Post not found")
        );

        post.setTitle(title);
        post.setContent(content);
        post.setUserId(userId);
        post.setUpdatedAt(LocalDateTime.now());

        if (image != null && !image.isEmpty()) {
            List<MultipartFile> files = new ArrayList<>();
            files.add(image);
            List<String> urls = fileUtils.saveFiles(files, type);
            if (!urls.isEmpty()) post.setImageUrl(urls.get(0));
        }

        return postRepository.save(post);
    }

    @DeleteMapping("/{id}")
    public void deletePost(@PathVariable String id) {

        Post post = postRepository.findById(id).orElse(null);
        if (post == null) throw new RuntimeException("Post not found");

        if (post.getImageUrl() != null) {
            String path = System.getProperty("user.dir") + post.getImageUrl();
            File file = new File(path);
            if (file.exists()) file.delete();
        }

        commentRepository.deleteByPostId(id);
        likeRepository.deleteByPostId(id);
        postRepository.deleteById(id);
    }

    // ⭐ 추가: 검색 + 페이징 기능 (title + userId 필터)
    @GetMapping("/search")
    public Page<PostResponseDto> searchPosts(
            @RequestParam(defaultValue = "0") int page,        // 현재 페이지 번호
            @RequestParam(defaultValue = "6") int size,        // 페이지당 개수
            @RequestParam(required = false) String keyword,    // 제목 검색
            @RequestParam(required = false) String userId      // 내 게시글만 보기용
    ) {
        return postService.searchPosts(keyword, page, size, userId);
    }

}
