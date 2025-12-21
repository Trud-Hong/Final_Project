/**
 * 상품 가격 계산 유틸리티
 * 상세페이지와 동일한 로직으로 모든 화면에서 가격을 계산합니다.
 */

/**
 * 할인된 가격 계산
 * @param {number} price - 원가
 * @param {number} discountRate - 할인율 (%)
 * @param {string} discountStart - 할인 시작일 (선택)
 * @param {string} discountEnd - 할인 종료일 (선택)
 * @returns {number} 할인된 가격
 */
export const getDiscountedPrice = (price, discountRate, discountStart = null, discountEnd = null) => {
  if (!discountRate || discountRate <= 0) return price;
  
  // 할인 기간이 설정되어 있으면 기간 확인
  if (discountStart && discountEnd) {
    const now = new Date();
    const start = new Date(discountStart);
    const end = new Date(discountEnd);
    // 할인 기간이 아니면 원가 반환
    if (now < start || now > end) {
      return price;
    }
  }
  
  return Math.round(price * (100 - discountRate) / 100);
};

/**
 * 할인 기간 확인
 * @param {number} discountRate - 할인율
 * @param {string} discountStart - 할인 시작일
 * @param {string} discountEnd - 할인 종료일
 * @returns {boolean} 할인 중인지 여부
 */
export const isOnDiscount = (discountRate, discountStart, discountEnd) => {
  if (!discountRate) return false;
  if (!discountStart || !discountEnd) return true; // 할인율만 있으면 할인 중으로 간주
  const now = new Date();
  const start = new Date(discountStart);
  const end = new Date(discountEnd);
  return now >= start && now <= end;
};

/**
 * 상품별 최종 금액 계산 (할인 적용)
 * @param {Object} product - 상품 정보
 * @param {number} quantity - 수량
 * @returns {number} 할인 적용된 총 금액
 */
export const calculateItemTotal = (product, quantity) => {
  if (!product || !quantity) return 0;
  
  // product.price가 없거나 유효하지 않으면 0 반환
  const price = Number(product.price);
  if (!price || isNaN(price) || price <= 0) return 0;
  
  let unitPrice = price; // 원가부터 시작
  
  // 1. 기본 할인 적용 (할인 기간 확인 포함)
  // 기본 할인은 할인 기간 내에만 적용
  if (product.discountRate && product.discountRate > 0) {
    const isBasicDiscountActive = isOnDiscount(
      product.discountRate, 
      product.discountStart, 
      product.discountEnd
    );
    if (isBasicDiscountActive) {
      unitPrice = getDiscountedPrice(
        unitPrice, 
        product.discountRate, 
        product.discountStart, 
        product.discountEnd
      );
    }
  }
  
  // 2. 대량구매 할인 적용 (기본 할인과 독립적으로, 수량만 충족하면 항상 적용)
  // 대량구매 할인은 기본 할인 기간과 무관하게 수량만 충족하면 적용
  // 현재 단가(기본 할인 적용 후 또는 원가)에 대량구매 할인을 추가 적용
  if (product.bulkMinQuantity && product.bulkDiscountRate && quantity >= product.bulkMinQuantity) {
    unitPrice = Math.round(unitPrice * (100 - product.bulkDiscountRate) / 100);
  }
  
  // 3. 상품 총액 계산
  const total = unitPrice * quantity;
  
  // NaN이나 undefined 체크
  if (isNaN(total) || total === undefined || total < 0) {
    console.warn('calculateItemTotal: Invalid total calculated', { product, quantity, unitPrice, total });
    return 0;
  }
  
  return total;
};

/**
 * 배송비 계산
 * @param {Object} product - 상품 정보
 * @param {number} productTotal - 상품 총액
 * @returns {number} 배송비
 */
export const calculateShippingFee = (product, productTotal) => {
  const baseShippingFee = 3000; // 기본 배송비
  
  // 무료배송 기준 체크
  if (product?.shippingFreeThreshold && productTotal >= product.shippingFreeThreshold) {
    return 0;
  }
  
  return baseShippingFee;
};

/**
 * 최종 결제 금액 계산 (상품 금액 + 배송비)
 * @param {Object} product - 상품 정보
 * @param {number} quantity - 수량
 * @returns {Object} { productTotal, shippingFee, totalAmount }
 */
export const calculateTotalAmount = (product, quantity) => {
  const productTotal = calculateItemTotal(product, quantity);
  const shippingFee = calculateShippingFee(product, productTotal);
  const totalAmount = productTotal + shippingFee;
  
  return {
    productTotal,
    shippingFee,
    totalAmount
  };
};

/**
 * 여러 상품의 총 결제 금액 계산
 * @param {Array} items - 상품 배열 [{ product, quantity }, ...]
 * @returns {Object} { productTotal, shippingFee, totalAmount }
 */
export const calculateMultipleItemsTotal = (items) => {
  let productTotal = 0;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      productTotal: 0,
      shippingFee: 3000,
      totalAmount: 3000
    };
  }
  
  items.forEach(item => {
    if (!item || !item.product || !item.quantity) {
      console.warn('Invalid item in calculateMultipleItemsTotal:', item);
      return;
    }
    const itemTotal = calculateItemTotal(item.product, item.quantity);
    if (isNaN(itemTotal)) {
      console.warn('calculateItemTotal returned NaN for item:', item, 'itemTotal:', itemTotal);
      return;
    }
    productTotal += itemTotal;
  });
  
  // 여러 상품 구매 시 배송비는 한 번만 (기본 배송비)
  // 무료배송은 각 상품별로 체크하되, 전체 합계로도 체크 가능
  const totalShippingFee = 3000; // 기본 배송비 한 번만
  
  // productTotal이 NaN이거나 undefined인 경우 처리
  if (isNaN(productTotal) || productTotal === undefined) {
    console.error('productTotal is invalid:', productTotal);
    productTotal = 0;
  }
  
  const totalAmount = productTotal + totalShippingFee;
  
  return {
    productTotal: productTotal || 0,
    shippingFee: totalShippingFee,
    totalAmount: totalAmount || totalShippingFee
  };
};

/**
 * 가격 포맷팅
 * @param {number} price - 가격
 * @returns {string} 포맷된 가격 문자열
 */
export const formatPrice = (price) => {
  if (typeof price !== 'number') return '0';
  return price.toLocaleString();
};

