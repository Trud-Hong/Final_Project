package com.farm.backend.controller;

import com.farm.backend.service.FindAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/find-id/send-code")
@RequiredArgsConstructor
public class FindAccountController {

    private final FindAccountService findAccountService;

    // 아이디 찾기
    @PostMapping("/find-id")
    public ResponseEntity<?> findId(@RequestParam String name,
                                    @RequestParam String email) {
        try {
            String userId = findAccountService.findUserId(name, email);
            return ResponseEntity.ok(userId);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("일치하는 회원이 없습니다.");
        }
    }

    // 비밀번호 찾기 (회원 존재 확인)
    @PostMapping("/find-pw/check")
    public ResponseEntity<?> checkUser(@RequestParam String name,
                                       @RequestParam String userId,
                                       @RequestParam String email) {
        boolean exists = findAccountService.checkUserForPw(name, userId, email);

        if (exists) {
            return ResponseEntity.ok("OK");
        } else {
            return ResponseEntity.badRequest().body("일치하는 회원이 없습니다.");
        }
    }

    // 비밀번호 변경
    @PostMapping("/find-pw/change")
    public ResponseEntity<?> changePassword(@RequestParam String userId,
                                            @RequestParam String newPassword) {
        try {
            findAccountService.updatePassword(userId, newPassword);
            return ResponseEntity.ok("비밀번호가 변경되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("오류가 발생했습니다.");
        }
    }
}
