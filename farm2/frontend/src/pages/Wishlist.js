// src/pages/Wishlist.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getDiscountedPrice, formatPrice as formatPriceUtil, isOnDiscount } from "../utils/priceCalculator";
import "../css/Wishlist.css";
import GotoBack from "../components/GotoBack";


//찜목록 카드 보여주는 부분
const WishlistItem = ({ item, onView, onRemove, onMove, isChecked, onCheckChange }) => {
  const product = item.product;

  const image =
    product?.mainImage
      ? (product.mainImage.startsWith("http") ? product.mainImage : `http://localhost:8080${product.mainImage}`)
      : product?.images?.[0]
      ? (product.images[0].startsWith("http") ? product.images[0] : `http://localhost:8080${product.images[0]}`)
      : "/img/no-image.png";

  // 등록일이 2~3일 이내인지 확인
  const isNewProduct = (createdAt) => {
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = now - createdDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
  };

  const isNew = isNewProduct(product?.createdAt);
  const hasDiscount = product?.discountRate && product.discountRate > 0 && isOnDiscount(product.discountRate, product.discountStart, product.discountEnd);
  const discountedPrice = hasDiscount ? getDiscountedPrice(product.price, product.discountRate, product.discountStart, product.discountEnd) : product?.price;
  
  // 단위 옵션이 있으면 해당 옵션의 재고 사용, 없으면 기본 재고 사용
  let displayStock = product?.stock || 0;
  let displayUnit = product?.unit || '';
  let isSoldOut = false;
  let isLowStock = false;
  
  if (product?.unitOptions && product.unitOptions.length > 0) {
    let selectedOption = null;
    
    // 선택된 옵션이 있으면 해당 옵션 찾기
    if (item.selectedUnit) {
      selectedOption = product.unitOptions.find(opt => {
        const unitMatch = (opt.unit || '').trim() === (item.selectedUnit || '').trim();
        if (item.selectedUnitProductName && opt.productName) {
          return unitMatch && (opt.productName || '').trim() === (item.selectedUnitProductName || '').trim();
        }
        return unitMatch;
      });
    }
    
    // 선택된 옵션이 없으면 기본 옵션 사용
    if (!selectedOption) {
      selectedOption = product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0];
    }
    
    if (selectedOption) {
      displayStock = selectedOption.stock || 0;
      displayUnit = selectedOption.unit || '';
    }
    
    // 단위 옵션이 있는 상품의 경우, 모든 옵션이 품절인지 확인
    const allOptionsSoldOut = product.unitOptions.every(opt => (opt.stock || 0) === 0);
    isSoldOut = allOptionsSoldOut;
    
    // 마감임박 확인 (품절이 아니고 재고가 임계값 이하)
    // selectedOption이 있으면 그 재고 사용, 없으면 defaultOption 사용
    const stockWarningThreshold = product?.stockWarningThreshold || 10;
    const optionForStock = selectedOption || (product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0]);
    const currentStock = optionForStock ? (optionForStock.stock || 0) : 0;
    isLowStock = !isSoldOut && currentStock > 0 && currentStock <= stockWarningThreshold;
  } else {
    // 단위 옵션이 없는 상품은 기본 재고로 판단
    isSoldOut = displayStock === 0;
    const stockWarningThreshold = product?.stockWarningThreshold || 10;
    isLowStock = !isSoldOut && displayStock > 0 && displayStock <= stockWarningThreshold;
  }
  
  const stockStatus = isSoldOut ? '품절' : '';

  //카드 클릭 시 체크 토글
  const handleCardClick = (e) => {
    // 버튼, 아이콘, 체크박스, 링크가 아닐 때만 체크 토글
    const target = e.target;
    const isButton = target.tagName === "BUTTON" || target.closest("button");
    const isIcon = target.tagName === "I" || target.closest("i");
    const isInput = target.tagName === "INPUT";
    const isLink = target.tagName === "A" || target.closest("a");
    
    if (!isButton && !isIcon && !isInput && !isLink) {
      onCheckChange();
    }
  };

  return (
    <div className="col-xl-3 col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
      <div 
        className="product-item wishlist-item-card"
        onClick={handleCardClick}
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        {/* 체크박스 */}
        <div className="wishlist-checkbox-container">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={onCheckChange}
            className="form-check-input wishlist-checkbox"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        
        <div 
          className="position-relative bg-light overflow-hidden"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          style={{ cursor: 'pointer', flexShrink: 0 }}
        >
          <img 
            className="img-fluid w-100" 
            src={image} 
            alt={product?.name}
            style={{ height: '250px', objectFit: 'cover' }}
          />
          {isNew && (
            <div className="bg-danger rounded text-white position-absolute start-0 top-0 m-4 py-1 px-3" style={{ fontWeight: 'bold', zIndex: 5 }}>
              NEW
            </div>
          )}
          {hasDiscount && (
            <div className="bg-warning rounded text-white position-absolute end-0 top-0 m-4 py-1 px-3" style={{ fontWeight: 'bold', zIndex: 5 }}>
              {product.discountRate}% 할인
            </div>
          )}
          {product?.bulkMinQuantity && product?.bulkDiscountRate && (
            <div className="bg-info rounded text-white position-absolute end-0" style={{ 
              fontWeight: 'bold', 
              zIndex: 5,
              fontSize: '12px',
              padding: '4px 8px',
              top: hasDiscount ? '60px' : '16px',
              right: '16px',
              whiteSpace: 'nowrap'
            }}>
              {product.bulkMinQuantity}개 이상 {product.bulkDiscountRate}% 추가
            </div>
          )}
          {stockStatus === '품절' && (
            <div className="bg-dark rounded text-white position-absolute start-50 translate-middle-x bottom-0 m-4 py-1 px-3" style={{ fontWeight: 'bold', zIndex: 5 }}>
              품절
            </div>
          )}
          {/* 재고 마감임박은 이미지 영역에 표시 */}
          {isLowStock && !isSoldOut && (
            <div className="bg-warning rounded text-white position-absolute start-0 bottom-0 m-4 py-1 px-3" style={{ fontWeight: 'bold', zIndex: 5 }}>
              마감임박
            </div>
          )}
        </div>

        <div className="text-center p-2 wishlist-content" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flexGrow: 1
        }}>
          {/* 1. 상품명 */}
          <a 
            className="d-block h5"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            style={{ 
              cursor: 'pointer', 
              color: '#333', 
              textDecoration: 'none',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '22px',
              minHeight: '44px',
              marginBottom: '0px'
            }}
            onMouseEnter={(e) => e.target.style.color = '#28a745'}
            onMouseLeave={(e) => e.target.style.color = '#333'}
            title={product?.name}
          >
            {product?.name}
          </a>
          
          {/* 2. 가격 */}
          <div style={{ marginBottom: '4px' }}>
            {hasDiscount ? (
              <>
                <span className="text-danger me-2" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {formatPriceUtil(discountedPrice)}원
                </span>
                <span className="text-muted text-decoration-line-through" style={{ fontSize: '14px' }}>
                  {formatPriceUtil(product.price)}원
                </span>
              </>
            ) : (
              <span className="text-primary" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {product?.price ? formatPriceUtil(product.price) : '0'}원
              </span>
            )}
          </div>
          
          {/* 3. 판매자 */}
          {product?.sellerNickname && (
            <div className="d-flex align-items-center justify-content-center gap-2" style={{ fontSize: '12px', marginBottom: '4px' }}>
              <span className="badge bg-primary" style={{ 
                fontSize: '10px', 
                padding: '3px 8px',
                fontWeight: '600'
              }}>
                판매자
              </span>
              <span style={{ color: '#333', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }} title={product.sellerNickname}>
                {product.sellerNickname}
              </span>
            </div>
          )}
        </div>

        <div className="d-flex border-top wishlist-actions">
          <small className="w-50 text-center border-end py-2">
            <button
              className="text-body wishlist-action-button"
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
            >
              <i className="fa fa-eye text-primary me-2"></i>상세보기
            </button>
          </small>
          <small className="w-50 text-center py-2">
            <button
              className="text-body wishlist-action-button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <i className="fa fa-heart-broken text-danger me-2"></i>찜 취소
            </button>
          </small>
        </div>
      </div>
    </div>
  );
};

