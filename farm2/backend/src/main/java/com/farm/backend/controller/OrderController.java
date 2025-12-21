// 혜정 11/17 주문내역 검색 컨트롤러

package com.farm.backend.controller;

import java.io.File;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
//CrossOrigin,GetMapping,RequestMapping,RequestParam,RestController를 비롯한 어노테이션 모두 이걸로 퉁쳐

import com.farm.backend.domain.Mileage;
import com.farm.backend.domain.Order;
import com.farm.backend.domain.Seller;
import com.farm.backend.product.entity.Product;
import com.farm.backend.product.repository.ProductRepository;
import com.farm.backend.repository.OrderRepository;
import com.farm.backend.repository.SellerRepository;
import com.farm.backend.service.MileageService;
import com.farm.backend.service.OrderService;
import com.farm.backend.service.QRCodeService;

import lombok.RequiredArgsConstructor;

import com.farm.backend.product.service.ProductService;

//리액트를 위한 부분
@RestController // JSON 형태로 데이터 주고받기
@CrossOrigin(origins = "http://localhost:3000") // 11/22 시큐어리티 컨피그에서 설정해서 주석처리함
@RequestMapping("api/orders") // 데이터관련된 주소 구분api처리
@RequiredArgsConstructor
public class OrderController {

    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private OrderService orderService;
    @Autowired
    private SellerRepository sellerRepository;

    // 구매완료시 호출되는API
    @PostMapping("/save")
    public Order saveOrder(@RequestBody Order order) {

        order.setOrderDate(LocalDateTime.now());

        Product product = productRepository.findById(order.getProductId()).orElse(null);

        if (product != null) {
            order.setSellerId(product.getSellerId());
        }

        // 재고 차감
        productService.decreaseStock(order.getProductId(), order.getQty());

        // 판매량 증가
        productService.increaseSalesCount(order.getProductId(), order.getQty());

        // 주문 저장
        return orderRepository.save(order);
    }

