import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MainBlog.css";

const BlogItem = ({ 
    imageUrl, 
    farmName, 
    sellerName, 
    category, 
    location, 
    address, 
    phone,
    startDate,
    sellerId 
}) => (
     <div className="col-md-3 d-flex justify-content-center">
        <div 
            className="main-card main-card-small"
            data-wow-delay="0.1s"
            onClick={() => window.location.href = `/seller/${sellerId}`}
            style={{ cursor: "pointer" }}
        >
            {/* 이미지 */}
            <div className="main-img-box">
                <img src={imageUrl || "/img/no-image.png"} alt={farmName} />
            </div>

            {/* 내용 */}
            <div className="main-info">
                <h6 className="fw-bold">{farmName}</h6>
                <span style={{fontSize:"13px"}}>판매 품목: {category}</span>

                <div className="border-top pt-2 mt-2">

                    <div className="main-info-row">
                        <i className="fa fa-user"></i>
                        <span className="main-label">판매자 이름</span>
                        <span className="main-value">{sellerName}</span>
                    </div>

                    <div className="main-info-row">
                        <i className="fa fa-phone"></i>
                        <span className="main-label">연락처</span>
                        <span className="main-value">{phone}</span>
                    </div>

                    <div className="main-info-row">
                        <i className="fa fa-map-marker"></i>
                        <span className="main-label">농장 주소</span>
                        <span className="main-value">{address}</span>
                    </div>

                    <div className="main-info-row">
                        <i className="fa fa-calendar"></i>
                        <span className="main-label">판매 등록일</span>
                        <span className="main-value">{startDate}</span>
                    </div>

                </div>
            </div>

        </div>
    </div>
);



const Blog = () => {
    const [blogs, setBlogs] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:8080/api/stores/recommend")
            .then(res => {
                setBlogs(res.data);
            })
            .catch(err => console.error(err));
    }, []);

    // 4개씩 묶기
    const chunked = [];
    for (let i = 0; i < blogs.length; i += 4) {
        chunked.push(blogs.slice(i, i + 4));
    }

    return (
        <div className="container-xxl py-5">
            <div className="container">
                <div className="section-header text-center mx-auto mb-5">
                    <h1 className="display-5 mb-3">추천! 오늘의 가게</h1>
                    <p>농사팜에서 추천하는 오늘의 가게!</p>
                </div>

                <div id="blogCarousel" className="carousel slide" data-bs-ride="carousel">
                    <div className="carousel-inner">
                        {chunked.map((group, idx) => (
                            <div
                                className={`carousel-item ${idx === 0 ? "active" : ""}`}
                                style={{marginTop: '10px', marginBottom: '10px'}} 
                                key={idx}
                            >
                                <div className="row justify-content-center">
                                    {group.map((blog, index) => (
                                        <BlogItem
                                            key={index}
                                            imageUrl={blog.imageUrl}
                                            farmName={blog.farmName}
                                            sellerName={blog.sellerName}
                                            sellerId={blog.sellerId}
                                            category={blog.category}
                                            location={blog.location}
                                            address={blog.address}
                                            startDate={blog.startDate}
                                            phone={blog.phone}
                                        />

                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="carousel-control-prev" type="button" data-bs-target="#blogCarousel" data-bs-slide="prev">
                        <span className="carousel-control-prev-icon"></span>
                    </button>
                    <button className="carousel-control-next" type="button" data-bs-target="#blogCarousel" data-bs-slide="next">
                        <span className="carousel-control-next-icon"></span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Blog;
