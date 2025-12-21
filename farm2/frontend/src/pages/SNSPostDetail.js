import React, { useEffect, useState, useRef } from "react";
import api from "../api/api";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "quill/dist/quill.snow.css";
import "../styles/sns.css";

export default function SNSPostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("userId")
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const isAdmin = localStorage.getItem("role") === "ROLE_ADMIN";

  // 좋아요 상태
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // 댓글 수정 상태
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // 게시글 + 댓글 불러오기
  useEffect(() => {
    api.get(`/posts/${id}`).then((res) => {
      setPost(res.data);
    });

    api.get(`/comments/${id}`).then((res) => {
      setComments(res.data);
    });
  }, [id]);

  // 좋아요 불러오기
  useEffect(() => {
    const userId = localStorage.getItem("userId");

    api.get(`/likes/count/${id}`).then((res) => {
      setLikeCount(res.data);
    });

    if (userId) {
      api.post(`/likes/check`, { postId: id, userId }).then((res) => {
        setLiked(res.data.liked);
      });
    } else {
      setLiked(false);
    }
  }, [id]);

  // 로그인 체크 (한 번만 실행되도록 ref 사용)
  const loginCheckDone = useRef(false);
  useEffect(() => {
    if (loginCheckDone.current) return;
    loginCheckDone.current = true;
    
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // 댓글 등록
  const submitComment = () => {
    if (!comment.trim()) return;

    api
      .post(`/comments`, {
        postId: id,
        userId: userId,
        content: comment,
      })
      .then(() => {
        setComment("");
        return api.get(`/comments/${id}`);
      })
      .then((res) => setComments(res.data));
  };

  // 좋아요 토글
  const toggleLike = () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      alert("로그인이 필요합니다.");
      return;
    }

    api
      .post(`/likes/${id}`, { userId })
      .then((res) => {
        setLiked(res.data.liked);
        return api.get(`/likes/count/${id}`);
      })
      .then((countRes) => {
        setLikeCount(countRes.data);
      });
  };

  // 공유하기
  const sharePost = async () => {
    const url = window.location.href;
    
    try {
      // Clipboard API가 사용 가능한 경우
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        alert("게시글 링크가 복사되었습니다!");
      } else {
        // Fallback: 구식 방법 사용
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            alert("게시글 링크가 복사되었습니다!");
          } else {
            // 복사 실패 시 사용자에게 수동 복사 안내
            prompt("링크를 복사하세요:", url);
          }
        } catch (err) {
          console.error('Fallback 복사 실패:', err);
          prompt("링크를 복사하세요:", url);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      // 에러 발생 시 사용자에게 수동 복사 안내
      prompt("링크를 복사하세요:", url);
    }
  };

  const editPost = () => {
    window.location.href = `/sns/edit/${id}`
  }

  const deletePost = () => {
    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;

    api
      .delete(`/posts/${id}`)
      .then(() => {
        alert("게시글이 삭제되었습니다.");
        // 삭제 후 목록으로 돌아갈 때도 페이지 정보 유지
        const returnPage = location.state?.returnPage ?? 0;
        const returnKeyword = location.state?.returnKeyword ?? "";
        
        const params = new URLSearchParams();
        if (returnPage > 0) {
          params.set("page", returnPage);
        }
        if (returnKeyword) {
          params.set("keyword", returnKeyword);
        }
        
        navigate(`/sns${params.toString() ? `?${params.toString()}` : ""}`);
      })
      .catch((err) => {
        console.error("삭제 오류:", err);
        alert("게시글 삭제에 실패했습니다.");
      });
  }

  // 댓글 수정 시작
  const startEditComment = (commentId, currentContent) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentContent);
  };

  // 댓글 수정 취소
  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  // 댓글 수정 저장
  const saveEditComment = (commentId) => {
    if (!editingCommentText.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    api
      .put(`/comments/${commentId}`, {
        content: editingCommentText,
        userId: localStorage.getItem("userId")
      })
      .then(() => {
        setEditingCommentId(null);
        setEditingCommentText("");
        return api.get(`/comments/${id}`);
      })
      .then((res) => setComments(res.data))
      .catch((err) => {
        console.error("댓글 수정 오류:", err);
        alert("댓글 수정에 실패했습니다.");
      });
  };

  if (!post) return <div className="sns-loading">Loading...</div>;

  return (
    <>
      <div className="sns-detail-container">
        {/* 본문 박스 */}
        <div className="sns-detail-box">
          {/* 작성자 + 날짜 + 조회수 */}
          <div className="sns-detail-header">
            <div className="sns-detail-author">
              <div className="sns-author-info">
                <span className="sns-author-name">{post.nickname || "익명"}</span>
                <span className="sns-detail-date">{post.createdAt?.split("T")[0]}</span>
              </div>
            </div>
            <div className="sns-detail-meta">
              <span className="sns-meta-item">
                <i className="fa fa-eye"></i> {post.views}
              </span>
            </div>
          </div>

          {/* 제목 */}
          <h1 className="sns-detail-title">{post.title}</h1>

          {/* 이미지 */}
          {post.imageUrl && (
            <div className="sns-detail-image-box">
              <img
                src={`http://localhost:8080${post.imageUrl}`}
                alt="게시글 이미지"
                className="sns-detail-image"
              />
            </div>
          )}

          {/* 내용 */}
          <div className="sns-detail-content ql-editor">{post.content}</div>

          {/* 좋아요 + 공유 버튼 */}
          <div className="sns-detail-actions">
            <button 
              className="btn btn-outline-primary" 
              onClick={() => {
                // 목록으로 돌아갈 때 이전 페이지 정보 복원
                const returnPage = location.state?.returnPage ?? 0;
                const returnKeyword = location.state?.returnKeyword ?? "";
                
                const params = new URLSearchParams();
                if (returnPage > 0) {
                  params.set("page", returnPage);
                }
                if (returnKeyword) {
                  params.set("keyword", returnKeyword);
                }
                
                navigate(`/sns${params.toString() ? `?${params.toString()}` : ""}`);
            }}>목록으로</button>

            <div style={{display: 'flex', gap: '12px'}}>
              <button className="btn btn-light" onClick={toggleLike}>
                <span className="sns-btn-icon">{liked ? "❤️" : "🤍"}</span>
                <span className="sns-btn-text">좋아요 {likeCount}</span>
              </button>

              <button className="btn btn-outline-primary" onClick={sharePost}>
                <span className="sns-btn-text">공유하기</span>
              </button>
              
              {/* 작성자만 수정/삭제 버튼 표시 */}
              {((userId && post.userId === userId) || isAdmin) && (
                <>
                  {userId && post.userId === userId && (
                    <button className="btn btn-warning" onClick={editPost}>
                      <span className="sns-btn-text">수정</span>
                    </button>
                  )}
                  <button className="btn btn-danger" onClick={deletePost}>
                    <span className="sns-btn-text">삭제</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>

        {/* 댓글 영역 */}
        <div className="sns-comment-section">
          <h3 className="sns-comment-title">댓글</h3>

          {comments.length === 0 ? (
            <div className="sns-comment-empty">아직 댓글이 없습니다.</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="sns-comment-item">
                <div className="sns-comment-content">
                  <div className="sns-comment-header">
                    <span className="sns-comment-author">{c.nickname || "익명"}</span>
                    <span className="sns-comment-date">
                      {c.createdAt?.split("T")[0]}
                    </span>
                  </div>

                  {/* 편집 모드일 때 */}
                  {editingCommentId === c.id ? (
                    <div className="sns-comment-edit-mode">
                      <textarea
                        className="sns-comment-edit-input"
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        rows={3}
                        placeholder="댓글을 수정하세요..."
                      />
                      <div className="sns-comment-edit-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => saveEditComment(c.id)}
                        >
                          저장
                        </button>
                        <button
                          className="btn btn-outline-primary"
                          onClick={cancelEditComment}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="sns-comment-text">
                        {c.content.split("\n").map((line, idx) => (
                          <span key={idx}>
                            {line}
                            <br />
                          </span>
                        ))}
                      </div>

                      {/* 댓글 수정/삭제 버튼 */}
                      {(localStorage.getItem("userId") === c.userId || isAdmin) && (
                        <div className="sns-comment-actions">
                          {localStorage.getItem("userId") === c.userId && (
                            <button
                              className="btn btn-warning"
                              onClick={() => startEditComment(c.id, c.content)}
                            >
                              수정
                            </button>
                          )}

                          <button
                            className="btn btn-danger"
                            onClick={() => {
                              if (window.confirm("댓글을 삭제하시겠습니까?")) {
                                const token = localStorage.getItem("token");
                                api.delete(`/comments/${c.id}`, {
                                  headers: {
                                    Authorization: `Bearer ${token}`
                                  }
                                })
                                .then(() => {
                                  return api.get(`/comments/${id}`);
                                }).then((res) => setComments(res.data))
                                  .catch((err) => {
                                    console.error("댓글 삭제 오류:", err);
                                    const errorMessage = err.response?.data?.message || err.message || "댓글 삭제에 실패했습니다.";
                                    alert(errorMessage);
                                  });
                              }
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}


          {/* 댓글 입력 */}
          <div className="sns-comment-write">
            <div className="sns-comment-input-wrapper">
              <input
                className="sns-comment-input"
                placeholder="댓글을 입력하세요..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitComment();
                  }
                }}
              />
              <button className="btn btn-primary" onClick={submitComment}>
                등록
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
