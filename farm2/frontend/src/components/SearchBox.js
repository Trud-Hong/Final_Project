import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SearchBox = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState("");
    const [popularKeywords, setPopularKeywords] = useState([]); // 인기검색어 목록 상태

    // 컴포넌트가 열릴 때 인기검색어 데이터 가져오기
    useEffect(() => {
        if (isOpen) {
            fetchPopularKeywords();
            axios.get('/api/search/popular')
            .then(res => console.log(res))
            .catch(err => {
                console.log('status:', err.response?.status); // 500
                console.log('message:', err.response?.data);  // 서버에서 보낸 메시지 확인
            });
        }
    }, [isOpen]);

    // 인기검색어 조회 API 호출
    const fetchPopularKeywords = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/search/popular');
            if (response.data && Array.isArray(response.data)) {
                setPopularKeywords(response.data);
            } else {
                setPopularKeywords([]);
            }
        } catch (error) {
            console.error('인기검색어 조회 실패:', error);
            setPopularKeywords([]);
        }
    };

    // 해당 월의 모든 날짜 데이터를 조회하는 함수
    const fetchMonthData = async (month, regionCode) => {
        try {
            const year = parseInt(month.substring(0, 4));
            const monthIndex = parseInt(month.substring(4, 6)) - 1;
            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

            const requests = [];
            const dates = [];

            // 해당 월의 모든 날짜에 대해 API 요청 생성
            for (let day = 1; day <= daysInMonth; day++) {
                // 날짜 형식을 YYYY-MM-DD로 변경
                const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dateStrOld = `${year}${String(monthIndex + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;
                dates.push(dateStrOld);
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

            // 모든 요청을 병렬로 실행
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
                
                return {
                    date: dateStr,
                    data: items
                };
            });
        } catch (err) {
            console.error('Error fetching month data:', err);
            return [];
        }
    };


    // 검색어에 해당하는 데이터가 있는지 확인하는 함수
    const checkSearchResultExists = async (keyword) => {
        try {
            // 현재 월 계산
            const now = new Date();
            const currentMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
            
            // 해당 월의 모든 날짜 데이터 조회 (기본 지역: 서울 1101)
            const monthData = await fetchMonthData(currentMonth, '1101');
            
            // 모든 날짜의 데이터를 순회하면서 검색어를 포함하는 품목이 있는지 확인
            const keywordLower = keyword.toLowerCase().trim();
            const hasMatchingItem = monthData.some(dayData => 
                dayData.data && dayData.data.some(item => {
                    // 품목명 추출 (여러 필드 확인)
                    const itemName = item.item_name || 
                                    (item.item && item.item.item_name) ||
                                    item.productName || 
                                    item.name || 
                                    item.MIDNAME || '';
                    
                    if (itemName) {
                        const itemLower = itemName.toLowerCase();
                        return itemLower.includes(keywordLower);
                    }
                    return false;
                })
            );
            
            return hasMatchingItem;
        } catch (error) {
            console.error('검색 결과 확인 실패:', error);
            return false;
        }
    };

    // 검색 제출 처리
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (query.trim()) {
            // 먼저 검색 결과가 있는지 확인 (로딩 중 표시할 수도 있음)
            const hasResults = await checkSearchResultExists(query.trim());
            
            if (!hasResults) {
                // 데이터가 없으면 alert 표시하고 DB에 저장하지 않음
                alert('해당 검색어의 데이터가 없습니다');
                setQuery("");
                onClose();
                return;
            }
            
            // 데이터가 있으면 검색어를 백엔드에 저장
            try {
                await axios.post('http://localhost:8080/api/search/save', {
                    keyword: query.trim()
                });
                // 저장 후 인기 검색어 목록 새로고침
                fetchPopularKeywords();
            } catch (error) {
                console.error('검색어 저장 실패:', error);
            }

            // 검색 결과 페이지로 이동
            window.location.href = `/searchresult?keyword=${encodeURIComponent(query)}`;
            setQuery("");
            onClose();
        } else if (!query.trim()) {
        }
    };

    // 인기검색어 클릭 처리
    const handleKeywordClick = async (keyword) => {
        // 검색어를 백엔드에 저장
        try {
            await axios.post('http://localhost:8080/api/search/save', {
                keyword: keyword
            });
        } catch (error) {
            console.error('검색어 저장 실패:', error);
        }

        // 검색 결과 페이지로 이동
        window.location.href = `/searchresult?keyword=${encodeURIComponent(keyword)}`;
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div>
            <div 
                className="position-absolute bg-white shadow-lg rounded p-3"
                style={{
                    top: '100%',
                    right: '-500%',
                    marginTop: '10px',
                    minWidth: '350px',
                    zIndex: 1050,
                    border: '1px solid #dee2e6'
                }}
            >
                {/* 검색 입력 폼 */}
                <form onSubmit={handleSubmit} className="d-flex align-items-center mb-3">
                    <div className="input-group flex-grow-1">
                        <input
                            type="search"
                            className="form-control"
                            placeholder="농산물명을 입력하세요..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                            style={{ borderRight: 'none' }}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ borderLeft: 'none' }}
                        >
                            <small className="fa fa-search"></small>
                        </button>
                    </div>
                </form>

                {/* 구분선 */}
                <hr className="my-2" />

                {/* 인기검색어 섹션 */}
                <div>
                    <h6 className="mb-2 text-muted" style={{ fontSize: '0.9rem' }}>
                        인기검색어
                    </h6>
                    <div className="popular-keywords">
                        {popularKeywords.length > 0 ? (
                            popularKeywords.map((item, index) => (
                                <div
                                    key={item._id}
                                    className="d-flex align-items-center py-1 border-bottom cursor-pointer"
                                    onClick={() => handleKeywordClick(item.keyword)}
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    {/* 순위 표시 */}
                                    <span 
                                        className="badge me-1"
                                        style={{
                                            backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#CD7F32' : '#000000ff',
                                            minWidth: '24px'
                                        }}
                                    >
                                        {index + 1}
                                    </span>
                                    {/* 검색어 */}
                                    <span className="flex-grow-1">{item.keyword}</span>
                                    {/* 검색 횟수 */}
                                    <small className="text-muted">{item.count}회</small>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                                인기검색어가 없습니다.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchBox;