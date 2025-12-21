import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
} from "chart.js";
import axios from "axios";
import "react-multi-carousel/lib/styles.css";
import SearchResultSeller from "./SearchResultSeller";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
);

// 캐러셀 반응형 설정
const responsive = {
    superLargeDesktop: { breakpoint: { max: 4000, min: 3000 }, items: 5 },
    desktop: { breakpoint: { max: 3000, min: 1024 }, items: 5 },
    tablet: { breakpoint: { max: 1024, min: 768 }, items: 3 },
    mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
};


const SearchResult = () => {
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('keyword') || '';
    
    const defaultMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
    const [selectedRegion, setSelectedRegion] = useState('1101');
    const [chartData, setChartData] = useState(null);
    const [monthAverage, setMonthAverage] = useState(null);
    const [prevMonthAverage, setPrevMonthAverage] = useState(null);

    // 캐시 관련 유틸리티 함수들
    const CACHE_PREFIX = 'searchResult_';
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
    const getCacheKey = (month, regionCode, date) => {
        return `${CACHE_PREFIX}${month}_${regionCode}_${date}`;
    };

    // 캐시에서 데이터 가져오기 (항상 캐시가 있으면 사용)
    const getCachedData = (month, regionCode) => {
        const today = getTodayDateString();
        const cacheKey = getCacheKey(month, regionCode, today);
        
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
    const setCachedData = (month, regionCode, data) => {
        const today = getTodayDateString();
        const cacheKey = getCacheKey(month, regionCode, today);
        
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
    const fetchDataFromAPI = async (month, regionCode) => {
        const year = parseInt(month.substring(0, 4));
        const monthIndex = parseInt(month.substring(4, 6)) - 1;
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

        const requests = [];
        const dates = [];

        for (let day = 1; day <= daysInMonth; day++) {
            // 날짜 형식을 YYYY-MM-DD로 변경
            const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dateStrOld = `${year}${String(monthIndex + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;
            dates.push(dateStrOld); // 내부적으로는 기존 형식 유지
            requests.push(
                axios
                    .get('http://localhost:8080/api/price/newtrend', {
                        params: {
                            p_regday: dateStr,
                            p_country_code: regionCode
                        }
                    })
                    .catch((err) => {
                        console.error('Error fetching day data:', dateStr, err);
                        return null;
                    })
            );
        }

        const responses = await Promise.all(requests);
        return dates.map((dateStr, index) => {
            const response = responses[index];
            if (!response) {
                return {
                    date: dateStr,
                    data: []
                };
            }
            
            // 응답이 문자열인 경우 JSON 파싱 시도
            let responseData = response.data;
            if (typeof responseData === 'string') {
                try {
                    responseData = JSON.parse(responseData);
                } catch (e) {
                    console.error(`Failed to parse JSON for date ${dateStr}:`, e);
                    return {
                        date: dateStr,
                        data: []
                    };
                }
            }
            
            if (!responseData) {
                return {
                    date: dateStr,
                    data: []
                };
            }
            
            // KAMIS API 응답 구조: data.data.item 배열
            let items = [];
            if (responseData.data && responseData.data.item && Array.isArray(responseData.data.item)) {
                items = responseData.data.item;
            } else if (responseData.data && Array.isArray(responseData.data)) {
                items = responseData.data;
            } else if (responseData.item && Array.isArray(responseData.item)) {
                items = responseData.item;
            } else if (Array.isArray(responseData)) {
                items = responseData;
            }
            
            // 첫 번째 날짜의 첫 번째 항목 로그 출력
            if (index === 0 && items.length > 0) {
                console.log('Sample item from API:', items[0]);
            }
            
            return {
                date: dateStr,
                data: items
            };
        });
    };

    // 백그라운드에서 API 호출하여 캐시 업데이트
    const fetchAndUpdateCache = async (month, regionCode) => {
        try {
            const mappedData = await fetchDataFromAPI(month, regionCode);
            setCachedData(month, regionCode, mappedData);
        } catch (err) {
            console.error('Error updating cache:', err);
        }
    };

    // 지역 목록
    const regions = [
        { code: '1101', name: '서울' },
        { code: '2100', name: '부산' },
        { code: '2200', name: '대구' },
        { code: '2401', name: '광주' },
        { code: '2501', name: '대전' },
    ];

    // 월별 요약 데이터 가져오기
    const fetchPriceData = async (month, regionCode) => {
        console.log('fetchPriceData called:', { month, regionCode, searchQuery });
        setLoading(true);
        setError(null);

        try {
            await processSummaryCards(month, regionCode);
        } catch (err) {
            setError(err?.message || '데이터를 불러오지 못했습니다.');
            console.error('Error fetching price data:', err);
        } finally {
            setLoading(false);
        }
    };

    const extractKgFromUnit = (unit) => {
        if (!unit) return 1;
        let match = 1;
        if (unit.indexOf('개') !== -1) {
            match = unit.match(/([\d.]+)\s*개/i);
            return match ? parseFloat(match[1]) : 1;
        }
        // 예: "10kg(그물망 3포기)", "8kg", "4kg", "20kg" 등에서 kg 추출
        else {match = unit.match(/([\d.]+)\s*kg/i);}
        return match ? parseFloat(match[1]) : 1;
    };

    const calculatePricePerKg = (item) => {
        // 당일 가격만 사용
        const priceStr = item.dpr1;
        
        // 가격이 "-"이거나 빈 문자열, null, undefined인 경우 데이터 없음
        if (!priceStr || priceStr === "-" || priceStr === "" || priceStr === null || priceStr === undefined) {
            return 0;
        }
        
        // 가격이 문자열인 경우 쉼표 제거 후 파싱
        let cost = 0;
        if (typeof priceStr === 'string') {
            // 쉼표와 공백 제거 후 파싱
            const cleanedPrice = priceStr.replace(/[,\s]/g, "");
            // 숫자가 아닌 경우 0 반환
            if (cleanedPrice === "" || cleanedPrice === "-" || isNaN(cleanedPrice)) {
                return 0;
            }
            cost = parseFloat(cleanedPrice) || 0;
        } else if (typeof priceStr === 'number') {
            cost = priceStr;
        }
        
        // 단위 필드: "10kg(그물망 3포기)" 또는 "10kg" 형식
        const unit = item.unit || item.std || item.unit_name || item.unitName || '';
        const kgPerUnit = extractKgFromUnit(unit);
        
        // kg당 가격 계산
        if (kgPerUnit > 0 && cost > 0) {
            return cost / kgPerUnit;
        }
        
        return 0;
    };

    // 검색어에 해당하는 품목 찾기
    const processSummaryCards = async (currentMonth, regionCode) => {
        console.log('processSummaryCards called:', { currentMonth, regionCode, searchQuery });
        try {
            const currentMonthData = await fetchMonthData(currentMonth, regionCode);
            console.log('currentMonthData length:', currentMonthData.length);
            
            if (currentMonthData.length === 0) {
                console.warn('No month data found');
                setSelectedItem(null);
                if (searchQuery) {
                    alert('해당 검색어에 대한 데이터가 없습니다.');
                    // window.location.href = '/about';
                }
                return;
            }

            // 검색어와 일치하는 품목 찾기
            const foundItems = new Set();
            const allItems = new Set(); // 디버깅용: 모든 품목명
            const itemDetails = []; // 디버깅용: 품목 상세 정보
            
            currentMonthData.forEach((dayData) => {
                if (!dayData.data || dayData.data.length === 0) {
                    return;
                }
                
                dayData.data.forEach((item) => {
                    // 품목명 추출 (여러 필드 확인)
                    const itemName = item.item_name || 
                                    (item.item && item.item.item_name) ||
                                    item.productName || 
                                    item.name || 
                                    item.MIDNAME || '';
                    
                    if (itemName) {
                        allItems.add(itemName);
                        
                        // 디버깅: 첫 번째 항목의 상세 정보 저장
                        if (itemDetails.length < 5) {
                            itemDetails.push({
                                itemName: itemName,
                                rawItem: item,
                                itemKeys: Object.keys(item)
                            });
                        }
                        
                        // 검색어가 있으면 대소문자 구분 없이 포함 여부 확인
                        if (searchQuery) {
                            const searchLower = searchQuery.toLowerCase().trim();
                            const itemLower = itemName.toLowerCase();
                            
                            // 정확히 일치하거나 포함되는지 확인
                            if (itemLower === searchLower || itemLower.includes(searchLower)) {
                                foundItems.add(itemName);
                                console.log('Match found:', { searchQuery, itemName, itemLower, searchLower });
                            }
                        }
                    }
                });
            });

            // 디버깅: 모든 품목명 출력
            console.log('=== Search Debug Info ===');
            console.log('Search query:', searchQuery);
            console.log('All items found:', Array.from(allItems).sort());
            console.log('Found items:', Array.from(foundItems));
            console.log('Sample item details:', itemDetails);
            
            // "붉은고추" 관련 검색어 확인
            if (searchQuery && searchQuery.includes('고추')) {
                const gochuItems = Array.from(allItems).filter(name => 
                    name.toLowerCase().includes('고추') || name.toLowerCase().includes('gochu')
                );
                console.log('Items containing "고추":', gochuItems);
            }

            if (searchQuery && foundItems.size === 0) {
                console.warn('No items found for search query:', searchQuery);
                console.warn('Available items:', Array.from(allItems));
                alert(`해당 검색어("${searchQuery}")에 대한 데이터가 없습니다.\n\n사용 가능한 품목: ${Array.from(allItems).slice(0, 10).join(', ')}...`);
                // window.location.href = '/about';
                return;
            }

            // 검색어가 있으면 해당 품목 선택, 없으면 첫 번째 품목 선택
            if (searchQuery && foundItems.size > 0) {
                setSelectedItem(Array.from(foundItems)[0]);
            } else if (!searchQuery) {
                // 검색어가 없으면 첫 번째 품목 선택
                const firstItem = currentMonthData[0]?.data?.[0];
                if (firstItem) {
                    const itemName = firstItem.item_name || 
                                   (firstItem.item && firstItem.item.item_name) ||
                                   firstItem.productName || 
                                   firstItem.name || 
                                   firstItem.MIDNAME || '';
                    setSelectedItem(itemName);
                }
            }
        } catch (err) {
            console.error('Error processing summary cards:', err);
            if (searchQuery) {
                alert('해당 검색어에 대한 데이터가 없습니다.');
                // window.location.href = '/about';
            }
            throw err;
        }
    };

    // 선택된 월의 모든 데이터를 가져오는 함수
    const fetchMonthData = async (month, regionCode) => {
        console.log('fetchMonthData called:', { month, regionCode });
        try {
            // 항상 캐시가 있으면 사용
            const cachedData = getCachedData(month, regionCode);
            if (cachedData) {
                console.log('Using cached data for', month, regionCode);
                // 오후 3시 이후인 경우에만 백그라운드에서 API 호출하여 캐시 업데이트
                if (shouldUseCache()) {
                    fetchAndUpdateCache(month, regionCode).catch(err => {
                        console.error('Error updating cache in background:', err);
                    });
                }
                return cachedData;
            }

            // 캐시가 없는 경우: 언제든지 API 호출하여 캐시에 저장
            console.log('Cache not available, fetching from API for', month, regionCode);
            const mappedData = await fetchDataFromAPI(month, regionCode);
            
            // 항상 캐시에 저장
            setCachedData(month, regionCode, mappedData);
            console.log('Data fetched and cached for', month, regionCode);
            
            console.log('fetchMonthData result:', {
                totalDays: mappedData.length,
                daysWithData: mappedData.filter(d => d.data.length > 0).length,
                firstDayItems: mappedData[0]?.data?.length || 0
            });
            
            return mappedData;
        } catch (err) {
            console.error('Error fetching month data:', err);
            return [];
        }
    };

    const buildDailyAverageMap = (monthData, itemName) => {
        return monthData.reduce((acc, dayData) => {
            // 날짜 추출 (YYYYMMDD 형식에서 일자 부분)
            const day = parseInt(dayData.date.substring(6, 8), 10);
            
            // 해당 날짜에 데이터가 없는 경우
            if (!dayData.data || dayData.data.length === 0) {
                return acc;
            }
            
            // 품목명으로 필터링 (여러 가능한 필드명 확인, 중첩된 구조도 확인)
            const itemData = dayData.data.filter((item) => {
                // 중첩된 item 객체가 있는 경우도 확인
                const name = item.item_name || 
                            (item.item && item.item.item_name) ||
                            item.productName || 
                            item.name || 
                            item.MIDNAME || '';
                return name === itemName;
            });
            
            if (itemData.length === 0) {
                // 해당 날짜에 선택한 품목 데이터가 없음
                return acc;
            }
            
            // kg당 가격 계산
            const prices = itemData
                .map((item) => calculatePricePerKg(item))
                .filter(price => !Number.isNaN(price) && price > 0);
            
            if (prices.length === 0) {
                return acc;
            }
            
            const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            
            acc[day] = {
                avg: Math.round(avgPrice),
                min: Math.round(minPrice),
                max: Math.round(maxPrice)
            };
            
            return acc;
        }, {});
    };

    const calculateOverallAverage = (values) => {
        if (!values.length) {
            return null;
        }
        return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    };

    // 품목이 개당 가격인지 확인하는 함수
    const isPerUnitItem = (itemName) => {
        if (!itemName) return false;
        return itemName.includes('수박') || itemName.includes('오이');
    };

    // 선택된 품목의 차트 데이터 생성 (일간 kg당 가격)
    useEffect(() => {
        const loadChartData = async () => {
            if (!(selectedItem && selectedMonth && selectedRegion)) {
                setChartData(null);
                setMonthAverage(null);
                setPrevMonthAverage(null);
                return;
            }

            const monthData = await fetchMonthData(selectedMonth, selectedRegion);

            if (monthData.length > 0) {
                const year = parseInt(selectedMonth.substring(0, 4));
                const monthIndex = parseInt(selectedMonth.substring(4, 6)) - 1;
                const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

                const dailyAverageMap = buildDailyAverageMap(monthData, selectedItem);
                
                // 일별 데이터 배열 생성 (1일부터 말일까지)
                const dailyData = [];
                const labels = [];
                
                for (let day = 1; day <= daysInMonth; day++) {
                    labels.push(`${day}일`);
                    const dayData = dailyAverageMap[day];
                    if (dayData) {
                        dailyData.push({
                            avg: dayData.avg,
                            min: dayData.min,
                            max: dayData.max
                        });
                    } else {
                        // 데이터가 없는 날은 null로 표시
                        dailyData.push({
                            avg: null,
                            min: null,
                            max: null
                        });
                    }
                }

                // 월평균 계산 (데이터가 있는 날짜만)
                const allDailyValues = dailyData
                    .filter(d => d.avg !== null)
                    .map(d => d.avg);
                setMonthAverage(allDailyValues.length > 0 ? calculateOverallAverage(allDailyValues) : null);

                // 전월 평균 계산
                const previousMonthDate = new Date(year, monthIndex, 1);
                previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
                const previousMonthStr =
                    previousMonthDate.getFullYear() +
                    String(previousMonthDate.getMonth() + 1).padStart(2, '0');
                const previousMonthData = await fetchMonthData(previousMonthStr, selectedRegion);
                const previousDailyAverageMap = buildDailyAverageMap(previousMonthData, selectedItem);
                const prevDailyValues = Object.values(previousDailyAverageMap)
                    .map(dayData => dayData.avg)
                    .filter(v => v !== null && v !== undefined);
                setPrevMonthAverage(
                    prevDailyValues.length > 0 ? calculateOverallAverage(prevDailyValues) : null
                );

                const isPerUnit = isPerUnitItem(selectedItem);
                const unitLabel = isPerUnit ? '개당' : 'kg당';
                const unitSuffix = isPerUnit ? '/개' : '/kg';

                const chart = {
                    labels: labels,
                    datasets: [
                        {
                            label: `${selectedItem} 최고 가격 (${unitLabel})`,
                            data: dailyData.map(d => d.max),
                            borderColor: "#ff9500",
                            backgroundColor: "rgba(255,149,0,0.3)",
                            tension: 0.4,
                            fill: false,
                            spanGaps: true, // 데이터가 없는 날짜를 건너뛰고 이전/다음 날짜를 연결
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            borderDash: [5, 5],
                        },
                        { 
                            label: `${selectedItem} 평균 가격 (${unitLabel})`,
                            data: dailyData.map(d => d.avg),
                            borderColor: "#ff4d4d",
                            backgroundColor: "rgba(255,77,77,0.3)",
                            tension: 0.4,
                            fill: false,
                            spanGaps: true, // 데이터가 없는 날짜를 건너뛰고 이전/다음 날짜를 연결
                            pointRadius: 4,
                            pointHoverRadius: 6,
                        },
                        {
                            label: `${selectedItem} 최저 가격 (${unitLabel})`,
                            data: dailyData.map(d => d.min),
                            borderColor: "#4d94ff",
                            backgroundColor: "rgba(77,148,255,0.3)",
                            tension: 0.4,
                            fill: false,
                            spanGaps: true, // 데이터가 없는 날짜를 건너뛰고 이전/다음 날짜를 연결
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            borderDash: [5, 5],
                        },
                    ],
                };

                setChartData(chart);
            } else {
                setChartData(null);
                setMonthAverage(null);
                setPrevMonthAverage(null);
            }
        };
        loadChartData();
    }, [selectedItem, selectedMonth, selectedRegion]);

    // 품목이 개당 가격인지 확인
    const isPerUnit = selectedItem ? isPerUnitItem(selectedItem) : false;
    const unitLabel = isPerUnit ? '개당' : 'kg당';
    const unitSuffix = isPerUnit ? '/개' : '/kg';

    useEffect(() => {
        console.log('useEffect triggered:', { selectedMonth, selectedRegion, searchQuery });
        if (searchQuery) {
            fetchPriceData(selectedMonth, selectedRegion);
        }
    }, [selectedMonth, selectedRegion, searchQuery]);

    if (loading) {
        return (
            <div
                className="container mb-5 text-center"
                style={{ minHeight: "400px", paddingTop: "100px" }}
            >
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">데이터를 불러오는 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="container mb-5 text-center"
                style={{ minHeight: "400px", paddingTop: "100px" }}
            >
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">에러 발생</h4>
                    <p>{error}</p>
                    <hr />
                    <button className="btn btn-primary" onClick={() => fetchPriceData(selectedMonth, selectedRegion)}>
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    if (!chartData) {
        return (
            <div
                className="container mb-5 text-center"
                style={{ minHeight: "400px", paddingTop: "100px" }}
            >
                <p className="text-muted">데이터 출력 중 ...</p>
            </div>
        );
    }

    return (
        <div className="container mb-5">
            {/* 제목 */}
            <div
                className="section-header text-center mx-auto mb-5 wow fadeInUp"
                data-wow-delay="0.1s"
                style={{ maxWidth: "600px" }}
            >
                <h2 className="display-5 mb-3">
                    {searchQuery ? `${searchQuery} 가격동향` : '주요 품목 가격동향'}
                </h2>
                <p className="text-muted">지역과 월을 선택하면 해당 기간의 가격 흐름을 확인할 수 있어요.</p>
            </div>

            {/* 지역 및 날짜 선택 */}
            <div className="filter-panel shadow-sm bg-white p-4 mb-4 d-flex flex-wrap justify-content-center gap-4">
                <div className="filter-item">
                    <label className="form-label fw-bold">지역 선택</label>
                    <select 
                        className="form-select filter-control"
                        value={selectedRegion}
                        onChange={(e) => {
                            setSelectedRegion(e.target.value);
                        }}
                    >
                        {regions.map((region) => (
                            <option key={region.code} value={region.code}>
                                {region.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="filter-item">
                    <label className="form-label fw-bold">월 선택</label>
                    <input 
                        type="month" 
                        className="form-control filter-control"
                        value={selectedMonth.replace(/(\d{4})(\d{2})/, '$1-$2')}
                        onChange={(e) => {
                            const newMonth = e.target.value.replace(/-/g, '');
                            setSelectedMonth(newMonth);
                        }}
                    />
                </div>
            </div>

            {/* 그래프 영역 */}
            <div className="graph-card bg-white shadow-sm p-4">
                <h4 className="fw-bold mb-3">{selectedItem} 일간 가격 추이 ({unitLabel} 가격)</h4>
                {prevMonthAverage !== null && (
                    <p className="text-muted small mb-1">
                        전월 평균 가격: {prevMonthAverage.toLocaleString()}원{unitSuffix}
                    </p>
                )}
                {monthAverage !== null && (
                    <p className="text-primary fw-semibold mb-3">
                        이번달 평균 가격: {monthAverage.toLocaleString()}원{unitSuffix}
                    </p>
                )}
                <Line data={chartData} options={{
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            mode: 'index',
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            callbacks: {
                                label: function(context) {
                                    if (context.parsed.y === null || context.parsed.y === undefined) {
                                        return context.dataset.label + ': 데이터 없음';
                                    }
                                    return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + '원';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString() + '원' + unitSuffix;
                                }
                            },
                            title: {
                                display: true,
                                text: `가격 (원${unitSuffix})`
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: '일자'
                            }
                        }
                    }
                }} />
                <p className="text-muted small mt-3">
                    ※ 제공되는 정보는 일별 도·소매 가격 정보입니다.
                    <br/>
                    ※ 그래프는 일별 {unitLabel} 가격을 보여줍니다. 카드의 상승률은 전달 월평균 대비 변동률입니다.
                </p>
            </div>

            <br/><br/>

            <SearchResultSeller />

            {/* 내부 스타일 */}
            <style>{`
                .filter-panel {
                    border: 1px solid #eef2f6;
                }
                .filter-item {
                    min-width: 220px;
                }
                .filter-control {
                    border-radius: 0.75rem;
                    background: #f8fafc;
                    border-color: #dbe4f0;
                }
                .filter-control:focus {
                    box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.15);
                    border-color: #86b7fe;
                    background: #ffffff;
                }
                .carousel-wrapper {
                    border: 1px solid #eef2f6;
                }
                .price-card {
                    transition: 0.25s;
                    background: white;
                }
                .price-card:hover {
                    transform: scale(1.05);
                    box-shadow: 0 5px 16px rgba(0,0,0,0.15);
                }
                .selected-card {
                    border: 2px solid #007bff !important;
                    background: #e9f3ff !important;
                }
                .graph-card {
                    min-height: 350px;
                }
                .react-multiple-carousel__arrow {
                    top: 50%;
                    transform: translateY(-50%);
                    opacity: 0.85;
                }
                .react-multiple-carousel__arrow--left {
                    left: -25px;
                }
                .react-multiple-carousel__arrow--right {
                    right: -25px;
                }
            `}</style>
        </div>
    );
};

export default SearchResult;
