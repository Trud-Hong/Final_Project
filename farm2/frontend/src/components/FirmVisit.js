// src/components/FirmVisit.jsx
import React from 'react';

const FirmVisit = () => {
    return (
        <div className="container-fluid bg-primary bg-icon mt-5 py-6">
        <div className="container">
            <div className="row g-5 align-items-center">
            <div className="col-md-7 wow fadeIn" data-wow-delay="0.1s">
                <h1 className="display-5 text-white mb-3">농산물 직거래 정보</h1>
                <p className="text-white mb-0">농산물 직거래는 소비자와 생산자가 직접 만나 거래하는 방식으로, 신선한 농산물을 저렴하게 구매하고 농민은 유통 마진 없이 더 나은 수입을 얻는 장점이 있습니다. Farm직거래 플랫폼이나 로컬푸드 직매장 등 다양한 채널을 통해 정보를 얻을 수 있습니다. </p>
            </div>
            <div className="col-md-5 text-md-end wow fadeIn" data-wow-delay="0.5s">
                <a className="btn btn-lg btn-secondary rounded-pill py-3 px-5" href="/sellerinfo">방문하기</a>
            </div>
            </div>
        </div>
        </div>
    );
};

export default FirmVisit;