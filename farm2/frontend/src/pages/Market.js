import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';

// 반응형 스타일
const responsiveStyles = `
    @media (max-width: 768px) {
        table {
            font-size: 12px;
        }
        .admin-th, .admin-td {
            padding: 8px 4px !important;
        }
    }
    @media (max-width: 480px) {
        table {
            font-size: 11px;
        }
        .admin-th, .admin-td {
            padding: 6px 3px !important;
        }
    }
`;

const Market = () => {
    const [marketList, setMarketList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    
    const [size] = useState(10); // 페이지당 항목 수
    const [totalPage, setTotalPage] = useState(0);
    const [allMarket, setAllMarket] = useState([]);
    const [filteredMarket, setFilteredMarket] = useState([]);

    const searchParams = new URLSearchParams(location.search);
    const initialPage = parseInt(searchParams.get("page") || "0", 10);
    const initialKeyword = searchParams.get("keyword") || "";
    const [page, setPage] = useState(initialPage);
    const [keyword, setKeyword] = useState(initialKeyword);

    // 컬럼 순서 정의
    const columnOrder = ['Num', 'code', 'city', 'marketName', 'location', 'tel', 'category'];

    // URL 쿼리 파라미터가 변경되면 상태 업데이트 (뒤로가기/앞으로가기 대응)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlPage = parseInt(params.get("page") || "0", 10);
        const urlKeyword = params.get("keyword") || "";
        
        if (urlPage !== page) {
            setPage(urlPage);
        }
        if (urlKeyword !== keyword) {
            setKeyword(urlKeyword);
        }
    }, [location.search]);

    useEffect(() => {
        fetchMarketData();
    }, []);

    useEffect(() => {
        let temp = allMarket;

        // 검색어로 필터링
        if (keyword.trim()) {
            temp = temp.filter(market => {
                // 모든 필드에서 검색어 찾기
                return Object.values(market).some(value => 
                    value && value.toString().toLowerCase().includes(keyword.toLowerCase())
                );
            });
        }

        // 전체 페이지 수 계산
        const total = Math.ceil(temp.length / size);
        setTotalPage(total > 0 ? total : 1);

        // 현재 페이지에 해당하는 데이터만 추출
        const startIndex = page * size;
        const endIndex = startIndex + size;
        const paginatedData = temp.slice(startIndex, endIndex);
        
        setFilteredMarket(paginatedData)
    }, [allMarket, page, size, keyword]);

    // 컬럼을 지정된 순서로 정렬하는 함수
    const sortColumns = (keys) => {
        const sortedKeys = [];
        const remainingKeys = [...keys];

        // 지정된 순서대로 컬럼 추가
        columnOrder.forEach(orderKey => {
            const foundIndex = remainingKeys.findIndex(key => 
                key.toLowerCase() === orderKey.toLowerCase()
            );
            if (foundIndex >= 0) {
                sortedKeys.push(remainingKeys[foundIndex]);
                remainingKeys.splice(foundIndex, 1);
            }
        });

        // 나머지 컬럼들 추가
        return [...sortedKeys, ...remainingKeys];
    };

    const fetchMarketData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('http://localhost:8080/api/market/list');
            
            const data = await response.json();
            
            if (!response.ok) {
                // 서버에서 반환한 에러 메시지 사용
                const errorMessage = data.error || data.message || '시장 정보를 불러오는데 실패했습니다.';
                throw new Error(errorMessage);
            }
            console.log(data);
            
            setMarketList(data);
            setAllMarket(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching market data:', err);
        } finally {
            setLoading(false);
        }
    };

    // 🔹 검색 버튼 클릭 시: 페이지를 0으로 돌려서 첫 페이지부터 검색
    const handleSearch = () => {
        const params = new URLSearchParams();
        params.set("page", "0");
        
        if (keyword && keyword.trim() !== "") {
            params.set("keyword", keyword.trim());
        }
        
        setPage(0);
        navigate({
            pathname: location.pathname,
            search: params.toString(),
        });
    };

    // 페이지 변경 핸들러
    const handlePageChange = (newPage) => {
        const params = new URLSearchParams(location.search);
        params.set("page", newPage);

        if (keyword && keyword.trim() !== "") {
            params.set("keyword", keyword.trim());
        } else {
            params.delete("keyword");
        }

        setPage(newPage);
        navigate({
            pathname: location.pathname,
            search: params.toString(),
        });
    };

    return (
        <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <style>{responsiveStyles}</style>
            {/* Page Header */}
            <div className="container-fluid page-header wow fadeIn" data-wow-delay="0.1s">
                <div className="container">
                    <h1 className="display-3 mb-3 animated slideInDown" style={{ marginRight: '300px' }}>
                        시장 정보
                    </h1>
                    <nav aria-label="breadcrumb animated slideInDown">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><a className="text-body" href="/">홈페이지</a></li>
                            <li className="breadcrumb-item"><a className="text-body" href="#">판매정보</a></li>
                            <li className="breadcrumb-item text-dark active" aria-current="page">시장 정보</li>
                        </ol>
                    </nav>
                </div>
            </div>

            {/* Market Section */}
            <div className="container-xxl py-6" style={{ width: '100%', maxWidth: '100%', paddingLeft: '15px', paddingRight: '15px' }}>
                <div 
                    className="section-header text-center mx-auto mb-5 wow fadeInUp" 
                    data-wow-delay="0.1s"
                    style={{ maxWidth: "700px", width: '100%'}}
                >
                    <h1 className="display-5 mb-3" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>시장 정보</h1>
                    <p>다양한 시장을 탐색해보세요.</p>
                </div>

                <div className="container py-5">
                    {/* 🔹 검색 + 버튼 바 */}
                    <div className="notice-toolbar">
                        <div className="notice-search-wrap">
                            <input
                            type="text"
                            className="notice-search-input"
                            placeholder="검색어를 입력하세요"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSearch();
                            }}
                            />
                        </div>

                        {/* <div className="notice-toolbar-actions">
                            <button
                            className="btn btn-outline-primary"
                            onClick={handleSearch}
                            >
                            검색
                            </button>
                        </div> */}
                    </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <p>로딩 중...</p>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger" role="alert" style={{ margin: '20px' }}>
                        {error}
                    </div>
                ) : marketList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px' }}>
                        시장 정보가 없습니다.
                    </div>
                ) : (
                    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table className='table table-hover notice-table mt-3' style={{ minWidth: '800px', width: '100%' }}>
                            <thead>
                                <tr>
                                    {(() => {
                                        // 필터링된 키 목록 가져오기
                                        const filteredKeys = Object.keys(filteredMarket[0] || {})
                                            .filter(key => key.toLowerCase() !== 'site' && key.toLowerCase() !== 'province');
                                        
                                        // 지정된 순서로 정렬
                                        const sortedKeys = sortColumns(filteredKeys);
                                        
                                        return sortedKeys.map((key, index) => (
                                            <th 
                                                key={index} 
                                                className="admin-th" 
                                                style={{ minWidth: '100px', textAlign: 'center' }}
                                            >
                                                {key === 'Num' && 'No.'}
                                                {key === 'code' && '시장코드'}
                                                {key === 'city' && '지역'}
                                                {key === 'marketName' && '시장명'}
                                                {key === 'location' && '상세 주소'}
                                                {key === 'tel' && '전화번호'}
                                                {key === 'category' && '구분'}
                                            </th>
                                        ));
                                    })()}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMarket.map((market, index) => {
                                    // 시장명 필드 찾기 (다양한 필드명 지원)
                                    const code = market.code || market['code'] || Object.values(market)[0];
                                    
                                    // 필터링된 키 목록 가져오기
                                    const filteredKeys = Object.keys(market).filter(key => key.toLowerCase() !== 'site' && key.toLowerCase() !== 'province');
                                    
                                    // 지정된 순서로 정렬
                                    const sortedKeys = sortColumns(filteredKeys);
                                    
                                    return (
                                        <tr 
                                            key={index}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => {
                                                if (code) {
                                                    // 상세페이지로 이동할 때 현재 페이지와 키워드 정보 전달
                                                    navigate(`/marketdetail/${encodeURIComponent(code)}`, {
                                                        state: { 
                                                            returnPage: page, 
                                                            returnKeyword: keyword 
                                                        }
                                                    });
                                                }
                                            }}
                                        >
                                            {sortedKeys.map((key, valueIndex) => (
                                                <td 
                                                    key={valueIndex} 
                                                    className="admin-td"
                                                    style={{ 
                                                        maxWidth: '200px', 
                                                        overflow: 'hidden', 
                                                        textOverflow: 'ellipsis', 
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {market[key] || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination
                    page={page}
                    totalPages={totalPage}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
        </div>
    );
};

export default Market;