    /**
     * 마일리지로 주문 생성 (결제 없이)
     */
    @PostMapping("/create-with-mileage")
    public ResponseEntity<?> createOrderWithMileage(@RequestBody Map<String, Object> request, Authentication auth) {
        if (auth == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        try {
            String userId = auth.getName();
            System.out.println("사용자 ID: " + userId);

            if (!request.containsKey("productId")) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "productId가 없습니다.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            String productId = request.get("productId").toString();
            String productName = request.containsKey("productName") ? request.get("productName").toString() : "";
            int quantity = request.containsKey("quantity") ? Integer.parseInt(request.get("quantity").toString()) : 0;
            int totalAmount = request.containsKey("totalAmount")
                    ? Integer.parseInt(request.get("totalAmount").toString())
                    : 0;
            String orderGroupId = request.containsKey("orderGroupId") ? request.get("orderGroupId").toString() : null;

            // 선택된 단위 정보 추출
            String selectedUnit = request.containsKey("unit") && request.get("unit") != null
                    ? request.get("unit").toString()
                    : null;
            String selectedUnitProductName = request.containsKey("selectedUnitProductName")
                    && request.get("selectedUnitProductName") != null
                            ? request.get("selectedUnitProductName").toString()
                            : null;
            Integer unitPrice = null;
            if (request.containsKey("unitPrice") && request.get("unitPrice") != null) {
                Object unitPriceObj = request.get("unitPrice");
                if (unitPriceObj instanceof Number) {
                    unitPrice = ((Number) unitPriceObj).intValue();
                } else {
                    unitPrice = Integer.parseInt(unitPriceObj.toString());
                }
            }

            // 배송지 정보 추출
            Map<String, Object> address = null;
            if (request.containsKey("address") && request.get("address") != null) {
                address = (Map<String, Object>) request.get("address");
            }

            // 마일리지 잔액 확인
            Mileage mileage = mileageService.getOrCreateMileage(userId);
            if (mileage.getBalance() < totalAmount) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message",
                        "마일리지 잔액이 부족합니다. (보유: " + mileage.getBalance() + "원, 필요: " + totalAmount + "원)");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // 상품 정보 조회
            com.farm.backend.product.entity.Product product = productService.findById(productId);
            if (product == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "상품을 찾을 수 없습니다.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // 재고 확인 (unitOptions가 있으면 선택된 옵션의 재고 확인)
            if (product.getUnitOptions() != null && !product.getUnitOptions().isEmpty() && selectedUnit != null) {
                for (int i = 0; i < product.getUnitOptions().size(); i++) {
                    com.farm.backend.product.entity.UnitOption opt = product.getUnitOptions().get(i);
                }

                // unitOptions에서 선택된 단위 찾기 (unit과 productName 둘 다 비교)
                com.farm.backend.product.entity.UnitOption selectedOption = null;
                for (com.farm.backend.product.entity.UnitOption opt : product.getUnitOptions()) {
                    // unit 비교
                    boolean unitMatch = selectedUnit != null && opt.getUnit() != null
                            && selectedUnit.trim().equals(opt.getUnit().trim());

                    // productName 비교 (둘 다 null이 아니면 비교)
                    boolean productNameMatch = false;
                    if (selectedUnitProductName != null && opt.getProductName() != null) {
                        productNameMatch = selectedUnitProductName.trim().equals(opt.getProductName().trim());
                    } else if (selectedUnitProductName == null && opt.getProductName() == null) {
                        // 둘 다 null이면 일치로 간주
                        productNameMatch = true;
                    }
                    // 한쪽만 null이면 불일치로 간주 (더 엄격한 매칭)

                    // unit과 productName 둘 다 일치해야 매칭 성공
                    if (unitMatch && productNameMatch) {
                        selectedOption = opt;
                        break;
                    } else {
                        if (!unitMatch) {
                        } else if (!productNameMatch) {
                        }
                    }
                }
                if (selectedOption != null) {
                    if (selectedOption.getStock() < quantity) {
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", false);
                        response.put("message",
                                "재고가 부족합니다. (선택 옵션: "
                                        + (selectedOption.getProductName() != null ? selectedOption.getProductName()
                                                : selectedUnit)
                                        + ", 현재 재고: " + selectedOption.getStock() + ")");
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
                    }
                } else {
                    for (com.farm.backend.product.entity.UnitOption opt : product.getUnitOptions()) {
                    }
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("message", "선택한 단위 옵션을 찾을 수 없습니다.");
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
                }
            } else {
                // unitOptions가 없으면 기본 재고 확인
                if (product.getStock() < quantity) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("message", "재고가 부족합니다.");
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
                }
            }

            // 주문 ID 생성 (실무 형식: ORD-YYYYMMDD-HHMMSS-XXXX)
            LocalDateTime now = LocalDateTime.now();
            // String dateStr =
            // now.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
            String timeStr = now.format(java.time.format.DateTimeFormatter.ofPattern("HHmmss"));
            String randomStr = String.format("%04d", (int) (Math.random() * 10000));
            String orderId = timeStr + "-" + randomStr;

            // 마일리지 차감
            mileageService.useMileage(userId, (long) totalAmount, orderId, "상품 구매 - " + productName);

            // 주문 생성
            int finalUnitPrice = unitPrice != null ? unitPrice : (totalAmount / quantity);
            String productImage = product.getMainImage();
            if (productImage == null && product.getImages() != null && !product.getImages().isEmpty()) {
                productImage = product.getImages().get(0);
            }

            Order order = new Order(userId, productName, productId, productImage, finalUnitPrice, quantity, totalAmount,
                    LocalDateTime.now());
            order.setSellerId(product.getSellerId());
            order.setMileageUsed((long) totalAmount);
            order.setStatus("결제완료"); // status로 통일 (배송준비중, 배송중, 배송완료, 환불완료 등)
            order.setId(orderId);
            if (orderGroupId != null && !orderGroupId.isEmpty()) {
                order.setOrderGroupId(orderGroupId);
            }

            // 배송지 정보 설정
            if (address != null) {
                order.setDeliveryTitle(address.get("title") != null ? address.get("title").toString() : null);
                order.setDeliveryPost(address.get("post") != null ? address.get("post").toString() : null);
                order.setDeliveryAddr1(address.get("addr1") != null ? address.get("addr1").toString() : null);
                order.setDeliveryAddr2(address.get("addr2") != null ? address.get("addr2").toString() : null);
                order.setDeliveryPhone(address.get("phone") != null ? address.get("phone").toString() : null);
            }

            // 단위 옵션 정보 설정
            if (selectedUnit != null) {
                order.setSelectedUnit(selectedUnit);
            }
            if (selectedUnitProductName != null) {
                order.setSelectedUnitProductName(selectedUnitProductName);
            }

            Order savedOrder = orderRepository.save(order);

            // 재고 차감 (unitOptions가 있으면 선택된 옵션의 재고 차감)
            // 재고 차감 시점에 product를 다시 조회하여 최신 정보 사용
            com.farm.backend.product.entity.Product productForStock = productService.findById(productId);
            if (productForStock == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "상품을 찾을 수 없습니다.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            if (productForStock.getUnitOptions() != null && !productForStock.getUnitOptions().isEmpty()
                    && selectedUnit != null) {
                for (int i = 0; i < productForStock.getUnitOptions().size(); i++) {
                    com.farm.backend.product.entity.UnitOption opt = productForStock.getUnitOptions().get(i);
                }

                // unitOptions에서 선택된 단위 찾아서 재고 차감 (unit과 productName 둘 다 비교)
                com.farm.backend.product.entity.UnitOption selectedOption = null;
                int selectedOptionIndex = -1;
                for (int i = 0; i < productForStock.getUnitOptions().size(); i++) {
                    com.farm.backend.product.entity.UnitOption opt = productForStock.getUnitOptions().get(i);

                    // unit 비교
                    boolean unitMatch = selectedUnit != null && opt.getUnit() != null
                            && selectedUnit.trim().equals(opt.getUnit().trim());

                    // productName 비교 (둘 다 null이 아니면 비교)
                    boolean productNameMatch = false;
                    if (selectedUnitProductName != null && opt.getProductName() != null) {
                        productNameMatch = selectedUnitProductName.trim().equals(opt.getProductName().trim());
                    } else if (selectedUnitProductName == null && opt.getProductName() == null) {
                        // 둘 다 null이면 일치로 간주
                        productNameMatch = true;
                    }
                    // 한쪽만 null이면 불일치로 간주 (더 엄격한 매칭)

                    // unit과 productName 둘 다 일치해야 매칭 성공
                    if (unitMatch && productNameMatch) {
                        selectedOption = opt;
                        selectedOptionIndex = i;
                        break; // 정확히 일치하는 옵션을 찾았으므로 종료
                    } else {
                        if (!unitMatch) {
                        }
                        if (!productNameMatch) {
                        }
                    }
                }

                if (productForStock.getUnitOptions() != null) {
                    for (int i = 0; i < productForStock.getUnitOptions().size(); i++) {
                        com.farm.backend.product.entity.UnitOption opt = productForStock.getUnitOptions().get(i);
                    }
                }
                if (selectedOption != null && selectedOptionIndex >= 0) {

                    // 재고 재확인 (최신 정보 기준)
                    int currentStock = selectedOption.getStock();
                    if (currentStock < quantity) {
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", false);
                        response.put("message", "재고가 부족합니다. (현재 재고: " + currentStock + ")");
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
                    }

                    // unitOptions 리스트를 새로 생성하여 저장 (MongoDB 중첩 리스트 업데이트 문제 해결)
                    List<com.farm.backend.product.entity.UnitOption> updatedUnitOptions = new ArrayList<>();
                    for (int i = 0; i < productForStock.getUnitOptions().size(); i++) {
                        com.farm.backend.product.entity.UnitOption opt = productForStock.getUnitOptions().get(i);
                        if (i == selectedOptionIndex) {
                            // 선택된 옵션의 재고만 차감
                            com.farm.backend.product.entity.UnitOption updatedOpt = com.farm.backend.product.entity.UnitOption
                                    .builder()
                                    .productName(opt.getProductName())
                                    .unit(opt.getUnit())
                                    .price(opt.getPrice())
                                    .stock(currentStock - quantity)
                                    .isDefault(opt.getIsDefault())
                                    .build();
                            updatedUnitOptions.add(updatedOpt);
                        } else {
                            // 다른 옵션은 그대로 유지
                            updatedUnitOptions.add(opt);
                        }
                    }
                    productForStock.setUnitOptions(updatedUnitOptions);

                    productForStock.setUpdatedAt(LocalDateTime.now());
                    Product savedProduct = productRepository.save(productForStock);

                    // 저장 후 확인
                    if (savedProduct.getUnitOptions() != null) {
                        for (com.farm.backend.product.entity.UnitOption opt : savedProduct.getUnitOptions()) {
                            if ((selectedOption.getProductName() != null && opt.getProductName() != null
                                    && opt.getProductName().equals(selectedOption.getProductName()))
                                    || (selectedOption.getProductName() == null && opt.getUnit() != null
                                            && opt.getUnit().equals(selectedOption.getUnit()))) {
                            }
                        }
                    }
                } else {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("message", "선택한 단위 옵션을 찾을 수 없습니다.");
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
                }
            } else {
                // unitOptions가 없으면 기본 재고 차감
                productService.decreaseStock(productId, quantity);
            }

            // 판매량 증가 (여기도 service 로 위임)
            productService.increaseSalesCount(productId, quantity);

            // 응답 생성 (이게 빠져있었음!)
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("order", savedOrder);
            response.put("message", "주문이 완료되었습니다.");

            // QR 생성 3개 (배송 준비, 배송중, 배송 완료)
            qrCodeService.generateQRCode(
                    "http://localhost:3000/qr-scan?orderId=" + savedOrder.getId() + "&step=PACKED",
                    savedOrder.getId() + "_PACKED");

            qrCodeService.generateQRCode(
                    "http://localhost:3000/qr-scan?orderId=" + savedOrder.getId() + "&step=PICKED_UP",
                    savedOrder.getId() + "_PICKED_UP");

            qrCodeService.generateQRCode(
                    "http://localhost:3000/qr-scan?orderId=" + savedOrder.getId() + "&step=DELIVERED",
                    savedOrder.getId() + "_DELIVERED");

            System.out.println("QR 자동 생성 완료: " + savedOrder.getId());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("마일리지 주문 생성 오류: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "주문 생성 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 주문내역 인터페이스(리포지토리-오더리포지토리) 가져와
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private MileageService mileageService;

    @Autowired
    private ProductService productService;

    @GetMapping("/findAllOrders")
    public List<Order> getAll() {
        // return orderRepository.findAll(Sort.by(Sort.Direction.DESC, "orderDate"));
        List<Order> result = orderRepository.findAll(Sort.by(Sort.Direction.DESC, "orderDate"));

        return result;
    }

    @GetMapping
    public List<Order> getAllOrders(@RequestParam String userId) {
        // return orderRepository.findByUserId(userId);

        List<Order> result = orderRepository.findByUserId(userId);

        System.out.println("백엔드에서 넘기는 주문 목록: " + result);

        return result;

    }
    // 전체 검색 (userId로 찾기)

    // 기간검색
    @GetMapping("/period")
    public List<Order> getOrdersByPeriod(
            @RequestParam String userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        return orderRepository.findByUserIdAndOrderDateBetween(userId, startDate, endDate);
    }

    // 전체 회원 기간검색
    @GetMapping("/allacountperiod")
    public List<Order> getOrdersAllByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        return orderRepository.findAllByOrderDateBetween(startDate, endDate);
    }

    // 환불 제외 전체 회원 기간검색
    @GetMapping("/allacountperiodwithoutrefund")
    public List<Order> getOrdersAllByPeriodWithoutRefund(
            @RequestParam String status,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        return orderRepository.findByStatusAndOrderDateBetween(status, startDate, endDate);
    }

    // 키워드 검색
    @GetMapping("/kSearch")
    public List<Order> searchOrders(
            @RequestParam String userId,
            @RequestParam String pName) {

        return orderRepository.findByUserIdAndPnameContaining(userId, pName);
    }

    // 키워드, 날짜모두 검색
    @GetMapping("/tSearch")
    public List<Order> searchByBoth(
            @RequestParam String userId,
            @RequestParam String pName,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        return orderRepository.findByUserIdAndPnameContainingAndOrderDateBetween(userId, pName, startDate, endDate);
    }

    // 환불 api 추가
    @PutMapping("/refund/{orderId}")
    public ResponseEntity<?> refundOrder(@PathVariable String orderId) {
        try {

            Optional<Order> optionalOrder = orderRepository.findById(orderId);

            if (!optionalOrder.isPresent()) {
                return ResponseEntity.badRequest().body("주문을 찾을 수 없습니다.");
            }

            Order order = optionalOrder.get();

            if ("환불완료".equals(order.getStatus())) {
                return ResponseEntity.badRequest().body("이미 환불 완료된 주문입니다.");
            }

            // -----------------------------
            // 재고 복구
            // -----------------------------
            productService.increaseStock(order.getProductId(), order.getQty());

            // 판매량 감소 추가
            productService.decreaseSalesCount(order.getProductId(), order.getQty());

            // -----------------------------
            // 마일리지 복구
            // -----------------------------
            if (order.getMileageUsed() != null && order.getMileageUsed() > 0) {
                mileageService.refundMileage(
                        order.getUserId(),
                        order.getMileageUsed(),
                        order.getId(),
                        "환불 처리로 마일리지 반환");
            }

            // 정산금 회수 (거래완료 주문일 때만)
            if ("거래완료".equals(order.getRefundPreviousStatus())) {

                Seller seller = sellerRepository.findByUserId(order.getSellerId());

                if (seller != null) {
                    long before = seller.getBalance();
                    long refundAmount = order.getTotalPrice();

                    seller.setBalance(Math.max(0, before - refundAmount));
                    seller.setTotalSales(Math.max(0, seller.getTotalSales() - refundAmount));

                    sellerRepository.save(seller);
                }
            }

            // -----------------------------
            // 3) 주문 상태 변경
            // -----------------------------
            order.setStatus("환불완료");

            Order updateOrder = orderRepository.save(order);
            System.out.println("환불 처리완료: " + updateOrder);

            return ResponseEntity.ok(updateOrder);

        } catch (Exception e) {
            System.err.println("환불 처리 오류: " + e.getMessage());
            return ResponseEntity.badRequest().body("환불처리 중 오류가 발생했습니다.");
        }
    }

    // 주문취소
    @PutMapping("/cancel-request/{orderId}")
    public ResponseEntity<?> requestCancel(
            @PathVariable String orderId,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        Optional<Order> optional = orderRepository.findById(orderId);
        if (!optional.isPresent())
            return ResponseEntity.badRequest().body("주문 없음");

        Order order = optional.get();

        // 권한 확인
        if (!order.getUserId().equals(auth.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("권한 없음");
        }

        // 상태 체크
        if (!("결제완료".equals(order.getStatus()) || "배송준비".equals(order.getStatus()))) {
            return ResponseEntity.badRequest().body("해당 상태에서 취소 불가");
        }

        // 사유 저장
        order.setCancelReason(body.get("cancelReason"));

        // 이전 상태 저장
        order.setCancelPreviousStatus(order.getStatus());

        // 상태 변경
        order.setStatus("취소요청");

        orderRepository.save(order);

        return ResponseEntity.ok("취소 요청 완료");
    }

    // 취소 요청 취소(구매자)
    @PutMapping("/cancel-cancel/{orderId}")
    public ResponseEntity<?> cancelCancelRequest(@PathVariable String orderId, Authentication auth) {

        Optional<Order> optional = orderRepository.findById(orderId);
        if (!optional.isPresent())
            return ResponseEntity.badRequest().body("주문 없음");

        Order order = optional.get();

        // 권한 체크
        if (!order.getUserId().equals(auth.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("권한 없음");
        }

        if (!"취소요청".equals(order.getStatus())) {
            return ResponseEntity.badRequest().body("취소요청 상태가 아님");
        }

        // 이전 상태 복귀
        String prev = order.getCancelPreviousStatus();
        if (prev == null)
            prev = "결제완료";

        order.setStatus(prev);

        // 초기화
        order.setCancelReason(null);
        order.setCancelRejected(false);
        order.setCancelRejectReason(null);
        order.setCancelPreviousStatus(null);

        orderRepository.save(order);

        return ResponseEntity.ok("취소 요청 취소됨");
    }

    // 취소 승인(판매자)
    @PutMapping("/cancel-approve/{orderId}")
    public ResponseEntity<?> approveCancel(
            @PathVariable String orderId,
            Authentication auth) {

        Optional<Order> optional = orderRepository.findById(orderId);
        if (!optional.isPresent())
            return ResponseEntity.badRequest().body("주문 없음");

        Order order = optional.get();

        if (!order.getSellerId().equals(auth.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("권한 없음");
        }

        if (!"취소요청".equals(order.getStatus())) {
            return ResponseEntity.badRequest().body("취소요청 상태가 아님");
        }

        // 재고 복구
        productService.increaseStock(order.getProductId(), order.getQty());

        // 판매량 복구
        productService.decreaseSalesCount(order.getProductId(), order.getQty());

        // 마일리지 복구
        if (order.getMileageUsed() != null && order.getMileageUsed() > 0) {
            mileageService.refundMileage(
                    order.getUserId(),
                    order.getMileageUsed(),
                    order.getId(),
                    "주문취소 환급");

        }

        order.setStatus("취소완료");

        orderRepository.save(order);

        return ResponseEntity.ok("취소 승인 완료");
    }

    // 취소 거절 (판매자)
    @PutMapping("/cancel-reject/{orderId}")
    public ResponseEntity<?> rejectCancel(
            @PathVariable String orderId,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        Optional<Order> optional = orderRepository.findById(orderId);
        if (!optional.isPresent())
            return ResponseEntity.badRequest().body("주문 없음");

        Order order = optional.get();

        if (!order.getSellerId().equals(auth.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("권한 없음");
        }

        if (!"취소요청".equals(order.getStatus())) {
            return ResponseEntity.badRequest().body("취소요청 상태가 아님");
        }

        String prev = order.getCancelPreviousStatus();
        if (prev == null)
            prev = "결제완료";

        order.setStatus(prev);
        order.setCancelRejected(true);
        order.setCancelRejectReason(body.get("rejectReason"));

        order.setCancelPreviousStatus(null);

        orderRepository.save(order);

        return ResponseEntity.ok("취소 거절 완료");
    }

    @PutMapping("/refund-request/{orderId}")
    public ResponseEntity<?> refundRequest(@PathVariable String orderId, @RequestBody Map<String, String> body) {
        try {
            Optional<Order> optionalOrder = orderRepository.findById(orderId);

            if (!optionalOrder.isPresent()) {
                return ResponseEntity.badRequest().body("주문을 찾을 수 없습니다.");
            }

            Order order = optionalOrder.get();

            // 환불 사유
            String reason = body.get("refundReason");
            order.setRefundReason(reason);

            // 이미 환불 완료된 주문
            if ("환불완료".equals(order.getStatus())) {
                return ResponseEntity.badRequest().body("이미 환불 완료된 주문입니다.");
            }

            // 이미 요청된 주문
            if ("환불요청".equals(order.getStatus())) {
                return ResponseEntity.badRequest().body("이미 환불 요청된 주문입니다.");
            }

            // 현재 상태 저장
            order.setRefundPreviousStatus(order.getStatus());

            // 상태 변경
            order.setStatus("환불요청");

            orderRepository.save(order);
            return ResponseEntity.ok("환불 요청 처리 완료");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("환불 요청 처리 실패: " + e.getMessage());
        }
    }

    // 환불 취소
    @PutMapping("/refund-cancel/{orderId}")
    public ResponseEntity<?> cancelRefund(@PathVariable String orderId) {
        try {
            Optional<Order> optionalOrder = orderRepository.findById(orderId);

            if (!optionalOrder.isPresent()) {
                return ResponseEntity.badRequest().body("주문을 찾을 수 없습니다.");
            }

            Order order = optionalOrder.get();

            // 환불요청 상태가 아닐 때
            if (!"환불요청".equals(order.getStatus())) {
                return ResponseEntity.badRequest().body("환불 요청 상태가 아닙니다.");
            }

            // 이전 상태로 복귀
            String prev = order.getRefundPreviousStatus();
            if (prev == null || prev.trim().isEmpty()) {
                prev = "결제완료"; // fallback
            }

            order.setStatus(prev);

            // 환불거절 표시 제거
            order.setRefundRejected(false);
            order.setRefundRejectReason(null);

            // 초기화
            order.setRefundPreviousStatus(null);

            orderRepository.save(order);

            return ResponseEntity.ok("환불 요청 취소 완료");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("환불 요청 취소 실패: " + e.getMessage());
        }
    }

    // 환불 거절
    @PutMapping("/refund-reject/{orderId}")
    public ResponseEntity<?> rejectRefund(
            @PathVariable String orderId,
            @RequestBody Map<String, String> body) {

        Optional<Order> optionalOrder = orderRepository.findById(orderId);
        if (!optionalOrder.isPresent()) {
            return ResponseEntity.badRequest().body("주문을 찾을 수 없습니다.");
        }

        Order order = optionalOrder.get();

        if (!"환불요청".equals(order.getStatus())) {
            return ResponseEntity.badRequest().body("환불 요청 상태가 아닙니다.");
        }

        String prev = order.getRefundPreviousStatus();
        if (prev == null || prev.trim().isEmpty()) {
            prev = "거래완료"; // fallback
        }

        // 이전 상태 복귀
        order.setStatus(prev);

        // 환불 거절 플래그 유지
        order.setRefundRejected(true);

        // 거절 사유
        String rejectReason = body.get("rejectReason");
        order.setRefundRejectReason(rejectReason);

        // 이전 상태 초기화
        order.setRefundPreviousStatus(null);

        orderRepository.save(order);

        return ResponseEntity.ok("환불 거절 처리 완료");
    }

    /**
     * 배송완료 처리 (판매자가 호출)
     */
    @PutMapping("/delivery-complete/{orderId}")
    public ResponseEntity<?> completeDelivery(@PathVariable String orderId, Authentication auth) {
        try {
            Optional<Order> optionalOrder = orderRepository.findById(orderId);
            if (!optionalOrder.isPresent()) {
                return ResponseEntity.badRequest().body("주문을 찾을 수 없습니다.");
            }

            Order order = optionalOrder.get();

            // 판매자 권한 확인
            if (auth != null && !order.getSellerId().equals(auth.getName())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("권한이 없습니다.");
            }

            order.setStatus("배송완료");
            orderRepository.save(order);

            // 배송완료 + 인수완료 모두 되었으면 판매자에게 마일리지 지급
            checkAndGrantMileageToSeller(order);

            return ResponseEntity.ok(order);
        } catch (Exception e) {
            System.err.println("배송완료 처리 오류: " + e.getMessage());
            return ResponseEntity.badRequest().body("배송완료 처리 중 오류가 발생했습니다.");
        }
    }

    /**
     * 인수확인 처리 (구매자가 호출)
     */
    @PutMapping("/receive-complete/{orderId}")
    public ResponseEntity<?> completeReceive(@PathVariable String orderId, Authentication auth) {
        try {
            Optional<Order> optionalOrder = orderRepository.findById(orderId);
            if (!optionalOrder.isPresent()) {
                return ResponseEntity.badRequest().body("주문을 찾을 수 없습니다.");
            }

            Order order = optionalOrder.get();

            // 구매자 권한 확인
            if (auth != null && !order.getUserId().equals(auth.getName())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("권한이 없습니다.");
            }

            order.setReceiveStatus("인수완료");
            orderRepository.save(order);

            // 배송완료 + 인수완료 모두 되었으면 판매자에게 마일리지 지급
            Order updatedOrder = orderService.updateStatus(orderId, "거래완료");

            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            System.err.println("인수확인 처리 오류: " + e.getMessage());
            e.printStackTrace(); // ← 이거 추가
            return ResponseEntity.badRequest().body("인수확인 처리 중 오류가 발생했습니다.");
        }
    }

    /**
     * 배송완료와 인수완료가 모두 되었는지 확인하고 주문을 거래 완료 상태로 변경
     */
    private void checkAndGrantMileageToSeller(Order order) {
        // 이미 거래 완료 처리된 주문은 다시 처리하지 않음
        if ("거래완료".equals(order.getStatus())) {
            return;
        }

        // 배송완료 && 인수완료 확인 후 거래 완료 처리
        if ("배송완료".equals(order.getStatus()) && "인수완료".equals(order.getReceiveStatus())) {
            order.setStatus("거래완료");
            orderRepository.save(order);
            System.out.println("주문 " + order.getId() + "이(가) 거래 완료 상태로 변경되었습니다.");
        }
    }

    // 판매자 주문 조회
    @GetMapping("/seller/{sellerId}")
    public List<Order> getOrdersBySeller(@PathVariable String sellerId) {
        return orderRepository.findBySellerId(sellerId);
    }

    // @PutMapping("/{id}/status")
    // public ResponseEntity<?> updateOrderStatus(
    // @PathVariable String id,
    // @RequestParam String status) {

    // Optional<Order> optionalOrder = orderRepository.findById(id);
    // if (!optionalOrder.isPresent()) {
    // return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Order not found");
    // }

    // Order order = optionalOrder.get();
    // order.setStatus(status); // MongoDB status 변경
    // orderRepository.save(order); // 실제 DB 저장

    // return ResponseEntity.ok("Status updated");
    // }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable String id,
            @RequestParam String status) {

        Order updatedOrder = orderService.updateStatus(id, status);

        return ResponseEntity.ok(updatedOrder);
    }

    /**
     * QR 스캔으로 배송 상태 자동 업데이트
     * 예: /api/orders/scan?orderId=xxx&step=PICKED_UP&key=SECRETKEY123
     */
    @CrossOrigin(origins = "http://localhost:3000")
    @GetMapping("/scan")
    public ResponseEntity<?> scanUpdate(
            @RequestParam String orderId,
            @RequestParam String step,
            @RequestParam(required = false) String key) {

        // 간단한 보안키 검증 (선택)
        String SECRET = "DELIVERY_QR_SECRET";
        if (key == null || !key.equals(SECRET)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid QR access");
        }

        // 주문 조회
        Optional<Order> optional = orderRepository.findById(orderId);
        if (!optional.isPresent()) {
            return ResponseEntity.badRequest().body("Invalid orderId");
        }

        Order order = optional.get();

        String newStatus;

        switch (step) {

            case "PACKED": // 포장 완료
                newStatus = "배송준비";
                break;

            case "PICKED_UP": // 기사 픽업
                newStatus = "배송중";
                break;

            case "DELIVERED": // 배송 완료
                newStatus = "배송완료";
                break;

            case "RETURN_START": // 반품 수거 시작
                newStatus = "반품수거중";
                break;

            case "RETURNED": // 반품 완료
                newStatus = "반품완료";
                break;

            default:
                return ResponseEntity.badRequest().body("Unknown step: " + step);
        }

        // DB 상태 업데이트
        order.setStatus(newStatus);
        orderRepository.save(order);

        // 로그 출력
        System.out.println("QR 스캔 처리됨: Order=" + orderId + ", Status=" + newStatus);

        // 응답
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("orderId", orderId);
        response.put("status", newStatus);
        response.put("time", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    @Autowired
    private QRCodeService qrCodeService;

    @GetMapping("/generate-qr/{orderId}/{step}")
    public ResponseEntity<?> generateQR(
            @PathVariable String orderId,
            @PathVariable String step) {
        try { // QR 코드 IP 설정
            String url = "http://localhost:3000/qr-scan"
                    + "?orderId=" + orderId
                    + "&step=" + step;

            File qrFile = qrCodeService.generateQRCode(url, orderId + "_" + step);

            return ResponseEntity.ok("QR 생성 완료: " + qrFile.getAbsolutePath());

        } catch (Exception e) {
            return ResponseEntity.status(500).body("QR 생성 실패: " + e.getMessage());
        }
    }

    /*
     * -------------------임시 데이터
     * 
     * @PostMapping("/test")
     * 
     * @SuppressWarnings("null") // null관련 경고 무시해.
     * public Order createTestOrder(@RequestBody Order order) {
     * 
     * return orderRepository.save(order);
     * }
     * 
     * @GetMapping("/test2") // 추후 post로 변경해야함.test만 get사용
     * public String createBulkTestData() {
     * 
     * Order order1 = new Order("hj", "사과5kg", 1500, 2, 3000, LocalDateTime.of(2025,
     * 11, 1, 10, 30));
     * 
     * Order order2 = new Order("kk", "사과2kg", 1000, 2, 2000, LocalDateTime.of(2025,
     * 11, 17, 10, 30));
     * 
     * orderRepository.save(order1);
     * orderRepository.save(order2);
     * 
     * return "저장완료";
     * }
     */

}
