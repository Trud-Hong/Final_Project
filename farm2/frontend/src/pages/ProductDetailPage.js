// src/pages/ProductDetailPage.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import "../css/productDetailPage.scss";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import ProductReview from "../components/ProductReview";
import RelatedProducts from "../components/RelatedProducts";
import ProductQnA from "../components/ProductQnA";
import { getDiscountedPrice, calculateTotalAmount as calculateTotalAmountUtil, formatPrice as formatPriceUtil, isOnDiscount } from "../utils/priceCalculator";
import SmartAddressSelect from "../components/SmartAddressSelect";
import Share from "../components/Share";

/* 설정 */
const API_BASE = "http://localhost:8080"; // 필요 시 변경
const MOCK_PRODUCT = {
  id: "691bcac29ae55329a780219a",
  name: "테스트 사과 (샘플)",
  price: 12310,
  unit: "kg",
  origin: "한국",
  originDetail: "경기도 ○○농장",
  farmingType: "유기농",
  harvestDate: "2025-10-31",
  expirationDate: "2025-11-26",
  description:
    "신선한 사과입니다. 달고 아삭한 맛이 특징이며, 샘플 설명 텍스트입니다.",
  images: [
    "https://picsum.photos/1200/900?random=1",
    "https://picsum.photos/1200/900?random=2",
    "https://picsum.photos/1200/900?random=3",
    "https://picsum.photos/1200/900?random=4",
  ],
  discountRate: 13,
  storageMethod: "서늘한 곳 보관",
  stock: 123,
  tags: ["과일", "제철", "유기농"],
  shippingConditions: "샛별배송/택배배송 가능",
  sellerName: "테스트 판매자",
};

/* 유틸 */
// 이미지 URL 처리 (상대 경로면 API_BASE 추가)
const getImageUrl = (imagePath) => {
  if (!imagePath) return '/img/no-image.png';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
};

const formatPrice = (v) => (typeof v === "number" ? `${v.toLocaleString()}원` : v);

