package com.farm.backend.service;

import com.farm.backend.domain.Member;
import com.farm.backend.domain.Notice;
import com.farm.backend.dto.NoticeListDto;
import com.farm.backend.repository.MemberRepository;
import com.farm.backend.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final MemberRepository memberRepository;

    // 목록
    public Page<NoticeListDto> list(int page, int size, String keyword) {

        // ✅ pinned 먼저 → createdAt 내림차순
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(
                        Sort.Order.desc("pinned"),
                        Sort.Order.desc("createdAt")
                )
        );

        Page<Notice> noticePage;

        if (keyword == null || keyword.trim().isEmpty()) {
            noticePage = noticeRepository.findAll(pageable);
        } else {
            // 검색 수행 시에도 동일한 정렬 사용
            List<Notice> filtered = noticeRepository.findAll(
                    Sort.by(
                            Sort.Order.desc("pinned"),
                            Sort.Order.desc("createdAt")
                    )
            );

            List<Notice> matched = new ArrayList<>();

            for (Notice n : filtered) {
                String t = n.getTitle();
                String c = n.getContent();

                if ((t != null && t.contains(keyword)) ||
                    (c != null && c.contains(keyword))) {
                    matched.add(n);
                }
            }

            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), matched.size());

            List<Notice> pageContent =
                    (start >= matched.size()) ? Collections.emptyList() : matched.subList(start, end);

            noticePage = new PageImpl<>(pageContent, pageable, matched.size());
        }

        // Notice -> NoticeListDto 변환
        List<NoticeListDto> dtoList = new ArrayList<>();

        for (Notice n : noticePage.getContent()) {

            String nickname = "알 수 없음";

            String userId = n.getUserId();
            if (userId != null && !userId.trim().isEmpty()) {
                Optional<Member> optionalMember = memberRepository.findByUserId(userId);
                if (optionalMember.isPresent()) {
                    Member m = optionalMember.get();
                    if (m.getNickname() != null && !m.getNickname().trim().isEmpty()) {
                        nickname = m.getNickname();
                    }
                }
            }

            // ✅ pinned 포함한 DTO 생성 (총 6개 인자)
            dtoList.add(new NoticeListDto(
                    n.getId(),
                    n.getTitle(),
                    nickname,
                    n.getCreatedAt(),
                    n.getViews(),
                    n.isPinned()      // ★ 추가됨 — 이 값이 DTO에 들어감
            ));
        }

        return new PageImpl<>(dtoList, pageable, noticePage.getTotalElements());
    }

    // 상세조회
    public Optional<Notice> detail(String id) {
        return noticeRepository.findById(id);
    }

    // 조회수 증가
    public void increaseViews(String id) {
        noticeRepository.findById(id).ifPresent(n -> {
            n.setViews(n.getViews() + 1);
            noticeRepository.save(n);
        });
    }

    // 작성
    public Notice write(Notice notice) {
        LocalDateTime now = LocalDateTime.now();
        notice.setViews(0);
        notice.setCreatedAt(now);
        notice.setUpdatedAt(now);
        return noticeRepository.save(notice);  // pinned 값도 함께 저장됨
    }

    // 수정
    public Notice update(Notice notice) {
        Notice original = noticeRepository.findById(notice.getId())
                .orElseThrow(() -> new RuntimeException("공지 없음"));

        // 원본 유지값
        notice.setCreatedAt(original.getCreatedAt());
        notice.setViews(original.getViews());
        notice.setUserId(original.getUserId());
        notice.setUpdatedAt(LocalDateTime.now());
        // pinned 값은 요청에서 받아온 값 그대로 사용 (notice.getPinned())

        return noticeRepository.save(notice);
    }

    public void delete(String id) {
        noticeRepository.deleteById(id);
    }
}
