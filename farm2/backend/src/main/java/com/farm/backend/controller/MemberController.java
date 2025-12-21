package com.farm.backend.controller;

import com.farm.backend.config.JwtUtil;
import com.farm.backend.domain.Member;
import com.farm.backend.repository.MemberRepository;
import com.farm.backend.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/member")
@CrossOrigin(origins = "http://localhost:3000")
public class MemberController {

    private final MemberService memberService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final MemberRepository memberRepository;

    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Member member) {
        try {
            memberService.signup(member);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "회원가입 성공");
            return ResponseEntity.ok().body(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 아이디 찾기: 인증번호 발송 (이메일)
    @PostMapping("/find-id/send-code")
    public ResponseEntity<?> sendFindIdCode(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String email = request.get("email");

        boolean result = memberService.sendFindIdCode(name, email);

        if (result) {
            Map<String, String> res = new HashMap<>();
            res.put("message", "인증번호가 전송되었습니다.");
            return ResponseEntity.ok(res);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("message", "해당 정보의 회원을 찾을 수 없습니다.");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 아이디 찾기: 인증번호 검증 후 userId 반환
    @PostMapping("/find-id/verify")
    public ResponseEntity<?> verifyFindIdCode(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String email = request.get("email");
        String code = request.get("code");

        String userId = memberService.verifyFindIdCode(name, email, code);

        if (userId != null) {
            return ResponseEntity.ok(userId);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("message", "인증번호가 일치하지 않습니다.");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // =========================
    // 비밀번호 찾기 컨트롤러 (A 방식)
    // =========================

    @PostMapping("/find-pw/send-code")
    public ResponseEntity<?> sendFindPwCode(@RequestBody Map<String, String> request) {

        String name = request.get("name");
        String userId = request.get("userId");
        String email = request.get("email");

        boolean result = memberService.sendFindPwCode(name, userId, email);

        if (result) {
            Map<String, String> res = new HashMap<>();
            res.put("message", "인증번호가 전송되었습니다.");
            return ResponseEntity.ok(res);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("message", "일치하는 회원이 없습니다.");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 인증번호 검증
    @PostMapping("/find-pw/verify")
    public ResponseEntity<?> verifyFindPwCode(@RequestBody Map<String, String> request) {

        String name = request.get("name");
        String userId = request.get("userId");
        String email = request.get("email");
        String code = request.get("code");

        boolean result = memberService.verifyFindPwCode(name, userId, email, code);

        if (result) {
            Map<String, String> res = new HashMap<>();
            res.put("message", "인증 성공");
            return ResponseEntity.ok(res);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("message", "인증번호가 올바르지 않습니다.");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 비밀번호 재설정
    @PostMapping("/find-pw/reset")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String userId = request.get("userId");
        String email = request.get("email");
        String code = request.get("code");
        String newPassword = request.get("newPassword");

        boolean result = memberService.resetPassword(name, userId, email, code, newPassword);
        if (result) {
            Map<String, String> res = new HashMap<>();
            res.put("message", "비밀번호가 변경되었습니다.");
            return ResponseEntity.ok(res);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("message", "인증 실패 또는 유효하지 않은 정보입니다.");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 회원 정보 조회 (userId로 조회)
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getMember(@PathVariable String userId) {
        Member member = memberService.findByUserId(userId);
        if (member != null) {
            return ResponseEntity.ok(member);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("message", "회원 정보를 찾을 수 없습니다.");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 회원 정보 수정
    @PutMapping("/update")
    public ResponseEntity<?> updateMember(@RequestBody Member member) {
        try {
            memberService.updateMember(member);
            Map<String, String> res = new HashMap<>();
            res.put("message", "회원 정보가 수정되었습니다.");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "회원 정보 수정 실패");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 관리자의 회원 정보 수정
    @PutMapping("/updateByAdmin")
    public ResponseEntity<?> updateMemberByAdmin(@RequestBody Member member) {
        try {
            memberService.updateMemberByAdmin(member);
            Map<String, String> res = new HashMap<>();
            res.put("message", "회원 정보가 수정되었습니다.");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "회원 정보 수정 실패");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String password = request.get("password");

        try {
            Member member = memberService.login(userId, password);

            if (member != null) {
                String token = jwtUtil.generateToken(member);
                Map<String, Object> response = new HashMap<>();
                response.put("message", "로그인 성공");
                response.put("token", token);
                response.put("userId", member.getUserId());
                response.put("name", member.getName());
                response.put("nickname", member.getNickname());
                response.put("role", member.getRole());
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("message", "아이디 또는 비밀번호가 잘못되었습니다.");
                return ResponseEntity.badRequest().body(error);
            }
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 비밀번호 인증 API
    @PostMapping("/verify-password")
    public ResponseEntity<?> verifyPassword(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String password = request.get("password");

        Member member = memberService.findByUserId(userId);

        if (member != null && passwordEncoder.matches(password, member.getPassword())) {
            return ResponseEntity.ok(new HashMap<>()); // 성공
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("message", "비밀번호가 올바르지 않습니다.");
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/delete/{userId}")
    public ResponseEntity<?> delete(@PathVariable String userId) {
        try {
            memberService.deleteMember(userId);
            Map<String, String> res = new HashMap<>();
            res.put("message", "회원 삭제 성공");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "회원 삭제 실패");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 전체 조회
    @GetMapping("/all")
    public ResponseEntity<?> getAllMembers() {
        try {
            List<Member> members = memberService.findAllMembers();

            return ResponseEntity.ok(members);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "회원 목록 조회 실패");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 판매자 신청 페이지 전용 회원 정보 조회
    @GetMapping("/info/{userId}")
    public ResponseEntity<?> getMemberInfo(@PathVariable String userId) {
        Member member = memberRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));

        return ResponseEntity.ok(member);
    }

    // 닉네임으로 회원 정보 조회
    @GetMapping("/nickname/{nickname}")
    public ResponseEntity<?> getMemberInfoByNickname(@PathVariable String nickname) {
        Member member = memberRepository.findByNickname(nickname);
        if (member != null) {
            return ResponseEntity.ok(member);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("message", "회원 정보를 찾을 수 없습니다.");
            return ResponseEntity.badRequest().body(error);
        }
    }

}
