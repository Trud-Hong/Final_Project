package com.farm.backend.controller;

import com.farm.backend.domain.Seller;
import com.farm.backend.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequiredArgsConstructor
@RequestMapping("/seller")
public class SellerController {

    private final SellerService sellerService;

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> register(
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
            @RequestPart("userId") String userId,
            @RequestPart("nickname") String nickname,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {

        Seller saved = sellerService.saveSeller(
                sellerName, phone, farmName, address, intro,
                businessNumber, bank, accountNumber,
                category, location, userId, nickname, image);

        Map<String, Object> result = new HashMap<>();
        result.put("id", saved.getId());
        result.put("message", "success");

        return ResponseEntity.ok(result);
    }

    @GetMapping("/list")
    public List<Seller> getSellerList() {
        return sellerService.getSellerList();
    }

    @GetMapping("/{id}")
    public Seller getSellerById(@PathVariable String id) {
        return sellerService.getSellerById(id);
    }

    @PutMapping(value = "/update/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateSeller(
            @PathVariable String id,
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
            @RequestPart("userId") String userId,
            @RequestPart("nickname") String nickname,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {

        sellerService.updateSeller(id, sellerName, phone, farmName, address, intro,
                businessNumber, bank, accountNumber, category, location, userId, nickname, image);

        return ResponseEntity.ok("updated");
    }

}
