import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { calculateTotalAmount, formatPrice as formatPriceUtil, getDiscountedPrice, calculateItemTotal } from "../utils/priceCalculator";

export default function PaymentComplete() {
const [searchParams] = useSearchParams();
const navigate = useNavigate();
const [status, setStatus] = useState("결제 승인 중...");
const [orderInfo, setOrderInfo] = useState(null);
const [productInfo, setProductInfo] = useState(null);
const [loading, setLoading] = useState(true);
const [multipleItems, setMultipleItems] = useState(null); // 여러 상품 구매 정보

const pg_token = searchParams.get("pg_token");
const tidFromQuery = searchParams.get("tid");
const orderIdFromQuery = searchParams.get("orderId");

useEffect(() => {
const processPayment = async () => {
  const paymentType = searchParams.get("type"); // mileage or kakao
  const orderId = orderIdFromQuery || localStorage.getItem("mileage_order_id") || localStorage.getItem("kakao_order_id");

  // 마일리지 결제인 경우
  if (paymentType === "mileage" || localStorage.getItem("mileage_order_id")) {
    try {
      const token = localStorage.getItem("token");
      const productId = localStorage.getItem("mileage_productId");
      const productName = localStorage.getItem("mileage_productName");
      const quantity = parseInt(localStorage.getItem("mileage_quantity") || "1", 10);
      const totalAmount = parseInt(localStorage.getItem("mileage_totalAmount") || "0", 10);
      const mileageUsed = parseInt(localStorage.getItem("mileage_mileageUsed") || "0", 10);
      
      // 선택한 옵션 정보 가져오기
      let selectedUnitOption = null;
      try {
        const optionStr = localStorage.getItem("mileage_selectedUnitOption");
        if (optionStr) {
          selectedUnitOption = JSON.parse(optionStr);
        }
      } catch (err) {
        console.error("옵션 정보 파싱 실패:", err);
      }

      // 상품 정보 가져오기
      // 실제 주문 시 저장된 totalAmount를 그대로 사용 (재계산하지 않음)
      let calculatedTotalAmount = totalAmount;
      if (productId) {
        try {
          const productResponse = await axios.get(`http://localhost:8080/products/detail/${productId}`);
          const product = productResponse.data;
          setProductInfo(product);
          // totalAmount는 실제 주문 시 저장된 값을 그대로 사용
        } catch (err) {
          console.error("상품 정보 조회 실패:", err);
        }
      }

      // 주문 정보 저장
      setOrderInfo({ 
        orderId: orderId || `mileage-order-${Date.now()}`,
        orderNumber: orderId || `mileage-order-${Date.now()}`,
        productName, 
        productId,
        quantity, 
        totalAmount: calculatedTotalAmount, // 할인 적용된 가격 사용
        mileageUsed,
        orderDate: new Date().toISOString(),
        selectedUnitOption // 선택한 옵션 정보 추가
      });

      // 결제 완료 플래그 설정
      if (productId) {
        sessionStorage.setItem('payment_completed', 'true');
        sessionStorage.setItem('payment_productId', productId);
      }

      // 여러 상품 구매 정보 확인
      const multipleOrdersStr = localStorage.getItem("mileage_multiple_orders");
      const multipleItemsStr = localStorage.getItem("mileage_multiple_items");
      if (multipleOrdersStr && multipleItemsStr) {
        try {
          const multipleOrders = JSON.parse(multipleOrdersStr);
          const items = JSON.parse(multipleItemsStr);
          setMultipleItems({
            orderIds: multipleOrders,
            items: items
          });
          
          // 여러 상품 구매인 경우 총 결제 금액을 다시 계산
          // 각 상품의 상세 정보를 가져와서 정확한 금액 계산
          const productPromises = items.map(async (item) => {
            try {
              const productResponse = await axios.get(`http://localhost:8080/products/detail/${item.productId}`);
              return productResponse.data;
            } catch (err) {
              console.error(`상품 ${item.productId} 정보 조회 실패:`, err);
              return null;
            }
          });
          
          const products = await Promise.all(productPromises);
          // totalAmount는 실제 주문 시 저장된 값을 그대로 사용 (재계산하지 않음)
          
          // 주문 정보 업데이트 (여러 상품 구매인 경우)
          const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
          setOrderInfo(prev => ({
            ...prev,
            totalAmount: calculatedTotalAmount,
            quantity: totalQuantity,
            productName: productName // 이미 "상품명 외 N개" 형식으로 저장됨
          }));
        } catch (err) {
          console.error("여러 상품 정보 파싱 실패:", err);
        }
      }

      // 로컬스토리지 제거
      localStorage.removeItem("mileage_order_id");
      localStorage.removeItem("mileage_productId");
      localStorage.removeItem("mileage_productName");
      localStorage.removeItem("mileage_quantity");
      localStorage.removeItem("mileage_totalAmount");
      localStorage.removeItem("mileage_mileageUsed");
      localStorage.removeItem("mileage_selectedUnitOption");
      localStorage.removeItem("mileage_multiple_orders");
      localStorage.removeItem("mileage_multiple_items");

      setStatus("구매가 완료되었습니다!");
    } catch (err) {
      console.error(err);
      setStatus("구매 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
    return;
  }

  // 카카오페이 결제인 경우 (기존 로직)
  const tid = tidFromQuery || localStorage.getItem("kakao_tid");

  if (!pg_token || !tid || !orderId) {  
    setStatus("결제 정보가 없습니다.");  
    setLoading(false);
    return;  
  }  

  try {  
    const token = localStorage.getItem("token");  
    const productId = localStorage.getItem("kakao_productId");
    const productName = localStorage.getItem("kakao_productName");  
    const quantity = parseInt(localStorage.getItem("kakao_quantity") || "1", 10);  
    const totalAmount = parseInt(localStorage.getItem("kakao_totalAmount") || "0", 10);  

    // 마일리지 사용 정보 가져오기
    const mileageUsed = parseInt(localStorage.getItem("kakao_mileageUsed") || "0", 10);
    
    const payload = { productId, productName, quantity, totalAmount, mileageUsed };  

    const response = await axios.post(  
      "http://localhost:8080/payment/approve",  
      payload,  
      {  
        params: { tid, pg_token, orderId },  
        headers: {  
          Authorization: `Bearer ${token}`,  
          "Content-Type": "application/json",  
        },  
      }  
    );  

    // 결제 완료 플래그 설정
    if (productId) {
      sessionStorage.setItem('payment_completed', 'true');
      sessionStorage.setItem('payment_productId', productId);
    }

    // 상품 정보 가져오기
    // 실제 주문 시 저장된 totalAmount를 그대로 사용 (재계산하지 않음)
    let calculatedTotalAmount = totalAmount;
    if (productId) {
      try {
        const productResponse = await axios.get(`http://localhost:8080/products/detail/${productId}`);
        const product = productResponse.data;
        setProductInfo(product);
        // totalAmount는 실제 주문 시 저장된 값을 그대로 사용
      } catch (err) {
        console.error("상품 정보 조회 실패:", err);
      }
    }

    // 로컬스토리지 제거
    localStorage.removeItem("kakao_tid");  
    localStorage.removeItem("kakao_order_id");  
    localStorage.removeItem("kakao_productId");
    localStorage.removeItem("kakao_productName");  
    localStorage.removeItem("kakao_quantity");  
    localStorage.removeItem("kakao_totalAmount");
    localStorage.removeItem("kakao_mileageUsed");

    // 주문 정보 저장
    const savedOrder = response.data?.order;
    // 실제 주문 시 저장된 totalAmount를 그대로 사용 (재계산하지 않음)
    
    setOrderInfo({ 
      orderId, 
      orderNumber: savedOrder?.id || orderId,
      productName, 
      productId,
      quantity, 
      totalAmount: totalAmount, // 실제 주문 시 저장된 값 사용
      mileageUsed,
      orderDate: savedOrder?.orderDate || new Date().toISOString()
    });  
    setStatus("결제가 완료되었습니다!");  
  } catch (err) {  
    console.error(err);  
    setStatus("결제 승인 중 오류가 발생했습니다.");  
  } finally {
    setLoading(false);
  }
};  

processPayment();  

}, [pg_token, tidFromQuery, orderIdFromQuery, searchParams]);

const formatPrice = (v) => (typeof v === "number" ? `${v.toLocaleString()}원` : v);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
};

return (
  <>
    <div className="container-fluid page-header" style={{ paddingTop: '100px', paddingBottom: '50px' }}>
      <div className="container">
        <h1 className="display-5 mb-3">결제 완료</h1>
      </div>
    </div>

    <div className="container py-5">
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">로딩 중...</span>
          </div>
          <p className="mt-3 text-muted">{status}</p>
        </div>
      ) : orderInfo ? (
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* 결제 완료 알림 */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', backgroundColor: '#f8f9fa' }}>
              <div className="card-body text-center p-5">
                <div className="mb-4">
                  <i className="fa fa-check-circle" style={{ fontSize: '80px', color: '#28a745' }}></i>
                </div>
                <h2 className="mb-3" style={{ color: '#28a745', fontWeight: 'bold' }}>결제가 완료되었습니다</h2>
                <p className="text-muted mb-0">주문이 정상적으로 접수되었습니다.</p>
              </div>
            </div>

            {/* 주문 정보 카드 */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
              <div className="card-header bg-white border-bottom" style={{ borderRadius: '12px 12px 0 0', padding: '20px' }}>
                <h4 className="mb-0 fw-bold">주문 정보</h4>
              </div>
              <div className="card-body p-4">
                <div className="row mb-3">
                  <div className="col-md-3 text-muted">주문번호</div>
                  <div className="col-md-9">
                    <strong className="font-monospace">
                      {multipleItems && multipleItems.orderIds.length > 1 
                        ? `${orderInfo.orderNumber ? orderInfo.orderNumber.substring(0, 8).toUpperCase() : orderInfo.orderId} (${multipleItems.orderIds.length}개 주문)`
                        : (orderInfo.orderNumber ? orderInfo.orderNumber.substring(0, 8).toUpperCase() : orderInfo.orderId)}
                    </strong>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-3 text-muted">주문일시</div>
                  <div className="col-md-9">{formatDate(orderInfo.orderDate)}</div>
                </div>
                {multipleItems && multipleItems.items.length > 1 && (
                  <div className="row mb-3">
                    <div className="col-md-3 text-muted">주문 상품 수</div>
                    <div className="col-md-9">
                      <strong>{multipleItems.items.length}개 상품</strong>
                    </div>
                  </div>
                )}
                <div className="row">
                  <div className="col-md-3 text-muted">결제금액</div>
                  <div className="col-md-9">
                    <span className="text-danger fw-bold fs-4">{formatPrice(orderInfo.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 주문 상품 정보 */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
              <div className="card-header bg-white border-bottom" style={{ borderRadius: '12px 12px 0 0', padding: '20px' }}>
                <h4 className="mb-0 fw-bold">주문 상품 {multipleItems && multipleItems.items.length > 1 ? `(${multipleItems.items.length}개)` : ''}</h4>
              </div>
              <div className="card-body p-4">
                {multipleItems && multipleItems.items.length > 1 ? (
                  // 여러 상품 구매인 경우
                  <div>
                    {multipleItems.items.map((item, index) => {
                      const imageUrl = item.productImage?.startsWith('http') 
                        ? item.productImage 
                        : (item.productImage 
                          ? `http://localhost:8080${item.productImage.startsWith('/') ? '' : '/'}${item.productImage}`
                          : '/img/no-image.png');
                      
                      return (
                        <div key={index} className="d-flex gap-4 mb-3 pb-3 border-bottom">
                          <img 
                            src={imageUrl}
                            alt={item.productName}
                            style={{
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                            onClick={() => navigate(`/products/detail/${item.productId}`)}
                            onError={(e) => {
                              e.target.src = '/img/no-image.png';
                            }}
                          />
                          <div className="flex-grow-1">
                            <h6 
                              className="mb-2 fw-bold"
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/products/detail/${item.productId}`)}
                              onMouseEnter={(e) => {
                                e.target.style.color = '#28a745';
                                e.target.style.textDecoration = 'underline';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.color = '#333';
                                e.target.style.textDecoration = 'none';
                              }}
                            >
                              {item.productName}
                            </h6>
                            {item.selectedUnitOption && (
                              <div className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                                <span>옵션: </span>
                                <span className="badge bg-secondary">
                                  {item.selectedUnitOption.productName 
                                    ? `${item.selectedUnitOption.productName} - ${item.selectedUnitOption.unit}` 
                                    : item.selectedUnitOption.unit}
                                </span>
                              </div>
                            )}
                            <div className="text-muted mb-2">
                              <span>수량: </span>
                              <span className="badge bg-info text-dark">{item.quantity}개</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // 단일 상품 구매인 경우
                  <div className="d-flex gap-4">
                    {(() => {
                      const imageUrl = productInfo?.mainImage
                        ? (productInfo.mainImage.startsWith('http')
                          ? productInfo.mainImage
                          : `http://localhost:8080${productInfo.mainImage.startsWith('/') ? '' : '/'}${productInfo.mainImage}`)
                        : '/img/no-image.png';
                      
                      return (
                        <img 
                          src={imageUrl} 
                          alt={orderInfo.productName}
                          style={{
                            width: '120px',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                          onClick={() => navigate(`/products/detail/${orderInfo.productId}`)}
                          onError={(e) => {
                            e.target.src = '/img/no-image.png';
                          }}
                        />
                      );
                    })()}
                    <div className="flex-grow-1">
                      <h5 
                        className="mb-2 fw-bold"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/products/detail/${orderInfo.productId}`)}
                        onMouseEnter={(e) => {
                          e.target.style.color = '#28a745';
                          e.target.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = '#333';
                          e.target.style.textDecoration = 'none';
                        }}
                      >
                        {orderInfo.productName}
                      </h5>
                      {orderInfo.selectedUnitOption && (
                        <div className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                          <span>옵션: </span>
                          <span className="badge bg-secondary">
                            {orderInfo.selectedUnitOption.productName 
                              ? `${orderInfo.selectedUnitOption.productName} - ${orderInfo.selectedUnitOption.unit}` 
                              : orderInfo.selectedUnitOption.unit}
                          </span>
                        </div>
                      )}
                      <div className="text-muted mb-2">
                        <span>수량: </span>
                        <span className="badge bg-info text-dark">{orderInfo.quantity}개</span>
                      </div>
                      {(() => {
                        if (!productInfo) {
                          // 상품 정보가 없으면 orderInfo.totalAmount에서 배송비(3000원)를 뺀 값 사용
                          const estimatedProductTotal = orderInfo.totalAmount - 3000;
                          return (
                            <div>
                              <span className="text-muted">상품금액: </span>
                              <strong>{formatPriceUtil(estimatedProductTotal)}</strong>
                            </div>
                          );
                        }

                        // 상품 정보가 있는 경우 calculateItemTotal 사용 (기본 할인 + 대량구매 할인 모두 포함)
                        // 단위 옵션이 선택된 경우 해당 옵션의 가격으로 임시 product 객체 생성
                        let productForCalculation = { ...productInfo };
                        
                        if (orderInfo.selectedUnitOption && orderInfo.selectedUnitOption.price) {
                          // 선택한 옵션의 가격 사용
                          productForCalculation.price = orderInfo.selectedUnitOption.price;
                        } else if (productInfo.unitOptions && productInfo.unitOptions.length > 0) {
                          // 단위 옵션이 있지만 선택되지 않은 경우 기본 옵션의 가격 사용
                          const defaultOption = productInfo.unitOptions.find(opt => opt.isDefault) || productInfo.unitOptions[0];
                          if (defaultOption && defaultOption.price) {
                            productForCalculation.price = defaultOption.price;
                          }
                        }
                        
                        // calculateItemTotal 사용 (기본 할인 + 대량구매 할인 모두 적용)
                        const productTotal = calculateItemTotal(productForCalculation, orderInfo.quantity);
                        
                        return (
                          <div>
                            <span className="text-muted">상품금액: </span>
                            <strong>{formatPriceUtil(productTotal)}</strong>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 배송 안내 */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', backgroundColor: '#fff3cd' }}>
              <div className="card-body p-4">
                <h5 className="mb-3">
                  <i className="fa fa-truck me-2"></i>
                  배송 안내
                </h5>
                <div className="mb-0" style={{ paddingLeft: '20px' }}>
                  <div>주문 확인 후 1-2일 내에 배송이 시작됩니다.</div>
                  <div>배송 시작 시 SMS로 알림을 드립니다.</div>
                  <div>배송 조회는 구매내역에서 확인하실 수 있습니다.</div>
                </div>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="d-flex gap-3 justify-content-center">
              <button
                className="btn btn-outline-primary btn-lg px-5"
                onClick={() => navigate('/products')}
              >
                <i className="fa fa-shopping-bag me-2"></i>
                쇼핑 계속하기
              </button>
              <button
                className="btn btn-primary btn-lg px-5"
                onClick={() => navigate('/userpage/orderlist')}
              >
                <i className="fa fa-list me-2"></i>
                구매내역 보기
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-danger text-center">
          <h4>결제 처리 중 오류가 발생했습니다.</h4>
          <p className="mb-0">{status}</p>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => navigate('/userpage/orderlist')}
          >
            구매내역으로 이동
          </button>
        </div>
      )}
    </div>
  </>
);
}
