package com.farm.backend.controller;

import com.farm.backend.domain.Seller;
import com.farm.backend.domain.SellerWithdrawRequest;
import com.farm.backend.domain.WithdrawRequest;
import com.farm.backend.service.SellerService;
import com.farm.backend.service.SellerWithdrawRequestService;
import com.farm.backend.service.WithdrawRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/withdraw")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class WithdrawRequestController {

    private final WithdrawRequestService withdrawRequestService;
    private final SellerWithdrawRequestService sellerWithdrawRequestService;
    private final SellerService sellerService;

    /**
     * 출금 요청 생성 (일반 사용자)
     */
    @PostMapping("/request")
    public ResponseEntity<?> createWithdrawRequest(
            @RequestBody Map<String, Object> request,
            Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");
        }

        try {
            String userId = auth.getName();
            Long amount = Long.parseLong(request.get("amount").toString());
            String bankName = request.get("bankName").toString();
            String accountNumber = request.get("accountNumber").toString();

            WithdrawRequest withdrawRequest = withdrawRequestService.createWithdrawRequest(
                    userId, amount, bankName, accountNumber);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "출금 요청이 접수되었습니다.");
            response.put("request", withdrawRequest);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "출금 요청 처리 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 사용자의 출금 요청 목록 조회 (일반 사용자)
     */
    @GetMapping("/my-requests")
    public ResponseEntity<?> getMyWithdrawRequests(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");
        }

        try {
            String userId = auth.getName();
            List<WithdrawRequest> requests = withdrawRequestService.getUserWithdrawRequests(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("requests", requests);
            response.put("count", requests.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "출금 요청 조회 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 관리자 권한 체크 헬퍼 메서드
     */
    private boolean isAdmin(Authentication auth) {
        if (auth == null)
            return false;
        return auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    /**
     * 모든 출금 요청 목록 조회 (관리자용) - 일반 사용자 + 판매자 통합
     */
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllWithdrawRequests(Authentication auth) {
        if (auth == null || !isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("관리자 권한이 필요합니다.");
        }

        try {
            // 일반 사용자 출금 요청
            List<WithdrawRequest> userRequests = withdrawRequestService.getAllWithdrawRequests();

            // 판매자 출금 요청
            List<SellerWithdrawRequest> sellerRequests = sellerWithdrawRequestService.getAllRequests();

            // 판매자 출금 요청을 일반 출금 요청 형식으로 변환
            List<Map<String, Object>> allRequests = new ArrayList<>();

            // 일반 사용자 요청 추가
            for (WithdrawRequest req : userRequests) {
                Map<String, Object> requestMap = new HashMap<>();
                requestMap.put("id", req.getId());
                requestMap.put("userId", req.getUserId());
                requestMap.put("userName", req.getUserName());
                requestMap.put("amount", req.getAmount());
                requestMap.put("bankName", req.getBankName());
                requestMap.put("accountNumber", req.getAccountNumber());
                requestMap.put("status", req.getStatus());
                requestMap.put("rejectReason", req.getRejectReason());
                requestMap.put("requestedAt", req.getRequestedAt());
                requestMap.put("processedAt", req.getProcessedAt());
                requestMap.put("processedBy", req.getProcessedBy());
                requestMap.put("type", "USER"); // 일반 사용자 구분
                allRequests.add(requestMap);
            }

            // 판매자 요청 추가
            for (SellerWithdrawRequest req : sellerRequests) {
                Seller seller = sellerService.getSellerById(req.getSellerId());
                Map<String, Object> requestMap = new HashMap<>();
                requestMap.put("id", req.getId());
                // sellerId는 MongoDB ObjectId이므로, 실제 사용자 ID는 seller.getUserId()를 사용
                requestMap.put("userId", seller != null ? seller.getUserId() : req.getSellerId());
                requestMap.put("userName", seller != null ? seller.getNickname() : "판매자");
                requestMap.put("amount", req.getAmount());
                requestMap.put("bankName", req.getBankName());
                requestMap.put("accountNumber", req.getAccountNumber());
                // 상태 변환: REQUESTED -> PENDING
                String status = req.getStatus();
                if ("REQUESTED".equals(status)) {
                    status = "PENDING";
                }
                requestMap.put("status", status);
                requestMap.put("rejectReason", req.getRejectReason());
                requestMap.put("requestedAt", req.getRequestedAt());
                requestMap.put("processedAt", req.getProcessedAt());
                requestMap.put("processedBy", req.getProcessedBy());
                requestMap.put("type", "SELLER"); // 판매자 구분
                allRequests.add(requestMap);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("requests", allRequests);
            response.put("count", allRequests.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "출금 요청 조회 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 상태별 출금 요청 목록 조회 (관리자용)
     */
    @GetMapping("/admin/status/{status}")
    public ResponseEntity<?> getWithdrawRequestsByStatus(
            @PathVariable String status,
            Authentication auth) {
        if (auth == null || !isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("관리자 권한이 필요합니다.");
        }

        try {
            List<WithdrawRequest> requests = withdrawRequestService.getWithdrawRequestsByStatus(status);

            Map<String, Object> response = new HashMap<>();
            response.put("requests", requests);
            response.put("count", requests.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "출금 요청 조회 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 출금 요청 승인 (관리자용) - 일반 사용자 + 판매자 통합
     */
    @PostMapping("/admin/approve/{requestId}")
    public ResponseEntity<?> approveWithdrawRequest(
            @PathVariable String requestId,
            Authentication auth) {
        if (auth == null || !isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("관리자 권한이 필요합니다.");
        }

        try {
            String adminUserId = auth.getName();

            // 먼저 일반 사용자 출금 요청 확인
            try {
                WithdrawRequest request = withdrawRequestService.approveWithdrawRequest(requestId, adminUserId);
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "출금 요청이 승인되었습니다.");
                response.put("request", request);
                return ResponseEntity.ok(response);
            } catch (IllegalArgumentException e) {
                // 일반 사용자 출금 요청이 아니면 판매자 출금 요청 확인
                try {
                    SellerWithdrawRequest sellerRequest = sellerWithdrawRequestService.approve(requestId, adminUserId);
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("message", "출금 요청이 승인되었습니다.");
                    response.put("request", sellerRequest);
                    return ResponseEntity.ok(response);
                } catch (IllegalArgumentException e2) {
                    throw new IllegalArgumentException("출금 요청을 찾을 수 없습니다.");
                }
            }
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "출금 요청 승인 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 출금 요청 거절 (관리자용)
     */
    @PostMapping("/admin/reject/{requestId}")
    public ResponseEntity<?> rejectWithdrawRequest(
            @PathVariable String requestId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        if (auth == null || !isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("관리자 권한이 필요합니다.");
        }

        try {
            String adminUserId = auth.getName();
            String rejectReason = body != null && body.containsKey("rejectReason")
                    ? body.get("rejectReason")
                    : "사유 없음";

            // 먼저 일반 사용자 출금 요청 확인
            try {
                WithdrawRequest request = withdrawRequestService.rejectWithdrawRequest(
                        requestId, adminUserId, rejectReason);
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "출금 요청이 거절되었습니다.");
                response.put("request", request);
                return ResponseEntity.ok(response);
            } catch (IllegalArgumentException e) {
                // 일반 사용자 출금 요청이 아니면 판매자 출금 요청 확인
                try {
                    SellerWithdrawRequest sellerRequest = sellerWithdrawRequestService.reject(
                            requestId, adminUserId, rejectReason);
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("message", "출금 요청이 거절되었습니다.");
                    response.put("request", sellerRequest);
                    return ResponseEntity.ok(response);
                } catch (IllegalArgumentException e2) {
                    throw new IllegalArgumentException("출금 요청을 찾을 수 없습니다.");
                }
            }
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "출금 요청 거절 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 출금 요청 상세 조회 (관리자용)
     */
    @GetMapping("/admin/{requestId}")
    public ResponseEntity<?> getWithdrawRequest(
            @PathVariable String requestId,
            Authentication auth) {
        if (auth == null || !isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("관리자 권한이 필요합니다.");
        }

        try {
            WithdrawRequest request = withdrawRequestService.getWithdrawRequest(requestId);

            Map<String, Object> response = new HashMap<>();
            response.put("request", request);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "출금 요청 조회 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
