import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../css/productQnA.scss';
import Pagination from './Pagination';

const API_BASE = "http://localhost:8080";

const QnaForm = ({ productId, onSubmit, productSellerId }) => {

  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  
  
  const submit = async () => {
    if (!title.trim()) {
      alert("문의 제목을 입력하세요.");
      return;
    }
    if (!question.trim()) {
      alert("문의 내용을 입력하세요.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      await axios.post(
      `${API_BASE}/products/${productId}/qna`,
      {
        title: title.trim(),
        question: question.trim(),
        content: question.trim(),
        privateFlag: isPrivate,
        sellerId: productSellerId,   // ★ 핵심
        userId: localStorage.getItem("userId")
      },

      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );


      setTitle("");
    setQuestion("");
      setIsPrivate(false);
      if (onSubmit) {
        onSubmit(0); // 목록 새로고침하고 첫 페이지로 이동
      }
      alert("문의가 등록되었습니다.");
    } catch (err) {
      console.error("문의 등록 실패:", err);
      alert("문의 등록 실패: " + (err.response?.data?.message || err.message));
    }
  };
  
  return (
    <div className="qna-form">
      <input 
        type="text"
        placeholder="문의 제목을 입력하세요."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea 
        placeholder="문의 내용을 입력하세요." 
        value={question} 
        onChange={(e) => setQuestion(e.target.value)} 
        rows={4}
      />
      <div className="qna-form-options">
        <label className="custom-checkbox-label">
          <input 
            type="checkbox" 
            checked={isPrivate} 
            onChange={(e) => setIsPrivate(e.target.checked)} 
            className="custom-checkbox-input"
          />
          <span className="custom-checkbox-mark"></span>
          <span className="custom-checkbox-text">비공개 문의</span>
        </label>
        <button onClick={submit} className="btn btn-primary" style={{display: 'flex'}} >문의등록</button>
      </div>
    </div>
  );
};

