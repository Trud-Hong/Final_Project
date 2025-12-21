// src/pages/Home.jsx
import React, { useEffect } from 'react';
import Carousel from '../components/Carousel';
import Features from '../components/Features';
import Products from '../components/Products';
import FirmVisit from '../components/FirmVisit';
import Testimonial from '../components/Testimonial';
import Blog from '../components/Blog';
import BacktoTop from '../components/BacktoTop';
import PriceTrend from '../components/PriceTrend';

const Home = () => {
    useEffect(() => {
        // Bootstrap 초기화
        const bootstrap = require('bootstrap/dist/js/bootstrap.bundle.min');
        
        // WOW.js 애니메이션 초기화
        if (window.WOW) {
        new window.WOW().init();
        }

        // jQuery 및 Owl Carousel 로드 확인
        const checkLibraries = setInterval(() => {
        if (window.$ && window.$.fn.owlCarousel) {
            clearInterval(checkLibraries);
        }
        }, 100);

        return () => clearInterval(checkLibraries);
    }, []);

    return (
        <>
        <Carousel />
        <PriceTrend />
        <Features />
        <Products />
        <FirmVisit />
        <Testimonial />
        <Blog />
        </>
    );
};

export default Home;