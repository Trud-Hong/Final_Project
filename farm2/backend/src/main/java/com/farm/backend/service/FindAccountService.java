package com.farm.backend.service;

import com.farm.backend.domain.Member;
import com.farm.backend.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FindAccountService {

    private final MemberRepository memberRepository;

    // 아이디 찾기 (이름 + 전화번호)
    public String findUserId(String name, String phone) {
        Member member = memberRepository.findByNameAndPhone(name, phone);

        if (member == null) {
            throw new RuntimeException("일치하는 회원 정보가 없습니다.");
        }

        return member.getUserId();
    }

    // 비밀번호 찾기 - 회원 존재 여부만 확인
    public boolean checkUserForPw(String name, String userId, String email) {
        return memberRepository.findByNameAndUserIdAndEmail(name, userId, email) != null;
    }

    // 비밀번호 변경
    public void updatePassword(String userId, String newPassword) {
        Member member = memberRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));

        member.setPassword(newPassword);
        memberRepository.save(member);
    }
}
