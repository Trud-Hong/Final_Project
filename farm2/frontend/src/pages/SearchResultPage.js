import React from 'react';
import SearchResult from '../components/SearchResult';
import { useSearchParams } from 'react-router-dom';

const SearchResultPage = () => {

    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('keyword') || '';

    return (
        <div>
            <div className="container-fluid page-header mb-5 wow fadeIn" data-wow-delay="0.1s">
                <div className="container">
                    <h3 className="display-3 mb-3 animated slideInDown" style={{marginRight:'300px'}}>{`'${searchQuery}' 검색 결과`}</h3>
                    <nav aria-label="breadcrumb animated slideInDown">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><a className="text-body" href="/">홈페이지</a></li>
                            <li className="breadcrumb-item text-dark active" aria-current="page">검색 결과</li>
                        </ol>
                    </nav>
                </div>
            </div>
            {/* <!-- Page Header End --> */}

            <SearchResult />


        </div>
    );
};

export default SearchResultPage;