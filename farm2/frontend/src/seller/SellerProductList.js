// src/seller/SellerProductList.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./SellerProductList.css";  // CSS 분리
import { getDiscountedPrice } from '../utils/priceCalculator';

const API_BASE = "http://localhost:8080";

// 이미지 URL 처리 (상대 경로면 API_BASE 추가)
const getImageUrl = (imagePath) => {
  if (!imagePath) return '/img/no-image.png';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
};

// 현재 재고 계산 (unitOptions가 있으면 기본 옵션의 재고 사용)
const getCurrentStock = (product) => {
  if (product.unitOptions && Array.isArray(product.unitOptions) && product.unitOptions.length > 0) {
    // 기본 옵션 찾기
    const defaultOption = product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0];
    return defaultOption ? (defaultOption.stock || 0) : 0;
  }
  return product.stock || 0;
};

// 현재 단위 계산
const getCurrentUnit = (product) => {
  if (product.unitOptions && Array.isArray(product.unitOptions) && product.unitOptions.length > 0) {
    // 기본 옵션 찾기
    const defaultOption = product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0];
    return defaultOption ? (defaultOption.unit || product.unit || '') : (product.unit || '');
  }
  return product.unit || '';
};

const SellerProductList = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [sortType, setSortType] = useState("latest");
  const [expandedStocks, setExpandedStocks] = useState(new Set()); // 펼쳐진 재고 정보 추적

  const sellerId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  
  // 재고 정보 펼치기/접기 토글
  const toggleStockExpansion = (productId) => {
    setExpandedStocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };


