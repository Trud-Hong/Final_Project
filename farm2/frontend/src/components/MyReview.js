// 구매내역 리스트 리뷰
import { useRef, useState } from "react";

const MyReview = ({
    order,
    myReviews, 
    setReviewContent,
    setWriteReviewId,
    setEditReviewId,
    setMyReviews,
    userId,
}) => {

// 이 주문에 대해 내가 쓴 리뷰 찾기
const existingReview = myReviews.find((r) => r.orderId === order.id);

// 환불받은 주문건은 리뷰x
const isRefund = order.status === "환불완료";

// 리뷰작성 가능 조건
const canWriteReview = 
!isRefund && (order.status === "거래완료");

//리뷰삭제
const deleteReview = async (reviewId) => {
  if (!window.confirm("정말 삭제하시겠습니까?")) return;

  try {
    await fetch(
      `http://localhost:8080/api/myreview/delete/${reviewId}`,
      { method: "DELETE" }
    );

    alert("삭제 되었습니다.");

    const res = await fetch(
      `http://localhost:8080/api/myreview/${userId}`
    );

    const data = await res.json();
    setMyReviews(data);

  } catch (error) {
    console.error("리뷰 삭제 실패:", error);
    alert("리뷰 삭제 중 오류가 발생했습니다.");
  }
};

const startEditReview = () => {
  if(!existingReview) return;

  setEditReviewId(existingReview.id);

  setWriteReviewId(null);

  setReviewContent(existingReview.content || "");
};


//화면 렌더링
return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>

      {/* 환불완료일때 */}
      {isRefund ? (
        <span style={{ fontSize: "12px", color: "#999" }}>-</span>
      ) : (
        <>
        
        {/* 리뷰가 있는 경우 : 수정/삭제 버튼 */}
        {existingReview ? (
            <div style={{
                display: "flex",
                gap: "4px",
                alignItems: "center",
                justifyContent: "center",
            }}
            >
            <div style={{display: "flex", gap: "5px", whiteSpace: "nowrap" }}>

            <button className="btn btn-sm"
            style={{ fontSize: "13px",
              padding: "2px 4px", backgroundColor: "#3cb815",
              border: "1px solid #3cb815", color: "white",
              fontWeight: "bold", 
              transition: "background-color 0.15s, color 0.15s"
                   }}

            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.color = "#3cb815";            }}

            onMouseLeave={(e) => {
               e.target.style.backgroundColor = "#3cb815";
              e.target.style.color = "white";
            }}
            onClick={startEditReview}>
              수정
            </button>

            <button className="btn btn-secondary btn-sm"
            style={{ fontSize: "13px", padding: "2px 4px",
              backgroundColor: "#ee7619", border: "1px solid #ee7619",
              color: "white", fontWeight: "bold", transition: "background-color 0.15s, color 0.15s"
            }}

            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.color = "#ee7619";
            }}

            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#ee7619";
              e.target.style.color = "white";
            }}
            onClick={() => deleteReview(existingReview.id)}
            >삭제</button>
            </div>

            {false && typeof existingReview.rating === "number" && (
                <div style={{fontSize: "11px", color: "#ffbf00"}}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} style={{color:
                            star <= existingReview.rating ? "#ffc107" : "#ddd",
                        }}>★</span>
                    ))}
                </div>
            )}
            </div>
        ): (

          /* 리뷰가없는 경우 */
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
            {canWriteReview ? (
                <button className="btn btn-sm"
                style={{ fontSize: "12px", padding: "5px 4px",
                   backgroundColor: "#3cb815",
                    border: "1px solid #3cb815",
                    color: "white",
                    transition: "background-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "white";
                    e.target.style.color = "#3cb815";
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#3cb815";
                    e.target.style.color = "white";
                }}

                onClick={() => {
                    setWriteReviewId(order.id);
                    setEditReviewId(null);
                    setReviewContent("");
                }}>리뷰 등록
                </button>
            ) : (
                <button className="btn btn-sm"
                style={{
                    fontSize: "12px",
                    padding: "5px 4px",
                    backgroundColor: "#ccc",
                    border: "1px solid #ccc",
                    cursor: "not-allowed",
                    color: "white",
                }}
                disabled>리뷰등록</button>
                )}
            </div>
        )}
        </>
    )}
    </div>);
};
export default MyReview;
