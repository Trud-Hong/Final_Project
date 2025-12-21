import React, { useEffect, useState } from 'react';
import '../css/PaymentModal.css';
import { calculateTotalAmount as calculateTotalAmountUtil, formatPrice as formatPriceUtil, isOnDiscount } from '../utils/priceCalculator';

const PaymentModal = ({ 
  show, 
  product, 
  quantity, 
  onClose, 
  onConfirm, 
  isProcessing,
  formatPrice,
  getDiscountedPrice,
  getImageUrl,
  calculateTotalAmount
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('kakaopay'); // 기본값: 카카오페이
  const [showTestBanner, setShowTestBanner] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [applyCoupon, setApplyCoupon] = useState(false);
  const [mileageBalance, setMileageBalance] = useState(0);
  const [useMileage, setUseMileage] = useState(false);
  const [mileageAmount, setMileageAmount] = useState(0);

  useEffect(() => {
    if (show) {
      setTimeout(() => setIsVisible(true), 10);
      // 모달이 열릴 때마다 초기화
      setSelectedPayment('kakaopay');
      setAgreedToTerms(false);
      setApplyCoupon(false);
      setUseMileage(false);
      setMileageAmount(0);
      fetchMileageBalance();
    } else {
      setIsVisible(false);
    }
  }, [show]);

  // 마일리지 잔액 조회
  const fetchMileageBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await fetch('http://localhost:8080/api/mileage/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMileageBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('마일리지 조회 실패:', error);
    }
  };

  if (!show) return null;

  // 계산 함수들
  const getUnitPrice = () => {
    let unitPrice = getDiscountedPrice(product.price, product.discountRate, product.discountStart, product.discountEnd);
    if (product.bulkMinQuantity && product.bulkDiscountRate && quantity >= product.bulkMinQuantity) {
      unitPrice = Math.round(unitPrice * (100 - product.bulkDiscountRate) / 100);
    }
    return unitPrice;
  };

  const getProductTotal = () => {
    if (!product || !quantity) return 0;
    const { productTotal } = calculateTotalAmountUtil(product, quantity);
    return productTotal;
  };

  const getShippingFee = () => {
    const productTotal = getProductTotal();
    return (product.shippingFreeThreshold && productTotal >= product.shippingFreeThreshold) ? 0 : 3000;
  };

  const getDiscountAmount = () => {
    if (product.bulkMinQuantity && quantity >= product.bulkMinQuantity) {
      return getDiscountedPrice(product.price, product.discountRate, product.discountStart, product.discountEnd) * quantity * product.bulkDiscountRate / 100;
    }
    return 0;
  };

  const getFinalAmount = () => {
    let amount = calculateTotalAmount();
    if (applyCoupon) {
      amount = Math.max(0, amount - 5000);
    }
    if (useMileage && mileageAmount > 0) {
      amount = Math.max(0, amount - mileageAmount);
    }
    return amount;
  };

  const handleMileageChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    const finalAmount = getFinalAmount();
    const maxMileage = Math.min(mileageBalance, finalAmount);
    setMileageAmount(Math.min(value, maxMileage));
  };

  const handleUseAllMileage = () => {
    const finalAmount = getFinalAmount();
    const maxMileage = Math.min(mileageBalance, finalAmount);
    setMileageAmount(maxMileage);
  };

  // 결제 방식 선택 핸들러
  const handlePaymentSelect = (paymentMethod) => {
    setSelectedPayment(paymentMethod);
  };

  // 결제하기 버튼 클릭 핸들러
  const handlePayment = async () => {
    if (!agreedToTerms) {
      alert('결제 서비스 이용 약관에 동의해주세요.');
      return;
    }
    
    // 마일리지 사용 처리
    if (useMileage && mileageAmount > 0) {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // 주문 ID는 결제 완료 후에 생성되므로 임시로 처리
          // 실제로는 결제 완료 후 주문 ID를 받아서 마일리지 사용 처리
          const orderId = `temp-${Date.now()}`;
          const response = await fetch('http://localhost:8080/api/mileage/use', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              amount: mileageAmount,
              orderId: orderId,
              description: '상품 구매 마일리지 사용'
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.message || '마일리지 사용에 실패했습니다.');
            return;
          }
        } catch (error) {
          console.error('마일리지 사용 실패:', error);
          alert('마일리지 사용 중 오류가 발생했습니다.');
          return;
        }
      }
    }
    
    // 마일리지 사용 정보를 localStorage에 저장
    if (useMileage && mileageAmount > 0) {
      localStorage.setItem("kakao_mileageUsed", mileageAmount.toString());
    } else {
      localStorage.setItem("kakao_mileageUsed", "0");
    }
    
    // 어떤 결제 방식을 선택하든 카카오페이로 결제 진행
    onConfirm();
  };

  // 결제 방식 목록
  const paymentMethods = [
    { id: 'bank', name: '실시간 계좌이체', icon: '🏦' },
    { id: 'card', name: '신용·체크카드', icon: '💳' },
    { id: 'toss', name: 'toss pay', icon: '💰', logo: true },
    { id: 'payco', name: 'PAYCO', icon: '🎁', logo: true, badge: '적립 혜택' },
    { id: 'kakaopay', name: 'pay', icon: '💛', logo: true, isKakao: true },
    { id: 'npay', name: 'N pay', icon: '🛒', logo: true },
    { id: 'phone', name: '휴대폰', icon: '📱' }
  ];

  return (
    <div 
      className={`payment-modal-backdrop ${isVisible ? 'visible' : 'hidden'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onClose();
        }
      }}
    >
      <div 
        className={`payment-modal-content ${isVisible ? 'visible' : 'hidden'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 테스트 환경 배너 */}
        {showTestBanner && (
          <div className="payment-test-banner">
            <div className="payment-test-banner-content">
              <span className="payment-test-banner-icon">⚠️</span>
              <span className="payment-test-banner-text">
                테스트 환경 - 실제로 결제되지 않습니다.
              </span>
            </div>
            <button
              onClick={() => setShowTestBanner(false)}
              className="payment-test-banner-close"
            >
              ×
            </button>
          </div>
        )}

        {/* 헤더 */}
        <div className="payment-modal-header">
          <h2 className="payment-modal-title">
            결제 방법
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="payment-modal-close-btn"
          >
            ×
          </button>
        </div>

        {/* 스크롤 가능한 본문 */}
        <div className="payment-modal-body">
          {/* 결제 방법 선택 그리드 */}
          <div className="payment-methods-grid">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => handlePaymentSelect(method.id)}
                disabled={isProcessing}
                className={`payment-method-btn ${selectedPayment === method.id ? 'selected' : ''} ${method.isKakao && selectedPayment === method.id ? 'kakao' : ''}`}
              >
                {method.badge && (
                  <div className="payment-method-badge">
                    {method.badge}
                  </div>
                )}
                {method.logo ? (
                  <div className="payment-method-logo">
                    {method.name}
                  </div>
                ) : (
                  <>
                    <span className="payment-method-icon">{method.icon}</span>
                    <span className="payment-method-name">
                      {method.name}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>

          {/* 결제 혜택 정보 */}
          <div className="payment-benefits">
            <div className="payment-benefits-item">
              <span className="payment-benefits-bold">신한카드</span> 최대 3개월 무이자 할부
            </div>
            <div className="payment-benefits-item">
              Payco · 포인트 결제 시 1% 적립
            </div>
            <div className="payment-benefits-item">
              <a href="#" className="payment-benefits-link">
                신용카드 무이자 할부 안내 &gt;
              </a>
            </div>
          </div>

          {/* 마일리지 사용 영역 */}
          {mileageBalance > 0 && (
            <div className="payment-mileage-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label className="payment-checkbox-label" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={useMileage}
                    onChange={(e) => {
                      setUseMileage(e.target.checked);
                      if (!e.target.checked) {
                        setMileageAmount(0);
                      }
                    }}
                    disabled={isProcessing}
                    className="payment-checkbox"
                  />
                  <span>마일리지 사용</span>
                </label>
                <span style={{ fontSize: '14px', color: '#666' }}>
                  보유: <strong>{mileageBalance.toLocaleString()}원</strong>
                </span>
              </div>
              {useMileage && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={mileageAmount || ''}
                    onChange={handleMileageChange}
                    placeholder="사용할 마일리지"
                    disabled={isProcessing}
                    style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    min="0"
                    max={Math.min(mileageBalance, getFinalAmount())}
                  />
                  <button
                    type="button"
                    onClick={handleUseAllMileage}
                    disabled={isProcessing}
                    style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    전액 사용
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 결제 정보 영역 */}
          <div className="payment-summary-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h6 style={{ marginBottom: '15px', fontWeight: 'bold' }}>결제 정보</h6>
            {(() => {
              if (!product || !quantity) return null;
              
              const { productTotal, shippingFee, totalAmount } = calculateTotalAmountUtil(product, quantity);
              const originalPrice = product.price * quantity;
              const basicDiscountAmount = product.discountRate && isOnDiscount(product.discountRate, product.discountStart, product.discountEnd) 
                ? Math.round(originalPrice * product.discountRate / 100) 
                : 0;
              const bulkDiscountAmount = product.bulkMinQuantity && product.bulkDiscountRate && quantity >= product.bulkMinQuantity
                ? Math.round((originalPrice - basicDiscountAmount) * product.bulkDiscountRate / 100)
                : 0;
              const totalDiscountAmount = basicDiscountAmount + bulkDiscountAmount;
              
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>상품 금액:</span>
                    <span>{formatPriceUtil(originalPrice)}원</span>
                  </div>
                  {basicDiscountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#dc3545' }}>
                      <span>기본 할인 ({product.discountRate}%):</span>
                      <span>-{formatPriceUtil(basicDiscountAmount)}원</span>
                    </div>
                  )}
                  {bulkDiscountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#dc3545' }}>
                      <span>대량구매 할인 ({product.bulkDiscountRate}%):</span>
                      <span>-{formatPriceUtil(bulkDiscountAmount)}원</span>
                    </div>
                  )}
                  {totalDiscountAmount > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold' }}>
                        <span>할인 후 상품 금액:</span>
                        <span>{formatPriceUtil(productTotal)}원</span>
                      </div>
                      <hr style={{ margin: '10px 0' }} />
                    </>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>배송비:</span>
                    <span>{formatPriceUtil(shippingFee)}원</span>
                  </div>
                  {applyCoupon && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#dc3545' }}>
                      <span>쿠폰 할인:</span>
                      <span>-5,000원</span>
                    </div>
                  )}
                  {useMileage && mileageAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#dc3545' }}>
                      <span>마일리지 사용:</span>
                      <span>-{formatPriceUtil(mileageAmount)}원</span>
                    </div>
                  )}
                  <hr style={{ margin: '10px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                    <span>총 결제 금액:</span>
                    <span style={{ color: '#007bff' }}>{formatPriceUtil(getFinalAmount())}원</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* 체크박스 영역 */}
          <div className="payment-checkbox-group">
            <label className="payment-checkbox-label">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={isProcessing}
                className="payment-checkbox"
              />
              <span>
                <span className="payment-checkbox-required">[필수]</span> 결제 서비스 이용 약관, 개인정보 처리 동의 &gt;
              </span>
            </label>
            <label className="payment-checkbox-label">
              <input
                type="checkbox"
                checked={applyCoupon}
                onChange={(e) => setApplyCoupon(e.target.checked)}
                disabled={isProcessing}
                className="payment-checkbox"
              />
              <span>5,000원 쿠폰 적용</span>
            </label>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="payment-modal-footer">
          <button
            onClick={handlePayment}
            disabled={isProcessing || !agreedToTerms}
            className="payment-submit-btn"
          >
            {isProcessing ? (
              <span className="payment-submit-btn-content">
                <span className="payment-spinner"></span>
                결제 진행 중...
              </span>
            ) : (
              '결제하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
