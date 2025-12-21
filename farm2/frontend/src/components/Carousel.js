// src/components/Carousel.jsx
import React from 'react';

const Carousel = () => {
    return (
        <div className="container-fluid p-0 mb-5 wow fadeIn" data-wow-delay="0.1s">

        <div id="header-carousel" className="carousel slide" data-bs-ride="carousel">

            <div className="carousel-inner">
                
            <div className="carousel-item active">
                <img className="w-100" src="/img/carousel-1.jpg" alt="Image" style={{height: "650px", objectFit: "cover", objectPosition: "bottom"}}/>
                <div className="carousel-caption">
                <div className="container">
                    <div className="row justify-content-start">
                    <div className="col-lg-7">
                        <h3 className="display-2 mb-5 animated slideInDown">신선한 농산물의 가격 정보를 확인하세요!</h3>
                        <a href="/about" className="btn btn-primary rounded-pill py-sm-3 px-sm-5">바로가기</a>
                        <a href="/contact" className="btn btn-secondary rounded-pill py-sm-3 px-sm-5 ms-3">고객센터</a>
                    </div>
                    </div>
                </div>
                </div>
            </div>

            <div className="carousel-item">
                <img className="w-100" src="/img/carousel-2.jpg" alt="Image" style={{height: "650px", objectFit: "cover", objectPosition: "bottom"}}/>
                <div className="carousel-caption">
                <div className="container">
                    <div className="row justify-content-start">
                    <div className="col-lg-7">
                        <h3 className="display-2 mb-5 animated slideInDown">제철을 맞이한 특산품 판매중!</h3>
                        <a href="/products" className="btn btn-primary rounded-pill py-sm-3 px-sm-5">바로가기</a>
                        <a href="/contact" className="btn btn-secondary rounded-pill py-sm-3 px-sm-5 ms-3">고객센터</a>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </div>

            <button className="carousel-control-prev" type="button" data-bs-target="#header-carousel" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Previous</span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#header-carousel" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Next</span>
            </button>
        </div>
        </div>
    );
};

export default Carousel;