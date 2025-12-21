package com.farm.backend.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.farm.backend.domain.Order;
import com.farm.backend.domain.Seller;
import com.farm.backend.repository.OrderRepository;
import com.farm.backend.repository.SellerRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final SellerRepository sellerRepository;

    public Order updateStatus(String orderId, String newStatus) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));

        order.setStatus(newStatus);
        orderRepository.save(order);

        if ("거래완료".equals(newStatus)) {
            Seller seller = sellerRepository.findByUserId(order.getSellerId());

            if (seller != null) {
                seller.setBalance(Optional.ofNullable(seller.getBalance()).orElse(0L) + order.getTotalPrice());
                seller.setTotalSales(Optional.ofNullable(seller.getTotalSales()).orElse(0L) + order.getTotalPrice());
                sellerRepository.save(seller);
            }
        }

        return order;
    }

}
