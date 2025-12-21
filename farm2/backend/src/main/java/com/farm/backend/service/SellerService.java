package com.farm.backend.service;

import com.farm.backend.domain.Seller;
import com.farm.backend.repository.SellerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SellerService {

    private final SellerRepository sellerRepository;

    public Seller saveSeller(String sellerName,
            String phone,
            String farmName,
            String address,
            String intro,
            String businessNumber,
            String bank,
            String accountNumber,
            String category,
            String location,
            String userId,
            String nickname,
            MultipartFile image)
            throws IOException {

        Seller seller = new Seller();

        seller.setSellerName(sellerName);
        seller.setPhone(phone);
        seller.setFarmName(farmName);
        seller.setAddress(address);
        seller.setIntro(intro);
        seller.setBusinessNumber(businessNumber);
        seller.setBank(bank);
        seller.setAccountNumber(accountNumber);
        seller.setCategory(category);
        seller.setLocation(location);
        seller.setUserId(userId);
        seller.setNickname(nickname);

        if (image != null && !image.isEmpty()) {
            seller.setImage(image.getBytes());
            seller.setImageName(image.getOriginalFilename());
        }

        return sellerRepository.save(seller);
    }

    public List<Seller> getSellerList() {
        return sellerRepository.findAll();
    }

    public Seller getSellerById(String id) {
        return sellerRepository.findById(id).orElse(null);
    }

    public Seller updateSeller(
            String id,
            String sellerName,
            String phone,
            String farmName,
            String address,
            String intro,
            String businessNumber,
            String bank,
            String accountNumber,
            String category,
            String location,
            String userId,
            String nickname,
            MultipartFile image) throws IOException {

        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Seller not found"));

        seller.setSellerName(sellerName);
        seller.setPhone(phone);
        seller.setFarmName(farmName);
        seller.setAddress(address);
        seller.setIntro(intro);
        seller.setBusinessNumber(businessNumber);
        seller.setBank(bank);
        seller.setAccountNumber(accountNumber);
        seller.setCategory(category);
        seller.setLocation(location);
        seller.setUserId(userId);
        seller.setNickname(nickname);

        if (image != null && !image.isEmpty()) {
            seller.setImage(image.getBytes());
            seller.setImageName(image.getOriginalFilename());
        }

        return sellerRepository.save(seller);
    }

    public Seller findByUserId(String userId) {
        return sellerRepository.findByUserId(userId);
    }

}