const sortedProducts = useMemo(() => {
  const list = [...products];

  switch (sortType) {
    case "latest":
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    case "sales":
      return list.sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0));

    case "views":
      return list.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));

    case "lowStock":
      return list.sort((a, b) => getCurrentStock(a) - getCurrentStock(b));

    case "approved":
      return list.filter(p => p.status === "approved");

    case "stop":
      return list.filter(p => p.status === "stop");

    default:
      return list;
  }
}, [products, sortType]);


  /** 상품 목록 호출 */
  useEffect(() => {
    if (!sellerId) return;

    axios.get(`http://localhost:8080/seller/products/list/${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setProducts(res.data))
    .catch(err => console.error("상품 목록 오류:", err));
    
  }, [sellerId, token]);


  /** 판매중지/재개 */
  const toggleStatus = async (id, currentStatus) => {
  const next = currentStatus === "approved" ? "stop" : "approved";

  // 판매자에게 확인 메시지 띄우기
  const confirmMessage =
    next === "stop"
      ? "판매를 중단하시겠습니까?"
      : "판매를 재개하시겠습니까?";

  if (!window.confirm(confirmMessage)) {
    return; // 취소하면 함수 종료
  }

  try {
    await axios.put(
      `http://localhost:8080/seller/products/${id}/status`,
      {},
      {
        params: { status: next },
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // 상태 업데이트
    setProducts(prev =>
      prev.map(p =>
        p.id === id ? { ...p, status: next } : p
      )
    );

    // 성공 메시지
    if (next === "stop") {
      alert("상품이 판매 중지되었습니다.");
    } else {
      alert("상품이 판매 재개되었습니다.");
    }

  } catch (err) {
    console.error("상태 변경 실패", err);
    alert("상태 변경 실패");
  }
};



  /** 삭제 */
  const handleDelete = async (id) => {
    if (!window.confirm("삭제하시겠습니까?")) return;

    try {
      await axios.delete(`http://localhost:8080/seller/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("삭제 오류", err);
    }
  };
  // NavLink 스타일 자동 적용
    const getNavClass = ({ isActive }) =>
        "nav-item nav-link" + (isActive ? " active fw-bold" : "");


  return (
    <div className="sellp-container">

    <div className="sellp-header-row">
  <div className="sellp-sort-left">
    <select
      className="sellp-sort-select"
      value={sortType}
      onChange={(e) => setSortType(e.target.value)}
    >
      <option value="latest">최신순</option>
      <option value="sales">판매량 높은 순</option>
      <option value="views">조회수 높은 순</option>
      <option value="lowStock">재고 적은 순</option>
      <option value="approved">판매중</option>
      <option value="stop">판매중지</option>
    </select>
  </div>

  <button
    className="btn btn-outline-primary"
    onClick={() => navigate("/seller/products")}
  >
    상품등록
  </button>
</div>

<h2 className="sellp-title">내 상품 관리</h2>



  <div className="sellp-grid">
    {sortedProducts.map(p => {
      const currentStock = getCurrentStock(p);
      const currentUnit = getCurrentUnit(p);
      const stockWarningThreshold = p.stockWarningThreshold || 10;
      const isLowStock = currentStock > 0 && currentStock <= stockWarningThreshold;
      const isOutOfStock = currentStock === 0;
      
      return (
      <div className="sellp-card" key={p.id}>
        
       <div className="sellp-img-wrap">
  
  {/* 오버레이 정보 */}
  <div className="sellp-overlay-info">
    <div className={`sellp-status-badge ${p.status === 'approved' ? 'green' : 'red'}`}>
      {p.status === 'approved' ? '판매중' : '판매중지'}
    </div>

    <div className="sellp-meta">
      판매량 {p.salesCount ?? 0} · 조회수 {p.viewCount ?? 0}
    </div>
  </div>

  {/* 상품 이미지 */}
  <img 
    src={getImageUrl(p.mainImage)} 
    alt={p.name} 
    className="sellp-img"
    onError={(e) => {
      e.target.src = '/img/no-image.png';
    }}
  />

  {/* 재고 부족 오버레이 */}
  {isLowStock && !isOutOfStock && <div className="sellp-overlay">재고 부족</div>}
  {isOutOfStock && <div className="sellp-overlay">품절</div>}
</div>



        <div className="sellp-info">
  <h3 className="sellp-name">{p.name}</h3>
  <div className="sellp-price">
    {(() => {
      // 단위 옵션이 있는 경우 기본 옵션의 가격 사용
      let basePrice = p.price;
      if (p.unitOptions && Array.isArray(p.unitOptions) && p.unitOptions.length > 0) {
        const defaultOption = p.unitOptions.find(opt => opt.isDefault) || p.unitOptions[0];
        if (defaultOption && defaultOption.price) {
          basePrice = defaultOption.price;
        }
      }
      // 할인 적용된 가격 계산
      const discountedPrice = getDiscountedPrice(basePrice, p.discountRate, p.discountStart, p.discountEnd);
      const isDiscounted = discountedPrice < basePrice;
      
      if (isDiscounted) {
        return (
          <>
            <span style={{ color: '#27ae60', fontWeight: '700' }}>
              {discountedPrice.toLocaleString()}원
            </span>&nbsp;
            <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '14px', marginRight: '8px' }}>
              {basePrice.toLocaleString()}원
            </span>
          </>
        );
      } else {
        return <span>{basePrice.toLocaleString()}원</span>;
      }
    })()}
  </div>
  <div className="sellp-stock">
    {p.unitOptions && Array.isArray(p.unitOptions) && p.unitOptions.length > 0 ? (
      // 단위 옵션이 있는 경우
      <div className="sellp-stock-with-options">
        {(() => {
          const totalOptions = p.unitOptions.length;
          const outOfStockCount = p.unitOptions.filter(opt => (opt.stock || 0) === 0).length;
          const isExpanded = expandedStocks.has(p.id);
          
          return (
            <>
              <div className="sellp-stock-summary" onClick={() => toggleStockExpansion(p.id)}>
                <span>
                  {outOfStockCount > 0 ? (
                    <span className="text-danger fw-bold">
                      총 {totalOptions}개 옵션 ({outOfStockCount}개 품절)
                    </span>
                  ) : (
                    <span>총 {totalOptions}개 옵션</span>
                  )}
                </span>
                <span className="sellp-expand-icon">{isExpanded ? '▲' : '▼'}</span>
              </div>
              {isExpanded && (
                <div className="sellp-unit-options-detail">
                  {p.unitOptions.map((opt, idx) => {
                    const optionStock = opt.stock || 0;
                    const optionLabel = opt.productName ? `${opt.productName} - ${opt.unit}` : opt.unit || '';
                    const isOptionOutOfStock = optionStock === 0;
                    
                    return (
                      <div key={idx} className="sellp-unit-option-item">
                        <span className={isOptionOutOfStock ? 'text-danger fw-bold' : ''}>
                          {optionLabel}: {isOptionOutOfStock ? '품절' : `${optionStock}개`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}
      </div>
    ) : (
      // 단위 옵션이 없는 경우 기존 로직
      <>
        {isOutOfStock ? (
          <span className="text-danger fw-bold">품절</span>
        ) : isLowStock ? (
          <span className="text-warning fw-bold">재고: {currentStock}{currentUnit} (마감임박)</span>
        ) : (
          <span>재고: {currentStock}{currentUnit}</span>
        )}
      </>
    )}
  </div>

</div>


        <div className="sellp-buttons">
          <button className="sellp-btn sellp-view" onClick={() => navigate(`/products/detail/${p.id}`)}>상세보기</button>
          <button className="sellp-btn sellp-edit" onClick={() => navigate(`/seller/products/${p.id}`)}>수정하기</button>
          <button className="sellp-btn sellp-delete" onClick={() => handleDelete(p.id)}>삭제</button>
          <button className="sellp-btn sellp-toggle" onClick={() => toggleStatus(p.id, p.status)}>
            {p.status === "approved" ? "판매중지" : "판매재개"}
          </button>
        </div>

      </div>
      );
    })}
  </div>
</div>

  );
};

export default SellerProductList;
