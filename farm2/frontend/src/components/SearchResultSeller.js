import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SearchResultSeller = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const searchQuery = searchParams.get('keyword') || '';
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 검색어를 itemType으로 매핑하는 함수
    const mapSearchQueryToItemType = (query) => {
        if (!query) return null;
        
        // 검색어를 소문자로 변환하여 매칭
        const queryLower = query.toLowerCase().trim();
        
        // 일반적인 매핑 규칙 (필요에 따라 확장 가능)
        const mappings = {
            '고추': '고추',
            '붉은고추': '고추',
            '청고추': '고추',
            '사과': '사과',
            '배추': '배추',
            '배': '배',
            '딸기': '딸기',
            '수박': '수박',
            '오이': '오이',
            '토마토': '토마토',
            '상추': '상추',
            '시금치': '시금치',
            '당근': '당근',
            '양파': '양파',
            '마늘': '마늘',
            '감자': '감자',
            '고구마': '고구마',
            '쌀': '쌀',
            '콩': '콩',
        };

        // 정확히 일치하는 경우
        if (mappings[queryLower]) {
            return mappings[queryLower];
        }

        // 매핑이 없으면 검색어를 그대로 사용
        return query;
    };

    // 상품 조회
    useEffect(() => {
        if (!searchQuery) {
            setProducts([]);
            return;
        }

        const fetchProducts = async () => {
            setLoading(true);
            setError(null);

            try {
                const itemType = mapSearchQueryToItemType(searchQuery);

                const response = await axios.get(`http://localhost:8080/products/itemtype/${itemType}`);
                
                // status가 'approved'인 상품만 필터링
                const approvedProducts = Array.isArray(response.data) 
                    ? response.data.filter(p => p.status === 'approved')
                    : [];

                setProducts(approvedProducts);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('상품을 불러오는 중 오류가 발생했습니다.');
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [searchQuery]);

    // 할인 가격 계산
    const getDiscountedPrice = (price, rate, start, end) => {
        if (!rate) return price;
        const now = new Date();
        const startDate = start ? new Date(start) : null;
        const endDate = end ? new Date(end) : null;
        
        if (startDate && endDate && now >= startDate && now <= endDate) {
            return Math.round(price * (100 - rate) / 100);
        }
        return price;
    };

    // 할인 중인지 확인
    const isOnDiscount = (rate, start, end) => {
        if (!rate) return false;
        const now = new Date();
        const startDate = start ? new Date(start) : null;
        const endDate = end ? new Date(end) : null;
        return startDate && endDate && now >= startDate && now <= endDate;
    };

    // 신상품 확인 (7일 이내)
    const isNewProduct = (createdAt) => {
        if (!createdAt) return false;
        const created = new Date(createdAt);
        const now = new Date();
        const diffTime = now - created;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays <= 3;
    };

    // 가격 포맷팅
    const formatPrice = (price) => {
        return price?.toLocaleString() || '0';
    };

    // 조회수 증가
    const increaseView = async (productId) => {
        try {
            await axios.put(`http://localhost:8080/products/${productId}/view`);
        } catch (err) {
            console.error('Error increasing view:', err);
        }
    };

    // 상품 카드 렌더링
    const renderProducts = () => {
        if (loading) {
            return (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">상품을 불러오는 중...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-5">
                    <div className="alert alert-warning" role="alert">
                        {error}
                    </div>
                </div>
            );
        }

        if (products.length === 0) {
            return (
                <div className="text-center py-5">
                    <p className="text-muted">
                        {searchQuery ? `"${searchQuery}"에 해당하는 판매 상품이 없습니다.` : '검색어를 입력해주세요.'}
                    </p>
                </div>
            );
        }

        return (
            <div className="row">
                {products.map((item) => {
                    const discountedPrice = getDiscountedPrice(item.price, item.discountRate, item.discountStart, item.discountEnd);
                    const hasDiscount = isOnDiscount(item.discountRate, item.discountStart, item.discountEnd);
                    const isNew = isNewProduct(item.createdAt);
                    
                    // 재고 확인
                    let currentStock = 0;
                    let isOutOfStock = false;
                    let isLowStock = false;
                    
                    if (item.unitOptions && Array.isArray(item.unitOptions) && item.unitOptions.length > 0) {
                        const defaultOption = item.unitOptions.find(opt => opt.isDefault) || item.unitOptions[0];
                        currentStock = defaultOption ? (defaultOption.stock || 0) : 0;
                        isOutOfStock = item.unitOptions.every(opt => (opt.stock || 0) === 0);
                    } else {
                        currentStock = item.stock || 0;
                        isOutOfStock = currentStock === 0;
                    }
                    
                    const stockWarningThreshold = item.stockWarningThreshold || 10;
                    isLowStock = !isOutOfStock && currentStock <= stockWarningThreshold;

                    return (
                        <div className="col-xl-3 col-lg-4 col-md-6 wow fadeInUp" key={item.id}>
                            <div className="product-item" style={{ cursor: 'pointer', border: "1px solid #ccc" }}>
                                <div 
                                    className="position-relative bg-light overflow-hidden"
                                    onClick={async () => {
                                        await increaseView(item.id);
                                        navigate(`/products/detail/${item.id}`);
                                    }}
                                    style={{ cursor: 'pointer' }}
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
                                        <div className="bg-warning rounded text-white position-absolute end-0 top-0 m-4 py-1 px-2" style={{ fontWeight: 'bold', zIndex: 5 }}>
                                            {item.discountRate}% 할인
                                        </div>
                                    )}
                                    {isOutOfStock && (
                                        <div className="bg-dark rounded text-white position-absolute start-50 translate-middle-x bottom-0 m-4 py-1 px-3" style={{ fontWeight: 'bold', zIndex: 5 }}>
                                            품절
                                        </div>
                                    )}
                                </div>
                                <div className="text-center p-4">
                                    <a 
                                        className="d-block h5 mb-2"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            await increaseView(item.id);
                                            navigate(`/products/detail/${item.id}`);
                                        }}
                                        style={{ cursor: 'pointer', color: '#333', textDecoration: 'none' }}
                                        onMouseEnter={(e) => e.target.style.color = '#28a745'}
                                        onMouseLeave={(e) => e.target.style.color = '#333'}
                                    >
                                        {item.name}
                                    </a>
                                    <div className="mb-2">
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
                                    {isLowStock && (
                                        <div className="mb-2" style={{ fontSize: '12px', color: '#ff9800' }}>
                                            <span className="text-warning fw-bold">마감임박</span>
                                        </div>
                                    )}
                                    {item.sellerId && (
                                        <div className="mb-2 d-flex align-items-center justify-content-center gap-2" style={{ fontSize: '12px' }}>
                                            <span className="badge bg-primary" style={{ 
                                                fontSize: '10px', 
                                                padding: '3px 8px',
                                                fontWeight: '600'
                                            }}>
                                                판매자
                                            </span>
                                            <span style={{ color: '#333', fontWeight: '500' }}>{item.sellerId}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="container mb-5">
            {/* 제목 */}
            <div
                className="section-header text-center mx-auto mb-5 wow fadeInUp"
                data-wow-delay="0.1s"
                style={{ maxWidth: "600px" }}
            >
                <h2 className="display-5 mb-3">
                    {searchQuery ? `${searchQuery} 판매 상품` : '주요 품목 판매 상품'}
                </h2>
                <p className="text-muted">검색한 품목의 판매 상품을 확인할 수 있어요.</p>
            </div>

            {/* 상품 목록 */}
            {renderProducts()}
        </div>
    );
};

export default SearchResultSeller;