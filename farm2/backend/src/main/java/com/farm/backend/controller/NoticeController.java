package com.farm.backend.controller;

import com.farm.backend.domain.Notice;
import com.farm.backend.dto.NoticeListDto;
import com.farm.backend.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notice")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    // 목록
    @GetMapping("/list")
    public ResponseEntity<Page<NoticeListDto>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(noticeService.list(page, size, keyword));
    }

    // 상세 (조회수 증가 없음)
    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable String id) {
        return noticeService.detail(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.badRequest().body("존재하지 않는 게시글"));
    }

    // 조회수 증가
    @PostMapping("/views/{id}")
    public ResponseEntity<?> increaseViews(@PathVariable String id) {
        noticeService.increaseViews(id);
        return ResponseEntity.ok("조회수 증가");
    }

    // 작성 
    @PostMapping("/write")
    public ResponseEntity<Notice> write(@RequestBody Notice notice) {
        return ResponseEntity.ok(noticeService.write(notice));
    }

    // 수정
    @PutMapping("/update")
    public ResponseEntity<Notice> update(@RequestBody Notice notice) {
        return ResponseEntity.ok(noticeService.update(notice));
    }

    // 삭제
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> delete(@PathVariable String id) {
        noticeService.delete(id);
        return ResponseEntity.ok("삭제 완료");
    }
}
