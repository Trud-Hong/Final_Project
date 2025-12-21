// src/components/Products.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Products.css";

// 캐러셀
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";


// -------------------------
// 제철 농산물 카드 디자인 버전
// -------------------------
const SeasonalProductItem = ({ product, isSlider }) => {
  const navigate = useNavigate();

  const discounted =
    product.discountRate &&
    (!product.discountStart || !product.discountEnd ||
      (new Date() >= new Date(product.discountStart) &&
        new Date(product.discountEnd) >= new Date()));

  const discountedPrice = discounted
    ? Math.round(product.price * (100 - product.discountRate) / 100)
    : product.price;

  // 캐러셀 안에서는 col-클래스 제거
  const wrapperClass = isSlider
    ? "mb-4" // 슬라이더일 때는 단순 마진만
    : "col-xl-3 col-lg-4 col-md-6 mb-4"; // 기존 그리드일 때

  return (
    <div className={wrapperClass}>
      <div className="product-item border rounded shadow-sm overflow-hidden">
        {/* 이미지 */}
        <div
          className="position-relative bg-light overflow-hidden"
          onClick={() => navigate(`/products/detail/${product.id}`)}
          style={{ cursor: "pointer" }}
        >
          <img
            className="img-fluid w-100"
            src={
              product.mainImage?.startsWith("http")
                ? product.mainImage
                : `http://localhost:8080${product.mainImage}`
            }
            alt={product.name}
            style={{ height: "250px", objectFit: "cover" }}
          />

          {discounted && (
            <div className="bg-warning rounded text-white position-absolute end-0 top-0 m-3 py-1 px-3 fw-bold">
              {product.discountRate}% 할인
            </div>
          )}

          {product.stock === 0 && (
            <div className="bg-dark rounded text-white position-absolute start-50 translate-middle-x bottom-0 m-3 py-1 px-3 fw-bold">
              품절
            </div>
          )}
        </div>
                {/* 내용 */}
                <div className="text-center p-3">
                    <h5
                        className="mb-2"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/products/detail/${product.id}`)}
                    >
                        {product.name}
                    </h5>

                    {discounted ? (
                        <>
                            <div className="text-danger fw-bold">{discountedPrice.toLocaleString()}원</div>
                            <div className="text-muted text-decoration-line-through">{product.price.toLocaleString()}원</div>
                        </>
                    ) : (
                        <div className="text-primary fw-bold">{product.price.toLocaleString()}원</div>
                    )}

                    <div style={{ fontSize: "13px", color: "#666" }}>
                        재고:{" "}
                        {product.stock === 0 ? (
                            <span className="text-danger">품절</span>
                        ) : (
                            <span className="text-success">{product.stock}{product.unit}</span>
                        )}
                    </div>
                </div>

                {/* 버튼 영역 */}
                <div className="d-flex border-top">
                    <div
                        className="w-50 text-center border-end py-2 text-body"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/products/detail/${product.id}`)}
                    >
                        <i className="fa fa-eye text-primary me-2"></i>상세보기
                    </div>

                    {/* 찜하기 버튼 */}
                    <div
                        className="w-50 text-center py-2 text-body"
                        style={{ cursor: "pointer" }}
                        onClick={async () => {
                            const userId = localStorage.getItem("userId");
                            if (!userId) {
                                alert("로그인이 필요합니다.");
                                navigate("/login");
                                return;
                            }

                            try {
                                await axios.post("http://localhost:8080/api/wishlist/add", {
                                    userId,
                                    productId: product.id,
                                });
                                alert("찜 목록에 추가되었습니다!");
                            } catch (err) {
                                console.error(err);
                                alert("찜 추가 실패");
                            }
                        }}
                    >
                        <i className="fa fa-shopping-bag text-primary me-2"></i>찜하기
                    </div>
                </div>
            </div>
        </div>
    );
};

//캐러셀
const SeasonalList = ({ items, emptyText }) => {
  if (!items || items.length === 0) {
    return <p className="text-center py-5">{emptyText}</p>;
  }

  // 4개 이하이면 기존처럼 그리드
  if (items.length <= 4) {
    return (
      <div className="row g-4">
        {items.map((p) => (
          <SeasonalProductItem key={p.id} product={p} />
        ))}
      </div>
    );
  }

  // 5개 이상이면 캐러셀
  const settings = {
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true,
    dots: false,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 3 } },
      { breakpoint: 992,  settings: { slidesToShow: 2 } },
      { breakpoint: 576,  settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <Slider {...settings} className="seasonal-slider">
      {items.map((p) => (
        <SeasonalProductItem key={p.id} product={p} isSlider />
      ))}
    </Slider>
  );
};




const Products = () => {
  const [seasonal, setSeasonal] = useState([]); // 전체 제철 상품 저장

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/products/seasonal")
      .then((res) => {
        console.log("seasonal API response:", res.data);
        if (Array.isArray(res.data)) {
          setSeasonal(res.data);
        } else {
          setSeasonal([]);
        }
      })
      .catch((err) => console.error("API error:", err));
  }, []);

  const vegetables = seasonal.filter((p) => p.categoryType === "vegetable");
  const fruits = seasonal.filter((p) => p.categoryType === "fruit");
  const grains = seasonal.filter((p) => p.categoryType === "grain");

  return (
    <div className="container-xxl py-5">
      <div className="container">
        <div className="row g-0 gx-5 align-items-end">
          <div className="col-lg-6">
            <div
              className="section-header text-start mb-5 wow fadeInUp"
              data-wow-delay="0.1s"
              style={{ maxWidth: "500px" }}
            >
              <h1 className="display-5 mb-3">제철 농산물</h1>
              <p>요즘 제철인 농산물을 확인해보세요!</p>
            </div>
          </div>

          <div
            className="col-lg-6 text-start text-lg-end wow slideInRight"
            data-wow-delay="0.1s"
          >
            <ul className="nav nav-pills d-inline-flex justify-content-end mb-5">
              <li className="nav-item me-2">
                <a
                  className="btn btn-outline-primary border-2 active"
                  data-bs-toggle="pill"
                  href="#tab-vegetable"
                >
                  채소
                </a>
              </li>
              <li className="nav-item me-2">
                <a
                  className="btn btn-outline-primary border-2"
                  data-bs-toggle="pill"
                  href="#tab-fruit"
                >
                  과일
                </a>
              </li>
              <li className="nav-item me-0">
                <a
                  className="btn btn-outline-primary border-2"
                  data-bs-toggle="pill"
                  href="#tab-grain"
                >
                  곡물
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 탭 내용 */}
        <div className="tab-content">

          {/* 채소 */}
          <div id="tab-vegetable" className="tab-pane fade show active p-0">
             <SeasonalList
    items={vegetables}
    emptyText="제철 채소가 없습니다."
  />
          </div>

          {/* 과일 */}
          <div id="tab-fruit" className="tab-pane fade p-0">
            <SeasonalList
    items={fruits}
    emptyText="제철 과일이 없습니다."
  />
          </div>

          {/* 곡물 */}
          <div id="tab-grain" className="tab-pane fade p-0">
            <SeasonalList
    items={grains}
    emptyText="제철 곡물이 없습니다."
  />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
