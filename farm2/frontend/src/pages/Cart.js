import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CartItem from "../components/CartItem";
import GotoBack from "../components/GotoBack";
import { calculateItemTotal, calculateMultipleItemsTotal, formatPrice, isOnDiscount } from "../utils/priceCalculator";
import "../css/Cart.css";
import SmartAddressSelect from "../components/SmartAddressSelect";

function Cart(){
    const navigate = useNavigate(); //페이지 이동
    const [cartItem, setCartItem] = useState([]);// 장바구니 목록
    const [checkedItem, setCheckedItem] = useState([]); //체크한 아이템
    const [loading, setLoading] = useState(false); //로딩상태
    const [userId, setUserId] = useState('') //로그인id
    const [showPurchaseModal, setShowPurchaseModal] = useState(false); // 구매 모달 표시
    const [agreedToTerms, setAgreedToTerms] = useState(false); // 구매 동의 체크
    const [isProcessingPurchase, setIsProcessingPurchase] = useState(false); // 구매 처리 중
    const [availableMileage, setAvailableMileage] = useState(0); // 보유 마일리지
    const [productDetails, setProductDetails] = useState({}); // 각 장바구니 아이템의 상품 정보
    //배송지 선택
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(null);

    //페이지가 처음 로드될떄 실행
    useEffect(() => {
            
    //로그인 확인
    const loginUserId = localStorage.getItem('userId');

        if (loginUserId) {
            setUserId(loginUserId);
        } else {
            alert('로그인이 필요한 서비스입니다.');
            const currentPath = window.location.pathname;
            window.location.replace('/login?redirect=' + encodeURIComponent(currentPath));
            return false;
        }
    }, []);

    useEffect(() => {
        if (userId) {
            loadCartItem(userId);
        }
    }, [userId]);

    //장바구니 목록 가져와
    const loadCartItem = async (userId) => {
        try {
            setLoading(true);

            const response = await fetch(`http://localhost:8080/api/cart/${userId}`); //임시로 로컬 호스트아이피주소

            if (!response.ok) {
                throw new Error('장바구니 목록을 불러오는데 실패했습니다.');
            }

            const data = await response.json();
            
            // 최신순으로 정렬 (productDetails 로드 전에 먼저 정렬)
            const sortedData = data.sort((a,b) =>
                new Date(b.createdAt) - new Date(a.createdAt));

            // productDetails 맵 생성
            const productDetailsMap = {};
            
            // 각 장바구니 아이템의 상품 정보를 병렬로 가져오기 (할인 정보 포함)
            // Promise.allSettled를 사용하여 일부 실패해도 계속 진행
            const productDetailsPromises = sortedData.map(async (item) => {
                try {
                    const productResponse = await axios.get(`http://localhost:8080/products/detail/${item.productId}`);
                    return { 
                        itemId: item.id, 
                        product: productResponse.data, 
                        success: true 
                    };
                } catch (error) {
                    console.error(`상품 ${item.productId} 정보 조회 실패:`, error);
                    // 실패한 경우 기본값 반환
                    return { 
                        itemId: item.id, 
                        product: { 
                            price: item.price, 
                            discountRate: 0, 
                            bulkMinQuantity: null, 
                            bulkDiscountRate: null, 
                            shippingFreeThreshold: null, 
                            unitOptions: null,
                            discountStart: null,
                            discountEnd: null
                        }, 
                        success: false 
                    };
                }
            });

            const productDetailsResults = await Promise.allSettled(productDetailsPromises);
            
            // 결과 처리
            productDetailsResults.forEach((result) => {
                if (result.status === 'fulfilled' && result.value) {
                    const { itemId, product } = result.value;
                    productDetailsMap[itemId] = product;
                }
            });

            // productDetails가 모두 로드된 후에 상태 업데이트 (race condition 방지)
            setProductDetails(productDetailsMap);
            setCartItem(sortedData);
            setLoading(false);

            // 일부 상품 정보를 가져오지 못한 경우 로그
            const failedCount = productDetailsResults.filter(result => 
                result.status === 'fulfilled' && !result.value.success
            ).length;
            if (failedCount > 0) {
                console.warn(`${failedCount}개 상품의 정보를 불러오지 못했습니다.`);
            }

        } catch (error) {
            console.error('장바구니 로드 오류:', error);
            alert('장바구니를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
            setCartItem([]);
            setProductDetails({});
            setLoading(false);
        }
    };

    //체크박스 체크여부
    const checkChange = (itemId) => {
        setCheckedItem(prev => {
            if(prev.includes(itemId)) {

                return prev.filter(id => id !== itemId);
            } else {

                return [...prev, itemId];
            }
        });
    };

    //전체선택
    const checkAll = (e) => {
        if (e.target.checked) {
            setCheckedItem(cartItem.map(item => item.id));
        } else {
            setCheckedItem([]);
        }
    };

    //수량변경
    const qtyChange = async (cartId, newQty) => {

        try {
            
            const response = await fetch(
                 `http://localhost:8080/api/cart/update/${cartId}?qty=${newQty}`,
                { method: 'PUT' }
                );

            if (!response.ok) {
                throw new Error('수량 변경 실패');
            }

        //성공시 화면 업데이트해
        setCartItem(prev =>
            prev.map(item =>
                item.id === cartId ? { ...item, qty: newQty } : item
            )
        );
        } catch (error) {

            console.error('수량 변경 오류:', error);
            alert('수량 변경 실패');            
        }
    };
    
    // 옵션 변경 핸들러
    const handleOptionChange = async (itemId, option) => {
        if (!itemId) {
            console.error('옵션 변경 오류: itemId가 없습니다.');
            alert('장바구니 항목 ID가 없습니다.');
            return;
        }
        
        try {
            console.log('옵션 변경 요청:', { itemId, option });
            
            // 로컬 상태 먼저 업데이트 (즉시 반영)
            setCartItem(prev => prev.map(item => 
                item.id === itemId 
                    ? { ...item, selectedUnit: option.unit, selectedUnitProductName: option.productName, price: option.price }
                    : item
            ));
            
            const response = await axios.put(`http://localhost:8080/api/cart/update-option/${itemId}`, {
                selectedUnit: option.unit,
                selectedUnitProductName: option.productName,
                price: option.price
            });
            console.log('옵션 변경 성공:', response.data);
            
            // 백엔드에서 업데이트된 정보로 로컬 상태 동기화 (다른 필드 업데이트가 있을 수 있음)
            setCartItem(prev => prev.map(item => 
                item.id === itemId 
                    ? { ...item, selectedUnit: response.data.selectedUnit, selectedUnitProductName: response.data.selectedUnitProductName, price: response.data.price }
                    : item
            ));
            
            // productDetails도 업데이트하지 않고 로컬 상태만 업데이트
            // loadCartItem을 호출하지 않아서 다른 아이템의 상태가 리셋되지 않음
        } catch (error) {
            console.error('옵션 변경 오류:', error);
            console.error('오류 상세:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url
            });
            
            // 오류 발생 시 이전 상태로 롤백
            await loadCartItem(userId);
            
            if (error.response?.status === 404) {
                alert('옵션 변경 API를 찾을 수 없습니다. 백엔드 서버를 재시작해주세요.');
            } else {
                alert(`옵션 변경 중 오류가 발생했습니다: ${error.response?.status || error.message}`);
            }
        }
    };

// 개별 삭제
    const onDelete = async (cartId) => {
        if(!window.confirm('이 상품을 장바구니에서 삭제하시겠습니까?')) {
            return;
        }
        
        try {
            
            const response = await fetch(
                `http://localhost:8080/api/cart/delete/${cartId}`,
                { method: 'DELETE' }
             );

             if (!response.ok) {
                throw new Error('삭제 실패');
             }
            
             //성공시 화면에서 제거
             setCartItem(prev => prev.filter(item => item.id !== cartId));
             setCheckedItem(prev => prev.filter(id => id !== cartId));

             alert('삭제되었습니다.');

        } catch (error) {
            console.error('삭제 오류:', error);
            alert('삭제에 실패했습니다.');
            }
        };

        // 선택 삭제
        const selectDelete = async () => {
            if (checkedItem.length === 0) {
                alert('삭제할 상품을 선택해 주세요.');
                return;
            }

            if (!window.confirm(`선택한 ${checkedItem.length}개 상품을 삭제하시겠습니까?`)) {
                return;
            }

            try {
                
    //선택항목 삭제
                for (const cartId of checkedItem) {
                    await fetch(
                      `http://localhost:8080/api/cart/delete/${cartId}`,
                     { method: 'DELETE' }
                     );
                }
    // 성공하면 화면에서 제거
             setCartItem(prev => prev.filter(item => !checkedItem.includes(item.id)));
             setCheckedItem([]);

             alert('선택한 상품이 삭제되었습니다.');

        } catch (error) {
            console.error('선택 삭제 오류:', error);
            alert('삭제에 실패했습니다.');
            }
        };

  // 구매하기 버튼 클릭 - 모달 열기
  const onBuy = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 후 구매 가능합니다.");
      return;
    }

    // 선택한 상품이 없으면
    if (checkedItem.length === 0) {
      alert("구매할 상품을 선택해주세요.");
      return;
    }

    // 선택한 장바구니 아이템들 가져오기
    const selectedCartItems = cartItem.filter(item => checkedItem.includes(item.id));
    
    // 각 아이템의 상품 정보와 수량을 포함한 배열 생성 (단위 옵션 가격 반영)
    const itemsWithProducts = selectedCartItems.map(item => {
      const product = productDetails[item.id] || { price: item.price, discountRate: 0, bulkMinQuantity: null, bulkDiscountRate: null, shippingFreeThreshold: null, unitOptions: null };
      
      // 단위 옵션이 있고 선택된 옵션이 있는 경우, 선택된 옵션의 가격 사용
      let finalPrice = product.price || item.price;
      if (product.unitOptions && product.unitOptions.length > 0 && item.selectedUnit) {
        // productName과 unit을 모두 확인하여 정확히 매칭
        let selectedOption = product.unitOptions.find(opt => {
          const unitMatch = opt.unit === item.selectedUnit;
          const productNameMatch = item.selectedUnitProductName 
            ? (opt.productName === item.selectedUnitProductName)
            : (!opt.productName || !item.selectedUnitProductName);
          return unitMatch && productNameMatch;
        });
        
        // 매칭되지 않으면 unit만으로 다시 찾기
        if (!selectedOption) {
          selectedOption = product.unitOptions.find(opt => opt.unit === item.selectedUnit);
        }
        
        if (selectedOption) {
          finalPrice = selectedOption.price;
        }
      }
      
      // 옵션 가격을 적용한 상품 정보
      const productWithOptionPrice = { ...product, price: finalPrice };
      
      return {
        product: productWithOptionPrice,
        quantity: item.qty
      };
    });
    
    // 할인 적용된 총 결제 금액 계산 (상세페이지와 동일한 로직)
    const { totalProductAmount, shippingFee, totalAmount } = calculateMultipleItemsTotal(itemsWithProducts);

    // 마일리지 잔액 확인
    try {
      const mileageResponse = await axios.get('http://localhost:8080/api/mileage/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const mileage = mileageResponse.data.balance || 0;
      setAvailableMileage(mileage);
      
      if (mileage < totalAmount) {
        const shortage = totalAmount - mileage;
        if (window.confirm(
          `마일리지가 부족합니다.\n` +
          `필요: ${totalAmount.toLocaleString()}원\n` +
          `보유: ${mileage.toLocaleString()}원\n` +
          `부족: ${shortage.toLocaleString()}원\n\n` +
          `마일리지 충전 페이지로 이동하시겠습니까?`
        )) {
          window.location.href = '/mileage?menu=charge';
        }
        return;
      }

      // 모달 열기
      console.log('모달 열기 시도');
      setShowPurchaseModal(true);
      setAgreedToTerms(false);
      console.log('showPurchaseModal 상태:', showPurchaseModal);
      
      // 기본 배송지 자동 로드 (모달이 열릴 때마다 최신 기본 배송지 확인)
      if (userId) {
        fetchDefaultAddress();
      }
    } catch (error) {
      console.error('마일리지 조회 실패:', error);
      alert('마일리지 조회 중 오류가 발생했습니다.');
    }
  };

  // 기본 배송지 불러오기
  const fetchDefaultAddress = async () => {
    try {
      console.log('기본 배송지 불러오기 시작, userId:', userId);
      const response = await fetch(`http://localhost:8080/api/addr?userId=${userId}`);
      const data = await response.json();
      console.log('불러온 배송지 목록:', data);
      
      if (data && data.length > 0) {
        // 정렬하지 않고 기본 배송지만 찾기
        const defaultAddr = data.find(addr => addr.isDefault === true || addr.default === true);
        console.log('찾은 기본 배송지:', defaultAddr);
        
        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
          console.log('기본 배송지 설정 완료:', defaultAddr);
        } else {
          console.log('기본 배송지가 없습니다.');
          // 기본 배송지가 없으면 첫 번째 배송지를 선택
          if (data.length > 0) {
            setSelectedAddress(data[0]);
            console.log('첫 번째 배송지를 기본으로 설정:', data[0]);
          }
        }
      } else {
        console.log('등록된 배송지가 없습니다.');
        setSelectedAddress(null);
      }
    } catch (error) {
      console.error('기본 배송지 불러오기 실패:', error);
    }
  };

  // 최종 구매 확인 (모달에서 호출)
  const handlePurchaseConfirm = async () => {
    // 배송지 확인
    if(!selectedAddress) {
      alert("배송지를 선택해주세요!");
      return;
    }
    if (!agreedToTerms) {
      alert('구매 안내 사항에 동의해주세요.');
      return;
    }

    try {
      setIsProcessingPurchase(true);
      const token = localStorage.getItem("token");
      
      // 선택한 장바구니 아이템들 가져오기
      const selectedCartItems = cartItem.filter(item => checkedItem.includes(item.id));

      // 여러 상품을 하나의 주문 그룹으로 묶기 위한 orderGroupId 생성
      const orderGroupId = `GROUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 각 상품별로 주문 생성
      let successCount = 0;
      let failCount = 0;
      const orderIds = [];

      for (const cartItem of selectedCartItems) {
        try {
          // 상품 정보 조회 (재고 확인용)
          let product;
          try {
            const productResponse = await axios.get(`http://localhost:8080/products/detail/${cartItem.productId}`);
            product = productResponse.data;
            
            if (!product) {
              throw new Error('상품 정보를 불러올 수 없습니다.');
            }
          } catch (productErr) {
            console.error(`${cartItem.productName} 상품 정보 조회 실패:`, productErr);
            alert(`${cartItem.productName}의 상품 정보를 불러올 수 없습니다. 상품이 삭제되었거나 존재하지 않을 수 있습니다.`);
            failCount++;
            continue;
          }

          // 옵션이 선택된 경우 재고 확인
          let stockToCheck = product.stock;
          let matchedOption = null;
          
          if (product.unitOptions && product.unitOptions.length > 0) {
            if (cartItem.selectedUnit) {
              // productName과 unit을 모두 확인하여 정확히 매칭
              matchedOption = product.unitOptions.find(opt => {
                const unitMatch = (opt.unit || '').trim() === (cartItem.selectedUnit || '').trim();
                if (cartItem.selectedUnitProductName && opt.productName) {
                  return unitMatch && (opt.productName || '').trim() === (cartItem.selectedUnitProductName || '').trim();
                }
                return unitMatch;
              });
              
              // 매칭되지 않으면 unit만으로 다시 찾기
              if (!matchedOption) {
                matchedOption = product.unitOptions.find(opt => 
                  (opt.unit || '').trim() === (cartItem.selectedUnit || '').trim()
                );
              }
              
              if (matchedOption) {
                stockToCheck = matchedOption.stock || 0;
              } else {
                // 옵션이 있는데 매칭되지 않은 경우 경고
                console.warn(`${cartItem.productName}의 선택된 옵션(${cartItem.selectedUnit})을 찾을 수 없습니다.`);
                alert(`${cartItem.productName}의 선택된 옵션(${cartItem.selectedUnit})을 찾을 수 없습니다. 옵션을 다시 선택해주세요.`);
                failCount++;
                continue;
              }
            } else {
              // 옵션이 있는데 선택되지 않은 경우 기본 옵션의 재고 확인
              const defaultOption = product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0];
              if (defaultOption) {
                stockToCheck = defaultOption.stock || 0;
                matchedOption = defaultOption;
              }
            }
          }
          
          // 재고 확인
          if (stockToCheck < cartItem.qty) {
            alert(`${cartItem.productName}의 재고가 부족합니다. (현재 재고: ${stockToCheck})`);
            failCount++;
            continue;
          }

          // 할인 적용된 가격 계산 (상세페이지와 동일한 로직)
          const itemProduct = productDetails[cartItem.id] || product;
          
          // 옵션 가격 적용
          let itemProductWithPrice = itemProduct;
          if (product.unitOptions && product.unitOptions.length > 0) {
            let selectedOption = null;
            if (cartItem.selectedUnit) {
              // productName과 unit을 모두 확인하여 정확히 매칭
              selectedOption = product.unitOptions.find(opt => {
                const unitMatch = opt.unit === cartItem.selectedUnit;
                if (cartItem.selectedUnitProductName && opt.productName) {
                  return unitMatch && opt.productName === cartItem.selectedUnitProductName;
                }
                return unitMatch;
              });
            } else {
              // 옵션이 있는데 선택되지 않은 경우 기본 옵션 사용
              selectedOption = product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0];
            }
            if (selectedOption) {
              itemProductWithPrice = { ...itemProduct, price: selectedOption.price };
            }
          }
          
          const itemTotal = calculateItemTotal(itemProductWithPrice, cartItem.qty);
          
          // 주문 생성 (여러 상품을 하나의 그룹으로 묶기)
          // 옵션 가격 찾기 (이미 매칭된 옵션 사용)
          let finalUnitPrice = null;
          if (matchedOption) {
            finalUnitPrice = matchedOption.price || null;
          } else if (cartItem.selectedUnit && product.unitOptions) {
            // 매칭된 옵션이 없으면 다시 찾기
            const priceOption = product.unitOptions.find(opt => {
              const unitMatch = (opt.unit || '').trim() === (cartItem.selectedUnit || '').trim();
              if (cartItem.selectedUnitProductName && opt.productName) {
                return unitMatch && (opt.productName || '').trim() === (cartItem.selectedUnitProductName || '').trim();
              }
              return unitMatch;
            });
            finalUnitPrice = priceOption?.price || null;
          } else if (product.unitOptions && product.unitOptions.length > 0 && !cartItem.selectedUnit) {
            // 옵션이 있는데 선택되지 않은 경우 기본 옵션의 가격 사용
            const defaultOption = product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0];
            if (defaultOption) {
              finalUnitPrice = defaultOption.price || null;
            }
          }
          
          // 옵션이 있는 상품인데 unit이 null이면 기본 옵션 사용
          let finalUnit = cartItem.selectedUnit;
          let finalUnitProductName = cartItem.selectedUnitProductName;
          
          if (product.unitOptions && product.unitOptions.length > 0) {
            if (!finalUnit && matchedOption) {
              // 옵션이 있는데 선택되지 않았고 기본 옵션이 매칭된 경우
              finalUnit = matchedOption.unit;
              finalUnitProductName = matchedOption.productName || null;
              console.log(`[Cart 구매] 옵션이 선택되지 않아 기본 옵션 사용: unit=${finalUnit}, productName=${finalUnitProductName}`);
            } else if (!finalUnit) {
              // matchedOption도 없으면 기본 옵션 찾기
              const defaultOption = product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0];
              if (defaultOption) {
                finalUnit = defaultOption.unit;
                finalUnitProductName = defaultOption.productName || null;
                finalUnitPrice = defaultOption.price || null;
                console.log(`[Cart 구매] 기본 옵션 자동 선택: unit=${finalUnit}, productName=${finalUnitProductName}`);
              }
            }
          }
          
          console.log(`[Cart 구매] 상품: ${cartItem.productName}, 최종 옵션: unit=${finalUnit}, productName=${finalUnitProductName}, 수량: ${cartItem.qty}, 매칭된 옵션:`, matchedOption);
          
          const payload = {
            productId: cartItem.productId,
            productName: cartItem.productName,
            quantity: cartItem.qty,
            totalAmount: itemTotal, // 할인 적용된 가격 사용
            orderGroupId: orderGroupId, // 같은 그룹으로 묶기
            address: selectedAddress, // 배송지 정보 포함
            unit: finalUnit || null, // 선택된 단위 (기본 옵션 포함)
            selectedUnitProductName: finalUnitProductName || null, // 선택된 옵션의 제품명 (기본 옵션 포함)
            unitPrice: finalUnitPrice
          };
          
          console.log(`[Cart 구매] Payload 전송:`, payload);

          const res = await axios.post("http://localhost:8080/api/orders/create-with-mileage", payload, {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json" 
            },
          });

          if (res.data.success) {
            successCount++;
            orderIds.push(res.data.order?.id);
            
            // 장바구니에서 제거
            await fetch(`http://localhost:8080/api/cart/delete/${cartItem.id}`, {
              method: 'DELETE'
            });
          } else {
            failCount++;
            alert(`${cartItem.productName} 구매 실패: ${res.data.message || "오류 발생"}`);
          }
        } catch (err) {
          failCount++;
          console.error(`${cartItem.productName} 구매 오류:`, err);
          
          // 상세한 오류 정보 추출
          let errorMessage = `${cartItem.productName} 구매 중 오류가 발생했습니다.`;
          
          if (err.response) {
            // 서버 응답이 있는 경우
            const status = err.response.status;
            const data = err.response.data;
            
            if (data && data.message) {
              errorMessage = `${cartItem.productName} 구매 실패: ${data.message}`;
            } else if (status === 400) {
              errorMessage = `${cartItem.productName} 구매 실패: 잘못된 요청입니다. (재고 부족 또는 옵션 정보 오류 가능)`;
            } else if (status === 401) {
              errorMessage = `${cartItem.productName} 구매 실패: 로그인이 필요합니다.`;
            } else if (status === 404) {
              errorMessage = `${cartItem.productName} 구매 실패: 상품을 찾을 수 없습니다.`;
            } else if (status === 500) {
              errorMessage = `${cartItem.productName} 구매 실패: 서버 오류가 발생했습니다.`;
            } else {
              errorMessage = `${cartItem.productName} 구매 실패: 서버 오류 (${status})`;
            }
            
            console.error('서버 응답 상세:', {
              status,
              statusText: err.response.statusText,
              data: data,
              headers: err.response.headers
            });
          } else if (err.request) {
            // 요청은 보냈지만 응답을 받지 못한 경우
            errorMessage = `${cartItem.productName} 구매 실패: 서버에 연결할 수 없습니다.`;
            console.error('서버 응답 없음:', err.request);
          } else {
            // 요청 설정 중 오류
            errorMessage = `${cartItem.productName} 구매 실패: ${err.message || '알 수 없는 오류'}`;
            console.error('요청 설정 오류:', err.message);
          }
          
          // 옵션 정보도 함께 로깅
          console.error('오류 발생 시 상품 정보:', {
            productId: cartItem.productId,
            productName: cartItem.productName,
            selectedUnit: cartItem.selectedUnit,
            selectedUnitProductName: cartItem.selectedUnitProductName,
            quantity: cartItem.qty
          });
          
          alert(errorMessage);
        }
      }

      // 결과 메시지
      if (successCount > 0) {
        if (failCount === 0) {
          // 첫 번째 주문 정보를 사용하여 결제 완료 화면으로 이동
          const firstOrderId = orderIds[0];
          if (firstOrderId) {
            // 첫 번째 상품 정보 가져오기
            const firstCartItem = selectedCartItems[0];
            const firstProduct = productDetails[firstCartItem.id] || await axios.get(`http://localhost:8080/products/detail/${firstCartItem.productId}`).then(res => res.data);
            
            // 총 결제 금액 계산 (단위 옵션 가격 반영)
            const itemsWithProducts = selectedCartItems.map(item => {
              const product = productDetails[item.id] || { price: item.price, discountRate: 0, bulkMinQuantity: null, bulkDiscountRate: null, shippingFreeThreshold: null, unitOptions: null };
              
              // 단위 옵션이 있고 선택된 옵션이 있는 경우, 선택된 옵션의 가격 사용
              let finalPrice = product.price || item.price;
              if (product.unitOptions && product.unitOptions.length > 0 && item.selectedUnit) {
                // productName과 unit을 모두 확인하여 정확히 매칭
                let selectedOption = product.unitOptions.find(opt => {
                  const unitMatch = opt.unit === item.selectedUnit;
                  const productNameMatch = item.selectedUnitProductName 
                    ? (opt.productName === item.selectedUnitProductName)
                    : (!opt.productName || !item.selectedUnitProductName);
                  return unitMatch && productNameMatch;
                });
                
                // 매칭되지 않으면 unit만으로 다시 찾기
                if (!selectedOption) {
                  selectedOption = product.unitOptions.find(opt => opt.unit === item.selectedUnit);
                }
                
                if (selectedOption) {
                  finalPrice = selectedOption.price;
                }
              }
              
              // 옵션 가격을 적용한 상품 정보
              const productWithOptionPrice = { ...product, price: finalPrice };
              
              return {
                product: productWithOptionPrice,
                quantity: item.qty
              };
            });
            const { totalAmount: totalPaymentAmount } = calculateMultipleItemsTotal(itemsWithProducts);
            
            // 주문 정보 localStorage에 저장 (PaymentComplete에서 사용)
            localStorage.setItem("mileage_order_id", firstOrderId);
            localStorage.setItem("mileage_productId", firstCartItem.productId);
            localStorage.setItem("mileage_productName", firstCartItem.productName);
            localStorage.setItem("mileage_quantity", firstCartItem.qty.toString());
            localStorage.setItem("mileage_totalAmount", totalPaymentAmount.toString());
            localStorage.setItem("mileage_mileageUsed", totalPaymentAmount.toString());
            
            // 여러 상품 구매인 경우 정보 저장
            if (selectedCartItems.length > 1) {
              localStorage.setItem("mileage_multiple_orders", JSON.stringify(orderIds));
              localStorage.setItem("mileage_multiple_items", JSON.stringify(selectedCartItems.map(item => {
                const product = productDetails[item.id];
                const selectedOption = item.selectedUnit && product?.unitOptions ? 
                  product.unitOptions.find(opt => opt.unit === item.selectedUnit) : null;
                return {
                  productId: item.productId,
                  productName: item.productName,
                  quantity: item.qty,
                  productImage: item.productImage || (product?.mainImage || (product?.images?.[0] || '')),
                  selectedUnitOption: selectedOption ? {
                    productName: selectedOption.productName || '',
                    unit: selectedOption.unit,
                    price: selectedOption.price
                  } : null
                };
              })));
              // 여러 상품 구매 시 첫 번째 상품명을 "상품명 외 N개" 형식으로 변경
              const combinedProductName = selectedCartItems.length > 1 
                ? `${selectedCartItems[0].productName} 외 ${selectedCartItems.length - 1}개`
                : selectedCartItems[0].productName;
              localStorage.setItem("mileage_productName", combinedProductName);
            }
            
            // 로딩 상태를 유지한 채로 PaymentComplete 페이지로 바로 이동
            // 장바구니 새로고침과 모달 닫기를 하지 않고 바로 이동하여 화면 전환 없음
            window.location.href = `/payment/complete?orderId=${firstOrderId}&type=mileage`;
            return; // 페이지 이동 직전이므로 함수 종료 (setIsProcessingPurchase 호출 안 함)
          } else {
            // 장바구니 목록 새로고침
            await loadCartItem(userId);
            setCheckedItem([]);
            setShowPurchaseModal(false);
            setIsProcessingPurchase(false);
            alert(`구매가 완료되었습니다!\n${successCount}개 상품이 주문되었습니다.`);
            navigate("/mypage");
            return;
          }
        } else {
          // 장바구니 목록 새로고침
          await loadCartItem(userId);
          setCheckedItem([]);
          setShowPurchaseModal(false);
          alert(`${successCount}개 상품은 구매되었지만, ${failCount}개 상품은 실패했습니다.`);
        }
      } else {
        alert("구매에 실패했습니다. 다시 시도해주세요.");
      }
      setIsProcessingPurchase(false);
    } catch (error) {
      console.error('구매 처리 오류:', error);
      alert('구매 처리 중 오류가 발생했습니다.');
      setIsProcessingPurchase(false);
    }
  };

    return (
        <>
        {/* 구매 처리 중 로딩 오버레이 */}
        {isProcessingPurchase && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999
            }}
          >
            <div style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '10px',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem', marginBottom: '20px' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h4 className="mt-3">구매 처리 중...</h4>
              <p className="text-muted mt-2">잠시만 기다려주세요.</p>
            </div>
          </div>
        )}

         <div className="container-fluid page-header wow fadeIn" data-wow-delay="0.1s">
            <div className="container">
                <h1 className="display-3 mb-3 animated slideInDown">
                    장바구니
                </h1>
                <nav aria-label="breadcrumb animated slideInDown">
                    <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item">
                            <a className="text-body" href="/">홈페이지</a>
                        </li>
                        <li className="breadcrumb-item">
                            <a className="text-body" href="/mypage">마이페이지</a>
                        </li>
                        <li className="breadcrumb-item text-dark active" aria-current="page">
                            장바구니
                        </li>
                    </ol>
                </nav>
            </div>
        </div>

        <div className="container py-6">

        {/* 회색 구분선 */}
        <hr className="cart-divider" />

        {/* 장바구니가 비어있을때 */}
        {cartItem.length === 0 ? (
            <div className="alert alert-info text-center py-5">
                <h4 className="mb-4">장바구니가 비어있습니다</h4>
                    <button 
                        className="btn btn-success btn-lg"
                        onClick={() => navigate('/products')}
                    > 쇼핑 계속하기 </button>
                    &nbsp;
                    <button 
                        className="btn btn-success btn-lg"
                        onClick={() => navigate('/wishlist')}
                    > 찜 목록으로 </button>
            </div>
        ) : (
            <>
            
            {/* 상단 컨트롤 */}
            <div className="row align-items-center mb-4">
                <div className="col-md-3">
                    <h4 className="display-8 mb-0">
                        나의 장바구니
                        <span className="text-muted ms-2 cart-item-count"> (총 {cartItem.length}개)</span>
                    </h4>
                </div>
            </div>

            {/* 장바구니 컬럼제목 */}
            <div className="row bg-light py-3 mb-2 rounded fw-bold text-center cart-header">
                <div className="col-1">
                        <input 
                            type="checkbox" 
                            checked={checkedItem.length === cartItem.length && cartItem.length >0}
                            onChange={checkAll}
                            className="form-check-input cart-header-checkbox"
                        />
                </div>
                <div className="col-1 cart-header-no">NO</div>
                <div className="col-1">이미지</div>
                <div className="col-3 text-start cart-header-product-name">상품명</div>
                <div className="col-1 cart-header-quantity">수량</div>
                <div className="col-2">단가</div>
                <div className="col-2">소계</div>
                <div className="col-1 cart-header-manage">관리</div>
            </div>

            {/* 장바구니 리스트 */}
            <div className="row g-3">
                {cartItem.map((item, index) => (
                    <CartItem
                        key={item.id}
                        item={item}
                        index={index}
                        isChecked={checkedItem.includes(item.id)}
                        onCheckChange={checkChange}
                        onQtyChange={qtyChange}
                        onDelete={onDelete}
                        product={productDetails[item.id]}
                        onOptionChange={handleOptionChange}
                    />
                ))}
            </div>

            {/* 구매하기 버튼 */}
            <div className="mt-4 text-end">
                <button 
                  className="btn btn-success btn-lg cart-purchase-button"
                  onClick={onBuy}
                  disabled={checkedItem.length === 0}
                >
                  <i className="fa fa-shopping-cart me-2"></i>
                  구매하기 ({checkedItem.length}개)
                </button>
                  &nbsp;
                <button 
                  className="btn btn-danger btn-lg cart-delete-button"
                  onClick={selectDelete}
                  disabled={checkedItem.length === 0}
                >
                  <i className="fa fa-shopping-cart me-2"></i>
                  선택 삭제 ({checkedItem.length}개)
                </button>
            </div>

            {/* 하단 요약 */}
            <div className="mt-5 p-4 bg-light rounded">                
                <div className="row">
                    <div className="col-md-12 text-end">
                        <h5>
                        총 <span className="text-success">{checkedItem.length}</span>개 상품 선택
                        </h5>

                        {(() => {
                            const selectedItems = cartItem.filter(item => checkedItem.includes(item.id));
                            if (selectedItems.length === 0) {
                                return <span className="text-success">0원</span>;
                            }
                            
                            // productDetails가 로드되지 않은 경우를 대비하여 기본값 처리 (단위 옵션 가격 반영)
                            const itemsWithProducts = selectedItems.map(item => {
                                const product = productDetails[item.id];
                                // productDetails가 없거나 price가 없으면 item.price 사용
                                if (!product || product.price === undefined || product.price === null || product.price === 0) {
                                    // item.price도 확인
                                    const fallbackPrice = item.price || 0;
                                    if (fallbackPrice === 0) {
                                        console.warn(`Item ${item.id} has no price:`, item);
                                    }
                                    return {
                                        product: { 
                                            price: fallbackPrice, 
                                            discountRate: 0, 
                                            bulkMinQuantity: null, 
                                            bulkDiscountRate: null, 
                                            shippingFreeThreshold: null,
                                            discountStart: null,
                                            discountEnd: null
                                        },
                                        quantity: item.qty || 1
                                    };
                                }
                                
                                // 단위 옵션이 있고 선택된 옵션이 있는 경우, 선택된 옵션의 가격 사용
                                let finalPrice = product.price;
                                if (product.unitOptions && product.unitOptions.length > 0 && item.selectedUnit) {
                                    // productName과 unit을 모두 확인하여 정확히 매칭
                                    let selectedOption = product.unitOptions.find(opt => {
                                        const unitMatch = opt.unit === item.selectedUnit;
                                        const productNameMatch = item.selectedUnitProductName 
                                            ? (opt.productName === item.selectedUnitProductName)
                                            : (!opt.productName || !item.selectedUnitProductName);
                                        return unitMatch && productNameMatch;
                                    });
                                    
                                    // 매칭되지 않으면 unit만으로 다시 찾기
                                    if (!selectedOption) {
                                        selectedOption = product.unitOptions.find(opt => opt.unit === item.selectedUnit);
                                    }
                                    
                                    if (selectedOption) {
                                        finalPrice = selectedOption.price;
                                    }
                                }
                                
                                // 옵션 가격을 적용한 상품 정보
                                const productWithOptionPrice = { ...product, price: finalPrice };
                                
                                return {
                                    product: productWithOptionPrice,
                                    quantity: item.qty || 1
                                };
                            });
                            
                            // 디버깅: 계산 전 값 확인
                            console.log('Selected items:', selectedItems);
                            console.log('Product details:', productDetails);
                            console.log('Items with products:', itemsWithProducts);
                            
                            const { totalProductAmount, shippingFee, totalAmount } = calculateMultipleItemsTotal(itemsWithProducts);
                            
                            console.log('Calculated totals:', { totalProductAmount, shippingFee, totalAmount });
                            
                            return (
                                <>
                                    {/* <div className="mb-2">
                                        상품 금액: <span className="text-success">{formatPrice(totalProductAmount)}원</span>
                                    </div> */}
                                    <div className="mb-2">
                                        배송비: <span className="text-success">{formatPrice(shippingFee)}원</span>
                                    </div>
                                    <div>
                                        총 결제예상 금액: <span className="text-success fs-4 fw-bold">
                                            {formatPrice(totalAmount)}원
                                        </span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                </div>
            </div>
            </>
        )}
    </div>

        <GotoBack /> 


 {/* 위로 가기 버튼 */}
    <a href="#" className="btn btn-lg btn-primary btn-lg-square rounded-circle back-to-top">
        <i className="bi bi-arrow-up"></i>
    </a>

    {/* 구매 확인 모달 */}
    {showPurchaseModal && (
      <>
        <div 
          className="modal-backdrop fade show cart-modal-backdrop"
          onClick={() => {
            if (!isProcessingPurchase) {
              setShowPurchaseModal(false);
            }
          }}
        ></div>
        <div 
          className="modal fade show cart-modal"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isProcessingPurchase) {
              setShowPurchaseModal(false);
            }
          }}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-lg cart-modal-dialog" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content cart-modal-content">
              <div className="modal-header cart-modal-header">
                <h5 className="modal-title">구매 확인</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowPurchaseModal(false)}
                  aria-label="Close"
                  disabled={isProcessingPurchase}
                ></button>
              </div>
              <div className="modal-body cart-modal-body">
                {/* 주문 상품 정보 */}
                <div className="mb-4">
                  <h6 className="mb-3">주문 상품 정보</h6>
                  <div className="cart-modal-products">
                    {cartItem.filter(item => checkedItem.includes(item.id)).map((item) => {
                      // 이미지 URL 처리
                      let imageUrl = '/img/no-image.png';
                      if (item.productImage) {
                        if (item.productImage.startsWith('http')) {
                          imageUrl = item.productImage;
                        } else if (item.productImage.startsWith('/')) {
                          imageUrl = `http://localhost:8080${item.productImage}`;
                        } else {
                          imageUrl = `http://localhost:8080/uploads/product-images/${item.productImage}`;
                        }
                      } else if (productDetails[item.id]?.mainImage) {
                        const mainImg = productDetails[item.id].mainImage;
                        if (mainImg.startsWith('http')) {
                          imageUrl = mainImg;
                        } else {
                          imageUrl = `http://localhost:8080${mainImg.startsWith('/') ? '' : '/'}${mainImg}`;
                        }
                      } else if (productDetails[item.id]?.images?.[0]) {
                        const firstImg = productDetails[item.id].images[0];
                        if (firstImg.startsWith('http')) {
                          imageUrl = firstImg;
                        } else {
                          imageUrl = `http://localhost:8080${firstImg.startsWith('/') ? '' : '/'}${firstImg}`;
                        }
                      }
                      
                      return (
                        <div key={item.id} className="d-flex align-items-start mb-4 pb-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <img 
                            src={imageUrl}
                            alt={item.productName}
                            className="cart-modal-product-image"
                            onError={(e) => {
                              e.target.src = '/img/no-image.png';
                            }}
                          />
                        <div className="cart-modal-product-info">
                          <h6 className="mb-2" style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>{item.productName}</h6>
                          {(() => {
                            const product = productDetails[item.id] || { price: item.price, discountRate: 0, bulkMinQuantity: null, bulkDiscountRate: null, discountStart: null, discountEnd: null, unitOptions: null };
                            // 옵션 정보 찾기
                            let selectedOption = null;
                            if (product.unitOptions && product.unitOptions.length > 0 && item.selectedUnit) {
                              // productName과 unit을 모두 확인하여 정확히 매칭
                              selectedOption = product.unitOptions.find(opt => {
                                const unitMatch = opt.unit === item.selectedUnit;
                                const productNameMatch = item.selectedUnitProductName 
                                  ? (opt.productName === item.selectedUnitProductName)
                                  : (!opt.productName || !item.selectedUnitProductName);
                                return unitMatch && productNameMatch;
                              });
                              
                              // 매칭되지 않으면 unit만으로 다시 찾기
                              if (!selectedOption) {
                                selectedOption = product.unitOptions.find(opt => opt.unit === item.selectedUnit);
                              }
                            }
                            // 옵션이 있지만 선택되지 않은 경우 기본 옵션 사용
                            if (!selectedOption && product.unitOptions && product.unitOptions.length > 0) {
                              selectedOption = product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0];
                            }
                            
                            // 옵션 가격 적용
                            let itemProduct = product;
                            if (selectedOption) {
                              itemProduct = { ...product, price: selectedOption.price };
                            }
                            
                            const itemTotal = calculateItemTotal(itemProduct, item.qty);
                            const hasBasicDiscount = product.discountRate && product.discountRate > 0 && isOnDiscount(product.discountRate, product.discountStart, product.discountEnd);
                            const hasBulkDiscount = product.bulkMinQuantity && product.bulkDiscountRate && item.qty >= product.bulkMinQuantity;
                            const originalPrice = itemProduct.price * item.qty;
                            
                            return (
                              <>
                                {/* 옵션 정보 표시 */}
                                {selectedOption && (
                                  <div className="text-muted small mb-2" style={{ fontSize: '13px', color: '#888' }}>
                                    {selectedOption.productName ? `${selectedOption.productName} - ` : ''}{selectedOption.unit}
                                  </div>
                                )}
                                <div className="text-muted small mb-3" style={{ fontSize: '14px', color: '#666' }}>
                                  수량: <strong style={{ color: '#333' }}>{item.qty}개</strong>
                                </div>
                            
                                <div className="cart-modal-product-price-wrapper">
                                  {hasBasicDiscount || hasBulkDiscount ? (
                                    <div>
                                      <div className="cart-modal-product-price-row">
                                        <span className="cart-modal-product-price-discounted">
                                          {formatPrice(itemTotal)}원
                                        </span>
                                        {hasBasicDiscount && (
                                          <span className="cart-modal-discount-badge-basic">
                                            {product.discountRate}%
                                          </span>
                                        )}
                                        {hasBulkDiscount && (
                                          <span className="cart-modal-discount-badge-bulk">
                                            대량 {product.bulkDiscountRate}%
                                          </span>
                                        )}
                                      </div>
                                      <div className="cart-modal-product-price-original">
                                        {formatPrice(originalPrice)}원
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="cart-modal-product-price-normal">
                                      {formatPrice(itemTotal)}원
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>

                {/* 결제 정보 */}
                <div className="mb-4 cart-modal-payment-info">
                  <h6 className="mb-3 fw-bold">결제 정보</h6>
                  {(() => {
                    const selectedItems = cartItem.filter(item => checkedItem.includes(item.id));
                    // 옵션 가격을 적용한 상품 정보로 변환
                    const itemsWithProducts = selectedItems.map(item => {
                      const product = productDetails[item.id] || { price: item.price, discountRate: 0, bulkMinQuantity: null, bulkDiscountRate: null, shippingFreeThreshold: null, discountStart: null, discountEnd: null, unitOptions: null };
                      // 옵션 정보 찾기
                      let selectedOption = null;
                      if (product.unitOptions && product.unitOptions.length > 0 && item.selectedUnit) {
                        // productName 우선으로 찾기, 없으면 unit으로 찾기
                        selectedOption = product.unitOptions.find(opt => 
                          (item.selectedUnitProductName && opt.productName === item.selectedUnitProductName) || 
                          opt.unit === item.selectedUnit
                        );
                      }
                      // 옵션이 있지만 선택되지 않은 경우 기본 옵션 사용
                      if (!selectedOption && product.unitOptions && product.unitOptions.length > 0) {
                        selectedOption = product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0];
                      }
                      // 옵션 가격 적용
                      const productWithOptionPrice = selectedOption ? { ...product, price: selectedOption.price } : product;
                      return {
                        product: productWithOptionPrice,
                        quantity: item.qty
                      };
                    });
                    const { totalProductAmount, shippingFee, totalAmount } = calculateMultipleItemsTotal(itemsWithProducts);
                    
                    // 전체 원가 계산 (옵션 가격 반영)
                    const totalOriginalPrice = selectedItems.reduce((sum, item) => {
                      const product = productDetails[item.id] || { price: item.price, unitOptions: null };
                      // 옵션 정보 찾기
                      let selectedOption = null;
                      if (product.unitOptions && product.unitOptions.length > 0 && item.selectedUnit) {
                        // productName과 unit을 모두 확인하여 정확히 매칭
                        selectedOption = product.unitOptions.find(opt => {
                          const unitMatch = opt.unit === item.selectedUnit;
                          const productNameMatch = item.selectedUnitProductName 
                            ? (opt.productName === item.selectedUnitProductName)
                            : (!opt.productName || !item.selectedUnitProductName);
                          return unitMatch && productNameMatch;
                        });
                        
                        // 매칭되지 않으면 unit만으로 다시 찾기
                        if (!selectedOption) {
                          selectedOption = product.unitOptions.find(opt => opt.unit === item.selectedUnit);
                        }
                      }
                      if (!selectedOption && product.unitOptions && product.unitOptions.length > 0) {
                        selectedOption = product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0];
                      }
                      const itemPrice = selectedOption ? selectedOption.price : product.price;
                      return sum + (itemPrice * item.qty);
                    }, 0);
                    
                    // 전체 할인 금액 계산 (옵션 가격 반영)
                    let totalBasicDiscount = 0;
                    let totalBulkDiscount = 0;
                    
                    selectedItems.forEach(item => {
                      const product = productDetails[item.id] || { price: item.price, discountRate: 0, bulkMinQuantity: null, bulkDiscountRate: null, discountStart: null, discountEnd: null, unitOptions: null };
                      // 옵션 정보 찾기
                      let selectedOption = null;
                      if (product.unitOptions && product.unitOptions.length > 0 && item.selectedUnit) {
                        selectedOption = product.unitOptions.find(opt => 
                          (item.selectedUnitProductName && opt.productName === item.selectedUnitProductName) || 
                          opt.unit === item.selectedUnit
                        );
                      }
                      if (!selectedOption && product.unitOptions && product.unitOptions.length > 0) {
                        selectedOption = product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0];
                      }
                      const itemPrice = selectedOption ? selectedOption.price : product.price;
                      const itemOriginalPrice = itemPrice * item.qty;
                      
                      // 기본 할인
                      if (product.discountRate && isOnDiscount(product.discountRate, product.discountStart, product.discountEnd)) {
                        totalBasicDiscount += Math.round(itemOriginalPrice * product.discountRate / 100);
                      }
                      
                      // 대량구매 할인 (기본 할인 적용 후 가격 기준)
                      if (product.bulkMinQuantity && product.bulkDiscountRate && item.qty >= product.bulkMinQuantity) {
                        const afterBasicDiscount = itemOriginalPrice - (product.discountRate && isOnDiscount(product.discountRate, product.discountStart, product.discountEnd) ? Math.round(itemOriginalPrice * product.discountRate / 100) : 0);
                        totalBulkDiscount += Math.round(afterBasicDiscount * product.bulkDiscountRate / 100);
                      }
                    });
                    
                    const totalDiscountAmount = totalBasicDiscount + totalBulkDiscount;
                    
                    return (
                      <div className="cart-modal-payment-details">
                        <div className="cart-modal-payment-row">
                          <span className="cart-modal-payment-label">상품 금액</span>
                          <span className="cart-modal-payment-value">{formatPrice(totalOriginalPrice)}원</span>
                        </div>
                        {totalBasicDiscount > 0 && (
                          <div className="cart-modal-payment-row cart-modal-payment-discount">
                            <span className="cart-modal-payment-label">기본 할인</span>
                            <span className="cart-modal-payment-value">-{formatPrice(totalBasicDiscount)}원</span>
                          </div>
                        )}
                        {totalBulkDiscount > 0 && (
                          <div className="cart-modal-payment-row cart-modal-payment-discount">
                            <span className="cart-modal-payment-label">대량구매 할인</span>
                            <span className="cart-modal-payment-value">-{formatPrice(totalBulkDiscount)}원</span>
                          </div>
                        )}
                        {totalDiscountAmount > 0 && (
                          <>
                            <div className="cart-modal-payment-divider"></div>
                          </>
                        )}
                        <div className="cart-modal-payment-row">
                          <span className="cart-modal-payment-label">배송비</span>
                          <span className="cart-modal-payment-value">{formatPrice(shippingFee)}원</span>
                        </div>
                        <div className="cart-modal-payment-divider"></div>
                        <div className="cart-modal-payment-row cart-modal-payment-total">
                          <span className="cart-modal-payment-label">총 결제 금액</span>
                          <span className="cart-modal-payment-value cart-modal-payment-total-amount">
                            {formatPrice(totalAmount)}원
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="mt-3 p-3 bg-light rounded" style={{ 
                    border: '1px solid #e9ecef',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    <span style={{ color: '#666' }}>보유 마일리지: </span>
                    <span style={{ color: '#28a745', fontWeight: '700', fontSize: '16px' }}>
                      {availableMileage.toLocaleString()}원
                    </span>
                  </div>
                </div>
                {/* 배송지 선택하기 */}
                    <div>
                      <button
                        className="btn btn-outline-primary w-100 mt-2"
                        onClick={() => setShowAddressModal(true)}
                      >배송지 선택하기</button>
                    </div>
                    {showAddressModal && (
                      <div 
                        className="modal-backdrop fade show" 
                        style={{ zIndex: 2000 }}
                        onClick={() => setShowAddressModal(false)}
                      ></div>
                    )}

                    {showAddressModal && (
                      <div 
                        className="modal fade show"
                        style={{
                          position: "fixed",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 2050
                        }}
                        onClick={(e) => {
                          if (e.target === e.currentTarget) setShowAddressModal(false);
                        }}
                      >
                        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "800px", width: "90%" }}>
                          <div className="modal-content" style={{ padding: "20px" }} onClick={(e) => e.stopPropagation()}>
                            {/* 모달이 열릴 때마다 최신 기본 배송지 불러오기 */}
                            {showAddressModal && (
                              <SmartAddressSelect 
                                key={showAddressModal} // 모달이 열릴 때마다 컴포넌트 재마운트
                                userId={userId}
                                onSelect={(addr) => {
                                  setSelectedAddress(addr);
                                  setShowAddressModal(false);
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedAddress ? (
                      <div className="p-3 border rounded mb-3">
                        <strong>{selectedAddress.title}</strong><br />
                        ({selectedAddress.post}) {selectedAddress.addr1} {selectedAddress.addr2}<br />
                        연락처: {selectedAddress.phone}
                      </div>
                    ) : (
                      <div className="alert alert-warning p-2">
                        배송지가 선택되지 않았습니다.
                      </div>
                    )}

                {/* 필수 안내 체크박스 */}
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="agreeTerms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      disabled={isProcessingPurchase}
                    />
                    <label className="form-check-label" htmlFor="agreeTerms">
                      <strong>[필수]</strong> 구매 안내 사항을 확인하였으며, 구매에 동의합니다.
                    </label>
                  </div>
                  <div className="mt-2 p-2 bg-light rounded small cart-modal-terms">
                    <div className="mb-1">• 마일리지로 결제됩니다.</div>
                    <div className="mb-1">• 구매 후 취소/환불은 마이페이지에서 신청 가능합니다.</div>
                    <div>• 배송은 영업일 기준 2-3일 소요됩니다.</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top pt-3 cart-modal-footer">
                <button
                  className="btn btn-outline-secondary btn-lg px-4"
                  onClick={() => setShowPurchaseModal(false)}
                  disabled={isProcessingPurchase}
                >
                  취소
                </button>
                <button
                  className="btn btn-success btn-lg px-5"
                  onClick={handlePurchaseConfirm}
                  disabled={isProcessingPurchase || !agreedToTerms}
                  style={{
                    background: agreedToTerms ? 'linear-gradient(135deg, #3CB815 0%, #2E8B0E 100%)' : '#6c757d',
                    border: 'none',
                    minWidth: '200px'
                  }}
                >
                  {isProcessingPurchase ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      처리 중...
                    </>
                  ) : (
                    '구매하기'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )}

    </>
    );

}

    export default Cart;