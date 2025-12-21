import React from 'react';
import { FaXTwitter, FaFacebookF, FaLinkedinIn, FaInstagram } from "react-icons/fa6";

const Footer = () => {
    return (
        <div className="container-fluid bg-dark footer pt-1 wow"style={{ marginTop: 'auto' }}>
        <div className="container py-5">
            <div className="row g-5">
            <div className="col-lg-3 col-md-6">
                {/* <h1 className="fw-bold text-primary mb-4">F<span className="text-secondary">ar</span>m</h1> */}
                <img src="/img/Farm_Footer.png" alt="Logo" style={{ width: "100px", height: "auto" }} />
                <p>농산물 직거래 사이트! 농사팜.</p>
                <div className="d-flex pt-2 justify-content-center">
                    <a className="text-body mx-3" href="https://www.facebook.com/"><FaFacebookF /></a>
                    <a className="text-body mx-3" href="https://x.com/"><FaXTwitter /></a>
                    <a className="text-body mx-3" href="https://kr.linkedin.com/"><FaLinkedinIn /></a>
                    <a className="text-body mx-3" href="https://www.instagram.com/"><FaInstagram /></a>
                </div>
            </div>
            <div className="col-lg-3 col-md-6">
                <h4 className="text-light mb-4">주소</h4>
                <p><i className="fa fa-map-marker-alt me-3"></i>수원시 인계동 휴먼IT교육</p>
                <p><i className="fa fa-phone-alt me-3"></i>+012 345 67890</p>
                <p><i className="fa fa-envelope me-3"></i>farm@example.com</p>
            </div>
            <div className="col-lg-6 col-md-12">
                <h4 className="text-light mb-2" style={{ 
                    textAlign: 'center', 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold',
                    marginBottom: '20px'
                }}>바로가기</h4>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-around',
                    gap: '10px',
                    color: 'white'
                }}>
                    {/* 왼쪽 열 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a className="btn btn-link" href="/contact" style={{ 
                                color: 'white', 
                                textDecoration: 'none',
                                padding: 0,
                                fontSize: '0.9rem'
                            }}>고객센터</a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a className="btn btn-link" href="/about" style={{ 
                                color: 'white', 
                                textDecoration: 'none',
                                padding: 0,
                                fontSize: '0.9rem'
                            }}>가격 추세</a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a className="btn btn-link" href="/predict" style={{ 
                                color: 'white', 
                                textDecoration: 'none',
                                padding: 0,
                                fontSize: '0.9rem'
                            }}>AI 가격 예측</a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a className="btn btn-link" href="/products" style={{ 
                                color: 'white', 
                                textDecoration: 'none',
                                padding: 0,
                                fontSize: '0.9rem'
                            }}>농산물 직거래</a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a className="btn btn-link" href="/sellerinfo" style={{ 
                                color: 'white', 
                                textDecoration: 'none',
                                padding: 0,
                                fontSize: '0.9rem'
                            }}>판매자</a>
                        </div>
                    </div>
                    {/* 오른쪽 열 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a className="btn btn-link" href="/feature" style={{ 
                                color: 'white', 
                                textDecoration: 'none',
                                padding: 0,
                                fontSize: '0.9rem'
                            }}>농산물 정보</a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a className="btn btn-link" href="/sns" style={{ 
                                color: 'white', 
                                textDecoration: 'none',
                                padding: 0,
                                fontSize: '0.9rem'
                            }}>커뮤니티</a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a className="btn btn-link" href="/notice" style={{ 
                                color: 'white', 
                                textDecoration: 'none',
                                padding: 0,
                                fontSize: '0.9rem'
                            }}>시장 정보</a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a className="btn btn-link" href="/notice" style={{ 
                                color: 'white', 
                                textDecoration: 'none',
                                padding: 0,
                                fontSize: '0.9rem'
                            }}>공지사항</a>
                        </div>
                    </div>
                </div>
            </div>
            {/* <div className="col-lg-3 col-md-6">
                <h4 className="text-light mb-4">Newsletter</h4>
                <p>Dolor amet sit justo amet elitr clita ipsum elitr est.</p>
                <div className="position-relative mx-auto" style={{maxWidth: '400px'}}>
                <input className="form-control bg-transparent w-100 py-3 ps-4 pe-5" type="text" placeholder="Your email" />
                <button type="button" className="btn btn-primary py-2 position-absolute top-0 end-0 mt-2 me-2">SignUp</button>
                </div>
            </div> */}
            </div>
        </div>
        <div className="container-fluid copyright">
            <div className="container">
            <div className="row">
                <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
                &copy; <a href="#">Farm</a>, All Right Reserved.
                </div>
                <div className="col-md-6 text-center text-md-end">
                코딩보이즈
                </div>
            </div>
            </div>
        </div>
        </div>
    );
};

export default Footer;