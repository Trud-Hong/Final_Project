// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";

// // ⭐ 별점 출력 함수
// const renderStars = (count, setRating = null) => (
//   <div style={{ cursor: setRating ? "pointer" : "default" }}>
//     {Array.from({ length: 5 }).map((_, i) => (
//       <span
//         key={i}
//         onClick={() => setRating && setRating(i + 1)}
//         style={{
//           color: i < count ? "#FFD700" : "#ddd",
//           fontSize: "20px",
//           marginRight: "3px",
//         }}
//       >
//         ★
//       </span>
//     ))}
//   </div>
// );

// const Testimonial = () => {
//   const [reviews, setReviews] = useState([]);
//   const [showForm, setShowForm] = useState(false);

//   // 폼 데이터
//   const [name, setName] = useState("");
//   const [product, setProduct] = useState("");
//   const [seller, setSeller] = useState("");
//   const [content, setContent] = useState("");
//   const [rating, setRating] = useState(5);

//   // ⭐ 서버에서 리뷰 불러오기
//   useEffect(() => {
//     axios.get("http://localhost:8080/api/reviews").then((res) => {
//       setReviews(res.data);
//     });
//   }, []);

//   // ⭐ 리뷰 작성 요청
//   const submitReview = () => {
//     if (!name || !content) {
//       alert("이름과 내용은 필수입니다.");
//       return;
//     }

//     const newReview = {
//       user: name,
//       product,
//       seller,
//       rating,
//       content,
//     };

//     axios
//       .post("http://localhost:8080/api/reviews", newReview)
//       .then((res) => {
//         setReviews([res.data, ...reviews]); // 리스트 갱신
//         setShowForm(false);
//         setName("");
//         setProduct("");
//         setSeller("");
//         setContent("");
//         setRating(5);
//       })
//       .catch(() => alert("리뷰 저장 실패"));
//   };

//   return (
//     <div>
//       {/* Page Header */}
//             <div className="container-fluid page-header wow fadeIn" data-wow-delay="0.1s">
//                 <div className="container">
//                     <h1 className="display-3 mb-3 animated slideInDown" style={{ marginRight: '300px' }}>
//                         고객 리뷰
//                     </h1>
//                     <nav aria-label="breadcrumb animated slideInDown">
//                         <ol className="breadcrumb mb-0">
//                             <li className="breadcrumb-item"><a className="text-body" href="/">홈페이지</a></li>
//                             <li className="breadcrumb-item"><a className="text-body" href="#">판매정보</a></li>
//                             <li className="breadcrumb-item text-dark active" aria-current="page">고객리뷰</li>
//                         </ol>
//                     </nav>
//                 </div>
//             </div>

//       {/* 작성 버튼 */}
//       <div className="container text-end mt-4">
//         <button
//           className="btn btn-primary"
//           onClick={() => setShowForm(true)}
//         >
//           ✍ 리뷰 작성하기
//         </button>
//       </div>

//       {/* 리뷰 작성 모달 */}
//       {showForm && (
//         <div
//           className="modal d-block"
//           style={{ background: "rgba(0,0,0,0.5)" }}
//         >
//           <div className="modal-dialog">
//             <div className="modal-content p-3">

//               <h4 className="mb-3">리뷰 작성</h4>

//               <input
//                 className="form-control mb-2"
//                 placeholder="이름"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//               />

//               <input
//                 className="form-control mb-2"
//                 placeholder="구매한 상품명"
//                 value={product}
//                 onChange={(e) => setProduct(e.target.value)}
//               />

//               <input
//                 className="form-control mb-2"
//                 placeholder="판매자명"
//                 value={seller}
//                 onChange={(e) => setSeller(e.target.value)}
//               />

//               {/* ⭐ 별점 선택 */}
//               <div className="mb-2">별점: {renderStars(rating, setRating)}</div>

//               <textarea
//                 className="form-control mb-3"
//                 placeholder="리뷰 내용"
//                 rows="4"
//                 value={content}
//                 onChange={(e) => setContent(e.target.value)}
//               />

//               <div className="text-end">
//                 <button
//                   className="btn btn-secondary me-2"
//                   onClick={() => setShowForm(false)}
//                 >
//                   취소
//                 </button>

//                 <button className="btn btn-primary" onClick={submitReview}>
//                   저장
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Review Area */}
//       <div className="container py-6">
//         <div className="section-header text-center mx-auto mb-5">
//           <h1 className="display-5 mb-3">구매자 리뷰</h1>
//           <p>실제 고객들의 구매 후기와 평가입니다.</p>
//         </div>

//         <div className="row g-4">
//           {reviews.map((review, idx) => (
//             <div key={idx} className="col-lg-6 col-md-12">
//               <div className="bg-white p-4 rounded shadow-sm h-100 position-relative">
//                 <div className="position-absolute" style={{ top: "20px", right: "20px" }}>
//                   {renderStars(review.rating)}
//                 </div>

//                 <h5>{review.user}</h5>
//                 <p className="text-muted">{review.date}</p>

//                 <p className="text-center my-4">{review.content}</p>

//                 <p><strong>판매자:</strong> {review.seller}</p>
//                 <p><strong>상품:</strong> {review.product}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Testimonial;