//찜목록 불러오기, 제품정보, 삭제 기능
export default function Wishlist() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [checkedItems, setCheckedItems] = useState([]); // 선택된 상품 ID 목록

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      alert("로그인 후 이용해주세요.");
      navigate("/login");
      return;
    }

    const fetchWishlist = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/wishlist/${userId}`);
        const wish = res.data;
        
        // 개별 상품 정보를 가져올 때 에러가 발생해도 계속 진행
        const fetchProducts = await Promise.allSettled(
          wish.map(async (item) => {
            try {
              const p = await axios.get(`http://localhost:8080/products/detail/${item.productId}`);
              return { ...item, product: p.data };
            } catch (error) {
              console.error(`상품 ${item.productId} 정보 조회 실패:`, error);
              // 상품 정보를 가져오지 못한 경우 기본값 반환
              return { 
                ...item, 
                product: { 
                  id: item.productId, 
                  name: '상품 정보를 불러올 수 없습니다',
                  price: 0,
                  stock: 0,
                  mainImage: '/img/no-image.png'
                } 
              };
            }
          })
        );
        
        // 성공한 항목만 필터링
        const successfulProducts = fetchProducts
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
        
        setList(successfulProducts);
        
        // 일부 상품 정보를 가져오지 못한 경우 알림
        const failedCount = fetchProducts.filter(result => result.status === 'rejected').length;
        if (failedCount > 0) {
          console.warn(`${failedCount}개 상품의 정보를 불러오지 못했습니다.`);
        }
      } catch (error) {
        console.error('찜목록 조회 오류:', error);
        alert('찜목록을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
        setList([]);
      }
    };

    fetchWishlist();
  }, [navigate, userId]);

  const removeWishlist = async (productId) => {
    await axios.post("http://localhost:8080/api/wishlist/remove", {
      userId,
      productId,
    });
    setList((prev) => prev.filter((item) => item.productId !== productId));
    setCheckedItems((prev) => prev.filter((id) => id !== productId));
  };

  const moveToCart = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/cart/from-wishlist", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"

        },
        body: JSON.stringify({
          userId: userId,
          productId: productId
        })
      });

      if(!res.ok) throw new Error();
      alert("장바구니로 이동했습니다!");

      setList(prev => prev.filter(item => item.productId !== productId));
      setCheckedItems(prev => prev.filter(id => id !== productId));
    } catch (error) {
      alert("오류 발생!")
    }
  };

  const moveToCartPage = () => {
    navigate("/mypage/cart");
  }

  // 체크박스 변경 핸들러
  const handleCheckChange = (productId) => {
    setCheckedItems(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };


  // 전체 선택/해제
  const handleCheckAll = (e) => {
    if (e.target.checked) {
      setCheckedItems(list.map(item => item.productId));
    } else {
      setCheckedItems([]);
    }
  };

  // 선택한 상품들을 장바구니로 이동
  const moveSelectedToCart = async () => {
    if (checkedItems.length === 0) {
      alert("장바구니에 담을 상품을 선택해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      let successCount = 0;
      let failCount = 0;

      // 선택한 상품들을 순차적으로 장바구니로 이동
      for (const productId of checkedItems) {
        try {
          const res = await fetch("http://localhost:8080/api/cart/from-wishlist", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              userId: userId,
              productId: productId
            })
          });

          if (res.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      // 성공한 상품들을 리스트에서 제거
      setList(prev => prev.filter(item => !checkedItems.includes(item.productId)));
      setCheckedItems([]);

      if (failCount === 0) {
        alert(`선택한 ${successCount}개 상품이 장바구니로 이동했습니다!`);
      } else {
        alert(`${successCount}개 상품은 장바구니로 이동했지만, ${failCount}개 상품은 실패했습니다.`);
      }
    } catch (error) {
      alert("오류가 발생했습니다!");
    }
  };

  // 선택한 상품 찜 취소 함수
const confirmAndRemoveWishlist = async (productIds) => {
  if (!productIds || productIds.length === 0) {
    alert("삭제할 상품을 선택해주세요.");
    return;
  }

  const confirmDelete = window.confirm(
    `선택한 ${productIds.length}개의 상품을 정말 삭제하시겠습니까?`
  );
  if (!confirmDelete) return;

  // 삭제
  for (const productId of productIds) {
    await removeWishlist(productId);
  }

  alert("선택한 상품을 찜에서 삭제했습니다.");
};

  return (
    <div> 
       <div className="container-fluid page-header wow fadeIn" data-wow-delay="0.1s">
                <div className="container">
                    <h1 className="display-3 mb-3 animated slideInDown wishlist-page-title">
                           찜 목록
                    </h1>
                    <nav aria-label="breadcrumb animated slideInDown">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><a className="text-body" href="/">홈페이지</a></li>
                            <li className="breadcrumb-item"><a className="text-body" href="#">판매정보</a></li>
                            <li className="breadcrumb-item text-dark active" aria-current="page">찜 목록</li>
                        </ol>
                    </nav>
                </div>
            </div>

    <div className="container-xxl py-5">
      <div className="container">
            {/* 상단 컨트롤 영역 */}
            <div className="row mb-4 align-items-center">
              <div className="col-md-6">
                <div className="d-flex align-items-center">
                  <input
                    type="checkbox"
                    checked={checkedItems.length === list.length && list.length > 0}
                    onChange={handleCheckAll}
                    className="form-check-input me-2"
                  />
                  <label className="form-check-label wishlist-checkbox-label">
                    전체 선택 ({checkedItems.length}/{list.length})
                  </label>
                </div>
              </div>
              <div className="col-md-6 text-end">
                <button
                  className="btn btn-success wishlist-button"
                  onClick={moveToCartPage}
                >
                  <i className="fa fa-shopping-cart me-2"></i>
                  장바구니
                </button>&nbsp;
                <button
                  className="btn btn-success wishlist-button"
                  onClick={moveSelectedToCart}
                  disabled={checkedItems.length === 0}
                  style={{
                    minWidth: "200px",
                    opacity: checkedItems.length === 0 ? 0.5 : 1
                  }}
                >
                  <i className="fa fa-shopping-cart me-2"></i>
                  선택한 상품 장바구니에 담기 ({checkedItems.length})
                </button>&nbsp;

                <button
                  className="btn btn-danger wishlist-button"
                  onClick={() => { confirmAndRemoveWishlist(checkedItems)}}
                  disabled={checkedItems.length === 0}
                  style={{
                    minWidth: "100px",
                    opacity: checkedItems.length === 0 ? 0.5 : 1
                  }}
                  >
                    <i className="fa fa-heart-broken me-2"></i>
                    찜 취소({checkedItems.length})
                  </button>
              </div>
            </div>

            {/* 상품 목록 */}
            {list.length === 0 ? (
              <p className="text-center wishlist-empty-message">
                현재 찜한 상품이 없습니다.
              </p>
            ) : (
            <div className="row g-4">
              {list.map((item) => (
                <WishlistItem
                  key={item.productId}
                  item={item}
                  isChecked={checkedItems.includes(item.productId)}
                  onCheckChange={() => handleCheckChange(item.productId)}
                  onView={() => navigate(`/products/detail/${item.productId}`)}
                  onRemove={() => confirmAndRemoveWishlist([item.productId])}
                  onMove={() => moveToCart(item.productId)}
                />
              ))}
            </div>
        )}
        
      </div> <GotoBack />
    </div>
    
    </div>
  );
}
