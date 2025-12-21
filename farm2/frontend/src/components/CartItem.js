import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    getDiscountedPrice, 
    formatPrice as formatPriceUtil, 
    isOnDiscount, 
    calculateItemTotal 
} from "../utils/priceCalculator";
import "../css/CartItem.css";

function CartItem({ item, index, isChecked, onCheckChange, onQtyChange, onDelete, product, onOptionChange }) {
    const navigate = useNavigate();
    const [qty, setQty] = useState(() => {
        const initialQty = item.qty || item.qty === 0 ? item.qty : 1;
        return initialQty > 0 ? initialQty : 1;
    });
    const [selectedUnitOption, setSelectedUnitOption] = useState(null);

    // item.qty가 변경되면 state 업데이트
    useEffect(() => {
        const newQty = item.qty || item.qty === 0 ? item.qty : 1;
        if (newQty > 0 && newQty !== qty) {
            setQty(newQty);
        }
    }, [item.qty]);
    
    // product 정보가 로드되면 selectedUnitOption 초기화
    useEffect(() => {
        if (!product) return;
        
        // unitOptions가 있는 경우에만 옵션 설정
        if (product.unitOptions && product.unitOptions.length > 0) {
            // 기존에 선택된 옵션이 있으면 찾기 (productName과 unit 둘 다 비교)
            if (item.selectedUnitProductName || item.selectedUnit) {
                const foundOption = product.unitOptions.find(opt => {
                    // productName과 unit 둘 다 비교
                    const optProductName = (opt.productName || '').trim();
                    const optUnit = (opt.unit || '').trim();
                    const itemProductName = (item.selectedUnitProductName || '').trim();
                    const itemUnit = (item.selectedUnit || '').trim();
                    
                    // 둘 다 있으면 둘 다 일치해야 함
                    if (itemProductName && itemUnit && optProductName && optUnit) {
                        return optProductName === itemProductName && optUnit === itemUnit;
                    }
                    // productName만 있으면 productName만 비교
                    if (itemProductName && optProductName && !itemUnit) {
                        return optProductName === itemProductName;
                    }
                    // unit만 있으면 unit만 비교
                    if (itemUnit && optUnit && !itemProductName) {
                        return optUnit === itemUnit;
                    }
                    return false;
                });
                if (foundOption) {
                    // 현재 선택된 옵션과 다른 경우에만 업데이트
                    if (!selectedUnitOption || 
                        (selectedUnitOption.productName !== foundOption.productName) ||
                        (selectedUnitOption.unit !== foundOption.unit)) {
                        setSelectedUnitOption(foundOption);
                    }
                    return;
                }
            }
            
            // 현재 선택된 옵션이 이미 올바르게 설정되어 있는지 확인
            if (selectedUnitOption) {
                const isStillValid = product.unitOptions.some(opt => {
                    const optProductName = (opt.productName || '').trim();
                    const optUnit = (opt.unit || '').trim();
                    const selectedProductName = (selectedUnitOption.productName || '').trim();
                    const selectedUnit = (selectedUnitOption.unit || '').trim();
                    
                    // productName과 unit 둘 다 비교
                    if (selectedProductName && selectedUnit && optProductName && optUnit) {
                        return optProductName === selectedProductName && optUnit === selectedUnit;
                    }
                    // productName만 있으면 productName만 비교
                    if (selectedProductName && optProductName && !selectedUnit) {
                        return optProductName === selectedProductName;
                    }
                    // unit만 있으면 unit만 비교
                    if (selectedUnit && optUnit && !selectedProductName) {
                        return optUnit === selectedUnit;
                    }
                    return false;
                });
                if (isStillValid) {
                    return; // 이미 올바른 옵션이 선택되어 있으면 업데이트하지 않음
                }
            }
            
            // selectedUnitOption이 없거나 유효하지 않은 경우 기본 옵션 설정
            const defaultOption = product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0];
            if (defaultOption && (!selectedUnitOption || 
                selectedUnitOption.productName !== defaultOption.productName ||
                selectedUnitOption.unit !== defaultOption.unit)) {
                setSelectedUnitOption(defaultOption);
            }
        } else {
            // unitOptions가 없으면 null로 설정
            if (selectedUnitOption !== null) {
                setSelectedUnitOption(null);
            }
        }
    }, [product, item.selectedUnit, item.selectedUnitProductName]);

    const resolveImageUrl = () => {
        const imagePath = item.productImage;
        if (!imagePath) return null;
        if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
            return imagePath;
        }
        if (imagePath.startsWith("/")) {
            return `http://localhost:8080${imagePath}`;
        }
        return `http://localhost:8080/uploads/product-images/${imagePath.replace(/^\/+/, "")}`;
    };

    // 현재 재고 수량 반환
    const getCurrentStock = () => {
        if (selectedUnitOption && selectedUnitOption.stock !== undefined) {
            return selectedUnitOption.stock || 0;
        }
        if (product && product.stock !== undefined) {
            return product.stock || 0;
        }
        if (item.stock !== undefined) {
            return item.stock || 0;
        }
        return 999999; // 재고 정보가 없으면 큰 값 반환 (제한 없음)
    };

    const handleQtyChange = (value) => {
        const maxStock = getCurrentStock();
        const safeValue = Math.max(1, Math.min(value, maxStock)); // 1 이상, 재고 이하
        setQty(safeValue);
        onQtyChange(item.id, safeValue);
    };

    const handleInputChange = (e) => {
        const onlyNumber = e.target.value.replace(/[^0-9]/g, "");
        if (onlyNumber === "") {
            setQty("");
            return;
        }
        const numValue = parseInt(onlyNumber, 10);
        if (!isNaN(numValue) && numValue > 0) {
            const maxStock = getCurrentStock();
            // 입력 중에는 재고 제한을 넘을 수 있지만, blur 시에 제한됨
            setQty(Math.min(numValue, maxStock));
        }
    };

    const handleInputBlur = () => {
        const maxStock = getCurrentStock();
        const currentValue = qty === "" || qty === null || qty === undefined ? 1 : (typeof qty === 'number' ? qty : parseInt(qty) || 1);
        const safeValue = Math.max(1, Math.min(currentValue, maxStock)); // 1 이상, 재고 이하
        setQty(safeValue);
        onQtyChange(item.id, safeValue);
    };

    const increase = () => {
        const maxStock = getCurrentStock();
        const currentQty = qty === "" || qty === null || qty === undefined ? 1 : (typeof qty === 'number' ? qty : parseInt(qty) || 1);
        // 재고를 넘지 않을 때만 증가
        if (currentQty < maxStock) {
            const next = currentQty + 1;
            handleQtyChange(next);
        }
    };

    const decrease = () => {
        const currentQty = qty === "" || qty === null || qty === undefined ? 1 : (typeof qty === 'number' ? qty : parseInt(qty) || 1);
        const next = Math.max(1, currentQty - 1);
        handleQtyChange(next);
    };

    // formatPrice는 priceCalculator에서 import하므로 제거

    const productImageUrl = resolveImageUrl();

    return (
    <div className="col-12 mb-3">
        <div className="row bg-white rounded shadow-sm align-items-center text-center cart-item-row">

            {/* 체크박스 */}
            <div className="col-1">
            <input type="checkbox" checked={isChecked}
            onChange={() => onCheckChange(item.id)}
            className="form-check-input cart-item-checkbox"
            />
            </div>

            {/* no */}
            <div className="col-1 cart-item-no"><strong>{index + 1}</strong></div>

            {/* 상품 이미지 */}
            <div className="col-1">

{/* 11/25 혜정 추가(오류 개선용) */}
                {productImageUrl ? (
                    <img
                        src={productImageUrl}
                        alt={item.productName || "상품 이미지"}
                        className="img-fluid rounded cart-item-image"
                        onError={(e) => {
                            e.target.src = "/img/no-image.png";
                        }}
                    />
                ) : (
                    <div
                        className="d-flex align-items-center justify-content-center bg-light rounded cart-item-image-placeholder"
                    >
                        <span className="text-muted small">이미지 없음</span>
                    </div>
                )}
            </div>


{/* ************11/25 주석처리 혜정  */}
                {/* <img src={`http://localhost:8080/uploads/product-images/${item.productImage}`}
                alt={item.productName}
                className="img-fluid rounded"
                style={{ 
                    width: '100px', 
                    height: '100px', 
                    objectFit: 'cover',
                    borderRadius: '12px'
                    }}
                onError={(e) => {
                    e.target.src = '/placeholder-image.png'; //대체이미지
                }}
                />
            </div> */}
{/* ************11/25 주석처리 혜정  */}


            {/* 상품명 및 옵션 */}
            <div className="col-3 text-start">
                <div
                    className={`cart-item-product-name ${item.productId ? '' : 'disabled'}`}
                    onClick={() => {
                        if (item.productId) {
                            navigate(`/products/detail/${item.productId}`);
                        }
                    }}
                >
                    {item.productName || '상품명 없음'}
                </div>
                {/* 옵션 선택 (unitOptions가 있는 경우) */}
                {product && product.unitOptions && product.unitOptions.length > 0 && (
                    <div className="mt-2">
                        <select
                            className="form-select form-select-sm"
                            value={selectedUnitOption ? (selectedUnitOption.productName ? `${selectedUnitOption.productName}|${selectedUnitOption.unit}` : selectedUnitOption.unit) : ''}
                            onChange={(e) => {
                                const selectedValue = e.target.value;
                                if (!selectedValue) {
                                    console.log('선택된 옵션이 없습니다');
                                    return;
                                }
                                
                                console.log('옵션 선택 시도:', { selectedValue, productId: product.id, productName: product.name });
                                console.log('사용 가능한 옵션:', product.unitOptions);
                                
                                // value 형식: "productName|unit" 또는 "unit"
                                let option = null;
                                if (selectedValue.includes('|')) {
                                    // productName|unit 형식
                                    const [productName, unit] = selectedValue.split('|');
                                    option = product.unitOptions.find(opt => {
                                        const optProductName = (opt.productName || '').trim();
                                        const optUnit = (opt.unit || '').trim();
                                        return optProductName === productName.trim() && optUnit === unit.trim();
                                    });
                                } else {
                                    // unit만 있는 경우
                                    option = product.unitOptions.find(opt => {
                                        const optUnit = (opt.unit || '').trim();
                                        return optUnit === selectedValue.trim();
                                    });
                                }
                                
                                if (option) {
                                    console.log('옵션 설정:', option);
                                    setSelectedUnitOption(option);
                                    if (onOptionChange) {
                                        onOptionChange(item.id, {
                                            productName: option.productName || '',
                                            unit: option.unit,
                                            price: option.price
                                        });
                                    }
                                } else {
                                    console.error('옵션을 찾을 수 없습니다:', { 
                                        selectedValue, 
                                        productId: product.id,
                                        productName: product.name,
                                        availableOptions: product.unitOptions.map(opt => ({ unit: opt.unit, productName: opt.productName }))
                                    });
                                }
                            }}
                            style={{ maxWidth: '200px' }}
                        >
                            {product.unitOptions.map((opt, idx) => {
                                // productName이 있으면 "productName|unit", 없으면 "unit" 형식으로 value 설정
                                const optionValue = opt.productName ? `${opt.productName}|${opt.unit}` : (opt.unit || '');
                                const optionText = opt.productName ? `${opt.productName} - ${opt.unit}` : opt.unit;
                                return (
                                    <option key={idx} value={optionValue} disabled={opt.stock === 0}>
                                        {optionText} ({opt.price ? opt.price.toLocaleString() : 0}원, 재고: {opt.stock})
                                        {opt.stock === 0 ? ' (품절)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                )}
            </div>

            {/* 수량 */}
            <div className="col-1">
                <div className="cart-item-quantity-wrapper">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary cart-item-quantity-btn"
                        onClick={decrease}
                    >
                        -
                    </button>
                    <input
                        type="text"
                        min="1"
                        max={getCurrentStock()}
                        value={qty === "" || qty === null || qty === undefined ? "" : (typeof qty === 'number' ? qty.toString() : String(parseInt(qty) || 1))}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        className="form-control cart-item-quantity-input"
                    />
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary cart-item-quantity-btn"
                        onClick={increase}
                        disabled={(() => {
                            const maxStock = getCurrentStock();
                            const currentQty = qty === "" || qty === null || qty === undefined ? 1 : (typeof qty === 'number' ? qty : parseInt(qty) || 1);
                            return currentQty >= maxStock;
                        })()}
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="col-2">
                <div className="cart-item-price-container">
                    {(() => {
                        if (!product) {
                            return <strong className="cart-item-price-normal">{formatPriceUtil(item.price)}원</strong>;
                        }
                        
                        // 옵션이 선택된 경우 옵션의 가격 사용, 없으면 기본 상품 가격 사용
                        // 우선순위: selectedUnitOption.price > item.price > product.price
                        let basePrice = 0;
                        if (selectedUnitOption && selectedUnitOption.price) {
                            // 옵션이 선택되어 있으면 옵션 가격 우선 사용
                            basePrice = selectedUnitOption.price;
                        } else if (item.price && item.price > 0) {
                            // 옵션이 없으면 item.price 사용
                            basePrice = item.price;
                        } else {
                            // 둘 다 없으면 기본 상품 가격 사용
                            basePrice = product.price || 0;
                        }
                        
                        // 수량에 따른 대량구매 할인 포함한 단가 계산
                        const currentQty = qty === "" || qty === null || qty === undefined ? 1 : (typeof qty === 'number' ? qty : parseInt(qty) || 1);
                        
                        // 옵션 가격을 적용한 상품 정보로 계산
                        const productWithOptionPrice = { ...product, price: basePrice };
                        const totalPrice = calculateItemTotal(productWithOptionPrice, currentQty);
                        
                        // 단가는 총액을 수량으로 나눈 값 (calculateItemTotal과 일치)
                        const unitPrice = currentQty > 0 ? Math.round(totalPrice / currentQty) : basePrice;
                        
                        // 할인 정보 확인 (표시용)
                        const hasBasicDiscount = product.discountRate && product.discountRate > 0 && isOnDiscount(product.discountRate, product.discountStart, product.discountEnd);
                        const hasBulkDiscount = product.bulkMinQuantity && product.bulkDiscountRate && currentQty >= product.bulkMinQuantity;
                        const hasAnyDiscount = hasBasicDiscount || hasBulkDiscount;
                        
                        const originalPrice = basePrice;
                        
                        // 할인이 있으면 할인 정보 표시
                        if (hasAnyDiscount) {
                            return (
                                <>
                                    {/* 할인 가격 */}
                                    <strong className="cart-item-price-discounted">
                                        {formatPriceUtil(unitPrice)}원
                                    </strong>
                                    {/* 할인율 배지 - 가격 아래에 작게 */}
                                    <div className="cart-item-discount-badges">
                                        {hasBasicDiscount && (
                                            <span className="cart-item-discount-badge-basic">
                                                {product.discountRate}%
                                            </span>
                                        )}
                                        {hasBulkDiscount && (
                                            <span className="cart-item-discount-badge-bulk">
                                                대량 {product.bulkDiscountRate}%
                                            </span>
                                        )}
                                    </div>
                                    {/* 원가 (취소선) */}
                                    <div className="cart-item-original-price">
                                        {formatPriceUtil(originalPrice)}원
                                    </div>
                                    {/* 대량구매 할인 안내 (아직 적용 안된 경우) */}
                                    {product.bulkMinQuantity && product.bulkDiscountRate && currentQty < product.bulkMinQuantity && (
                                        <div className="cart-item-bulk-discount-info">
                                            {product.bulkMinQuantity}개 이상 구매 시 {product.bulkDiscountRate}% 추가 할인
                                        </div>
                                    )}
                                </>
                            );
                        } else {
                            // 대량구매 할인 안내만 있는 경우
                            if (product.bulkMinQuantity && product.bulkDiscountRate) {
                                return (
                                    <>
                                        <strong className="cart-item-price-normal">{formatPriceUtil(item.price)}원</strong>
                                        <div className="cart-item-bulk-discount-info">
                                            {product.bulkMinQuantity}개 이상 구매 시 {product.bulkDiscountRate}% 할인
                                        </div>
                                    </>
                                );
                            }
                            return <strong className="cart-item-price-normal">{formatPriceUtil(item.price)}원</strong>;
                        }
                    })()}
                </div>
            </div>

            {/* 소계 (단가 * 수량) */}
            <div className="col-2">
                <div className="cart-item-subtotal-container">
                    {(() => {
                        if (!product) {
                            const subtotal = (item.price || 0) * (qty || 1);
                            return <strong className="cart-item-subtotal">{formatPriceUtil(subtotal)}원</strong>;
                        }
                        
                        // 옵션이 선택된 경우 옵션의 가격 사용, 없으면 기본 상품 가격 사용
                        let basePrice = 0;
                        if (selectedUnitOption && selectedUnitOption.price) {
                            basePrice = selectedUnitOption.price;
                        } else if (item.price && item.price > 0) {
                            basePrice = item.price;
                        } else {
                            basePrice = product.price || 0;
                        }
                        
                        // 수량
                        const currentQty = qty === "" || qty === null || qty === undefined ? 1 : (typeof qty === 'number' ? qty : parseInt(qty) || 1);
                        
                        // 옵션 가격을 적용한 상품 정보로 계산
                        const productWithOptionPrice = { ...product, price: basePrice };
                        const subtotal = calculateItemTotal(productWithOptionPrice, currentQty);
                        
                        return <strong className="cart-item-subtotal">{formatPriceUtil(subtotal)}원</strong>;
                    })()}
                </div>
            </div>     
            

            {/* 수량 변경 버튼 / 삭제 */}
            <div className="col-1 d-flex justify-content-center">
                <button
                    type="button"
                    className="cart-item-delete-button"
                    onClick={() => onDelete(item.id)}
                >
                    삭제
                </button>
            </div>
        </div>
    </div>
    );
};

export default CartItem;