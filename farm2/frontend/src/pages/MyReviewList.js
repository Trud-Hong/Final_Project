import { useEffect, useState } from "react";
import GotoBack from "../components/GotoBack";


const MyReviewList = () => {

    const userId = localStorage.getItem("userId");

    const [reviews, setReviews] = useState([]);

    const [editId, setEditId] = useState(null);
    const [editContent, setEditContent] = useState("");

    useEffect(() => {
        if(!userId) {
            alert("로그인이 필요한 서비스 입니다.");
            window.location.href = "/login?redirect=/mypage/myreview";
        } else {
            fetchMyReviews();
        }
    }, []);

    // 리뷰 목록 불러오기
    const fetchMyReviews = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/myreview/${userId}`);
            const data = await res.json();
            setReviews(data);
        } catch (error) {

            console.error("리뷰 조회 오류: ", error);
        }
    };

//리뷰 삭제하기
    const deleteReview = async (id) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(
                `http://localhost:8080/api/myreview/delete/${id}`,
                {method: "DELETE"}
            );

            if (res.ok) {
                alert("삭제되었습니다");
                fetchMyReviews();
            }
        } catch (error) {
            console.error("삭제 오류: ", error);
        }
    };

    // 수정버튼
    const startEdit = (review) => {
        setEditId(review.id);
        setEditContent(review.content);
    };

    // 리뷰 수정저장
    const saveEdit = async (id) => {

        try {
            const res = await fetch(
                `http://localhost:8080/api/myreview/edit/${id}`,
                {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({content: editContent})
                }
            );

            if(res.ok) {
                alert("수정되었습니다.");
                setEditId(null);
                setEditContent("");
                fetchMyReviews();
            }
        } catch (error) {
            console.error("수정 오류: ", error);
        }
    };

    //날짜 포맷
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${(date.getMonth()+1)
            .toString().padStart(2,"0")}-${date.getDate()
            .toString().padStart(2,"0")}-${date.getHours()
            .toString().padStart(2,"0")}-${date.getMinutes()
            .toString().padStart(2,"0")}`;
    };

    return (
        <div className="container" style={{ marginTop: "40px", marginBottom: "60px"}}>
            <h2>내가 남긴 리뷰</h2>

            <p className="text-muted">
                총 <strong>{reviews.length}</strong>개의 리뷰가 있습니다.
            </p>

            <table className="table table-bordered">
                <thead>
                    <tr className="table-light">
                        <th style={{ width: "60px" }}>No.</th>
                        <th>상품명</th>
                        <th style={{ width: "40%" }}>리뷰 내용</th>
                        <th style={{ width: "180px" }}>리뷰 날짜</th>
                        <th style={{ width: "150px" }}> 관리</th>
                    </tr>
                </thead>
                <tbody>
                    {reviews.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="text-center py-4">
                                작성한 리뷰가 없습니다.
                            </td>
                        </tr>
                    ) : (
                    reviews.map((review, index) => (
                        <tr key={review.id}>
                            <td>{index + 1}</td>
                            <td>{review.product}</td>

                            <td>
                                {editId === review.id ? (
                                    <input
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="from-vontrol"/>
                                ) : (
                                    review.content
                                )}
                            </td>

                            <td>{formatDate(review.createdAt)}</td>

                            <td className="text-center">
                            {editId === review.id ? (
                                <>
                                <button
                                    className="btn btn-success btn-sm me-2"
                                    onClick={() => saveEdit(review.id)}>
                                    저장
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setEditId(null)}>
                                    취소
                                </button>
                                </>
                            ) : (
                                <>
                                <button
                                    className="btn btn-success btn-sm me-2"
                                    onClick={() => startEdit(review)}>
                                        수정
                                </button>

                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => deleteReview(review.id)}
                                >
                                    삭제
                                </button>
                                </>
                            )}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
            <GotoBack /> 

    </div>
    );

};
export default MyReviewList;