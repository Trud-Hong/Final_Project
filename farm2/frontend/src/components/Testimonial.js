import React, { useEffect, useState } from 'react';
import "./Testimonial.css";

const Testimonial = () => {

  const [reviews, setReviews] = useState([]);

  // 리뷰 불러오기
  useEffect(() => {
    fetch("http://localhost:8080/api/reviews")
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        // 최신순 (DESC)
        const sorted = list.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        setReviews(sorted);
      })
      .catch(err => console.error("리뷰 불러오기 오류:", err));
  }, []);

  // Owl Carousel 초기화
  useEffect(() => {
    if (!reviews || reviews.length === 0) return;

    if (window.$ && window.$.fn.owlCarousel) {
      setTimeout(() => {
        window.$('.testimonial-carousel').owlCarousel({
          autoplay: true,
          smartSpeed: 1000,
          margin: 25,
          dots: false,
          loop: true,
          center: true,
          responsive: {
            0: { items: 1 },
            576: { items: 1 },
            768: { items: 2 },
            992: { items: 3 }
          }
        });
      }, 200);
    }
  }, [reviews]);

  // 판매자 상세페이지 스타일과 동일한 별 UI
  const CardStarRating = ({ rating }) => {
    return (
      <div className="review-star-container">
        {Array.from({ length: 5 }, (_, i) => {
          let className = "review-star";
          if (rating >= i + 1) className += " full";
          return (
            <span key={i} className={className}>★</span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container-fluid bg-light bg-icon py-6 mb-5">
      <div className="container">

        {/* 섹션 제목 */}
        <div
          className="section-header text-center mx-auto mb-5 wow fadeInUp"
          data-wow-delay="0.1s"
          style={{ maxWidth: '500px' }}
        >
          <h1 className="display-5 mb-3">고객 리뷰</h1>
          <p>구매자가 작성한 판매자 리뷰 페이지 입니다.</p>
        </div>

        {/* 리뷰 캐러셀 */}
        <div
          className="owl-carousel testimonial-carousel wow fadeInUp"
          data-wow-delay="0.1s"
        >

          {reviews.length === 0 && (
            <p className="text-center">아직 리뷰가 없습니다.</p>
          )}

          {reviews.map((review, idx) => (
            <div key={idx} className="testimonial-item position-relative bg-white p-5 mt-4">

              <i className="fa fa-quote-left fa-3x text-primary position-absolute top-0 start-0 mt-n4 ms-5"></i>

              {/* 별점 표시 추가 */}
              <div className="mb-2">
                <div className='re'>{review.farmName}</div>
                <CardStarRating rating={review.rating} />
                <div className='reDay'>{review.date}</div>
              </div>

              {/* 리뷰 내용 */}
              <p className="mb-4">{review.content}</p>

              {/* 리뷰 작성자 */}
              <div className="d-flex align-items-center">
                <div className="ms-3">
                  <div className="reName">
                  {review.reviewerNick || review.reviewerId || "익명"}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Testimonial;
