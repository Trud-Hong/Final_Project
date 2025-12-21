import React, { useEffect, useState } from 'react';
import "../styles/sellerBlog.css";

const regions = [
    "전체","서울가락", "서울강서", "부산엄궁", "부산국제수산","부산반여","대구북부",
    "인천남촌", "인천삼산", "광주각화","광주서부","대전오정", "대전노은",
    "수원", "안양", "안산", "구리", "춘천", "원주", "강릉", "청주", "충주", "천안",
    "전주", "익산", "정읍", "순천", "포항", "안동", "구미", "창원팔용", "울산",
    "창원내서", "진주"
];

const categories = ["전체", "채소", "과일", "곡물&기타"];

const Blog = () => {

    const [sellerList, setSellerList] = useState([]);
    const [openRegion, setOpenRegion] = useState(false);
    const [openCategory, setOpenCategory] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState("전체");
    const [selectedCategory, setSelectedCategory] = useState("전체");

    useEffect(() => {
        fetch("http://localhost:8080/seller/list")
            .then(res => res.json())
            .then(data => {
                setSellerList(data);
            })
            .catch(err => console.error(err));
    }, []);

    const renderSeller = (list) => {
        return list.map((item) => (
            <div 
                key={item.id}
                className="seller-card wow fadeInUp"
                style={{borderRadius: 0}}
                data-wow-delay="0.1s"
                onClick={() => window.location.href = `/seller/${item.id}`}
            >
                <div className="seller-img-box">
                    {item.image ? (
                        <img
                            src={`data:image/jpeg;base64,${item.image}`}
                            alt={item.farmName}
                        />
                    ) : (
                        <img src="/img/Img_none2.jpg" alt="no-img" />
                    )}
                </div>

                <div className="seller-info">
                    <h5 className="mb-3 fw-bold">{item.farmName}</h5>
                    <span>판매 품목: {item.category}</span>
                    <div className="border-top pt-1">
                        <div className="info-row">
                        <i className="fa fa-user"></i>
                        <span className="label">판매자 이름</span>
                        <span className="value">{item.sellerName}</span>
                      </div>

                      <div className="info-row">
                        <i className="fa fa-phone"></i>
                        <span className="label">연락처</span>
                        <span className="value">{item.phone}</span>
                      </div>

                      <div className="info-row">
                        <i className="fa fa-map-marker"></i>
                        <span className="label">농장 주소</span>
                        <span className="value long-text">{item.address}</span>
                      </div>
                    </div>
                </div>
            </div>
        ));
    };

    const filteredSellers = sellerList.filter((seller) => {
        const matchRegion = selectedRegion === "전체" || seller.location === selectedRegion;
        const matchCategory = selectedCategory === "전체" || seller.category === selectedCategory;
        return matchRegion && matchCategory;
    });

    return (
        <div>
            <div className="container-fluid page-header wow fadeIn" data-wow-delay="0.1s">
                <div className="container">
                    <h1 className="display-3 mb-3 animated slideInDown" style={{ marginRight: '300px' }}>
                        판매자
                    </h1>
                    <nav aria-label="breadcrumb animated slideInDown">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><a className="text-body" href="/">홈페이지</a></li>
                            <li className="breadcrumb-item"><a className="text-body" href="#">판매정보</a></li>
                            <li className="breadcrumb-item text-dark active" aria-current="page">판매자</li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="container-xxl py-6">
                <div className="container">

                    <div className="section-header text-center mx-auto mb-5 wow fadeInUp" data-wow-delay="0.1s" style={{ maxWidth: '500px' }}>
                        <h1 className="display-5 mb-3">판매자 정보</h1>
                        <p>지역과 품목을 선택하여 원하는 판매자를 찾아보세요.</p>
                    </div>

                    <div className="filter-bar d-flex justify-content-center gap-3 mb-4">

  {/* 지역 선택 */}
  <div className="filter-item">
    <div className='ch'>시장선택</div>
    <button 
      className={`filter-btn ${openRegion ? "active" : ""}`}
      onClick={() => {
        setOpenRegion(!openRegion);
        setOpenCategory(false); // 다른 필터 닫기
      }}
    >
       {selectedRegion}
    </button>

    {openRegion && (
      <div className="filter-dropdown">
        {regions.map((r) => (
          <div
            key={r}
            className="filter-option"
            onClick={() => {
              setSelectedRegion(r);
              setOpenRegion(false);
            }}
          >
            {r}
          </div>
        ))}
      </div>
    )}
  </div>

  {/* 품목 선택 */}
  <div className="filter-item">
    <div className='ch'>품목선택</div>
    <button 
      className={`filter-btn ${openCategory ? "active" : ""}`}
      onClick={() => {
        setOpenCategory(!openCategory);
        setOpenRegion(false); // 다른 필터 닫기
      }}
    >
       {selectedCategory}
    </button>

    {openCategory && (
      <div className="filter-dropdown">
        {categories.map((c) => (
          <div
            key={c}
            className="filter-option"
            onClick={() => {
              setSelectedCategory(c);
              setOpenCategory(false);
            }}
          >
            {c}
          </div>
        ))}
      </div>
    )}
  </div>
</div>

                    <div className="seller-grid">
                      {renderSeller(filteredSellers)}
                    </div>

                </div>
            </div>

            <a href="#" className="btn btn-lg btn-primary btn-lg-square rounded-circle back-to-top">
                <i className="bi bi-arrow-up"></i>
            </a>
        </div>
    );
};

export default Blog;
