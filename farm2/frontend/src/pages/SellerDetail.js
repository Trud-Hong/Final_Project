import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/SellerDetail.css";

const SellerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [sortOption, setSortOption] = useState("latest");
  const [sellerReviews, setSellerReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [editingReview, setEditingReview] = useState(null);

  const isAdmin = localStorage.getItem("role") === "ROLE_ADMIN";

  const sellerImage = seller?.image
  ? `data:image/jpeg;base64,${seller.image}`
  : "/img/no-image.png";

  const sellerFarmName = seller?.farmName || "농장 정보 없음";
  const sellerName = seller?.sellerName || "판매자 정보 없음";


  // -------------------------------
  // 판매자 상세 조회
  // -------------------------------
  useEffect(() => {
    fetch(`http://localhost:8080/seller/${id}`)
      .then((res) => res.json())
      .then((data) => setSeller(data))
      .catch((err) => console.error(err));
  }, [id]);

  // -------------------------------
  // 판매자 등록 상품 조회
  // -------------------------------
  useEffect(() => {
    if (!seller) return;

    const sellerKey = seller.userId; // DB 저장 기준

    fetch(`http://localhost:8080/products/seller/${sellerKey}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("판매자 상품:", data);

        if (Array.isArray(data)) setSellerProducts(data);
        else if (data?.data && Array.isArray(data.data)) setSellerProducts(data.data);
        else setSellerProducts([]);
      })
      .catch((err) => console.error(err));
  }, [seller]);

  useEffect(() => {
  if (!seller) return;

  fetch(`http://localhost:8080/api/reviews/seller/${seller.userId}`)
    .then(res => res.json())
    .then(data => {
      console.log("📌 리뷰 데이터:", data); // ★ 여기 중요

      if (Array.isArray(data)) {
        setSellerReviews(data);
      } else if (data?.data && Array.isArray(data.data)) {
        // {"data":[...]} 형태
        setSellerReviews(data.data);
      } else {
        setSellerReviews([]); // 배열 아님 → 빈 배열
      }

      // 평균 별점 계산
      const list = Array.isArray(data) ? data :
                   Array.isArray(data?.data) ? data.data : [];

      if (list.length > 0) {
        const avg = list.reduce((sum, r) => sum + r.rating, 0) / list.length;
        setAverageRating(avg);
      }
    })
    .catch(err => console.error(err));
}, [seller]);



  if (!seller) return <div className="text-center my-5">로딩 중...</div>;

  const getSortedProducts = () => {
  let sorted = [...sellerProducts];

  switch (sortOption) {
    case "latest":
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case "lowPrice":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "highPrice":
      sorted.sort((a, b) => b.price - a.price);
      break;
    default:
      break;
  }

  return sorted;
};


  // ---------------------------------------------
  // Product.js 카드 UI 그대로 사용하기 위한 함수
  // ---------------------------------------------
  const renderSellerProducts = (list) => {
    const getDiscountedPrice = (price, rate, start, end) => {
      if (!rate) return price;
      // 할인 기간 확인
      if (start && end) {
        const now = new Date();
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (now < startDate || now > endDate) {
          return price; // 할인 기간이 아니면 원가 반환
        }
      }
      return Math.round(price * (100 - rate) / 100);
    };

    const isNewProduct = (createdAt) => {
      if (!createdAt) return false;
      const created = new Date(createdAt);
      const now = new Date();
      const days = (now - created) / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 3;
    };

    const isOnDiscount = (rate, start, end) => {
      if (!rate) return false;
      if (!start || !end) return true;
      const now = new Date();
      return now >= new Date(start) && now <= new Date(end);
    };

    return list.map((item) => {
      const discountedPrice = getDiscountedPrice(item.price, item.discountRate, item.discountStart, item.discountEnd);
      const hasDiscount =
        item.discountRate &&
        isOnDiscount(item.discountRate, item.discountStart, item.discountEnd);
      const isNew = isNewProduct(item.createdAt);

      return (
        <div className="col-xl-3 col-lg-4 col-md-6 wow fadeInUp" 
          key={item.id} 
          onClick={() => navigate(`/products/detail/${item.id}`)}
          >
          <div className="product-item" style={{ cursor: "pointer", border : "1px solid #e0e0e0"}}>
            {/* 이미지 */}
            <div className="position-relative bg-light overflow-hidden">
          <img
            className="seller-product-img"
            src={
              item.mainImage
                ? `http://localhost:8080${item.mainImage}`
                : item.images?.[0]
                ? `http://localhost:8080${item.images[0]}`
                : "/img/no-image.png"
            }
            alt={item.name}
          />
          {hasDiscount && (
            <div className="bg-warning rounded text-white position-absolute end-0 top-0 m-4 py-1 px-3" style={{ fontWeight: 'bold', zIndex: 5 }}>
              {item.discountRate}% 할인
            </div>
          )}
          {item.bulkMinQuantity && item.bulkDiscountRate && (
            <div className="bg-info rounded text-white position-absolute end-0" style={{ 
              fontWeight: 'bold', 
              zIndex: 5,
              fontSize: '12px',
              padding: '4px 8px',
              top: hasDiscount ? '60px' : '16px',
              right: '16px',
              whiteSpace: 'nowrap'
            }}>
              {item.bulkMinQuantity}개 이상 {item.bulkDiscountRate}% 추가
            </div>
          )}
        </div>

            {/* 텍스트 영역 */}
            <div className="text-center p-4">
              <a
                className="d-block h5 mb-2"
                onClick={() => navigate(`/products/detail/${item.id}`)}
                style={{ cursor: "pointer", color: "#333", textDecoration: "none" }}
              >
                {item.name}
              </a>

              {/* 가격 */}
              <div className="mb-2">
                {hasDiscount ? (
                  <>
                    <span
                      className="text-danger fw-bold me-2"
                      style={{ fontSize: "18px" }}
                    >
                      {discountedPrice.toLocaleString()}원
                    </span>
                    <span
                      className="text-muted text-decoration-line-through"
                      style={{ fontSize: "14px" }}
                    >
                      {item.price.toLocaleString()}원
                    </span>
                  </>
                ) : (
                  <span
                    className="text-primary fw-bold"
                    style={{ fontSize: "18px" }}
                  >
                    {item.price.toLocaleString()}원
                  </span>
                )}
              </div>

              {/* 재고 */}
              <div style={{ fontSize: "12px", color: "#666" }}>
                재고:{" "}
                {item.stock === 0 ? (
                  <span className="text-danger fw-bold">품절</span>
                ) : item.stock <= (item.stockWarningThreshold || 10) ? (
                  <span className="text-warning fw-bold">
                    {item.stock}
                    {item.unit} (재고부족)
                  </span>
                ) : (
                  <span className="text-success">
                    {item.stock}
                    {item.unit}
                  </span>
                )}
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="d-flex border-top">
              <small className="w-50 text-center border-end py-2">
                <a
                  className="text-body"
                  onClick={() => navigate(`/products/detail/${item.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <i className="fa fa-eye text-primary me-2"></i>
                  상세보기
                </a>
              </small>

              <small className="w-50 text-center py-2">
                <a className="text-body" style={{ cursor: "pointer" }}>
                  <i className="fa fa-shopping-bag text-primary me-2"></i>찜하기
                </a>
              </small>
            </div>
          </div>
        </div>
      );
    });
  };

  // 리뷰 수정 시작 함수
  const startEditReview = (review) => {
  setEditingReview(review);
  setRating(review.rating);
  setContent(review.content);
  setShowReviewModal(true);
};

  // 리뷰 삭제 함수
const deleteReview = (id) => {
  if (!window.confirm("리뷰를 삭제하시겠습니까?")) return;

  fetch(`http://localhost:8080/api/reviews/${id}`, {
    method: "DELETE",
  })
    .then(() => {
      // 먼저 리스트에서 제거된 결과 만들어주기
      const updatedList = sellerReviews.filter((r) => r.id !== id);

      // 상태 업데이트
      setSellerReviews(updatedList);

      // 평균 별점 즉시 재계산
      const avg =
        updatedList.length === 0
          ? 0
          : updatedList.reduce((sum, r) => sum + r.rating, 0) /
            updatedList.length;

      setAverageRating(avg);
    })
    .catch((err) => console.error("삭제 오류:", err));
};



  // 리뷰 저장 함수
const handleSubmitReview = () => {
  const userId = localStorage.getItem("userId");
  const reviewerNick = localStorage.getItem("nickname");


  if (!userId) {
    alert("로그인이 필요합니다.");
    return;
  }

  if (!content || content.trim() === "") {
    alert("리뷰 내용을 입력해주세요.");
    return;
  }

  const reviewData = {
    sellerUserId: seller.userId,
    reviewerId: userId,
    rating,
    content,
    reviewerNick : reviewerNick,
  };

  // 수정 모드
if (editingReview) {
  fetch(`http://localhost:8080/api/reviews/${editingReview.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reviewData),
  })
    .then((res) => res.json())
    .then((updated) => {

      // 업데이트된 리뷰 리스트 반영
      const updatedList = sellerReviews.map((r) =>
        r.id === updated.id ? updated : r
      );

      setSellerReviews(updatedList);

      // 평균 별점 즉시 재계산
      const avg =
        updatedList.reduce((sum, r) => sum + r.rating, 0) /
        updatedList.length;

      setAverageRating(avg);

      // 모달 닫기 / 수정모드 종료
      setEditingReview(null);
      setShowReviewModal(false);
    })
    .catch((err) => console.error("수정 오류:", err));

  return;
}


  // 작성 모드
fetch("http://localhost:8080/api/reviews", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(reviewData),
})
  .then((res) => res.json())
  .then((newReview) => {

    // 리스트 업데이트
    const updatedList = [...sellerReviews, newReview];
    setSellerReviews(updatedList);

    // 평균 별점 즉시 갱신
    const avg =
      updatedList.reduce((sum, r) => sum + r.rating, 0) /
      updatedList.length;
    setAverageRating(avg);

    // UI 초기화
    setShowReviewModal(false);
    setRating(5);
    setContent("");
  });

};


// 별점 표시 함수
const AvgStarRating = ({ rating }) => {
  return (
    <div className="avg-star-container">
      {Array.from({ length: 5 }, (_, i) => {
        let className = "avg-star";
        if (rating >= i + 1) className += " full";
        

        return <span key={i} className={className}>★</span>;
      })}
    </div>
  );
};



const StarRatingInput = ({ rating, setRating }) => {
  const [hoverValue, setHoverValue] = useState(undefined);

  const handleClick = (value) => {
    setRating(value);
  };

  const handleMouseMove = (value) => {
    setHoverValue(value);
  };

  const displayValue = hoverValue !== undefined ? hoverValue : rating;

  return (
    <div className="input-star-container"
         onMouseLeave={() => setHoverValue(undefined)}>
      {Array.from({ length: 5 }, (_, i) => {
        const value = i + 1;
        let className = "input-star";
        if (displayValue >= value) className += " full";
        else if (displayValue >= value - 0.5) className += " half";

        return (
          <span
            key={i}
            className={className}
            onClick={() => handleClick(value)}
            onMouseMove={(e) => handleMouseMove(value, e)}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};


const ReviewStar = ({ rating }) => {
  return (
    <div className="review-star-container">
      {Array.from({ length: 5 }, (_, i) => {
        let className = "review-star";
        if (rating >= i + 1) className += " full";
        

        return <span key={i} className={className}>★</span>;
      })}
    </div>
  );
};







  // ---------------------------------------------------------------------

  return (
    <div>
      {/* Header */}
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

      {/* 판매자 정보 */}
      <div className="container py-5" style={{ maxWidth: "850px" }}>
        <h1 className="mb-4 text-center fw-bold">{seller.farmName}</h1>

        <div className="card shadow p-4">
          {/* 이미지 */}
          <div className="text-center mb-4">
            {seller.image ? (
              <img
                src={`data:image/jpeg;base64,${seller.image}`}
                alt="seller"
                style={{
                  width: "250px",
                  height: "250px",
                  objectFit: "cover",
                  borderRadius: "15px",
                }}
              />
            ) : (
              <img src="/img/Img_none2.jpg" width="250" alt="no-img" />
            )}
          </div>

          {/* 기본 정보 테이블 */}
          <table className="excel-table">
            <tbody>
              <tr>
                <th>판매자 이름</th>
                <td>{seller.sellerName}</td>
              </tr>
              <tr>
                <th>닉네임</th>
                <td>{seller.nickname}</td>
              </tr>
              <tr>
                <th>연락처</th>
                <td>{seller.phone}</td>
              </tr>
              <tr>
                <th>지역</th>
                <td>{seller.location}</td>
              </tr>
              <tr>
                <th>품목</th>
                <td>{seller.category}</td>
              </tr>
              <tr>
                <th>농장 주소</th>
                <td>{seller.address}</td>
              </tr>
            </tbody>
          </table>

          {/* 소개 */}
          <h4 className="fw-bold mt-4 mb-2">농장 소개</h4>
          <hr />
          <p>{seller.intro || "소개가 없습니다."}</p>

          {/* 계좌 */}
          <hr />
          <table className="excel-table">
            <tbody>
              <tr>
                <th>은행명</th>
                <td>{seller.bank}</td>
              </tr>
              <tr>
                <th>계좌번호</th>
                <td>{seller.accountNumber}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* 판매자가 등록한 상품 */}
        <div className="container-fluid py-5">
          <h3 className="fw-bold mt-5">판매자가 등록한 상품</h3>
          <hr />

          {/* 정렬 옵션 */}
          <div className="d-flex justify-content-end mb-3">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="form-select"
              style={{ width: "180px" }}
            >
              <option value="latest">최신순</option>
              <option value="lowPrice">낮은 가격순</option>
              <option value="highPrice">높은 가격순</option>
            </select>
          </div>


          <div className="row g-4">
            {sellerProducts.length === 0 ? (
              <p className="text-center text-muted">등록된 상품이 없습니다.</p>
            ) : (
              renderSellerProducts(getSortedProducts())
            )}
          </div>
      </div>

      {/* ------------------------------------- */}
{/* 판매자 리뷰 섹션 */}
{/* ------------------------------------- */}

<div className="container review-section" style={{ maxWidth: "900px" }}>
  <h3 className="fw-bold mt-5">판매자 리뷰</h3>
  <hr />

  {/* 평균 별점 줄 */}
  {sellerReviews.length > 0 ? (
    <div className="review-header-top" style={{marginLeft:"280px"}}>
      <AvgStarRating rating={averageRating} />

      <div className="avg-score">{averageRating.toFixed(1)} / 5</div>

      <div className="review-count">총 {sellerReviews.length}개의 리뷰</div>
    </div>
  ) : (
    <p className="text-muted">아직 리뷰가 없습니다.</p>
  )}

  {/* 리뷰 리스트 */}
  <div>
    {sellerReviews.map((review) => (
      <div className="review-item" key={review.id}>
        <div className="review-item-header">
          <span className="review-writer">{review.reviewerNick}</span>
          <ReviewStar rating={review.rating} />
          <span className="review-date">
            {new Date(review.date).toLocaleDateString()}
          </span>
        </div>
        <div className="review-content">{review.content}</div>

        {/* 수정/삭제 버튼 (본인 리뷰만 표시) */}
        {(review.reviewerId === localStorage.getItem("userId") || isAdmin) && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "8px",
              gap: "8px"
            }}
          >
            {review.reviewerId === localStorage.getItem("userId") && (
              <button className="btn btn-sm btn-outline-primary" onClick={() => startEditReview(review)}>수정</button>
            )}
              <button className="btn btn-sm btn-outline-danger" onClick={() => deleteReview(review.id)}>삭제</button>
          </div>
        )}
      </div>
    ))}
  </div>
</div>


{/* 리뷰 작성 */}
<div className="revieWrap">
      <h4 className="review-title">
        {editingReview ? "리뷰 수정" : "리뷰 작성"}
      </h4>

      {/* 별점 입력 */}
      <div className="review-rating-area">
        <StarRatingInput rating={rating} setRating={setRating} />
      </div>

      <textarea
        className="review-textarea"
        placeholder="리뷰 내용을 입력하세요."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="review-btn-area">
        <button className="btn btn-primary" onClick={handleSubmitReview}>
          {editingReview ? "수 정" : "등 록"}
        </button>
        <button className="btn btn-outline-primary" onClick={() => setShowReviewModal(false)}>
          취 소
        </button>
      </div>
  </div>
</div>
  );
};

export default SellerDetail;
