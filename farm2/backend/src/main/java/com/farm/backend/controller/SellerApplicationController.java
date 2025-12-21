package com.farm.backend.controller;

import com.farm.backend.config.JwtUtil;
import com.farm.backend.domain.Member;
import com.farm.backend.dto.SellerApplyDTO;
import com.farm.backend.service.SellerApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class SellerApplicationController {

    private final SellerApplicationService sellerApplicationService;
    private final JwtUtil jwtUtil;

    /** 사용자 → 판매자 신청 */
    @PostMapping(value = "/seller/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Member applySeller(
            @RequestPart("sellerName") String sellerName,
            @RequestPart("phone") String phone,
            @RequestPart("farmName") String farmName,
            @RequestPart("address") String address,
            @RequestPart("intro") String intro,
            @RequestPart("businessNumber") String businessNumber,
            @RequestPart("bank") String bank,
            @RequestPart("accountNumber") String accountNumber,
            @RequestPart("category") String category,
            @RequestPart("location") String location,
            @RequestPart("nickname") String nickname,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestHeader(value = "Authorization", required = false) String authHeader) throws IOException {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("인증 정보가 없습니다.");
        }

        String token = authHeader.replace("Bearer ", "");
        String userId = jwtUtil.getUserId(token); // ✔ 정상 호출

        // SellerApplyDTO 생성
        SellerApplyDTO dto = new SellerApplyDTO();
        dto.setSellerName(sellerName);
        dto.setPhone(phone);
        dto.setFarmName(farmName);
        dto.setAddress(address);
        dto.setIntro(intro);
        dto.setBusinessNumber(businessNumber);
        dto.setBank(bank);
        dto.setAccountNumber(accountNumber);
        dto.setCategory(category);
        dto.setLocation(location);
        dto.setNickname(nickname);

        // 이미지 처리
        if (image != null && !image.isEmpty()) {
            dto.setImage(image.getBytes());
            dto.setImageName(image.getOriginalFilename());
        }

        return sellerApplicationService.applySeller(dto, userId);
    }

    /** 관리자 → 판매자 신청 목록 조회 */
    @GetMapping("/admin/seller-app")
    public List<Member> getSellerApplications() {
        return sellerApplicationService.getSellerApplications();
    }

    /** 관리자 → 승인 */
    @PostMapping("/admin/seller-app/{userId}/approve")
    public Member approveSeller(@PathVariable String userId) {
        return sellerApplicationService.approveSeller(userId);
    }

    /** 관리자 → 거절 */
    @PostMapping("/admin/seller-app/{userId}/reject")
    public Member rejectSeller(@PathVariable String userId) {
        return sellerApplicationService.rejectSeller(userId);
    }

}
