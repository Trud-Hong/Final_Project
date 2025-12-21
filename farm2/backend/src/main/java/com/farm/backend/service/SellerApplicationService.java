package com.farm.backend.service;

import com.farm.backend.domain.Member;
import com.farm.backend.domain.Seller;
import com.farm.backend.domain.SellerApplyInfo;
import com.farm.backend.dto.SellerApplyDTO;
import com.farm.backend.repository.MemberRepository;
import com.farm.backend.repository.SellerRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SellerApplicationService {

    private final MemberRepository memberRepository;
    private final SellerRepository sellerRepository;

    /** 사용자 → 판매자 신청 */
    public Member applySeller(SellerApplyDTO dto, String userId) {

        Member member = memberRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));

        // 이미 Seller 등록된 경우 차단
        Seller existingSeller = sellerRepository.findByUserId(userId);
        if (existingSeller != null) {
            throw new RuntimeException("이미 판매자 등록이 완료된 회원입니다.");
        }

        // 이미 판매자 신청 상태인지 확인 (중복 신청 방지)
        if (member.getSellerApply() != null
                && member.getSellerApply().isApplied()
                && !"REJECTED".equals(member.getSellerApply().getStatus())) {

            throw new RuntimeException("이미 판매자 신청을 하셨습니다.");
        }

        SellerApplyInfo info = new SellerApplyInfo();
        info.setApplied(true);
        info.setStatus("PENDING");
        info.setCreatedAt(LocalDateTime.now());

        info.setPhone(dto.getPhone());
        info.setFarmName(dto.getFarmName());
        info.setIntro(dto.getIntro());
        info.setBusinessNumber(dto.getBusinessNumber());

        info.setSellerName(dto.getSellerName());
        info.setNickname(dto.getNickname());

        info.setCategory(dto.getCategory());
        info.setLocation(dto.getLocation());
        info.setAddress(dto.getAddress());
        info.setBank(dto.getBank());
        info.setAccountNumber(dto.getAccountNumber());

        info.setImage(dto.getImage());
        info.setImageName(dto.getImageName());

        member.setSellerApply(info);

        return memberRepository.save(member);
    }

    /** 관리자 → 신청 목록 조회 */
    public List<Member> getSellerApplications() {
        return memberRepository.findAll()
                .stream()
                .filter(m -> m.getSellerApply() != null
                        && "PENDING".equals(m.getSellerApply().getStatus()))

                .collect(Collectors.toList());
    }

    /** 관리자 → 승인 */
    public Member approveSeller(String userId) {

        Member member = memberRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));

        SellerApplyInfo apply = member.getSellerApply();

        // 신청 기록 없는 사람 승인 막기
        if (apply == null || !apply.isApplied()) {
            throw new RuntimeException("판매자 신청 기록이 없습니다.");
        }

        // 기존 Seller 이미 존재하면 차단
        Seller existing = sellerRepository.findByUserId(userId);
        if (existing != null) {
            throw new RuntimeException("이미 판매자로 등록된 회원입니다.");
        }

        apply.setStatus("APPROVED");
        member.setRole("ROLE_SELLER");

        // Seller 문서 생성
        Seller seller = new Seller();
        seller.setUserId(member.getUserId());
        seller.setSellerName(member.getName());
        seller.setNickname(member.getNickname());
        seller.setPhone(apply.getPhone());
        seller.setFarmName(apply.getFarmName());
        seller.setAddress(apply.getAddress());
        seller.setIntro(apply.getIntro());
        seller.setBusinessNumber(apply.getBusinessNumber());

        seller.setCategory(apply.getCategory());
        seller.setLocation(apply.getLocation());

        seller.setBank(apply.getBank());
        seller.setAccountNumber(apply.getAccountNumber());

        seller.setImage(apply.getImage());
        seller.setImageName(apply.getImageName());

        sellerRepository.save(seller);

        return memberRepository.save(member);
    }

    /** 관리자 → 거절 */
    public Member rejectSeller(String userId) {

        Member member = memberRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));

        SellerApplyInfo apply = member.getSellerApply();

        // 신청 기록이 없는 경우 거절 불가
        if (apply == null || !apply.isApplied()) {
            throw new RuntimeException("판매자 신청 기록이 없습니다.");
        }

        apply.setStatus("REJECTED");

        return memberRepository.save(member);
    }
}
