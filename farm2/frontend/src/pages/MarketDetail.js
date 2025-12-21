import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PriceTrendOfMarket from '../components/PriceTrendOfMarket';

const MarketDetail = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [market, setMarket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 캐시 관련 유틸리티 함수들
    const CACHE_PREFIX = 'marketDetail_';
    const UPDATE_HOUR = 15; // 오후 3시

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
    const getCacheKey = (marketCode, date) => {
        return `${CACHE_PREFIX}${marketCode}_${date}`;
    };

    // 캐시에서 데이터 가져오기 (항상 캐시가 있으면 사용)
    const getCachedData = (marketCode) => {
        const today = getTodayDateString();
        const cacheKey = getCacheKey(marketCode, today);
        
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
    const setCachedData = (marketCode, data) => {
        const today = getTodayDateString();
        const cacheKey = getCacheKey(marketCode, today);
        
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
    const fetchDataFromAPI = async (marketCode) => {
        try {
            const response = await fetch(`http://localhost:8080/api/market/detail/${marketCode}`);
            const data = await response.json();
            
            if (!response.ok) {
                const errorMessage = data.error || data.message || '시장 정보를 불러오는데 실패했습니다.';
                throw new Error(errorMessage);
            }
            
            return data;
        } catch (err) {
            console.error('Error fetching market detail from API:', err);
            throw err;
        }
    };

    // 백그라운드에서 API 호출하여 캐시 업데이트
    const fetchAndUpdateCache = async (marketCode) => {
        try {
            const data = await fetchDataFromAPI(marketCode);
            setCachedData(marketCode, data);
        } catch (err) {
            console.error('Error updating cache:', err);
        }
    };

    useEffect(() => {
        fetchMarketDetail();
    }, [code]);

    const fetchMarketDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // 항상 캐시가 있으면 사용
            const cachedData = getCachedData(code);
            if (cachedData) {
                console.log('Using cached data for market', code);
                setMarket(cachedData);
                setLoading(false);
                
                // 오후 3시 이후인 경우에만 백그라운드에서 API 호출하여 캐시 업데이트
                if (shouldUseCache()) {
                    fetchAndUpdateCache(code).then(updatedData => {
                        if (updatedData) {
                            setMarket(updatedData);
                        }
                    }).catch(err => {
                        console.error('Error updating cache in background:', err);
                    });
                }
                return;
            }

            // 캐시가 없는 경우: 언제든지 API 호출하여 캐시에 저장
            console.log('Cache not available, fetching from API for market', code);
            const data = await fetchDataFromAPI(code);
            
            // 항상 캐시에 저장
            setCachedData(code, data);
            console.log('Data fetched and cached for market', code);
            
            setMarket(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching market detail:', err);
        } finally {
            setLoading(false);
        }
    };


    //카카오맵부분 추가
    useEffect(() => {
        // market 데이터가 없거나 location이 없으면 실행하지 않음
        if (!market || !market.location) {
            return;
        }

        if(!window.kakao || !window.kakao.maps){ //카카오 or 카카오맵이 준비되었으면 실행해
            console.log("카카오맵 오류");
            return; //스크립트 없으면 여기에서 종료 후 다시 점검
        }

        //HTML에서 id="kakaoMap" div 가져와
        const container = document.getElementById('KakaoMap');

        if(!container) {
            console.log("지도 컨테이너 없음");
            return;
        }

        const options = {
            center: new window.kakao.maps.LatLng(37.2635727, 127.0286009), 
            // center = 지도의 중심 위치 (임시로 수원시청 근처)
            // LatLng(위도, 경도) = 지도 좌표

            level:3  // level = 지도 확대 레벨 (1=제일 확대, 14=제일 축소)
        };

        const map = new window.kakao.maps.Map(container, options);
        //지도 만들었음.

        const geocoder = new window.kakao.maps.services.Geocoder();
        //주소를 좌표로 변경해

        const loc = market.location;
        
        if (!loc) {
            console.log('주소 정보가 없습니다.');
            return;
        }
        
        geocoder.addressSearch(loc,
            function(result, status) {
            // addressSearch('주소', 검색완료되면실행할함수)
            // function(result, status) = 검색 끝나면 좌표정보와 결과 알려줘
        
            if (status === window.kakao.maps.services.Status.OK){
                //검색 성공했으면 실행해

                const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
                // result[0] = 검색 결과 첫 번째 (제일 정확한 주소)
                // y = 위도 (latitude),  x = 경도 (longitude)
                // const coords = 그 좌표를 coords라는 이름으로 저장
        
                const marker = new window.kakao.maps.Marker({
                    map: map, //위에서 만든 지도에 표시해
                    position: coords //검색한 좌표 위치에 마커 표시해
                });
        
                map.setCenter(coords); //마커가 화면 중앙에 있어야해.
            } else {
                console.log('주소 검색 실패:', status);
            }
        });
   }, [market]); // market 데이터가 로드되면 실행


    return (
        <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            {/* Page Header */}
            <div className="container-fluid page-header wow fadeIn" data-wow-delay="0.1s">
                <div className="container">
                    <h1 className="display-3 mb-3 animated slideInDown" style={{ marginRight: '300px' }}>
                        시장 상세 정보
                    </h1>
                    <nav aria-label="breadcrumb animated slideInDown">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item">
                                <a className="text-body" href="/">홈페이지</a>
                            </li>
                            <li className="breadcrumb-item">
                                <a className="text-body" href="/market">시장 정보</a>
                            </li>
                            <li className="breadcrumb-item text-dark active" aria-current="page">
                                {market?.marketName}
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>

            {/* Market Detail Section */}
            <div className="container-xxl py-6" style={{ width: '100%', maxWidth: '100%', paddingLeft: '15px', paddingRight: '15px' }}>
                <div 
                    className="section-header text-center mx-auto mb-5 wow fadeInUp" 
                    data-wow-delay="0.1s"
                    style={{ maxWidth: "700px", width: '100%'}}
                >
                    <h1 className="display-5 mb-3" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                        {market?.marketName}
                    </h1>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <p>로딩 중...</p>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger" role="alert" style={{ margin: '20px' }}>
                        {error}
                        <div style={{ marginTop: '10px' }}>
                            <button 
                                className="btn btn-primary" 
                                onClick={() => {
                                    // 목록으로 돌아갈 때 이전 페이지 정보 복원
                                    const returnPage = location.state?.returnPage ?? 0;
                                    const returnKeyword = location.state?.returnKeyword ?? "";
                                    
                                    const params = new URLSearchParams();
                                    if (returnPage > 0) {
                                        params.set("page", returnPage);
                                    }
                                    if (returnKeyword) {
                                        params.set("keyword", returnKeyword);
                                    }
                                    
                                    navigate(`/market${params.toString() ? `?${params.toString()}` : ""}`);
                                }}
                            >
                                시장 목록으로 돌아가기
                            </button>
                        </div>
                    </div>
                ) : market ? (
                    <div className="row">
                        <div className="col-12">
                            <div className="card shadow-sm">
                                <div className="card-body" style={{ padding: '30px' }}>
                                    <table className="table table-borderless">
                                        <tbody>
                                            {Object.entries(market)
                                                .filter(([key]) => key !== 'province' && key !== 'Num')
                                                .map(([key, value], index) => (
                                                <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                                                    <th 
                                                        scope="row" 
                                                        style={{ 
                                                            width: '200px', 
                                                            padding: '15px',
                                                            backgroundColor: '#f8f9fa',
                                                            fontWeight: 'bold',
                                                            verticalAlign: 'middle'
                                                        }}
                                                    >
                                                        {key === 'marketName' && '시장명'}
                                                        {key === 'site' && 'URL'}
                                                        {key === 'code' && '시장코드'}
                                                        {key === 'city' && '지역'}
                                                        {key === 'location' && '상세 주소'}
                                                        {key === 'tel' && '전화번호'}
                                                        {key === 'category' && '구분'}
                                                    </th>
                                                    <td style={{ padding: '15px', verticalAlign: 'middle' }}>
                                                        {key === 'site' ? (
                                                            <a 
                                                                href={value && (value.startsWith('http://') || value.startsWith('https://')) 
                                                                    ? value 
                                                                    : `https://${value}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {value}
                                                            </a>
                                                        ) : (
                                                            value || '-'
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div
                                        className="container-xxl wow fadeIn"
                                        data-wow-delay="0.1s"
                                        style={{ marginBottom: '-6px',
                                                paddingLeft: '90px',
                                                paddingRight: '90px',
                                        }}>
                                        <div id="KakaoMap" style={{width: "100%", height: "450px"}}></div>
                                    </div>
                                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                                        <button 
                                            className="btn btn-primary" 
                                            onClick={() => {
                                                // 목록으로 돌아갈 때 이전 페이지 정보 복원
                                                const returnPage = location.state?.returnPage ?? 0;
                                                const returnKeyword = location.state?.returnKeyword ?? "";
                                                
                                                const params = new URLSearchParams();
                                                if (returnPage > 0) {
                                                    params.set("page", returnPage);
                                                }
                                                if (returnKeyword) {
                                                    params.set("keyword", returnKeyword);
                                                }
                                                
                                                navigate(`/market${params.toString() ? `?${params.toString()}` : ""}`);
                                            }}
                                        >
                                            시장 목록으로 돌아가기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '30px' }}>
                        시장 정보를 찾을 수 없습니다.
                    </div>
                )}
            </div>
            {market && market.code && (
                <div>
                    <PriceTrendOfMarket marketCode={market.code} />
                </div>
            )}
            {/* <div
                className="container-xxl wow fadeIn"
                data-wow-delay="0.1s"
                style={{ marginBottom: '-6px',
                        paddingLeft: '90px',
                        paddingRight: '90px',
                        paddingBottom: '90px',
                }}
            >

            <div id="KakaoMap" style={{width: "100%", height: "450px"}}></div>
            </div> */}
        </div>
    );
};

export default MarketDetail;


