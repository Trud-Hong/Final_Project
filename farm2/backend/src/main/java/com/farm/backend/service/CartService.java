package com.farm.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.farm.backend.domain.Cart;
import com.farm.backend.product.entity.Product;
import com.farm.backend.product.service.ProductService;
import com.farm.backend.repository.CartRepository;
import com.farm.backend.repository.WishlistRepository;

import lombok.RequiredArgsConstructor;

@SuppressWarnings("null") // null관련 경고 무시해.
@Service
@RequiredArgsConstructor
public class CartService {

    @Autowired
    private CartRepository cartRepository; // 카트리포지토리 의존성 주입
    private final WishlistRepository wishlistRepository;
    private final ProductService productService;

    // 장바구니에 상품 추가
    public Cart addToCart(String userId, String productId, String productName, String productImage, int qty,
            int price, String selectedUnit, String selectedUnitProductName) {

        // 같은 상품 + 같은 옵션 조합이 있는지 확인
        Cart sameCart = null;
        if (selectedUnit != null) {
            // 옵션이 있는 경우: productId + selectedUnit으로 찾기
            sameCart = cartRepository.findByUserIdAndProductIdAndSelectedUnit(userId, productId, selectedUnit);
        } else {
            // 옵션이 없는 경우: productId만으로 찾기 (기존 로직)
            sameCart = cartRepository.findByUserIdAndProductId(userId, productId);
            // 기존 아이템도 옵션이 없어야 함
            if (sameCart != null && sameCart.getSelectedUnit() != null) {
                sameCart = null; // 옵션이 있는 기존 아이템은 다른 아이템으로 간주
            }
        }

        // 같은 상품 + 같은 옵션 조합이 있으면 수량만 증가
        if (sameCart != null) {
            System.out.println(
                    "기존 장바구니 아이템 발견: cartId=" + sameCart.getId() + ", 기존 수량=" + sameCart.getQty() + ", 추가 수량=" + qty);
            sameCart.setQty(sameCart.getQty() + qty);
            sameCart.setPrice(price); // 가격도 업데이트 (옵션 변경 시 가격이 바뀔 수 있음)
            return cartRepository.save(sameCart);
        }

        // 없으면 새로 추가
        System.out.println("새로운 장바구니 아이템 추가");
        Cart newCart = new Cart(userId, productId, productName, productImage, qty, price);
        newCart.setSelectedUnit(selectedUnit);
        newCart.setSelectedUnitProductName(selectedUnitProductName);
        Cart savedCart = cartRepository.save(newCart);
        System.out.println("장바구니 아이템 저장 완료: cartId=" + savedCart.getId());
        return savedCart;
    }

    // id로 장바구니 목록 가져와
    public List<Cart> getCartByUserId(String userId) {
        return cartRepository.findByUserId(userId);
    }

    // 장바구니 특정항목 삭제
    public void deleteCartItem(String cartId) {
        cartRepository.deleteById(cartId);
    }

    // 수량 변경
    public Cart updateQty(String cartId, int qty) {
        Cart cart = cartRepository.findById(cartId).orElseThrow(() -> new RuntimeException("장바구니 항목을 찾을 수 없습니다."));

        cart.setQty(qty);

        return cartRepository.save(cart);
    }

    // 옵션 변경
    public Cart updateOption(String cartId, String selectedUnit, String selectedUnitProductName, Integer price) {
        Cart cart = cartRepository.findById(cartId).orElseThrow(() -> new RuntimeException("장바구니 항목을 찾을 수 없습니다."));

        cart.setSelectedUnit(selectedUnit);
        cart.setSelectedUnitProductName(selectedUnitProductName);
        if (price != null) {
            cart.setPrice(price);
        }

        return cartRepository.save(cart);
    }

    // 장바구니 모두삭제
    public void clearCart(String userId) {
        cartRepository.deleteByUserId(userId);
    }

    // 찜목록 -> 장바구니 이동
    public void moveFromWishListToCart(String userId, String productId) {
        // 상품 정보 가져오기
        Product product = productService.findById(productId);
        if (product == null) {
            throw new RuntimeException("상품을 찾을 수 없습니다.");
        }

        // 상품명, 이미지, 가격 정보 추출
        String productName = product.getName();
        String productImage = product.getMainImage() != null ? product.getMainImage()
                : (product.getImages() != null && !product.getImages().isEmpty()
                        ? product.getImages().get(0)
                        : "");
        int price = product.getPrice();

        // 장바구니에 상품 추가 (수량 1개)
        addToCart(userId, productId, productName, productImage, 1, price, null, null);

        // 찜목록에서 제거
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
    }
}