const ProductQnA = ({ productId, productSellerId, isLoggedIn }) => {
  const [qnas, setQnas] = useState([]);
  const [totalQnas, setTotalQnas] = useState(0);
  const [editingQnaId, setEditingQnaId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingQuestion, setEditingQuestion] = useState("");
  const [answeringQnaId, setAnsweringQnaId] = useState(null);
  const [answerContent, setAnswerContent] = useState("");
  const [expandedQnaId, setExpandedQnaId] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const currentUserId = localStorage.getItem("userId");
  const currentNickname = localStorage.getItem("nickname") || localStorage.getItem("username") || '';
  const currentRole = localStorage.getItem("role");
  const isAdmin = currentRole === "ROLE_ADMIN";
  const isSellerOfProduct = currentRole === "ROLE_SELLER" && productSellerId && currentUserId === productSellerId;
  const canAnswer = isSellerOfProduct;

  // QnA 목록 불러오기
  const fetchQnas = async (pageNum = 0) => {
    if (!productId) return;
    
    try {
      const token = localStorage.getItem("token");
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};

      const res = await axios.get(`${API_BASE}/products/${productId}/qna`, {
        headers,
        params: {page: pageNum, size: 5,
          userId: currentUserId
        }
      });

      console.log("QnA API 응답:", res.data);
    console.log("첫 번째 QnA:", res.data[0]);

      const allQnas = res.data; // 서버에서 전체 QnA 배열 받음
      const size = 5;
      const startIndex = pageNum * size;
      const pagedQnas = allQnas.slice(startIndex, startIndex + size);
      
      const qnaList = pagedQnas.map((q) => {
        let createdAtStr = new Date().toISOString();
        if (q.createdAt) {
          if (typeof q.createdAt === 'string') {
            createdAtStr = q.createdAt;
          } else if (q.createdAt instanceof Date) {
            createdAtStr = q.createdAt.toISOString();
          } else {
            createdAtStr = new Date(q.createdAt).toISOString();
          }
        }

        let answeredAtStr = null;
        if (q.answeredAt) {
          if (typeof q.answeredAt === 'string') {
            answeredAtStr = q.answeredAt;
          } else if (q.answeredAt instanceof Date) {
            answeredAtStr = q.answeredAt.toISOString();
          } else {
            answeredAtStr = new Date(q.answeredAt).toISOString();
          }
        }
        
        return {
          id: q.id || q._id,
          userId: q.userId || '',
          author: q.author || '',
          title: q.title || q.question || '',
          question: q.question || '',
          answer: q.answer || null,
          createdAt: createdAtStr,
          answeredAt: answeredAtStr,
          isPrivate: q.privateFlag || false
        };
      });
      setQnas(qnaList);
      setTotalQnas(allQnas.length);
      setPage(pageNum);
      setTotalPages(Math.ceil(allQnas.length / size));
    } catch (error) {
      console.error("QnA API 호출 실패:", error);
      setQnas([]);
      setTotalQnas(0);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    fetchQnas(0);
  }, [productId]);

  const handlePageChange = (p) => {
    fetchQnas(p);
  };

  // QnA 수정
  const updateQna = async (qnaId) => {
    if (!editingTitle.trim()) {
      alert("문의 제목을 입력해주세요.");
      return;
    }
    if (!editingQuestion.trim()) {
      alert("문의 내용을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/products/${productId}/qna/${qnaId}`,
        {
          title: editingTitle.trim(),
          question: editingQuestion.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      await fetchQnas(page);
      setEditingQnaId(null);
      setEditingTitle("");
      setEditingQuestion("");
      alert("문의가 수정되었습니다.");
    } catch (error) {
      console.error("문의 수정 실패:", error);
      const errorMsg = error.response?.data?.message || error.message || "문의 수정에 실패했습니다.";
      alert(errorMsg);
    }
  };

  // QnA 삭제
  const deleteQna = async (qnaId) => {
    if (!window.confirm("정말 이 문의를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${API_BASE}/products/${productId}/qna/${qnaId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      await fetchQnas(page);
      alert("문의가 삭제되었습니다.");
    } catch (error) {
      console.error("문의 삭제 실패:", error);
      const errorMsg = error.response?.data?.message || error.message || "문의 삭제에 실패했습니다.";
      alert(errorMsg);
    }
  };

  // 답변 등록
  const submitAnswer = async (qnaId) => {
    if (!answerContent.trim()) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE}/products/${productId}/qna/${qnaId}/answer`,
        {
          answer: answerContent.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      await fetchQnas(page);
      setAnsweringQnaId(null);
      setAnswerContent("");
      alert("답변이 등록되었습니다.");
    } catch (error) {
      console.error("답변 등록 실패:", error);
      const errorMsg = error.response?.data?.message || error.message || "답변 등록에 실패했습니다.";
      alert(errorMsg);
    }
  };

  const startEditQna = (qna) => {
    setEditingQnaId(qna.id);
    setEditingTitle(qna.title || "");
    setEditingQuestion(qna.question);
    setExpandedQnaId(qna.id);
  };

  const cancelEditQna = () => {
    setEditingQnaId(null);
    setEditingTitle("");
    setEditingQuestion("");
  };

  const startAnswer = (qna) => {
    setAnsweringQnaId(qna.id);
    setAnswerContent(qna.answer || "");
    setExpandedQnaId(qna.id);
  };

  const cancelAnswer = () => {
    setAnsweringQnaId(null);
    setAnswerContent("");
  };

  const toggleExpand = (qnaId) => {
    setExpandedQnaId((prev) => (prev === qnaId ? null : qnaId));
  };

  const handleToggle = (qna, canView) => {
    if (qna.isPrivate && !canView) {
      alert("해당 문의는 작성자만 확인 가능합니다.");
      return;
    }
    toggleExpand(qna.id);
  };

  const sortedQnas = useMemo(() => {
    return [...qnas].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [qnas]);

  return (
    <div className="pd-qna">
      <div className="pd-section-head">
        <h4>상품 문의 ({totalQnas})</h4>
      </div>
      
      {isLoggedIn && (
      <div className="pd-qna-write">
          <QnaForm 
            productId={productId}
            onSubmit={fetchQnas}
            productSellerId={productSellerId}   // ★ 추가되는 부분
          />
        </div>
      )}

      {!isLoggedIn && (
        <div className="pd-qna-alert">
          문의 작성은 로그인 후 가능합니다.
        </div>
      )}

      <div className="pd-qna-list">
        {sortedQnas.length === 0 ? (
          <div className="pd-qna-empty">
            아직 등록된 문의가 없습니다.
          </div>
        ) : (
          <div className="pd-qna-board">
            {sortedQnas.map((q, index) => {
              const isMyQna =
                (q.userId && String(q.userId) === String(currentUserId));
              const isPrivateQna = q.isPrivate;
              const isEditing = editingQnaId === q.id;
              const isAnswering = answeringQnaId === q.id;
              const canView = !q.isPrivate || isMyQna || isSellerOfProduct || isAdmin;
              const displayTitle = q.title || q.question || "제목 없음";
              const displayAuthor = q.author;
              const isExpanded = expandedQnaId === q.id;
              const pageSize = 5;
              const rowNumber = totalQnas - (page * pageSize + index);

              return (
                <div className={`pd-qna-item ${isExpanded ? "expanded" : ""}`} key={q.id}>
                  <div className="q-row">
                    <div className="q-main">
                      <button
                        type="button"
                        className={`q-title-button ${isExpanded ? "expanded" : ""}`}
                        onClick={() => handleToggle(q, canView)}
                      >
                        <span className="q-number">{rowNumber}</span>
                        <span className="q-title-text">
                          {q.isPrivate === false ? displayTitle : canView ? displayTitle : "비공개 문의입니다."}
                          {"\u00A0"}{"\u00A0"}
                          {q.isPrivate && <span className="q-private-badge">비공개</span>}
                        </span>
                      </button>
                      <div className="q-submeta">
                        <span className="q-author">{displayAuthor}</span>
                        <span className="q-date">작성 {new Date(q.createdAt).toLocaleDateString("ko-KR")}</span>
                        {q.answer && q.answeredAt && (
                          <span className="q-date">답변 {new Date(q.answeredAt).toLocaleDateString("ko-KR")}</span>
                        )}
                      </div>
                    </div>
                    <div className="q-actions">
                      {(q.answer || q.answeredAt) ? (
                        <span className="status-complete">답변 완료</span>
                      ) : (
                        <>
                          {canAnswer && !q.answer && canView && (
                            <button className="btn btn-primary" onClick={() => startAnswer(q)}>
                              답변하기
                            </button>
                          )}
                          {!canAnswer && !q.answer && (
                            <span className="status-pending1">대기중</span>
                          )}
                        </>
                      )}

                      {((isMyQna || isAdmin) && !isEditing && currentUserId && canView && !q.answer) && (
                        <div className="action-buttons">
                          {isMyQna && (
                            <button className="btn-edit" onClick={() => startEditQna(q)}>
                              수정
                            </button>
                          )}
                          {(isAdmin || isMyQna) && (
                            <button className="btn-delete" onClick={() => deleteQna(q.id)}>
                              삭제
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="q-detail">
                      {!canView ? (
                        <div className="detail-locked">
                          해당 문의는 작성자만 확인 가능합니다.
                        </div>
                      ) : isEditing ? (
                        <div className="qna-edit-form">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            placeholder="문의 제목을 입력하세요."
                          />
                          <textarea
                            value={editingQuestion}
                            onChange={(e) => setEditingQuestion(e.target.value)}
                            rows={4}
                            placeholder="문의 내용을 입력하세요."
                          />
                          <div className="qna-edit-actions">
                            <button className="btn-save" onClick={() => updateQna(q.id)}>
                              저장
                            </button>
                            <button className="btn-cancel" onClick={cancelEditQna}>
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="pd-qna-detail-body">
                            <div className="detail-question">
                              <div className="detail-label">문의 내용</div>
                              <p>{q.question}</p>
                            </div>
                            {q.answer ? (
                              <div className="detail-answer">
                                <div className="detail-label">답변</div>
                                <p>{q.answer}</p>
                                {q.answeredAt && (
                                  <div className="q-answer-date">
                                    {new Date(q.answeredAt).toLocaleDateString("ko-KR")}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="detail-answer empty">아직 답변이 없습니다.</div>
                            )}
                          </div>

                          {isAnswering && (
                            <div className="qna-answer-form">
                              <textarea
                                value={answerContent}
                                onChange={(e) => setAnswerContent(e.target.value)}
                                rows={3}
                                placeholder="답변을 입력하세요."
                              />
                              <div className="qna-edit-actions">
                                <button className="btn btn-primary" onClick={() => submitAnswer(q.id)}>
                                  답변 등록
                                </button>
                                <button className="btn-cancel" onClick={cancelAnswer}>
                                  취소
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
};

export default ProductQnA;