/* 라이트박스(간단) */
function Lightbox({ src, onClose }) {
  if (!src) return null;
  return (
    <div className="pd-lightbox" onClick={onClose}>
      <div className="pd-lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <img 
          src={getImageUrl(src)} 
          alt="lightbox"
          onError={(e) => {
            e.target.src = '/img/no-image.png';
          }}
        />
        <button className="pd-lightbox-close" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {

    const leftRef = useRef(null);
    const stickyRef = useRef(null);

  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [mainIndex, setMainIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const fadeTimerRef = useRef(null);

  const [quantity, setQuantity] = useState(1);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [availableMileage, setAvailableMileage] = useState(0);
  
  //배송지 선택
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(null);
  const userId = localStorage.getItem("userId");

  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'cert', 'detail', 'review', 'qna'
  const [showStickyTabs, setShowStickyTabs] = useState(false);
  
  // 탭 콘텐츠 ref
  const infoTabRef = useRef(null);
  const certTabRef = useRef(null);
  const detailTabRef = useRef(null);
  const reviewTabRef = useRef(null);
  const qnaTabRef = useRef(null);
  
  // 탭 클릭 핸들러
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    
    // 해당 탭 콘텐츠로 스크롤 (navbar 높이만큼 오프셋 추가)
    setTimeout(() => {
      let targetRef = null;
      switch(tabName) {
        case 'info':
          targetRef = infoTabRef.current;
          break;
        case 'cert':
          targetRef = certTabRef.current;
          break;
        case 'detail':
          targetRef = detailTabRef.current;
          break;
        case 'review':
          targetRef = reviewTabRef.current;
          break;
        case 'qna':
          targetRef = qnaTabRef.current;
          break;
      }
      
      if (targetRef) {
        const elementPosition = targetRef.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - 120; // navbar 높이만큼 오프셋
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  // 스크롤 위치 감지하여 탭 표시 여부 결정
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY || window.pageYOffset;
      // 탭이 있는 위치를 지나면 하단 고정 탭 표시
      const tabsElement = document.querySelector('.pd-tabs-static');
      if (tabsElement) {
        const tabsOffsetTop = tabsElement.offsetTop;
        // 탭 위치를 지나면 하단 탭 표시
        setShowStickyTabs(scrollPosition > tabsOffsetTop);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 초기 로드 시에도 체크
    return () => window.removeEventListener('scroll', handleScroll);
  }, [product]); // product가 로드되면 탭 위치를 다시 계산

  // 가격 정보 (최근 1개월 최저가, 평균가)
  const [priceInfo, setPriceInfo] = useState({
    minPrice: null,
    avgPrice: null,
    loading: false,
    error: null
  });

  // 단위 옵션 관리
  const [selectedUnitOption, setSelectedUnitOption] = useState(null);
  const [displayPrice, setDisplayPrice] = useState(0);
  const [displayStock, setDisplayStock] = useState(0);
  const [displayUnit, setDisplayUnit] = useState('');

  // 현재 재고 계산 (unitOptions가 있으면 selectedUnitOption의 재고 사용)
  const getCurrentStock = () => {
    if (product && product.unitOptions && product.unitOptions.length > 0 && selectedUnitOption) {
      return selectedUnitOption.stock || 0;
    }
    return displayStock || (product ? product.stock : 0);
  };

  // 현재 단위 계산
  const getCurrentUnit = () => {
    if (product && product.unitOptions && product.unitOptions.length > 0 && selectedUnitOption) {
      return selectedUnitOption.unit || '';
    }
    return displayUnit || (product ? product.unit : '');
  };

  // 현재 가격 계산 (unitOptions가 있으면 selectedUnitOption의 가격 사용)
  const getCurrentPrice = () => {
    if (product && product.unitOptions && product.unitOptions.length > 0 && selectedUnitOption) {
      return selectedUnitOption.price || 0;
    }
    return displayPrice || (product ? product.price : 0);
  };

  // 수량 조절 및 구매 가능 여부 확인 (unitOptions가 있으면 옵션 선택 필수)
  const canAdjustQuantity = () => {
    if (product && product.unitOptions && product.unitOptions.length > 0) {
      return selectedUnitOption !== null;
    }
    return true; // unitOptions가 없으면 항상 가능
  };

  useEffect(() => {
    const adjustStickyHeight = () => {
        if(leftRef.current && stickyRef.current) {
            stickyRef.current.style.minHeight = `${leftRef.current.offsetHeight}px`;
        }
    };

    adjustStickyHeight();
    window.addEventListener("resize", adjustStickyHeight);

    return () => window.removeEventListener("resize", adjustStickyHeight);
  },[product])

  const [related, setRelated] = useState([]);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  /* 데이터 로드 */
  useEffect(() => {
    if (!productId) {
      setProduct(MOCK_PRODUCT);
      setRelated(makeRelatedMock(MOCK_PRODUCT));
      return;
    }
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE}/products/detail/${productId}`);
        if (res.data) {
          setProduct(res.data);
          
          // unitOptions 처리 (초기에는 옵션 선택하지 않음)
          if (res.data.unitOptions && Array.isArray(res.data.unitOptions) && res.data.unitOptions.length > 0) {
            // 기존 선택된 옵션이 있고 여전히 유효하면 유지 (페이지 새로고침 등)
            setSelectedUnitOption(prev => {
              if (prev) {
                // productName 우선으로 찾기
                let updatedOption = null;
                // productName과 unit 둘 다 비교하여 정확한 옵션 찾기
                if (prev.productName && prev.unit) {
                  // productName과 unit 둘 다 있으면 둘 다 비교
                  updatedOption = res.data.unitOptions.find(opt => {
                    const optProductName = (opt.productName || '').trim();
                    const optUnit = (opt.unit || '').trim();
                    return optProductName === prev.productName.trim() && optUnit === prev.unit.trim();
                  });
                } else if (prev.unit) {
                  // unit만 있으면 unit만으로 찾기
                  updatedOption = res.data.unitOptions.find(opt => 
                    opt.unit && opt.unit.trim() === prev.unit.trim()
                  );
                } else if (prev.productName) {
                  // productName만 있으면 productName만으로 찾기 (하지만 이 경우는 정확하지 않을 수 있음)
                  updatedOption = res.data.unitOptions.find(opt => 
                    opt.productName && opt.productName.trim() === prev.productName.trim()
                  );
                }
                
                if (updatedOption) {
                  // 기존 선택 유지 (재고는 업데이트)
                  setDisplayPrice(updatedOption.price || 0);
                  setDisplayStock(updatedOption.stock || 0);
                  setDisplayUnit(updatedOption.unit || '');
                  return updatedOption;
                }
              }
              // 초기 로드 시에는 옵션을 선택하지 않음 (null로 유지)
              setDisplayPrice(0);
              setDisplayStock(0);
              setDisplayUnit('');
              return null;
            });
          } else {
            // unitOptions가 없으면 기본 값 사용
            setSelectedUnitOption(null);
            setDisplayPrice(res.data.price || 0);
            setDisplayStock(res.data.stock || 0);
            setDisplayUnit(res.data.unit || '');
          }
          
          const relatedRes = await axios.get(`${API_BASE}/products/related/${productId}`);
          setRelated(relatedRes.data || []);

        } else {
          setProduct(MOCK_PRODUCT);
          setRelated(makeRelatedMock(MOCK_PRODUCT));
        }
      } catch (err) {
        console.warn("상품 API 호출 실패, mock 사용:", err?.message || err);
        setProduct(MOCK_PRODUCT);
        setRelated(makeRelatedMock(MOCK_PRODUCT));
      }
    };

    fetchProduct();
    
    // 결제 완료 후 재고 갱신을 위한 폴링
    const interval = setInterval(() => {
      if (productId) {
        fetchProduct();
      }
    }, 2000); // 2초마다 갱신
    
    // 결제 완료 후 페이지 복귀 시 즉시 갱신
    const handleFocus = () => {
      if (productId) {
        fetchProduct();
      }
    };
    
    // 페이지 가시성 변경 시 갱신 (다른 탭에서 돌아올 때)
    const handleVisibilityChange = () => {
      if (!document.hidden && productId) {
        fetchProduct();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 결제 완료 후 localStorage에 플래그가 있으면 즉시 갱신
    const checkPaymentComplete = () => {
      const paymentCompleted = sessionStorage.getItem('payment_completed');
      if (paymentCompleted === 'true') {
        fetchProduct();
        sessionStorage.removeItem('payment_completed');
      }
    };
    checkPaymentComplete();
    
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [productId]);

  // 초기 로드 시에만 mainImage로 설정 (대표이미지가 첫 번째에 있으면 인덱스 0으로 설정)
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  useEffect(() => {
    if(product?.images?.length && isInitialLoad) {
      // 대표이미지가 첫 번째에 있는지 확인 (등록 시 첫 번째로 배치되도록 했으므로)
      const mainIdx = product.mainImage && product.images[0] === product.mainImage 
        ? 0 
        : product.images.findIndex(img => img === product.mainImage);
      setMainIndex(mainIdx >= 0 ? mainIdx : 0);
      setIsInitialLoad(false);
    }
  },[product, isInitialLoad])

  // 가격 추세 데이터 가져오기 (최근 1개월 최저가, 평균가)
  useEffect(() => {
    if (!product?.name) return;

    const fetchPriceTrend = async () => {
      setPriceInfo(prev => ({ ...prev, loading: true, error: null }));

      // itemType(상품종의 품목) 또는 name이 없으면 가격 정보를 가져올 수 없음
      if (!product?.itemType && !product?.name) {
        setPriceInfo({ minPrice: null, avgPrice: null, loading: false, error: null });
        return;
      }

      try {
        // 최근 1개월 데이터 가져오기
        const today = new Date();
        const currentMonth = today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const monthIndex = today.getMonth();
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

        // 가격 추세 API 호출 함수
        const fetchDayData = async (day) => {
          const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          try {
            const response = await axios.get('http://localhost:8080/api/price/newtrend', {
              params: {
                p_regday: dateStr,
                p_country_code: '1101' // 서울 기본값
              }
            });
            return response.data;
          } catch (err) {
            console.error(`Error fetching day data: ${dateStr}`, err);
            return null;
          }
        };

        // 유틸리티 함수들 (PriceTrend.js 참고)
        const extractKgFromUnit = (unit) => {
          if (!unit) return 1;
          const unitLower = unit.toLowerCase();
          
          // g 단위 처리 (그램을 kg으로 변환: 1000g = 1kg)
          if (unitLower.indexOf('g') !== -1 && unitLower.indexOf('kg') === -1) {
            const match = unit.match(/([\d.]+)\s*g/i);
            if (match) {
              return parseFloat(match[1]) / 1000; // g을 kg으로 변환
            }
          }
          
          // kg 단위 처리
          if (unitLower.indexOf('kg') !== -1) {
            const match = unit.match(/([\d.]+)\s*kg/i);
            if (match) {
              return parseFloat(match[1]);
            }
          }
          
          // 개 단위 처리
          if (unitLower.indexOf('개') !== -1) {
            const match = unit.match(/([\d.]+)\s*개/i);
            if (match) {
              return parseFloat(match[1]);
            }
          }
          
          return 1; // 기본값
        };

        const calculatePricePerKg = (item) => {
          const priceStr = item.dpr1;
          if (!priceStr || priceStr === "-" || priceStr === "" || priceStr === null || priceStr === undefined) {
            return 0;
          }
          
          let cost = 0;
          if (typeof priceStr === 'string') {
            const cleanedPrice = priceStr.replace(/[,\s]/g, "");
            if (cleanedPrice === "" || cleanedPrice === "-" || isNaN(cleanedPrice)) {
              return 0;
            }
            cost = parseFloat(cleanedPrice) || 0;
          } else if (typeof priceStr === 'number') {
            cost = priceStr;
          }
          
          const unit = item.unit || item.std || item.unit_name || item.unitName || '';
          const kgPerUnit = extractKgFromUnit(unit);
          
          if (kgPerUnit > 0 && cost > 0) {
            return cost / kgPerUnit;
          }
          return 0;
        };

        // 품목명 추출 함수 (Product.js와 동일하게 PRDLST_NM 우선)
        const getItemName = (item) => {
          return item.PRDLST_NM || 
                 item.item_name || 
                 (item.item && item.item.item_name) ||
                 item.productName || 
                 item.name || 
                 item.MIDNAME || '';
        };

        // 상품명과 매칭되는 품목 찾기 (정확한 매칭 또는 부분 매칭)
        const matchProductName = (itemName, productName) => {
          if (!itemName || !productName) return false;
          const itemNameLower = itemName.toLowerCase().trim();
          const productNameLower = productName.toLowerCase().trim();
          
          // 정확한 매칭
          if (itemNameLower === productNameLower) return true;
          
          // 부분 매칭 (상품명이 품목명에 포함되거나, 품목명이 상품명에 포함)
          if (itemNameLower.includes(productNameLower) || productNameLower.includes(itemNameLower)) {
            return true;
          }
          
          // 일반적인 단어 제거 후 매칭 (예: "사과"와 "부사 사과")
          const productWords = productNameLower.split(/\s+/).filter(w => w.length > 1);
          return productWords.some(word => itemNameLower.includes(word));
        };

        // 일별 데이터 수집 (매일 데이터를 가져와서 최저가 정확도 향상)
        const dayPromises = [];
        for (let day = 1; day <= daysInMonth; day++) {
          dayPromises.push(fetchDayData(day));
        }
        
        const dayResponses = await Promise.all(dayPromises);
        
        // 데이터 파싱 및 가격 추출
        const allPrices = [];
        
        dayResponses.forEach((responseData, index) => {
          if (!responseData) return;
          
          // 응답 데이터 파싱
          let items = [];
          if (typeof responseData === 'string') {
            try {
              responseData = JSON.parse(responseData);
            } catch (e) {
              return;
            }
          }
          
          // Grid_20240625000000000661_1.row 구조 우선 체크 (Product.js와 동일하게)
          if (responseData.Grid_20240625000000000661_1 && responseData.Grid_20240625000000000661_1.row) {
            items = responseData.Grid_20240625000000000661_1.row;
          } else if (responseData.data) {
            if (responseData.data.data && responseData.data.data.item && Array.isArray(responseData.data.data.item)) {
              items = responseData.data.data.item;
            } else if (responseData.data.data && Array.isArray(responseData.data.data)) {
              items = responseData.data.data;
            } else if (responseData.data.item && Array.isArray(responseData.data.item)) {
              items = responseData.data.item;
            } else if (Array.isArray(responseData.data)) {
              items = responseData.data;
            }
          }
          
          if (items.length === 0) {
            if (responseData.item && Array.isArray(responseData.item)) {
              items = responseData.item;
            } else if (Array.isArray(responseData)) {
              items = responseData;
            }
          }
          
          // 상품종의 품목(itemType) 또는 상품명과 매칭되는 품목 찾기 (itemType 우선)
          const matchName = product.itemType || product.name;
          const matchedItems = items.filter(item => {
            const itemName = getItemName(item);
            return matchProductName(itemName, matchName);
          });
          
          // kg당 가격 계산
          matchedItems.forEach(item => {
            const pricePerKg = calculatePricePerKg(item);
            if (pricePerKg > 0 && !Number.isNaN(pricePerKg)) {
              allPrices.push(pricePerKg);
            }
          });
        });

        // 최저가와 평균가 계산
        if (allPrices.length > 0) {
          const minPrice = Math.min(...allPrices);
          const avgPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
          
          setPriceInfo({
            minPrice: Math.round(minPrice),
            avgPrice: Math.round(avgPrice),
            loading: false,
            error: null
          });
        } else {
          setPriceInfo({
            minPrice: null,
            avgPrice: null,
            loading: false,
            error: '가격 데이터를 찾을 수 없습니다.'
          });
        }
      } catch (error) {
        console.error('가격 추세 데이터 가져오기 실패:', error);
        setPriceInfo({
          minPrice: null,
          avgPrice: null,
          loading: false,
          error: '가격 정보를 불러오는 중 오류가 발생했습니다.'
        });
      }
    };

    fetchPriceTrend();
  }, [product?.itemType, product?.name]);

  // 현재 선택된 단위의 가격으로 총액 계산
  const totalPrice = getCurrentPrice() * quantity;

  /* 이미지 페이드 전환: 인덱스 바꿀 때 트리거 */
  const showImageIndex = (idx) => {
    if (idx === mainIndex) return;
    setMainIndex(idx);
  };

  /* 수량 */
  const increase = () => setQuantity((q) => q + 1);
  const decrease = () => setQuantity((q) => Math.max(1, q - 1));


  // 최종 결제 금액 계산 (유틸리티 사용)
  const calculateTotalAmount = () => {
    if (!product) return 0;
    
    // unitOptions가 있으면 선택된 옵션의 가격을 사용하도록 product 객체 임시 수정
    const productForCalculation = { ...product };
    const currentPrice = getCurrentPrice();
    if (currentPrice > 0) {
      productForCalculation.price = currentPrice;
    }
    
    const result = calculateTotalAmountUtil(productForCalculation, quantity);
    return result.totalAmount;
  };

  // 구매하기 버튼 클릭 - 모달 열기
  const onBuy = async () => {
    console.log('구매하기 버튼 클릭됨');
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 후 구매 가능합니다.");
      return;
    }
    
    // unitOptions가 있으면 옵션 선택 확인
    if (product.unitOptions && product.unitOptions.length > 0 && !selectedUnitOption) {
      alert("옵션을 선택해주세요.");
      return;
    }

    // 재고 확인
    const currentStock = getCurrentStock();
    if (currentStock < quantity) {
      const currentUnit = getCurrentUnit();
      alert(`재고가 부족합니다. (현재 재고: ${currentStock}개${currentUnit ? `, 단위: ${currentUnit}` : ''})`);
      return;
    }

    const totalAmount = calculateTotalAmount();
    console.log('총 결제 금액:', totalAmount);

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
    } catch (error) {
      console.error('마일리지 조회 실패:', error);
      alert('마일리지 조회 중 오류가 발생했습니다.');
      return;
    }

    // 모달 열기
    console.log('모달 열기');
    setShowPurchaseModal(true);
    setAgreedToTerms(false);
    
    // 기본 배송지 자동 로드 (모달이 열릴 때마다 최신 기본 배송지 확인)
    if (userId) {
      fetchDefaultAddress();
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

    // 약관 동의 확인
    if (!agreedToTerms) {
      alert('구매 안내 사항에 동의해주세요.');
      return;
    }

    try {
      setIsProcessingPurchase(true);
      const token = localStorage.getItem("token");
      const totalAmount = calculateTotalAmount();

      // 마일리지로 주문 생성 (배송지 포함, 선택된 단위 정보 포함)
      const currentPrice = getCurrentPrice();
      const currentUnit = getCurrentUnit();
      const payload = {
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        totalAmount: totalAmount,
        address: selectedAddress,
        unit: currentUnit || displayUnit, // 선택된 단위
        selectedUnitProductName: selectedUnitOption ? (selectedUnitOption.productName || null) : null, // 선택된 옵션의 제품명
        unitPrice: currentPrice || displayPrice // 선택된 단위의 단가
      };

      console.log('구매 요청 payload:', payload);
      
      const res = await axios.post("http://localhost:8080/api/orders/create-with-mileage", payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json" 
        },
      });

      console.log('구매 응답:', res.data);

      if (res.data.success) {
        const orderId = res.data.order?.id || `mileage-order-${Date.now()}`;
        
        // 주문 정보 localStorage에 저장 (PaymentComplete에서 사용)
        localStorage.setItem("mileage_order_id", orderId);
        localStorage.setItem("mileage_productId", product.id);
        localStorage.setItem("mileage_productName", product.name);
        localStorage.setItem("mileage_quantity", quantity.toString());
        localStorage.setItem("mileage_totalAmount", totalAmount.toString());
        localStorage.setItem("mileage_mileageUsed", totalAmount.toString());
        
        // 선택한 옵션 정보 저장 (옵션이 있는 경우)
        if (selectedUnitOption) {
          localStorage.setItem("mileage_selectedUnitOption", JSON.stringify({
            productName: selectedUnitOption.productName || '',
            unit: selectedUnitOption.unit || '',
            price: selectedUnitOption.price || 0
          }));
        } else {
          localStorage.removeItem("mileage_selectedUnitOption");
        }

        // 로딩 상태를 유지한 채로 PaymentComplete 페이지로 바로 이동
        window.location.href = `/payment/complete?orderId=${orderId}&type=mileage`;
        return; // 페이지 이동 직전이므로 함수 종료 (setIsProcessingPurchase 호출 안 함)
      } else {
        alert(res.data.message || "구매 처리 중 오류가 발생했습니다.");
        setIsProcessingPurchase(false);
      }
    } catch (err) {
      console.error('구매 에러 상세:', err);
      console.error('에러 응답 데이터:', err.response?.data);
      const errorMessage = err.response?.data?.message || 
                          (err.response?.data?.error ? err.response.data.error : null) ||
                          err.response?.data || 
                          err.message || 
                          "구매 처리 중 오류가 발생했습니다.";
      alert(`구매 실패: ${errorMessage}`);
      setIsProcessingPurchase(false);
    }
  };

  // 혜정 장바구니 버튼 클릭시 DB저장 기능 추가 11/24
  const onAddCart = async () => {

    const userId = localStorage.getItem("userId");

    if (!userId) {
      
      alert("로그인이 필요합니다.");
      const currentPath = window.location.pathname;
          window.location.replace(
          "/login?redirect=" + encodeURIComponent(currentPath));
          return false;
     }

    // 옵션이 있는 상품인데 선택되지 않은 경우 기본 옵션 자동 선택
    let finalSelectedOption = selectedUnitOption;
    if (product.unitOptions && product.unitOptions.length > 0 && !selectedUnitOption) {
      // 기본 옵션 찾기 (isDefault가 true인 옵션 또는 첫 번째 옵션)
      const defaultOption = product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0];
      if (defaultOption) {
        finalSelectedOption = defaultOption;
        setSelectedUnitOption(defaultOption);
        setDisplayPrice(defaultOption.price);
        setDisplayStock(defaultOption.stock);
        setDisplayUnit(defaultOption.unit);
        console.log("옵션이 선택되지 않아 기본 옵션 자동 선택:", defaultOption);
      } else {
        alert("옵션을 선택해주세요.");
        return;
      }
    }

    try {
      // 현재 선택된 옵션의 가격 사용
      const currentPrice = getCurrentPrice();
      
      //장바구니 담을 데이터
      const cartItem = {
        userId: userId, 
        productId: product.id,
        qty: quantity,
        productName: product.name,
        productImage: product.mainImage || product.images[0],
        price: getDiscountedPrice(currentPrice, product.discountRate, product.discountStart, product.discountEnd),
        selectedUnit: finalSelectedOption ? finalSelectedOption.unit : null,
        selectedUnitProductName: finalSelectedOption ? (finalSelectedOption.productName || '') : null
      };

      console.log("카트아이템:", cartItem);

      //백엔드로 post요청
      const res = await axios.post(
        "http://localhost:8080/api/cart/add",
        cartItem,
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
      alert("장바구니에 담았습니다.");

    } catch (err) {
      console.error("장바구니 추가 실패:", err);
      alert("장바구니 추가 중 오류가 발생했습니다");
    }
  };
// ------------여기까지 혜정

  if (!product) return <div className="pd-loading">Loading...</div>;

  return (
    <div className="pd-page-wrapper">
      <Share/>
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

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      <div className="pd-container">
        {/* TOP */}
        <div className="pd-top">
          {/* LEFT */}
          <div className="pd-left" ref={leftRef}>
            <div className={`pd-main-image ${isFading ? "fading" : "visible"}`}>
              <button className="pd-img-prev" onClick={() => showImageIndex((mainIndex - 1 + product.images.length) % product.images.length)}>‹</button>  
              <img 
                src={getImageUrl(product.images?.[mainIndex])} 
                alt={product.name} 
                onClick={() => setLightboxSrc(getImageUrl(product.images?.[mainIndex]))}
                onError={(e) => {
                  e.target.src = '/img/no-image.png';
                }}
              />
              <button className="pd-img-next" onClick={() => showImageIndex((mainIndex + 1) % product.images.length)}>›</button>
            </div>

            <div className="pd-thumb-row">
              {product.images?.map((img, idx) => (
                <button
                  key={idx}
                  className={`pd-thumb ${idx === mainIndex ? "active" : ""}`}
                  onClick={() => showImageIndex(idx)}
                >
                  <img 
                    src={getImageUrl(img)} 
                    alt={`thumb-${idx}`}
                    onError={(e) => {
                      e.target.src = '/img/no-image.png';
                    }}
                  />
                </button>
              ))}
            </div>

            {/* 요약 */}
            <div className="pd-short-desc">
              <h3>상품 요약</h3>
              <p>{product.description}</p>
              {product.tags && product.tags.length > 0 && (
                <div className="pd-tags">
                  {product.tags.map((tag, idx) => (
                    <span key={idx} className="pd-tag">#{tag}</span>
                  ))}
                </div>
              )}
            </div><br/>
            <div className="pd-mid">
              <section className="pd-price-history">
            <h4>가격 변동 안내</h4>
            {priceInfo.loading ? (
              <p>가격 정보를 불러오는 중...</p>
            ) : priceInfo.error ? (
              <p className="text-muted">{priceInfo.error}</p>
            ) : priceInfo.minPrice !== null && priceInfo.avgPrice !== null ? (
              <>
                <p>
                  최근 1개월 최저가: <strong>{priceInfo.minPrice.toLocaleString()}원/kg</strong>
                </p>
                <p>   
                  최근 1개월 평균가: <strong>{priceInfo.avgPrice.toLocaleString()}원/kg</strong>
                </p>
                  {/* 단위 옵션이 있는 상품은 옵션 선택 후에만 판매가와 비교 정보 표시 */}
                  {(!product.unitOptions || product.unitOptions.length === 0 || selectedUnitOption) && (
                    <p>
                     판매가: <strong>{formatPrice(getDiscountedPrice(getCurrentPrice(), product.discountRate, product.discountStart, product.discountEnd))}/{getCurrentUnit()}</strong>
                     {(() => {
                     // 선택된 옵션 기준으로 kg당 가격 계산 (할인 적용된 가격 사용)
                     let pricePerKg = 0;
                     
                     // 할인이 적용된 현재 가격 계산 (선택된 옵션 기준)
                     const currentPriceBase = getCurrentPrice();
                     const currentPriceDiscounted = getDiscountedPrice(currentPriceBase, product.discountRate, product.discountStart, product.discountEnd);
                     
                     // 단위 옵션이 있는 경우, 선택된 옵션의 productName 또는 unit에서 kg 정보 추출
                     if (product.unitOptions && product.unitOptions.length > 0 && selectedUnitOption) {
                       const currentPrice = currentPriceDiscounted;
                       let kgValue = 1; // 기본값 1kg
                       
                       // productName에서 kg 또는 g 정보 찾기 (우선순위 1)
                       if (selectedUnitOption.productName) {
                         const productNameLower = selectedUnitOption.productName.toLowerCase();
                         const kgMatch = productNameLower.match(/([\d.]+)\s*kg/i);
                         if (kgMatch) {
                           kgValue = parseFloat(kgMatch[1]);
                         } else {
                           // productName에 kg이 없으면 g 단위 확인
                           const gMatch = productNameLower.match(/([\d.]+)\s*g/i);
                           if (gMatch && !productNameLower.includes('kg')) {
                             const grams = parseFloat(gMatch[1]);
                             kgValue = grams / 1000; // g를 kg로 변환
                           } else {
                             // productName에 kg, g 모두 없으면 unit에서 찾기
                             const unit = (selectedUnitOption.unit || '').toLowerCase().trim();
                             if (unit.includes('kg')) {
                               const unitKgMatch = unit.match(/([\d.]+)\s*kg/i);
                               kgValue = unitKgMatch ? parseFloat(unitKgMatch[1]) : 1;
                             } else if (unit.includes('g') && !unit.includes('kg')) {
                               const gramMatch = unit.match(/([\d.]+)\s*g/i);
                               const grams = gramMatch ? parseFloat(gramMatch[1]) : 1000;
                               kgValue = grams / 1000; // g를 kg로 변환
                             }
                           }
                         }
                       } else {
                         // productName이 없으면 unit에서 찾기
                         const unit = (selectedUnitOption.unit || '').toLowerCase().trim();
                         if (unit.includes('kg')) {
                           const unitKgMatch = unit.match(/([\d.]+)\s*kg/i);
                           kgValue = unitKgMatch ? parseFloat(unitKgMatch[1]) : 1;
                         } else if (unit.includes('g') && !unit.includes('kg')) {
                           const gramMatch = unit.match(/([\d.]+)\s*g/i);
                           const grams = gramMatch ? parseFloat(gramMatch[1]) : 1000;
                           kgValue = grams / 1000; // g를 kg로 변환
                         }
                       }
                       
                       // 1kg당 가격 계산
                       pricePerKg = kgValue > 0 ? currentPrice / kgValue : currentPrice;
                     } else {
                       // 단위 옵션이 없는 경우 product.name과 product.unit에서 kg/g 정보 찾기
                       const currentPrice = currentPriceDiscounted;
                       let kgValue = 1; // 기본값 1kg
                       
                       // 1. product.name에서 kg 또는 g 정보 찾기 (우선순위 1)
                       if (product.name) {
                         const productNameLower = product.name.toLowerCase();
                         const kgMatch = productNameLower.match(/([\d.]+)\s*kg/i);
                         if (kgMatch) {
                           kgValue = parseFloat(kgMatch[1]);
                         } else {
                           // productName에 kg이 없으면 g 단위 확인
                           const gMatch = productNameLower.match(/([\d.]+)\s*g/i);
                           if (gMatch && !productNameLower.includes('kg')) {
                             const grams = parseFloat(gMatch[1]);
                             kgValue = grams / 1000; // g를 kg으로 변환
                           } else {
                             // productName에 kg/g 정보가 없으면 product.unit 확인
                             const unit = (getCurrentUnit() || product.unit || '').toLowerCase().trim();
                             if (unit.includes('kg')) {
                               const unitKgMatch = unit.match(/([\d.]+)\s*kg/i);
                               kgValue = unitKgMatch ? parseFloat(unitKgMatch[1]) : 1;
                             } else if (unit.includes('g') && !unit.includes('kg')) {
                               const gramMatch = unit.match(/([\d.]+)\s*g/i);
                               const grams = gramMatch ? parseFloat(gramMatch[1]) : 1000;
                               kgValue = grams / 1000; // g를 kg으로 변환
                             }
                           }
                         }
                       } else {
                         // product.name이 없으면 product.unit만 확인
                         const unit = (getCurrentUnit() || product.unit || '').toLowerCase().trim();
                         if (unit.includes('kg')) {
                           const unitKgMatch = unit.match(/([\d.]+)\s*kg/i);
                           kgValue = unitKgMatch ? parseFloat(unitKgMatch[1]) : 1;
                         } else if (unit.includes('g') && !unit.includes('kg')) {
                           const gramMatch = unit.match(/([\d.]+)\s*g/i);
                           const grams = gramMatch ? parseFloat(gramMatch[1]) : 1000;
                           kgValue = grams / 1000; // g를 kg으로 변환
                         }
                       }
                       
                       // 1kg당 가격 계산
                       pricePerKg = kgValue > 0 ? currentPrice / kgValue : currentPrice;
                     }
                    
                    // 도매 최저가 대비 비율 계산 (양수=저렴, 음수=비쌈)
                    if (priceInfo.minPrice > 0) {
                      const priceDiff = ((priceInfo.minPrice - pricePerKg) / priceInfo.minPrice * 100);
                      const priceDiffText = priceDiff >= 0 ? `${priceDiff.toFixed(1)}% 낮음` : `${Math.abs(priceDiff).toFixed(1)}% 높음`;
                      
                      return (
                        <> <br/>(도매 최저가 대비: <strong>{priceDiffText}</strong>, {pricePerKg.toLocaleString()}원/kg)</>
                      );
                    }
                    return null;
                  })()}
                    </p>
                  )}
              </>
            ) : (
              <p className="text-muted">가격 정보를 불러올 수 없습니다.</p>
            )}
            {product.discountRate && (
              <p>할인율: <strong>{product.discountRate}%</strong>
                {product.discountStart && product.discountEnd && (
                  <> · 할인기간: <strong>{product.discountStart} ~ {product.discountEnd}</strong></>
                )}
              </p>
            )}
            {product.bulkMinQuantity && product.bulkDiscountRate && (
              <p>대량구매 할인: <strong>{product.bulkMinQuantity}개 이상 구매 시 {product.bulkDiscountRate}% 할인</strong></p>
            )}
          </section>
            <section className="pd-delivery">
            <h4>배송 안내</h4>
            <div className="pd-delivery-item"><strong>샛별배송</strong> : 오전 7시 이전 주문 시 오늘 도착 (일부 지역 제외)</div>
            <div className="pd-delivery-item">
              <strong>택배배송</strong> : 기본 3,000원
              {product.shippingFreeThreshold && ` (${product.shippingFreeThreshold.toLocaleString()}원 이상 무료)`}
              {product.additionalShippingFee && ` · 지역 추가 배송비: ${product.additionalShippingFee.toLocaleString()}원`}
            </div>
            {product.shippingConditions && (
              <div className="pd-delivery-item">{product.shippingConditions}</div>
            )}
          </section>

          <section className="pd-checkpoints">
            <h4>구매 전 확인사항</h4>
            <div className="pd-checkpoint">냉장상품은 새벽배송/샛별배송이 우선입니다.</div>
            <div className="pd-checkpoint">자연산 특성상 약간의 크기/색차가 있을 수 있습니다.</div>
            <div className="pd-checkpoint">신선상품은 반품 규정이 다를 수 있으니 유의하세요.</div>
          </section>
          </div>
          </div>

          {/* RIGHT sticky */}
          <aside className="pd-right">
            <div className="pd-sticky" ref={stickyRef}>
              <div className="pd-title">{product.name}</div>

              <div className="pd-price-row">
                {(() => {
                  const currentPrice = getCurrentPrice();
                  const hasDiscount = product.discountRate && isOnDiscount(product.discountRate, product.discountStart, product.discountEnd);
                  
                  if (hasDiscount) {
                    return (
                      <>
                        <div className="pd-discount">{product.discountRate}%</div>
                        <div className="pd-price">{formatPrice(getDiscountedPrice(currentPrice, product.discountRate, product.discountStart, product.discountEnd))}
                            <div className="pd-price-old">{formatPrice(currentPrice)}</div>
                        </div>
                      </>
                    );
                  } else {
                    return <div className="pd-price">{formatPrice(currentPrice)}</div>;
                  }
                })()}
                {product.discountStart && product.discountEnd && (
                  <div className="pd-discount-period">
                    할인기간: {product.discountStart} ~ {product.discountEnd}
                  </div>
                )}
              </div>

              <div className="pd-seller">
                <span className="label">판매자</span> 
                <span className="seller-name">{product.sellerNickname || product.sellerName || "판매자 정보 없음"}</span>
              </div>

              <div className="pd-info">
                <div><span>원산지</span> {product.origin} {product.originDetail && `(${product.originDetail})`}</div>
                <div><span>재배방식</span> {product.farmingType || "정보 없음"}</div>
                <div><span>수확일</span> {product.harvestDate || "정보 없음"}</div>
                <div><span>유통기한</span> {product.expirationDate || "정보 없음"}</div>
                <div><span>보관방법</span> {product.storageMethod || "정보 없음"}</div>
                {/* 재고 상태는 옵션 선택 후에만 표시 */}
                {/* {((product.unitOptions && product.unitOptions.length > 0 && selectedUnitOption) || 
                  (!product.unitOptions || product.unitOptions.length === 0)) && (
                  <div className="pd-stock-info">
                    <span>재고 상태</span> 
                    {(() => {
                      const currentStock = getCurrentStock();
                      const stockWarningThreshold = product.stockWarningThreshold || 10;
                      
                      if (currentStock === 0) {
                        return <span className="stock-out">품절</span>;
                      } else if (currentStock <= stockWarningThreshold) {
                        return <span className="stock-warning">재고마감 임박</span>;
                      } else {
                        return <span className="stock-normal">재고 충분</span>;
                      }
                    })()}
                  </div>
                )} */}
              </div>

              {/* 단위 옵션이 있는 경우에만 옵션 선택 UI 표시 */}
              {product.unitOptions && Array.isArray(product.unitOptions) && product.unitOptions.length > 0 && (
                <div className="pd-option">
                  <label>옵션 <span style={{color: 'red'}}>*</span></label>
                  <select 
                    value={selectedUnitOption ? (selectedUnitOption.productName ? `${selectedUnitOption.productName}|${selectedUnitOption.unit}` : selectedUnitOption.unit) : ''}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      console.log('선택된 value:', selectedValue);
                      // value 형식: "productName|unit" 또는 "unit"
                      let selected = null;
                      if (selectedValue.includes('|')) {
                        // productName|unit 형식
                        const [productName, unit] = selectedValue.split('|');
                        selected = product.unitOptions.find(opt => {
                          const optProductName = (opt.productName || '').trim();
                          const optUnit = (opt.unit || '').trim();
                          return optProductName === productName.trim() && optUnit === unit.trim();
                        });
                      } else {
                        // unit만 있는 경우
                        selected = product.unitOptions.find(opt => {
                          const optUnit = (opt.unit || '').trim();
                          return optUnit === selectedValue.trim();
                        });
                      }
                      
                      console.log('찾은 옵션:', selected);
                      if (selected) {
                        setSelectedUnitOption(selected);
                        setDisplayPrice(selected.price);
                        setDisplayStock(selected.stock);
                        setDisplayUnit(selected.unit);
                        setQuantity(1); // 단위 변경 시 수량 초기화
                      }
                    }}
                    className="pd-option-select"
                    required
                  >
                    <option value="">옵션을 선택해주세요</option>
                    {product.unitOptions.map((opt, idx) => {
                      // productName이 있으면 "productName|unit", 없으면 "unit" 형식으로 value 설정
                      const optionValue = opt.productName ? `${opt.productName}|${opt.unit}` : (opt.unit || '');
                      return (
                        <option key={idx} value={optionValue} disabled={opt.stock === 0}>
                          {opt.productName ? `${opt.productName} - ${opt.unit}` : opt.unit} ({opt.price.toLocaleString()}원, 재고: {opt.stock})
                          {opt.stock === 0 ? ' (품절)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="pd-quantity">
                <span>
                  수량
                  {/* 단위 옵션이 없는 상품의 경우 재고 정보 표시 */}
                  {(!product.unitOptions || product.unitOptions.length === 0) && (
                    <span style={{ fontSize: '13px', color: '#666', marginLeft: '12px', fontWeight: 'normal' }}>
                      재고: <strong style={{ color: (product.stock === 0 || !product.stock) ? '#dc3545' : product.stock <= 10 ? '#ff9800' : '#28a745' }}>
                        {(product.stock === 0 || !product.stock) ? '품절' : `${product.stock}개`}
                      </strong>
                    </span>
                  )}
                </span>
                <div>
                  {canAdjustQuantity() ? (
                    <>
                      <div className="pd-counter">
                        <button onClick={decrease} disabled={getCurrentStock() === 0 || quantity <= 1}>-</button>
                        <input
                          type="number"
                          value={quantity === 0 ? "" : quantity}
                          min={1}
                          max={getCurrentStock() || 999}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              setQuantity(0);
                              return;
                            }
                            const num = parseInt(val, 10);
                            if (!isNaN(num)) {
                              const maxStock = getCurrentStock() || 999;
                              setQuantity(Math.min(num, maxStock));
                            }
                          }}
                          onBlur={() => {
                            if (quantity < 1) setQuantity(1);
                            const maxStock = getCurrentStock();
                            if (maxStock && quantity > maxStock) {
                              setQuantity(maxStock);
                            }
                          }}
                        />
                        <button onClick={increase} disabled={getCurrentStock() === 0 || quantity >= getCurrentStock()}>+</button>
                      </div>
                      {(() => {
                        const maxStock = getCurrentStock();
                        // 재고가 0이 아니고, 수량이 재고보다 많을 때만 경고 표시
                        return maxStock > 0 && quantity > maxStock && (
                          <div className="quantity-warning">재고가 부족합니다. (최대 {maxStock}개)</div>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="pd-counter" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                      <button disabled>-</button>
                      <input type="number" value="1" disabled />
                      <button disabled>+</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pd-total">
                {(() => {
                  // 옵션을 선택하지 않았을 때 (unitOptions가 있고 selectedUnitOption이 null인 경우)
                  if (product.unitOptions && product.unitOptions.length > 0 && !selectedUnitOption) {
                    return (
                      <div className="pd-total-message" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        옵션을 선택해주세요
                      </div>
                    );
                  }
                  
                  // 상품 단가 계산 (현재 선택된 단위의 가격 사용)
                  let unitPrice = getDiscountedPrice(getCurrentPrice(), product.discountRate, product.discountStart, product.discountEnd);
                  const isBulkDiscount = product.bulkMinQuantity && product.bulkDiscountRate && quantity >= product.bulkMinQuantity;
                  if (isBulkDiscount) {
                    unitPrice = Math.round(unitPrice * (100 - product.bulkDiscountRate) / 100);
                  }
                  const productTotal = unitPrice * quantity;
                  
                  // 배송비 계산
                  const baseShippingFee = 3000;
                  let shippingFee = baseShippingFee;
                  if (product.shippingFreeThreshold && productTotal >= product.shippingFreeThreshold) {
                    shippingFee = 0;
                  }
                  
                  const finalTotal = productTotal + shippingFee;
                  
                  return (
                    <>
                      <div className="pd-total-detail">
                        <span>상품금액</span>
                        <span>{formatPrice(productTotal)}</span>
                      </div>
                      {isBulkDiscount && (
                        <div className="pd-total-detail bulk-discount">
                          <span>대량구매 할인 ({product.bulkDiscountRate}%)</span>
                          <span>적용됨</span>
                        </div>
                      )}
                      <div className={`pd-total-detail ${shippingFee === 0 ? 'shipping-free' : ''}`}>
                        <span>배송비</span>
                        <span>{shippingFee === 0 ? '무료' : formatPrice(shippingFee)}</span>
                      </div>
                      <div className="pd-total-final">
                        <span>총 결제금액</span>
                        <strong>{formatPrice(finalTotal)}</strong>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="pd-buttons">
                <button 
                  className="btn-buy" 
                  onClick={onBuy}
                  disabled={!canAdjustQuantity() || getCurrentStock() === 0}
                >
                  {(() => {
                    if (!canAdjustQuantity()) {
                      return "옵션을 선택해주세요";
                    }
                    if (getCurrentStock() === 0) {
                      return "품절";
                    }
                    return "구매하기";
                  })()}
                </button>
                <button 
                  className="btn-cart"
                  onClick={onAddCart}
                  disabled={!canAdjustQuantity() || getCurrentStock() === 0}
                >
                  장바구니
                </button>
                <button 
                  className="btn-cart"
                  onClick={async () => {
                  const userId = localStorage.getItem("userId");
                  if (!userId) {
                    alert("로그인이 필요합니다.");
                    navigate("/login");
                    return;
                  }

                  // 단위 옵션이 있는 상품인데 선택되지 않은 경우 기본 옵션 자동 선택
                  let finalSelectedOption = selectedUnitOption;
                  if (product.unitOptions && product.unitOptions.length > 0 && !selectedUnitOption) {
                    // 기본 옵션 찾기 (isDefault가 true인 옵션 또는 첫 번째 옵션)
                    const defaultOption = product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0];
                    if (defaultOption) {
                      finalSelectedOption = defaultOption;
                      setSelectedUnitOption(defaultOption);
                      setDisplayPrice(defaultOption.price);
                      setDisplayStock(defaultOption.stock);
                      setDisplayUnit(defaultOption.unit);
                      console.log("찜하기: 옵션이 선택되지 않아 기본 옵션 자동 선택:", defaultOption);
                    }
                  }

                  const productId = product.id || product._id;

                  if (!productId) {
                    alert("상품 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
                    return;
                  }

                  try {
                    const res = await axios.post("http://localhost:8080/api/wishlist/add", {
                      userId,
                      productId
                    });

                    if (res.data.message === "already") {
                      alert("이미 찜한 상품입니다 ");
                    } else {
                      alert("찜 목록에 추가되었습니다!");
                    }
                  } catch (error) {
                    console.error("찜하기 오류:", error);
                    alert("찜하기 중 오류가 발생했습니다.");
                  }
                }}  
                  disabled={getCurrentStock() === 0}
                >
                  찜 하기
                </button>
              </div>

              <div className="pd-delivery-summary">
                <div className="badge">샛별배송</div>
                <div>오늘 주문 시 도착 가능 / 일부 지역 제외</div>
              </div>
            </div>
          </aside>
        </div>

        {/* MID */}
        <div className="pd-mid">
          {/* 탭 메뉴 (일반 탭 - sticky 제거) */}
          <div className="pd-tabs pd-tabs-static">
            <div className="pd-tabs-inner">
              <button 
                className={`pd-tab ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => handleTabClick('info')}
              >
                상품필수정보
              </button>
              {product.certificates && product.certificates.length > 0 && (
                <button 
                  className={`pd-tab ${activeTab === 'cert' ? 'active' : ''}`}
                  onClick={() => handleTabClick('cert')}
                >
                  품질인증
                </button>
              )}
              <button 
                className={`pd-tab ${activeTab === 'detail' ? 'active' : ''}`}
                onClick={() => handleTabClick('detail')}
              >
                상세이미지
              </button>
              <button 
                className={`pd-tab ${activeTab === 'review' ? 'active' : ''}`}
                onClick={() => handleTabClick('review')}
              >
                리뷰
              </button>
              <button 
                className={`pd-tab ${activeTab === 'qna' ? 'active' : ''}`}
                onClick={() => handleTabClick('qna')}
              >
                상품문의
              </button>
            </div>
          </div>

          {/* 하단 고정 탭 (스크롤 시 표시) */}
          {showStickyTabs && (
            <div className="pd-tabs-bottom">
              <div className="pd-tabs-bottom-inner">
                <button 
                  className={`pd-tab-bottom ${activeTab === 'info' ? 'active' : ''}`}
                  onClick={() => handleTabClick('info')}
                >
                  상품필수정보
                </button>
                {product.certificates && product.certificates.length > 0 && (
                  <button 
                    className={`pd-tab-bottom ${activeTab === 'cert' ? 'active' : ''}`}
                    onClick={() => handleTabClick('cert')}
                  >
                    품질인증
                  </button>
                )}
                <button 
                  className={`pd-tab-bottom ${activeTab === 'detail' ? 'active' : ''}`}
                  onClick={() => handleTabClick('detail')}
                >
                  상세이미지
                </button>
                <button 
                  className={`pd-tab-bottom ${activeTab === 'review' ? 'active' : ''}`}
                  onClick={() => handleTabClick('review')}
                >
                  리뷰
                </button>
                <button 
                  className={`pd-tab-bottom ${activeTab === 'qna' ? 'active' : ''}`}
                  onClick={() => handleTabClick('qna')}
                >
                  상품문의
                </button>
              </div>
            </div>
          )}

          {/* 탭 콘텐츠 */}
          <div className="pd-tab-content">
            {activeTab === 'info' && (
              <div ref={infoTabRef}>
                <section className="pd-essential">
                  <h4>상품 필수 정보</h4>
                  <table>
                    <tbody>
                      <tr><th>제품명</th><td>{product.name}</td></tr>
                      <tr><th>카테고리</th>
                        <td>
                          {{
                            fruit: "과일",
                            vegetable: "채소",
                            grain: "곡물&기타"
                          }
                            [product.categoryType] || "정보 없음"}
                        </td>
                      </tr>
                      <tr><th>원산지</th><td>{product.origin} {product.originDetail && `(${product.originDetail})`}</td></tr>
                      <tr><th>재배방식</th><td>{product.farmingType || "정보 없음"}</td></tr>
                      <tr><th>수확일</th><td>{product.harvestDate || "정보 없음"}</td></tr>
                      <tr><th>유통기한</th><td>{product.expirationDate || "정보 없음"}</td></tr>
                      <tr><th>보관방법</th><td>{product.storageMethod || "정보 없음"}</td></tr>
                      <tr><th>판매자</th><td>{product.sellerNickname || product.sellerName || "정보 없음"}</td></tr>
                    </tbody>
                  </table>
                </section>
              </div>
            )}

            {activeTab === 'cert' && (
              <div ref={certTabRef}>
                {product.certificates && product.certificates.length > 0 && (
                  <div className="pd-certificates">
                    <h4>품질 인증 · 검사서</h4>
                    <div className="pd-cert-grid">
                      {product.certificates.map((cert, idx) => {
                        const certUrl = getImageUrl(cert);
                        const isPdf = cert.toLowerCase().endsWith('.pdf');
                        return (
                          <div key={idx} className="pd-cert-item" onClick={() => !isPdf && setLightboxSrc(certUrl)}>
                            {isPdf ? (
                              <div className="pd-cert-pdf">
                                <a href={certUrl} target="_blank" rel="noopener noreferrer">
                                  📄 인증서 {idx + 1}
                                </a>
                              </div>
                            ) : (
                              <img 
                                src={certUrl} 
                                alt={`인증서-${idx}`}
                                onError={(e) => {
                                  e.target.src = '/img/no-image.png';
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'detail' && (
              <div ref={detailTabRef}>
                {/* 상세 이미지 */}
                {product.images && product.images.length > 0 && (
                  <div className="pd-detail-images">
                    <div className="pd-detail-img-container">
                      {product.images.map((src, idx) => (
                        <div key={idx} className="pd-detail-img-item" onClick={() => setLightboxSrc(getImageUrl(src))}>
                          <img 
                            src={getImageUrl(src)} 
                            alt={`상세이미지 ${idx + 1}`}
                            onError={(e) => {
                              e.target.src = '/img/no-image.png';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'review' && (
              <div ref={reviewTabRef}>
                <ProductReview 
                  productId={productId} 
                  productName={product?.name}
                  onLightboxOpen={setLightboxSrc} 
                />
              </div>
            )}

            {activeTab === 'qna' && (
              <div ref={qnaTabRef}>
                <ProductQnA 
                  productId={productId}
                  productSellerId={product?.sellerId || ""}
                  isLoggedIn={localStorage.getItem("isLoggedIn") === "true"}
                />
              </div>
            )}
          </div>
        </div>

        {/* 연관상품 */}
        <RelatedProducts products={related} />

        {/* 구매 확인 모달 */}
        {showPurchaseModal && product && (
          <>
            <div 
              className="modal-backdrop fade show"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1040
              }}
              onClick={() => {
                if (!isProcessingPurchase) {
                  setShowPurchaseModal(false);
                }
              }}
            ></div>
            <div 
              className="modal fade show"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1050
              }}
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
                className="modal-dialog modal-dialog-centered modal-lg" 
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  margin: 'auto', 
                  maxWidth: '600px',
                  maxHeight: '90vh',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div className="modal-content" style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '90vh',
                  overflow: 'hidden'
                }}>
                  <div className="modal-header" style={{ flexShrink: 0 }}>
                    <h5 className="modal-title">구매 확인</h5>
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => setShowPurchaseModal(false)}
                      aria-label="Close"
                      disabled={isProcessingPurchase}
                    ></button>
                  </div>
                  <div className="modal-body" style={{
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    flex: 1,
                    minHeight: 0,
                    maxHeight: 'calc(90vh - 140px)'
                  }}>
                    {/* 상품 정보 */}
                    <div className="mb-4">
                      <h6 className="mb-3">주문 상품 정보</h6>
                      <div className="d-flex align-items-center mb-3">
                        {product.mainImage && (
                          <img 
                            src={getImageUrl(product.mainImage)} 
                            alt={product.name}
                            style={{ width: '80px', height: '80px', objectFit: 'cover', marginRight: '15px', borderRadius: '8px' }}
                            onError={(e) => {
                              e.target.src = '/img/no-image.png';
                            }}
                          />
                        )}
                        {!product.mainImage && product.images && product.images.length > 0 && (
                          <img 
                            src={getImageUrl(product.images[0])} 
                            alt={product.name}
                            style={{ width: '80px', height: '80px', objectFit: 'cover', marginRight: '15px', borderRadius: '8px' }}
                            onError={(e) => {
                              e.target.src = '/img/no-image.png';
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <h6 className="mb-1">{product.name}</h6>
                          <div className="text-muted small">
                            수량: {quantity}개
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 결제 정보 */}
                    <div className="mb-4 p-3 bg-light rounded">
                      <h6 className="mb-3">결제 정보</h6>
                      {(() => {
                        // 선택된 단위 옵션의 가격을 반영한 product 객체 생성
                        const productForCalculation = { ...product };
                        const currentPrice = getCurrentPrice();
                        if (currentPrice > 0) {
                          productForCalculation.price = currentPrice;
                        }
                        
                        const { productTotal, shippingFee, totalAmount } = calculateTotalAmountUtil(productForCalculation, quantity);
                        
                        // 원가 계산 (선택된 단위 옵션의 가격 기준)
                        const originalPrice = currentPrice * quantity;
                        
                        // 기본 할인 계산 (선택된 단위 옵션의 가격 기준)
                        const basicDiscountAmount = product.discountRate && isOnDiscount(product.discountRate, product.discountStart, product.discountEnd) 
                          ? Math.round(originalPrice * product.discountRate / 100) 
                          : 0;
                        
                        // 대량구매 할인 계산 (기본 할인이 적용된 후 가격에 적용)
                        const priceAfterBasicDiscount = originalPrice - basicDiscountAmount;
                        const bulkDiscountAmount = product.bulkMinQuantity && product.bulkDiscountRate && quantity >= product.bulkMinQuantity
                          ? Math.round(priceAfterBasicDiscount * product.bulkDiscountRate / 100)
                          : 0;
                        
                        const totalDiscountAmount = basicDiscountAmount + bulkDiscountAmount;
                        
                        return (
                          <>
                            <div className="d-flex justify-content-between mb-2">
                              <span>상품 금액:</span>
                              <span>{formatPriceUtil(originalPrice)}원</span>
                            </div>
                            {basicDiscountAmount > 0 && (
                              <div className="d-flex justify-content-between mb-2 text-danger">
                                <span>기본 할인 ({product.discountRate}%):</span>
                                <span>-{formatPriceUtil(basicDiscountAmount)}원</span>
                              </div>
                            )}
                            {bulkDiscountAmount > 0 && (
                              <div className="d-flex justify-content-between mb-2 text-danger">
                                <span>대량구매 할인 ({product.bulkDiscountRate}%):</span>
                                <span>-{formatPriceUtil(bulkDiscountAmount)}원</span>
                              </div>
                            )}
                            {totalDiscountAmount > 0 && (
                              <>
                                <div className="d-flex justify-content-between mb-2">
                                  <span>할인 후 상품 금액:</span>
                                  <span className="fw-bold">{formatPriceUtil(productTotal)}원</span>
                                </div>
                                <hr className="my-2" />
                              </>
                            )}
                            <div className="d-flex justify-content-between mb-2">
                              <span>배송비:</span>
                              <span>{formatPriceUtil(shippingFee)}원</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between">
                              <strong>총 결제 금액:</strong>
                              <strong className="text-primary fs-5">{formatPriceUtil(totalAmount)}원</strong>
                            </div>
                            <div className="mt-2 text-muted small">
                              보유 마일리지: {availableMileage.toLocaleString()}원
                            </div>
                          </>
                        );
                      })()}
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
                        ({selectedAddress.post}) {selectedAddress.addr1} <br/>
                        {selectedAddress.addr2}<br />
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
                      <div className="mt-2 p-2 bg-light rounded small" style={{ fontSize: '0.875rem' }}>
                        <div className="mb-1">• 마일리지로 결제됩니다.</div>
                        <div className="mb-1">• 구매 후 취소/환불은 마이페이지에서 신청 가능합니다.</div>
                        <div>• 배송은 영업일 기준 2-3일 소요됩니다.</div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-top pt-3" style={{ flexShrink: 0 }}>
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
                        <>
                          <i className="fa fa-check me-2"></i>
                          구매하기
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


/* 연관상품 모킹 */
function makeRelatedMock(product) {
  if (!product) return [];
  return new Array(8).fill(0).map((_, i) => ({
    id: `${product.id}-rel-${i}`,
    name: `${product.name} - 추천 ${i + 1}`,
    price: Math.round(product.price * (0.6 + Math.random() * 0.8)),
    images: [`https://picsum.photos/300/300?random=${i + 10}`],
  }));
}
