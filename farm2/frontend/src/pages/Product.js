import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getDiscountedPrice, isOnDiscount } from '../utils/priceCalculator';
import "./Product.css";

const Product = () => {
    const navigate = useNavigate();

    // 페이징 상태
    const [page, setPage] = useState(0);
    const [size] = useState(8);  // 한 페이지 상품 개수
    const [totalPages, setTotalPages] = useState(0);

    const [products, setProducts] = useState([]);
    const [activeTab, setActiveTab] = useState("all");
    const [priceInfoMap, setPriceInfoMap] = useState({}); // productId -> { minPrice, avgPrice, pricePerKg }
    const [priceInfoLoading, setPriceInfoLoading] = useState(false); // 가격 정보 로딩 상태
    const [memberIsActiveMap, setMemberIsActiveMap] = useState({}); // nickname -> isActive 캐시

    // 캐시 관련 유틸리티 함수들
    const CACHE_PREFIX = 'productPrice_';
    const UPDATE_HOUR = 15; // 오후 3시
    const DEFAULT_REGION_CODE = '1101'; // 서울 기본값

    // 오후 3시 이후인지 확인하는 함수
    const shouldUseCache = () => {
        const now = new Date();
        const currentHour = now.getHours();
        return currentHour >= UPDATE_HOUR;
    };

    // 오늘 날짜 문자열 생성 (YYYY-MM-DD)
    const getTodayDateString = () => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    };

    // 캐시 키 생성
    const getCacheKey = (date, regionCode) => {
        return `${CACHE_PREFIX}${date}_${regionCode}`;
    };

    // 캐시에서 데이터 가져오기 (항상 캐시가 있으면 사용)
    const getCachedData = (date, regionCode) => {
        const today = getTodayDateString();
        const cacheKey = getCacheKey(date, regionCode);
        
        try {
            const cached = localStorage.getItem(cacheKey);
            if (!cached) return null;

            const parsedCache = JSON.parse(cached);
            const cacheDate = new Date(parsedCache.lastUpdate);
            const todayDate = new Date(today);
            
            // 오늘 날짜의 캐시가 있으면 항상 사용
            if (cacheDate.toDateString() === todayDate.toDateString()) {
                return parsedCache.data;
            }
            
            return null;
        } catch (err) {
            console.error('Error reading cache:', err);
            return null;
        }
    };

    // 오래된 캐시 정리 (3일 이상 된 캐시 삭제)
    const cleanOldCache = () => {
        try {
            const today = new Date();
            const keysToDelete = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(CACHE_PREFIX)) {
                    try {
                        const cached = localStorage.getItem(key);
                        if (cached) {
                            const parsedCache = JSON.parse(cached);
                            const cacheDate = new Date(parsedCache.lastUpdate);
                            const daysDiff = (today - cacheDate) / (1000 * 60 * 60 * 24);
                            
                            if (daysDiff > 3) {
                                keysToDelete.push(key);
                            }
                        }
                    } catch (e) {
                        keysToDelete.push(key);
                    }
                }
            }
            
            keysToDelete.forEach(key => {
                localStorage.removeItem(key);
            });
            
            if (keysToDelete.length > 0) {
                console.log(`Cleaned ${keysToDelete.length} old cache entries`);
            }
        } catch (err) {
            console.error('Error cleaning old cache:', err);
        }
    };

    // 캐시에 데이터 저장
    const setCachedData = (date, regionCode, data) => {
        const today = getTodayDateString();
        const cacheKey = getCacheKey(date, regionCode);
        
        try {
            cleanOldCache();
            
            const cacheData = {
                data: data,
                lastUpdate: new Date().toISOString(),
                date: today
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (err) {
            if (err.name === 'QuotaExceededError') {
                console.warn('Storage quota exceeded, cleaning old cache...');
                cleanOldCache();
                
                try {
                    const todayDate = new Date(today);
                    const keysToDelete = [];
                    
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith(CACHE_PREFIX) && !key.includes(today)) {
                            keysToDelete.push(key);
                        }
                    }
                    
                    keysToDelete.forEach(key => {
                        localStorage.removeItem(key);
                    });
                    
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify({
                            data: data,
                            lastUpdate: new Date().toISOString(),
                            date: today
                        }));
                        console.log('Cache saved after cleanup');
                    } catch (retryErr) {
                        console.error('Failed to save cache after cleanup:', retryErr);
                    }
                } catch (cleanupErr) {
                    console.error('Error during cleanup:', cleanupErr);
                }
            } else {
                console.error('Error saving cache:', err);
            }
        }
    };

    // API 호출하여 데이터 가져오기 (내부 함수)
    const fetchDataFromAPI = async (date, regionCode) => {
        try {
            const response = await axios.get('http://localhost:8080/api/price/newtrend', {
                params: {
                    p_regday: date,
                    p_country_code: regionCode
                }
            });
            return response.data;
        } catch (err) {
            console.error('Error fetching day data:', date, err);
            return null;
        }
    };

    // nickname으로 member의 isActive 조회 (캐싱 포함)
    const fetchUserIsActive = useCallback(async (nickname) => {
        if (!nickname) return false;
        
        // 캐시에 있으면 캐시 사용
        if (memberIsActiveMap.hasOwnProperty(nickname)) {
            return memberIsActiveMap[nickname];
        }
        
        try {
            const response = await axios.get(`http://localhost:8080/api/member/nickname/${nickname}`);
            const isActive = response.data?.isActive ?? false;
            
            // 캐시에 저장
            setMemberIsActiveMap(prev => ({
                ...prev,
                [nickname]: isActive
            }));
            
            return isActive;
        } catch (err) {
            console.error('Error fetching user data:', err);
            // 에러 발생 시 false로 캐싱하여 반복 호출 방지
            setMemberIsActiveMap(prev => ({
                ...prev,
                [nickname]: false
            }));
            return false;
        }
    }, [memberIsActiveMap]);

    // 백그라운드에서 API 호출하여 캐시 업데이트
    const fetchAndUpdateCache = async (date, regionCode) => {
        try {
            const data = await fetchDataFromAPI(date, regionCode);
            if (data) {
                setCachedData(date, regionCode, data);
                console.log('Cache updated in background for', date, regionCode);
            }
        } catch (err) {
            console.error('Error updating cache:', err);
        }
    };
    


    // 상품 + 페이징 불러오기
    useEffect(() => {
        axios.get("http://localhost:8080/products/search", {
            params: { page, size }
        })
            .then(res => {
                console.log("Axios res.data:", res.data);
                const content = res.data?.content || [];
                console.log("받은 상품 목록:", content.map(p => ({ id: p.id, name: p.name, status: p.status })));
                setProducts(prev => {
  const merged = [...prev, ...content];

  const unique = merged.filter(
    (item, index, self) =>
      index === self.findIndex(p => p.id === item.id)
  );
  
  console.log("병합 후 상품 목록:", unique.map(p => ({ id: p.id, name: p.name, status: p.status })));

  return unique;
});

                 setTotalPages(res.data?.totalPages || 0);
        })
        .catch(err => console.error(err))
        .finally(() => {
            setLoading(false);
        });
}, [page]);

    // 카테고리 분류 (현재 페이지 기준)
    const activeProducts = products.filter(p => p.status === "approved");

    const vegetables = activeProducts.filter(p => p.categoryType === "vegetable");
    const fruits = activeProducts.filter(p => p.categoryType === "fruit");
    const etc = activeProducts.filter(p => p.categoryType === "grain");

    //조회수 증가
    const increaseView = async (id) => {
  try {
    await axios.put(`http://localhost:8080/products/${id}/view`);
  } catch (err) {
    console.error("조회수 증가 실패:", err);
  }
};


    const getDiscountedPrice = (price, discountRate) => {
        if (!discountRate) return price;
        return Math.round(price * (100 - discountRate) / 100);
    };

    // 등록일이 2~3일 이내인지 확인
    const isNewProduct = (createdAt) => {
        if (!createdAt) return false;
        const createdDate = new Date(createdAt);
        const now = new Date();
        const diffTime = now - createdDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 3;
    };

    // 할인 중인지 확인
    const isOnDiscount = (discountRate, discountStart, discountEnd) => {
        if (!discountRate) return false;
        if (!discountStart || !discountEnd) return true; // 할인율만 있으면 할인 중으로 간주
        const now = new Date();
        const start = new Date(discountStart);
        const end = new Date(discountEnd);
        return now >= start && now <= end;
    };

    const formatPrice = (price) => {
        return price.toLocaleString();
    };

    // 가격 추세 정보 가져오기 (상품별)
    const fetchPriceInfoForProduct = async (product) => {
        // itemType(상품종의 품목) 또는 name이 없으면 가격 정보를 가져올 수 없음
        if (!product?.itemType && !product?.name) return null;

        try {
            // 최근 1개월 데이터 가져오기 (매일 데이터를 가져와서 최저가 정확도 향상)
            const today = new Date();
            const year = today.getFullYear();
            const monthIndex = today.getMonth();
            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

            // 가격 추세 API 호출 함수 (캐싱 적용)
            const fetchDayData = async (day) => {
                const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const regionCode = DEFAULT_REGION_CODE;
                
                // 항상 캐시가 있으면 사용
                const cachedData = getCachedData(dateStr, regionCode);
                if (cachedData) {
                    // 오후 3시 이후인 경우에만 백그라운드에서 API 호출하여 캐시 업데이트
                    if (shouldUseCache()) {
                        fetchAndUpdateCache(dateStr, regionCode).catch(err => {
                            console.error('Error updating cache in background:', err);
                        });
                    }
                    return cachedData;
                }

                // 캐시가 없는 경우: 언제든지 API 호출하여 캐시에 저장
                const data = await fetchDataFromAPI(dateStr, regionCode);
                if (data) {
                    setCachedData(dateStr, regionCode, data);
                }
                return data;
            };

            // 유틸리티 함수
            const extractKgFromUnit = (unit) => {
                if (!unit) return 1;
                const unitLower = unit.toLowerCase();
                
                if (unitLower.indexOf('g') !== -1 && unitLower.indexOf('kg') === -1) {
                    const match = unit.match(/([\d.]+)\s*g/i);
                    if (match) {
                        return parseFloat(match[1]) / 1000;
                    }
                }
                
                if (unitLower.indexOf('kg') !== -1) {
                    const match = unit.match(/([\d.]+)\s*kg/i);
                    if (match) {
                        return parseFloat(match[1]);
                    }
                }
                
                return 1;
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

            // 일별 데이터 수집 (매일 데이터를 가져와서 최저가 정확도 향상)
            const dayPromises = [];
            for (let day = 1; day <= daysInMonth; day++) {
                dayPromises.push(fetchDayData(day));
            }
            const dayDataArray = await Promise.all(dayPromises);

            // 품목명 추출 함수
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

            // 상품종의 품목(itemType) 또는 상품명으로 매칭 (itemType 우선)
            const matchName = product.itemType || product.name;
            const productNameLower = matchName.toLowerCase().trim();
            const allPrices = [];

            dayDataArray.forEach(dayData => {
                if (!dayData) return;
                
                // 응답 데이터 파싱
                let items = [];
                if (typeof dayData === 'string') {
                    try {
                        dayData = JSON.parse(dayData);
                    } catch (e) {
                        return;
                    }
                }
                
                if (dayData.Grid_20240625000000000661_1 && dayData.Grid_20240625000000000661_1.row) {
                    items = dayData.Grid_20240625000000000661_1.row;
                } else if (dayData.data) {
                    if (dayData.data.data && dayData.data.data.item && Array.isArray(dayData.data.data.item)) {
                        items = dayData.data.data.item;
                    } else if (dayData.data.data && Array.isArray(dayData.data.data)) {
                        items = dayData.data.data;
                    } else if (dayData.data.item && Array.isArray(dayData.data.item)) {
                        items = dayData.data.item;
                    } else if (Array.isArray(dayData.data)) {
                        items = dayData.data;
                    }
                } else if (dayData.item && Array.isArray(dayData.item)) {
                    items = dayData.item;
                } else if (Array.isArray(dayData)) {
                    items = dayData;
                }

                // 상품종의 품목(itemType) 또는 상품명과 매칭되는 품목 찾기
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

            // 최저가와 평균가 계산 (ProductDetailPage와 동일하게 반올림)
            if (allPrices.length > 0) {
                const minPrice = Math.round(Math.min(...allPrices));
                const avgPrice = Math.round(allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length);

                // 현재 상품의 kg당 가격 계산
                const currentPriceBase = product.unitOptions && product.unitOptions.length > 0 && product.unitOptions.find(opt => opt.isDefault)
                    ? product.unitOptions.find(opt => opt.isDefault).price
                    : product.price;
                
                const currentPrice = getDiscountedPrice(
                    currentPriceBase,
                    product.discountRate,
                    product.discountStart,
                    product.discountEnd
                );

                // kg 정보 추출
                let kgValue = 1;
                if (product.unitOptions && product.unitOptions.length > 0) {
                    const defaultOption = product.unitOptions.find(opt => opt.isDefault) || product.unitOptions[0];
                    if (defaultOption.productName) {
                        const productNameLower = defaultOption.productName.toLowerCase();
                        const kgMatch = productNameLower.match(/([\d.]+)\s*kg/i);
                        const gMatch = productNameLower.match(/([\d.]+)\s*g/i);
                        if (kgMatch) {
                            kgValue = parseFloat(kgMatch[1]);
                        } else if (gMatch && !productNameLower.includes('kg')) {
                            kgValue = parseFloat(gMatch[1]) / 1000;
                        } else {
                            const unit = (defaultOption.unit || '').toLowerCase().trim();
                            if (unit.includes('kg')) {
                                const match = unit.match(/([\d.]+)\s*kg/i);
                                kgValue = match ? parseFloat(match[1]) : 1;
                            } else if (unit.includes('g') && !unit.includes('kg')) {
                                const match = unit.match(/([\d.]+)\s*g/i);
                                kgValue = match ? parseFloat(match[1]) / 1000 : 1;
                            }
                        }
                    } else {
                        const unit = (defaultOption.unit || '').toLowerCase().trim();
                        if (unit.includes('kg')) {
                            const match = unit.match(/([\d.]+)\s*kg/i);
                            kgValue = match ? parseFloat(match[1]) : 1;
                        } else if (unit.includes('g') && !unit.includes('kg')) {
                            const match = unit.match(/([\d.]+)\s*g/i);
                            kgValue = match ? parseFloat(match[1]) / 1000 : 1;
                        }
                    }
                } else {
                    if (product.name) {
                        const productNameLower = product.name.toLowerCase();
                        const kgMatch = productNameLower.match(/([\d.]+)\s*kg/i);
                        const gMatch = productNameLower.match(/([\d.]+)\s*g/i);
                        if (kgMatch) {
                            kgValue = parseFloat(kgMatch[1]);
                        } else if (gMatch && !productNameLower.includes('kg')) {
                            kgValue = parseFloat(gMatch[1]) / 1000;
                        } else {
                            const unit = (product.unit || '').toLowerCase().trim();
                            if (unit.includes('kg')) {
                                const match = unit.match(/([\d.]+)\s*kg/i);
                                kgValue = match ? parseFloat(match[1]) : 1;
                            } else if (unit.includes('g') && !unit.includes('kg')) {
                                const match = unit.match(/([\d.]+)\s*g/i);
                                kgValue = match ? parseFloat(match[1]) / 1000 : 1;
                            }
                        }
                    } else {
                        const unit = (product.unit || '').toLowerCase().trim();
                        if (unit.includes('kg')) {
                            const match = unit.match(/([\d.]+)\s*kg/i);
                            kgValue = match ? parseFloat(match[1]) : 1;
                        } else if (unit.includes('g') && !unit.includes('kg')) {
                            const match = unit.match(/([\d.]+)\s*g/i);
                            kgValue = match ? parseFloat(match[1]) / 1000 : 1;
                        }
                    }
                }

                const pricePerKg = kgValue > 0 ? currentPrice / kgValue : currentPrice;
                const discountPercent = minPrice > 0 ? ((minPrice - pricePerKg) / minPrice * 100) : 0;

                return {
                    minPrice,
                    avgPrice,
                    pricePerKg,
                    discountPercent
                };
            }
        } catch (error) {
            console.error(`가격 정보 조회 실패 (${product.name}):`, error);
        }
        return null;
    };

    // 상품별 가격 정보 가져오기 (지연 로딩: 사용자가 스크롤하거나 요청할 때만)
    useEffect(() => {
        const fetchPriceInfos = async () => {
            const activeProducts = products.filter(p => p.status === "approved");
            if (activeProducts.length === 0) return;

            setPriceInfoLoading(true);
            
            // 배치 처리: 한 번에 최대 4개씩 처리하여 서버 부하 감소
            const batchSize = 4;
            const newPriceInfoMap = {};
            
            for (let i = 0; i < activeProducts.length; i += batchSize) {
                const batch = activeProducts.slice(i, i + batchSize);
                const priceInfoPromises = batch.map(async (product) => {
                    const priceInfo = await fetchPriceInfoForProduct(product);
                    return { productId: product.id, priceInfo };
                });
                
                const results = await Promise.all(priceInfoPromises);
                results.forEach(({ productId, priceInfo }) => {
                    if (priceInfo) {
                        newPriceInfoMap[productId] = priceInfo;
                    }
                });
                
                // 배치마다 상태 업데이트하여 점진적으로 표시
                setPriceInfoMap(prev => ({ ...prev, ...newPriceInfoMap }));
                
                // 다음 배치 전 약간의 지연 (서버 부하 방지)
                if (i + batchSize < activeProducts.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            setPriceInfoLoading(false);
        };

        if (products.length > 0) {
            // 약간의 지연 후 실행 (초기 렌더링 후)
            const timer = setTimeout(() => {
                fetchPriceInfos();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [products]);

    const loaderRef = useRef(null);
const [loading, setLoading] = useState(false);

useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting && !loading && page + 1 < totalPages) {
                setLoading(true);
                setPage(prev => prev + 1);
            }
        },
        { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
}, [loading, totalPages, page]);


    // 상품 카드 렌더링 함수
    const renderProducts = (list) => {
        return list.map(item => {
            const discountedPrice = getDiscountedPrice(item.price, item.discountRate, item.discountStart, item.discountEnd);
            const hasDiscount = item.discountRate && isOnDiscount(item.discountRate, item.discountStart, item.discountEnd);
            const isNew = isNewProduct(item.createdAt);
            const priceInfo = priceInfoMap[item.id];
            
            // unitOptions가 있으면 모든 옵션의 재고 확인, 없으면 기본 stock 확인
            let currentStock = 0;
            let isOutOfStock = false;
            let isLowStock = false;
            
            if (item.unitOptions && Array.isArray(item.unitOptions) && item.unitOptions.length > 0) {
                // 모든 옵션의 재고 확인
                const totalStock = item.unitOptions.reduce((sum, opt) => sum + (opt.stock || 0), 0);
                // 모든 옵션의 재고가 0인지 확인
                isOutOfStock = item.unitOptions.every(opt => (opt.stock || 0) === 0);
                // 표시용 재고는 기본 옵션 또는 첫 번째 옵션 사용
                const defaultOption = item.unitOptions.find(opt => opt.isDefault) || item.unitOptions[0];
                currentStock = defaultOption ? (defaultOption.stock || 0) : 0;
            } else {
                currentStock = item.stock || 0;
                isOutOfStock = currentStock === 0;
            }
            
            const stockWarningThreshold = item.stockWarningThreshold || 10;
            isLowStock = !isOutOfStock && currentStock <= stockWarningThreshold;

            return (
                <div className="col-xl-3 col-lg-4 col-md-6 wow fadeInUp" key={item.id}>
                    <div className="product-item" style={{ 
                        cursor: 'pointer', 
                        border: "1px solid #ccc",
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%'
                    }}>
                        <div 
                            className="position-relative bg-light overflow-hidden"
                            onClick={async () => {
                                await increaseView(item.id);
                                navigate(`/products/detail/${item.id}`);
                            }}
                            style={{ cursor: 'pointer', flexShrink: 0 }}
                        >
                            <img 
                                className="img-fluid w-100"
                                src={
                                    item.mainImage 
                                        ? (item.mainImage.startsWith('http') ? item.mainImage : `http://localhost:8080${item.mainImage}`)
                                        : (item.images && item.images[0] 
                                            ? (item.images[0].startsWith('http') ? item.images[0] : `http://localhost:8080${item.images[0]}`)
                                            : '/img/no-image.png')
                                } 
                                alt={item.name}
                                style={{ height: '250px', objectFit: 'cover' }}
                            />
                            {isNew && (
                                <div className="bg-danger rounded text-white position-absolute start-0 top-0 m-4 py-1 px-3" style={{ fontWeight: 'bold', zIndex: 5 }}>
                                    NEW
                                </div>
                            )}
                            {hasDiscount && (
                                <div className="bg-warning rounded text-white position-absolute end-0 top-0 m-4 py-1 px-3" style={{ fontWeight: 'bold', zIndex: 5 }}>
                                    {item.discountRate}% 할인
                                </div>
                            )}
                            {item.bulkMinQuantity && item.bulkDiscountRate && (
                                <div className="bg-info rounded text-white position-absolute end-0" style={{ 
                                    fontWeight: 'bold', 
                                    zIndex: 5,
                                    fontSize: '12px',
                                    padding: '4px 8px',
                                    top: hasDiscount ? '60px' : '16px',
                                    right: '16px',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {item.bulkMinQuantity}개 이상 {item.bulkDiscountRate}% 추가
                                </div>
                            )}
                            {isOutOfStock && (
                                <div className="bg-dark rounded text-white position-absolute start-50 translate-middle-x bottom-0 m-4 py-1 px-3" style={{ fontWeight: 'bold', zIndex: 5 }}>
                                    품절
                                </div>
                            )}
                            {/* 재고 마감임박은 이미지 영역에 표시 */}
                            {isLowStock && !isOutOfStock && (
                                <div className="bg-warning rounded text-white position-absolute start-0 bottom-0 m-4 py-1 px-3" style={{ fontWeight: 'bold', zIndex: 5 }}>
                                    마감임박
                                </div>
                            )}
                        </div>
                        <div className="text-center p-2" style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            flexGrow: 1
                        }}>
                            {/* 1. 상품명 */}
                            <a 
                                className="d-block h5"
                                onClick={async (e) => {
                                    e.preventDefault();
                                    await increaseView(item.id);
                                    navigate(`/products/detail/${item.id}`);
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
                                title={item.name}
                            >
                                {item.name}
                            </a>
                            
                            {/* 2. 가격 */}
                            <div style={{ marginBottom: '4px' }}>
                                {hasDiscount ? (
                                    <>
                                        <span className="text-danger me-2" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                            {formatPrice(discountedPrice)}원
                                        </span>
                                        <span className="text-muted text-decoration-line-through" style={{ fontSize: '14px' }}>
                                            {formatPrice(item.price)}원
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-primary" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                        {formatPrice(item.price)}원
                                    </span>
                                )}
                            </div>
                            
                            {/* 3. 판매자 */}
                            {item.sellerNickname && (
                                <div className="d-flex align-items-center justify-content-center gap-2" style={{ fontSize: '12px', marginBottom: '4px' }}>
                                    <span className="badge bg-primary" style={{ 
                                        fontSize: '10px', 
                                        padding: '3px 8px',
                                        fontWeight: '600'
                                    }}>
                                        판매자
                                    </span>
                                    <span style={{ color: '#333', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }} title={item.sellerNickname}>
                                        {item.sellerNickname}
                                    </span>
                                </div>
                            )}
                            
                            {/* 4. 최저가, 5. 평균가, 6. 최저가 대비 할인율 */}
                            {priceInfoLoading && !priceInfo && (
                                <div className="mb-2" style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
                                    시세 정보 로딩 중...
                                </div>
                            )}
                            {priceInfo && (
                                <div className="mb-2" style={{ fontSize: '11px', color: '#666', lineHeight: '1.6' }}>
                                    <div className="mb-1">
                                        최저가: <strong style={{ color: '#28a745' }}>{priceInfo.minPrice.toLocaleString()}원/kg</strong>
                                    </div>
                                    <div className="mb-1">
                                        평균가: <strong>{priceInfo.avgPrice.toLocaleString()}원/kg</strong>
                                    </div>
                                    {priceInfo.discountPercent > 0 && (
                                        <div style={{ color: '#dc3545', fontWeight: 'bold' }}>
                                            최저가 대비 <strong>{priceInfo.discountPercent.toFixed(1)}% 낮음</strong>
                                        </div>
                                    )}
                                    {priceInfo.discountPercent <= 0 && priceInfo.minPrice > 0 && (
                                        <div style={{ color: '#ff9800' }}>
                                            최저가 대비 <strong>{(Math.abs(priceInfo.discountPercent)).toFixed(1)}% 높음</strong>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="d-flex border-top">
                            <small className="w-50 text-center border-end py-2">
                                <a 
                                    className="text-body"
                                    onClick={async (e) => {
    e.preventDefault();
    await increaseView(item.id);
    navigate(`/products/detail/${item.id}`);
}}

                                    style={{ cursor: 'pointer', textDecoration: 'none' }}
                                >
                                    <i className="fa fa-eye text-primary me-2"></i>상세보기
                                </a>
                            </small>
                            {/* 명갑 */}
                            <small className="w-50 text-center py-2">
<button
  className="text-body"
  style={{ cursor: "pointer", background: "none", border: "none" }}
  onClick={async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    const productId = item.id || item._id;

    try {
      const res = await axios.post("http://localhost:8080/api/wishlist/add", {
        userId,
        productId,
      });

      if (res.data.message === "already") {
        alert("이미 찜한 상품입니다 ");
      } else {
        alert("찜 목록에 추가되었습니다!");
      }
    } catch (error) {
      console.error(error);
      alert("찜하기 중 오류가 발생했습니다.");
    }
  }}
>
  <i className="fa fa-shopping-bag text-primary me-2"></i>찜하기
</button>




                            </small>
                            {/* 명갑 */}
                        </div>
                    </div>
                </div>
            );
        });
    };



    return (
        <div>
            {/* Page Header Start */}
            <div className="container-fluid page-header mb-5 wow fadeIn" data-wow-delay="0.1s">
                <div className="container">
                    <h1 className="display-3 mb-3 animated slideInDown" style={{ marginRight: '300px' }}>
                        농산물 직거래
                    </h1>
                    <nav aria-label="breadcrumb animated slideInDown">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><a className="text-body" href="/">홈페이지</a></li>
                            <li className="breadcrumb-item text-dark active" aria-current="page">농산물</li>
                        </ol>
                    </nav>
                </div>
            </div>
            {/* Page Header End */}

            {/* Product Start */}
            <div className="container-xxl py-5">
                <div className="container">
                    <div className="row g-0 gx-5 align-items-end">
                        <div className="col-lg-6">
                            <div className="section-header text-start mb-5 wow fadeInUp" data-wow-delay="0.1s" style={{ maxWidth: '500px' }}>
                                <h1 className="display-5 mb-3">직거래 농산물</h1>
                                <p>유통마진이 없는 직거래로 신선한 농산물을 저렴한 가격에 구입하세요.</p>
                                {/* <div>총 <span style={{ fontWeight: 'bold', color: 'green' }}>{products.length}</span>개의 상품이 있습니다.</div> */}
                            </div>
                        </div>

                        <div className="col-lg-6 text-start text-lg-end wow slideInRight" data-wow-delay="0.1s">
                            <ul className="nav nav-pills d-inline-flex justify-content-end mb-5">

  <li className="nav-item me-2">
    <a
      className={`btn btn-outline-primary border-2 ${activeTab === "all" ? "active" : ""}`}
      onClick={() => setActiveTab("all")}
    >
      전 체
    </a>
  </li>

  <li className="nav-item me-2">
    <a
      className={`btn btn-outline-primary border-2 ${activeTab === "vegetable" ? "active" : ""}`}
      onClick={() => setActiveTab("vegetable")}
    >
      채 소
    </a>
  </li>

  <li className="nav-item me-2">
    <a
      className={`btn btn-outline-primary border-2 ${activeTab === "fruit" ? "active" : ""}`}
      onClick={() => setActiveTab("fruit")}
    >
      과 일
    </a>
  </li>

  <li className="nav-item me-0">
    <a
      className={`btn btn-outline-primary border-2 ${activeTab === "grain" ? "active" : ""}`}
      onClick={() => setActiveTab("grain")}
    >
      곡물&기타
    </a>
  </li>

</ul>

                        </div>
                    </div>

                    <div className="tab-content">

                        <div className="row g-4">
    {activeTab === "all" && renderProducts(activeProducts)}
    {activeTab === "vegetable" && renderProducts(vegetables)}
    {activeTab === "fruit" && renderProducts(fruits)}
    {activeTab === "grain" && renderProducts(etc)}

</div>



                    </div>
                </div>
            </div>
            <div ref={loaderRef} style={{ height: "50px" }}></div>
            {/* Product End */}

            {/* Back to top */}
            <a href="#" className="btn btn-lg btn-primary btn-lg-square rounded-circle back-to-top">
                <i className="bi bi-arrow-up"></i>
            </a>
        </div>
    );
};

export default Product;