package com.farm.backend.service;

import com.farm.backend.domain.Member;
import com.farm.backend.repository.MemberRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.farm.backend.service.EmailService;

import org.springframework.transaction.annotation.Transactional;

import com.farm.backend.repository.EmailVerifyRepository;
import com.farm.backend.repository.LikeRepository;
import com.farm.backend.repository.CommentRepository;
import com.farm.backend.repository.PostRepository;
import com.farm.backend.repository.ReviewRepository;
import com.farm.backend.repository.OrderRepository;
import com.farm.backend.repository.SellerRepository;
import java.time.LocalDateTime;
import java.time.Clock;
import java.time.ZoneId;


@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService; // ⭐ 추가

    private final EmailVerifyRepository emailVerifyRepository;
private final LikeRepository likeRepository;
private final CommentRepository commentRepository;
private final PostRepository postRepository;
private final ReviewRepository reviewRepository;
private final OrderRepository orderRepository;
private final SellerRepository sellerRepository;

    // 회원가입
    public Member signup(Member member) {

        if (member.getProvider() == null || member.getProvider().trim().isEmpty()) {
            member.setProvider("local");
        }

        if (memberRepository.existsByEmail(member.getEmail())) {
            throw new RuntimeException("이미 사용 중인 이메일입니다.");
        }

        if (memberRepository.existsByUserId(member.getUserId())) {
            throw new RuntimeException("이미 사용 중인 아이디입니다.");
        }

         if (memberRepository.existsByPhone(member.getPhone())) {
        throw new RuntimeException("이미 사용 중인 전화번호입니다.");
        }

        if (memberRepository.existsByNickname(member.getNickname())) {
        throw new RuntimeException("이미 사용 중인 닉네임입니다.");
        }

        member.setPassword(passwordEncoder.encode(member.getPassword()));
        
      
        Clock kstClock = Clock.system(ZoneId.of("Asia/Seoul"));
        if (member.getCreatedAt() == null) {
            member.setCreatedAt(LocalDateTime.now(kstClock));
        }
        if (member.getUpdatedAt() == null) {
            member.setUpdatedAt(LocalDateTime.now(kstClock));
        }
        
        return memberRepository.save(member);
    }

    public Member findByUserId(String userId) {
        return memberRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다."));
    }

    // 로그인
    public Member login(String userId, String rawPassword) {
        Optional<Member> memberOpt = memberRepository.findByUserId(userId);
        if (!memberOpt.isPresent()) {
            return null;
        }
        Member member = memberOpt.get();
        if (member.isDeleted()) {
            return null;
        }
        if (member.getIsActive() != null && !member.getIsActive()) {
            throw new RuntimeException("비활성화된 계정입니다.");
        }
        if (passwordEncoder.matches(rawPassword, member.getPassword())) {
            return member;
        }
        return null;
    }

    // 아이디 찾기 - 인증번호 전송
    public boolean sendFindIdCode(String name, String email) {
        Member member = memberRepository.findByNameAndEmail(name, email);
        if (member == null) return false;

        String code = String.valueOf((int)(Math.random() * 900000) + 100000);
        member.setVerifyCode(code);
        memberRepository.save(member);

        emailService.sendEmail(email, "아이디 찾기 인증번호", "인증번호: " + code);
        return true;
    }


    // 아이디 찾기 - 인증번호 검증 후 userId 반환
    public String verifyFindIdCode(String name, String email, String code) {
        Member member = memberRepository.findByNameAndEmail(name, email);
        if (member != null && code.equals(member.getVerifyCode())) {
            return member.getUserId();
        }
        return null;
    }

    // 비밀번호 찾기 - 인증번호 전송
public boolean sendFindPwCode(String name, String userId, String email) {
    Member member = memberRepository.findByNameAndUserIdAndEmail(name, userId, email);

    if (member == null) return false;

    String code = String.valueOf((int)(Math.random() * 900000) + 100000);
    member.setVerifyCode(code);
    memberRepository.save(member);

    emailService.sendEmail(email, "비밀번호 재설정 인증번호", "인증번호: " + code);
    return true;
}
// 비밀번호 찾기 - 인증번호 검증
public boolean verifyFindPwCode(String name, String userId, String email, String code) {
    Member member = memberRepository.findByNameAndUserIdAndEmail(name, userId, email);
    if (member != null && code.equals(member.getVerifyCode())) {
        return true;
    }
    return false;
}

// 비밀번호 검증 후 새 비밀번호 갱신
public boolean resetPassword(String name, String userId, String email, String code, String newPassword) {
    Member member = memberRepository.findByNameAndUserIdAndEmail(name, userId, email);

    if (member == null || !code.equals(member.getVerifyCode())) return false;

    member.setPassword(passwordEncoder.encode(newPassword));
    member.setVerifyCode(null);
    memberRepository.save(member);
    return true;
}

public void updateMember(Member updated) {
    Member member = memberRepository.findByUserId(updated.getUserId())
        .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));

    member.setName(updated.getName());
    member.setEmail(updated.getEmail());
    member.setNickname(updated.getNickname());
    member.setPhone(updated.getPhone());
    member.setRole(updated.getRole());
    
    // updatedAt을 한국 시간(KST)으로 업데이트
    Clock kstClock = Clock.system(ZoneId.of("Asia/Seoul"));
    member.setUpdatedAt(LocalDateTime.now(kstClock));

    // 비밀번호 입력한 경우만 변경
    if (updated.getPassword() != null && !updated.getPassword().isEmpty()) {
        member.setPassword(passwordEncoder.encode(updated.getPassword()));
    }

    memberRepository.save(member);
}

// 관리자 페이지에서 사용자 정보 변경
public void updateMemberByAdmin(Member updated) {
    Member member = memberRepository.findByUserId(updated.getUserId())
        .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));

    member.setNickname(updated.getNickname());
    member.setRole(updated.getRole());
    member.setIsActive(updated.getIsActive());
    
    // updatedAt을 한국 시간(KST)으로 업데이트
    Clock kstClock = Clock.system(ZoneId.of("Asia/Seoul"));
    member.setUpdatedAt(LocalDateTime.now(kstClock));

    memberRepository.save(member);
}

@Transactional
public void deleteMember(String userId) {

    // 회원 정보 조회 (email 필요)
    Member member = memberRepository.findByUserId(userId)
        .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));

    // 이메일 인증 데이터 삭제
    emailVerifyRepository.deleteByEmail(member.getEmail());

    // 좋아요 삭제
    likeRepository.deleteByUserId(userId);

    // 댓글 삭제
    commentRepository.deleteByUserId(userId);

    // 게시글 삭제
    postRepository.deleteByUserId(userId);

    
// 리뷰 삭제
reviewRepository.deleteAllByUser(member.getUserId());
reviewRepository.deleteAllByUser(member.getNickname());
reviewRepository.deleteAllByUser(member.getName());
reviewRepository.deleteAllByUser(member.getPhone());   
reviewRepository.deleteAll();


    // 주문 내역 삭제
    orderRepository.deleteByUserId(userId);

    // 판매자 정보 삭제
    sellerRepository.deleteByUserId(userId);


member.setDeleted(true);
memberRepository.save(member);  
memberRepository.deleteByUserId(userId); 
reviewRepository.deleteAllByUserId(userId);


}

    //모든 사용자 찾기
    public List<Member> findAllMembers() {
        return memberRepository.findAll();
    }

}