// src/seller/SellerQuestion.jsx

import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Pagination from '../components/Pagination';
import { useLocation, useNavigate } from 'react-router-dom';

const SellerQuestion = () => {

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [replyInputs, setReplyInputs] = useState({});
  const [loading, setLoading] = useState(true);

  const [editId,setEditId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [openContentId, setOpenContentId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialPage = parseInt(searchParams.get("page") || "0", 10);

  const [page, setPage] = useState(initialPage);
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const [itemsPerPage] = useState(5); // 페이지당 문의 수

  const sellerId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  /* ================================================================
   * 0. 문의 목록 다시 불러오는 함수 (답변 후 자동 갱신용)
   * ================================================================ */
  const fetchQuestions = () => {
    setLoading(true);

    axios
      .get(`http://localhost:8080/products/qna/seller?sellerId=${sellerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setQuestions(res.data);
      })
      .catch((err) => {
        console.error("문의 목록 호출 오류:", err);
      })
      .finally(() => setLoading(false));
  };

  /* ================================================================
   * 1. 페이지 진입 시 문의 목록 불러오기
   * ================================================================ */
  useEffect(() => {
    if (!sellerId) return;
    fetchQuestions();
  }, [sellerId, token]);

  // page가 변경될 때 currentPage 동기화 (0-based -> 1-based)
  useEffect(() => {
    setCurrentPage(page + 1);
  }, [page]);

  // URL 파라미터 변경 시 page 동기화
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlPage = parseInt(params.get("page") || "0", 10);
    if (urlPage !== page) {
      setPage(urlPage);
    }
  }, [location.search, page]);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(location.search);
    params.set("page", newPage);

    setPage(newPage);
    navigate({
      pathname: location.pathname,
      search: params.toString(),
    });
  };


  /* ================================================================
   * ⭐ 여기! 로딩 상태일 때 UI 먼저 return
   * ================================================================ */
  if (loading) {
    return (
      <div style={{
        padding: "30px",
        fontSize: "18px",
        textAlign: "center",
        color: "#666"
      }}>
        로딩 중...
      </div>
    );
  }


  /* ================================================================
   * 2. 답변 입력값 저장
   * ================================================================ */
  const handleInputChange = (qnaId, value) => {
    setReplyInputs((prev) => ({
      ...prev,
      [qnaId]: value,
    }));
  };

  /* ================================================================
   * 3. 답변 등록 API
   * ================================================================ */
  const submitReply = async (question) => {
    if (isSubmitting) {
      alert("저장중입니다.");
      return;
    }

    const replyText = replyInputs[question.id];

    if (!replyText || replyText.trim() === "") {
      alert("답변 내용을 입력해주세요.");
      return;
    }

      try {
        setIsSubmitting(true); //중복클릭방지

        // 답변등록
      await axios.post(
        `http://localhost:8080/products/${question.productId}/qna/${question.id}/answer`,
      { answer: replyText },
      { headers: {Authorization: `Bearer ${token}`}}
      );

      alert("답변이 등록되었습니다.");

      // 화면 즉시 반영
      setQuestions((prev) => 
      prev.map((q) => 
        q.id === question.id ? { ...q, answer: replyText } : q) );

      // 입력창 초기화
      setReplyInputs((prev) => ({ ...prev, [question.id]: ""}));


      const res = await axios.get(
         `http://localhost:8080/products/qna/seller/unanswered/count?sellerId=${sellerId}`,
      { headers: {Authorization: `Bearer ${token}`}}
      );

      // (5) localStorage에 저장 + storage 이벤트 발생 → Seller.jsx가 감지함
      localStorage.setItem("unansweredQnA", res.data.toString());
      window.dispatchEvent(new Event("storage"));

      // UX옵션 상세자동 닫기, 포커스 제거
      setOpenContentId(null); 
      document.activeElement.blur();

    } catch (error) {
      console.error("답변 등록 오류:", error);
      alert("답변 등록에 실패했습니다.")
    } finally{
      setIsSubmitting(false); //중복클릭방지 off
    }};


  //   try {
  //     // ⭐⭐ 새로운 QnA 답변 API
  //     await axios.post(
  //       `http://localhost:8080/products/${question.productId}/qna/${question.id}/answer`,
  //       { answer: replyText },
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );

  //     alert("답변이 등록되었습니다.");

  //     // 답변 즉시 리스트에 반영
  //     setQuestions((prev) =>
  //       prev.map((q) =>
  //         q.id === question.id ? { ...q, answer: replyText } : q
  //       )
  //     );

  //     // 입력창 초기화
  //     setReplyInputs((prev) => ({ ...prev, [question.id]: "" }));

  //     // ⭐ 미답변 카운트 갱신
  //     const res = await axios.get(
  //       `http://localhost:8080/products/qna/seller/unanswered/count?sellerId=${sellerId}`,
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );

  //     localStorage.setItem("unansweredQnA", res.data.toString());
  //     window.dispatchEvent(new Event("storage"));

  //   } catch (err) {
  //     console.error("답변 등록 오류:", err);
  //   }
  // };

  // 수정, 삭제 추가
  const startEdit = (q) => {
    setEditId(q.id);
    setEditContent(q.answer);
  };

  const saveEdit = async (question) => {
    if (isSubmitting) {
      alert("수정중입니다.");
      return;
    }

    if (!editContent || editContent.trim() === "") {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await axios.put(
        `http://localhost:8080/products/${question.productId}/qna/${question.id}/answer`,
        {answer: editContent},
        {headers: {Authorization: `Bearer ${token}`}}
      );

      if (res.status === 200) {
        alert("수정되었습니다.")

        setEditId(null);
        setEditContent("");

        // 화면에 즉시 반영
        setQuestions((prev) =>
        prev.map ((q) => q.id === question.id ? { ...q, answer: editContent} : q ));
      }
    } catch (error) {
      if (error.response) {
        alert(`수정 실패: ${error.response.data || error.response.status}`);
      } else {
      console.error("수정오류:", error);
        alert("수정 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

   

  const deleteAnswer = async (question) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    if (isSubmitting) {
      alert("처리중입니다.");
      return
    }

    try {
      setIsSubmitting(true);

      await axios.delete(
        `http://localhost:8080/products/${question.productId}/qna/${question.id}/answer`,
        {headers: { Authorization: `Bearer ${token}`}}
      );

      alert("삭제되었습니다.");

      setQuestions((prev) => 
      prev.map((q) => q.id === question.id ? { ...q, answer: null} : q)
    )
  

  //미답변 카운트 갱신
  const res = await axios.get(
    `http://localhost:8080/products/qna/seller/unanswered/count?sellerId=${sellerId}`,{headers: {Authorization: `Bearer ${token}`}}
  );

  localStorage.setItem("unansweredQnA", res.data.toString());
  window.dispatchEvent(new Event("storage"));

    } catch (error) {
      console.error("삭제 오류", error);
      if (error.response) {
        alert(`삭제 실패: ${error.response.data || error.response.status}`);
      } else {
        alert("삭제 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

//-----------------여기까지 추가 혜정 12/8




  /* ================================================================
   * 4. 페이지네이션 적용
   * ================================================================ */
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentQuestions = questions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(questions.length / itemsPerPage);

  /* ================================================================
   * 5. 실제 렌더링 UI
   * ================================================================ */
  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3>문의 관리</h3>
      </div>

      <table className="admin-table">
        <thead className="admin-thead">
          <tr>
            <th>번호</th>
            <th>구매자 ID</th>
            <th>상품명</th>
            <th>문의 내용</th>
            <th>답변</th>
            <th>상태</th>
            <th style={{ textAlign:'center' }}>관리</th>
          </tr>
        </thead>

        <tbody>
          {questions.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign:'center', padding:'20px', color:'#777' }}>
                문의가 없습니다.
              </td>
            </tr>
          ) : (
            currentQuestions.map((q, index) => (
              // <tr key={q.id}>
              <React.Fragment key={q.id}>
                <tr>
                  <td>{(page * itemsPerPage) + index + 1}</td>

                {/* <td className="admin-td">{q.id}</td> */}

                <td className="admin-td">{q.userId}</td>


                <td className="admin-td"
                style={{cursor: "pointer", color: "#333"}}
                onClick={async () => {
                  if (!q.productId) {
                    alert("현재 판매하지 않는 상품입니다.");
                    return;
                  }

                  try {
                    const res = await fetch(
                      `http://localhost:8080/products/detail/${q.productId}`
                    );

                    if (!res.ok) {
                      alert("현재 판매하지 않는 상품입니다.");
                      return
                    }

                    window.location.href = `/products/detail/${q.productId}`;
                  } catch (error) {
                    alert("현재 판매하지 않는 상품입니다.");
                  }
                }}

                onMouseEnter={(e) => {
                  e.target.style.color = '#28a745';
                  e.target.style.textDecoration = 'underline';
                }}

                onMouseLeave={(e) => {
                  e.target.style.color = '#333';
                  e.target.style.textDecoration = 'none';
                }}
                ><strong> {q.title}</strong></td>

                {/* }>{q.title}</td> */}


                <td className="admin-td"
                style={{ cursor: "pointer"}}
                onClick={() => 
                  setOpenContentId(openContentId === q.id? null : q.id)
                }> {q.content.slice(0,20)}...</td>
    {/* ------- 여기까지 수정했음 12/8 혜정 */}



                {/* 이미 답변된 상태 */}
                {q.answer ? (
                  <>
                    <td>
                      {editId === q.id ? (
                        <input value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}/>
                      ) : (
                        <span style={{ color:'#2ecc71' }}>
                        {q.answer}</span>
                )}</td>
                    <td className="admin-td">답변 완료</td>


                    <td className='text-center'>
                      {editId ===q.id ? (
                        <>
                        <button  className="btn btn-sm"
                          style={{
                            marginLeft: "6px",
                            fontSize: "13px",
                            padding: "2px 6px",
                            backgroundColor: "#3cb815",
                            border: "1px solid #3cb815",
                            color: "white",
                            fontWeight: "bold",
                            transition: "background-color 0.15s, color 0.15s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "white";
                            e.target.style.color = "#3cb815";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#3cb815";
                            e.target.style.color = "white";
                          }}
                        
                        onClick={() => saveEdit(q)}> 저장</button>

                        <button
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: "13px",
                          padding: "2px 6px",
                          backgroundColor: "#ee7619",
                          border: "1px solid #ee7619",
                          color: "white",
                          fontWeight: "bold",
                          transition: "background-color 0.15s, color 0.15s",
                          marginLeft: "4px"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "white";
                          e.target.style.color = "#ee7619";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#ee7619";
                          e.target.style.color = "white";
                        }}
                        onClick={() => setEditId(null)}>취소</button>
                        </>
                      ) : (
                        <>
                        <button  className="btn btn-sm"
                        style={{
                          marginLeft: "6px",
                          fontSize: "13px",
                          padding: "2px 6px",
                          backgroundColor: "#3cb815",
                          border: "1px solid #3cb815",
                          color: "white",
                          fontWeight: "bold",
                          transition: "background-color 0.15s, color 0.15s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "white";
                          e.target.style.color = "#3cb815";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#3cb815";
                          e.target.style.color = "white";
                        }}                       
                        
                        
                        onClick={() => startEdit(q)}>수정</button>

                        <button 
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: "13px",
                          padding: "2px 6px",
                          backgroundColor: "#ee7619",
                          border: "1px solid #ee7619",
                          color: "white",
                          fontWeight: "bold",
                          transition: "background-color 0.15s, color 0.15s",
                          marginLeft: "4px"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "white";
                          e.target.style.color = "#ee7619";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#ee7619";
                          e.target.style.color = "white";
                        }}
                        
                        onClick={() => deleteAnswer(q)}>삭제</button>
                        </>
                        )}
                    </td>
                    </>
                ) : (
                  <>
                  <td>
                    <textarea
                    value={replyInputs[q.id] || ""}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                    placeholder="답변을 입력하세요"/>
                    </td>

                    <td className="admin-td"><font color="red">답변 대기중</font></td>
                

                <td className="admin-td text-center">                
                    <button                    
                     className= "btn btn-sm"
                     style={{
                      fontSize: "12px",
                      padding: "5px 6px",
                      backgroundColor: "#3cb815",
                      border: "1px solid #3cb815",
                      color: "white",
                      transition: "background-color 0.15s, color 0.15s",
                      fontWeight: "bold"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "white";
                      e.target.style.color = "#3cb815";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#3cb815";
                      e.target.style.color = "white";
                    }}
                    onClick={() => submitReply(q)}>답변 등록</button>
                   </td>
                  </>
                )}
              </tr>          

              {openContentId === q.id && (
                <tr>
                  <td colSpan="7" style={{background: "#f9f9f9", padding: "15px"}}>
                    <strong>문의 전체 내용</strong> <br/>
                    {q.content}
                  </td>
                </tr>
              )}

              </React.Fragment>
            ))
          )}


        </tbody>
      </table>

      {/* 페이지네이션 */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default SellerQuestion;
