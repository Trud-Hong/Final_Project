// src/components/Features.jsx
import React from 'react';

const Features = () => {
    return (
        <div className="container-fluid bg-light bg-icon my-5 py-6">
        <div className="container">
            <div className="section-header text-center mx-auto mb-5 wow fadeInUp" data-wow-delay="0.1s" style={{maxWidth: '500px'}}>
            <h1 className="display-5 mb-3">건강정보</h1>
            <p>친환경 농산물이 일반 농산물보다 더 많은 파이토케미컬을 함유하여 항염증, 혈당 조절, 암 예방 등에 도움을 줄 수 있으며, 로컬푸드는 신선도를 높이고 지역 경제 활성화에 기여하는 이점이 있습니다 </p>
            </div>
            <div className="row g-4">
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
                <div className="bg-white text-center h-100 p-4 p-xl-5">
                <img className="img-fluid mb-4" src="/img/icon-1.png" alt="" />
                <h4 className="mb-3">유기농 농산물</h4>
                <p className="mb-4">섭취 시 체내 농약 성분 노출을 줄일 수 있고, 일부 연구에서는 항산화 성분이 더 풍부합니다.</p>
                <a className="btn btn-outline-primary border-2 py-2 px-4 rounded-pill" href="/feature">더보기</a>
                </div>
            </div>
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
                <div className="bg-white text-center h-100 p-4 p-xl-5">
                <img className="img-fluid mb-4" src="/img/icon-2.png" alt="" />
                <h4 className="mb-3">제철 농산물</h4>
                <p className="mb-4">영양분과 맛이 풍부하고, 항산화 물질과 비타민 등 유익한 성분이 많아 건강에 좋습니다.</p>
                <a className="btn btn-outline-primary border-2 py-2 px-4 rounded-pill" href="/feature">더보기</a>
                </div>
            </div>
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.5s">
                <div className="bg-white text-center h-100 p-4 p-xl-5">
                <img className="img-fluid mb-4" src="/img/icon-3.png" alt="" />
                <h4 className="mb-3">로컬푸드</h4>
                <p className="mb-4">신선하고 맛과 영양이 우수하며, 생산자와 소비자 모두에게 이익을 줄 수 있습니다. </p>
                <a className="btn btn-outline-primary border-2 py-2 px-4 rounded-pill" href="/feature">더보기</a>
                </div>
            </div>
            </div>
        </div>
        </div>
    );
};

export default Features;