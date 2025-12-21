//상품 상세페이지 리뷰 확인용

import React, { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../css/productDetailPage.scss';
import Pagination from './Pagination';
import { GiConsoleController } from 'react-icons/gi';

const API_BASE = "http://localhost:8080";

const ProductReview = ({ productId, productName, onLightboxOpen }) => {
  const [productReviews, setProductReviews] = useState([]);
  const [productReviewSort, setProductReviewSort] = useState("recent");
  const nickname = localStorage.getItem("nickname") || localStorage.getItem("username") || "";
  const [newReview, setNewReview] = useState({ rating: 5, content: "", pics: [], author: nickname });
  const reviewFileInputRef = useRef(null);

  // 리뷰 수정 관련 상태
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingReviewContent, setEditingReviewContent] = useState("");
  const [editingReviewRating, setEditingReviewRating] = useState(5);
  const [editingReviewPics, setEditingReviewPics] = useState([]);
  const [editingReviewNewFiles, setEditingReviewNewFiles] = useState([]);
  
  const currentUserId = localStorage.getItem("userId");
  const currentUserRole = localStorage.getItem("role");
  const isAdmin = currentUserRole === "ROLE_ADMIN";

  //페이징
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;

  // 리뷰 목록 불러오기
  const fetchReviews = async (pageNum=0) => {
    try {
      const res = await axios.get(`${API_BASE}/products/${productId}/reviews`);
      const reviews = res.data.map((r) => {
        let createdAtStr = new Date().toISOString();
        if (r.createdAt) {
          if (typeof r.createdAt === 'string') {
            createdAtStr = r.createdAt;
          } else if (r.createdAt instanceof Date) {
            createdAtStr = r.createdAt.toISOString();
          } else {
            createdAtStr = new Date(r.createdAt).toISOString();
          }
        }
        
        // pics 배열 정리 (문자열만 남기기)
        let cleanPics = [];
        if (r.pics && Array.isArray(r.pics)) {
          cleanPics = r.pics
            .map(pic => {
              if (typeof pic === 'string') {
                if (pic.includes('리뷰이미지') && !pic.includes('/') && !pic.includes('http')) {
                  return null;
                }
                return pic.trim();
              } else if (pic && pic.url) {
                return pic.url;
              } else if (pic && typeof pic === 'object') {
                return pic.url || pic.src || null;
              }
              return null;
            })
            .filter(pic => pic !== null && pic !== undefined && pic !== '' && !(typeof pic === 'string' && pic.includes('리뷰이미지') && !pic.includes('/')));
        }
        
        return {
          id: r.id || r._id,
          userId: r.userId || '',
          author: r.author || '익명',
          rating: r.rating || 5,
          content: r.content || '',
          pics: cleanPics,
          createdAt: createdAtStr
        };
      });

      const startIndex = pageNum*pageSize;
      const pagedReviews = reviews.slice(startIndex, startIndex + pageSize);

      setProductReviews(pagedReviews);
      setPage(pageNum);
      setTotalPages(Math.ceil(reviews.length/pageSize));
    } catch (error) {
      console.error("리뷰 API 호출 실패:", error);
      setProductReviews([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  const handlePageChange = (p) => {
    fetchReviews(p);
  };

  // 파일 업로드 함수
  const uploadReviewImages = async (files) => {
    if (!files || files.length === 0) return [];
    
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("type", "review-images");

    try {
      const res = await axios.post(
        `${API_BASE}/files/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
      return res.data || [];
    } catch (err) {
      console.error("이미지 업로드 실패:", err);
      return [];
    }
  };

  // 리뷰 작성: 이미지 선택
  const onReviewFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map((f) => ({ file: f, url: URL.createObjectURL(f), isNew: true }));
    setNewReview((prev) => ({ ...prev, pics: [...(prev.pics || []), ...previews] }));
    e.target.value = "";
  };

  const removeNewReviewPic = (idx) => {
    setNewReview((prev) => {
      const filtered = prev.pics.filter((_, i) => i !== idx);
      const removed = prev.pics[idx];
      if (removed && removed.isNew && removed.url) {
        URL.revokeObjectURL(removed.url);
      }
      return { ...prev, pics: filtered };
    });
  };

  // 리뷰 작성
  const submitReview = async () => {
    const token = localStorage.getItem("token");

    if(!newReview.content) {
      alert("내용을 입력해주세요.");
      return;
    }

    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const newImageFiles = newReview.pics.filter(p => p.isNew && p.file).map(p => p.file);
      let uploadedImageUrls = [];
      
      if (newImageFiles.length > 0) {
        uploadedImageUrls = await uploadReviewImages(newImageFiles);
      }
      
      const existingUrls = newReview.pics
        .filter(p => !p.isNew && typeof p === 'string' && p.trim() !== '' && (p.startsWith('/') || p.startsWith('http')))
        .map(p => p.trim());
      const allImageUrls = [...existingUrls, ...uploadedImageUrls].filter(url => url && url.trim() !== '');

      newReview.pics.forEach(p => {
        if (p.isNew && p.url) {
          URL.revokeObjectURL(p.url);
        }
      });

      await axios.post(
        `${API_BASE}/products/${productId}/reviews`,
        {
          product: productName,
          //혜정 11/26 추가

          rating: newReview.rating,
          content: newReview.content,
          pics: allImageUrls
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      await fetchReviews();
      setNewReview({rating: 5, content: "", pics: [], author: nickname});
      alert("리뷰가 등록되었습니다.");
    } catch (err) {
      console.error("리뷰 등록 실패:", err);
      alert("리뷰 등록 실패: " + (err.response?.data?.message || err.message));
    }
  };

  // 리뷰 수정
  const updateReview = async (reviewId) => {
    if (!editingReviewContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const newImageFiles = editingReviewNewFiles.filter(f => f.file).map(f => f.file);
      let uploadedImageUrls = [];
      
      if (newImageFiles.length > 0) {
        uploadedImageUrls = await uploadReviewImages(newImageFiles);
      }
      
      const existingUrls = editingReviewPics.filter(p => typeof p === 'string').map(p => p);
      const allImageUrls = [...existingUrls, ...uploadedImageUrls];

      editingReviewNewFiles.forEach(f => {
        if (f.url) URL.revokeObjectURL(f.url);
      });

      await axios.put(
        `${API_BASE}/products/${productId}/reviews/${reviewId}`,
        {
          rating: editingReviewRating,
          content: editingReviewContent,
          pics: allImageUrls
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchReviews();
      
      setEditingReviewId(null);
      setEditingReviewContent("");
      setEditingReviewRating(5);
      setEditingReviewPics([]);
      setEditingReviewNewFiles([]);
      
      alert("리뷰가 수정되었습니다.");
    } catch (error) {
      console.error("리뷰 수정 실패:", error);
      const errorMsg = error.response?.data?.message || error.message || "리뷰 수정에 실패했습니다.";
      alert(errorMsg);
    }
  };

  // 리뷰 삭제
  const deleteReview = async (reviewId) => {
    if (!window.confirm("정말 이 리뷰를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${API_BASE}/products/${productId}/reviews/${reviewId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchReviews();
      alert("리뷰가 삭제되었습니다.");
    } catch (error) {
      console.error("리뷰 삭제 실패:", error);
      const errorMsg = error.response?.data?.message || error.message || "리뷰 삭제에 실패했습니다.";
      alert(errorMsg);
    }
  };

  // 리뷰 수정 모드 진입
  const startEditReview = (review) => {
    setEditingReviewId(review.id);
    setEditingReviewContent(review.content);
    setEditingReviewRating(review.rating);
    setEditingReviewPics(review.pics || []);
    setEditingReviewNewFiles([]);
  };

  // 리뷰 수정 취소
  const cancelEditReview = () => {
    editingReviewNewFiles.forEach(f => {
      if (f.url) URL.revokeObjectURL(f.url);
    });
    
    setEditingReviewId(null);
    setEditingReviewContent("");
    setEditingReviewRating(5);
    setEditingReviewPics([]);
    setEditingReviewNewFiles([]);
  };

  // 수정 모드에서 이미지 추가
  const onEditReviewFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map((f) => ({ file: f, url: URL.createObjectURL(f), isNew: true }));
    setEditingReviewNewFiles((prev) => [...prev, ...previews]);
    e.target.value = "";
  };

  // 수정 모드에서 기존 이미지 삭제
  const removeEditReviewPic = (idx, isExisting) => {
    if (isExisting) {
      setEditingReviewPics((prev) => prev.filter((_, i) => i !== idx));
    } else {
      const removed = editingReviewNewFiles[idx];
      if (removed && removed.url) {
        URL.revokeObjectURL(removed.url);
      }
      setEditingReviewNewFiles((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  // 수정 모드에서 새 이미지 삭제
  const removeEditReviewNewPic = (idx) => {
    const removed = editingReviewNewFiles[idx];
    if (removed && removed.url) {
      URL.revokeObjectURL(removed.url);
    }
    setEditingReviewNewFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // 리뷰 정렬
  const sortedProductReviews = useMemo(() => {
    const copy = [...productReviews];
    if (productReviewSort === "recent") {
      return copy.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    }
    if (productReviewSort === "high") return copy.sort((a, b) => b.rating - a.rating);
    if (productReviewSort === "low") return copy.sort((a, b) => a.rating - b.rating);
    return copy;
  }, [productReviews, productReviewSort]);

  return (
    <div className="pd-reviews">
      <div className="pd-section-head">
        <h4>리뷰 ({productReviews.length})</h4>
        <div className="pd-review-controls">
          <select 
            className="custom-select"
            value={productReviewSort} 
            onChange={(e) => setProductReviewSort(e.target.value)}
          >
            <option value="recent">최신순</option>
            <option value="high">평점 높은순</option>
            <option value="low">평점 낮은순</option>
          </select>
        </div>
      </div>

      {/* <div className="pd-review-write">
        {localStorage.getItem("isLoggedIn") === "true" ? (
          <>
            <input 
              placeholder="작성자" 
              value={nickname} 
              readOnly
              disabled
              style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
            />
            <div className="pd-review-rating">
              <label>평점: </label>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  style={{ 
                    cursor: "pointer", 
                    fontSize: "20px",
                    color: star <= newReview.rating ? "#ffc107" : "#ddd"
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <textarea 
              placeholder="리뷰를 작성하세요." 
              value={newReview.content} 
              onChange={(e) => setNewReview({ ...newReview, content: e.target.value })} 
            />
          
        <div className="pd-review-tools">
          <label className="pd-file-label">
            사진업로드
            <input ref={reviewFileInputRef} type="file" accept="image/*" multiple onChange={onReviewFiles} />
          </label>
          <div className="pd-upload-preview">
            {(newReview.pics || []).map((p, i) => (
              <div key={i} className="pd-upload-thumb">
                <img src={typeof p === 'string' ? p : p.url} alt="" />
                <button 
                  className="btn-remove-preview"
                  onClick={() => removeNewReviewPic(i)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
            <div className="pd-review-actions">
              <button onClick={submitReview}>리뷰 등록</button>
            </div>
        </div>
        </>
        ) : (
          <div className="alert alert-info">리뷰 작성은 로그인 후 가능합니다.</div>
        )}
      </div> */}

      <div className="pd-review-list">
        {sortedProductReviews.length === 0 ? (
          <div className="pd-review-empty">아직 작성된 리뷰가 없습니다.</div>
        ) : (
          sortedProductReviews.map((r) => {
            const reviewUserId = String(r.userId || '');
            const myUserId = String(currentUserId || '');
            const currentNickname = localStorage.getItem("nickname") || localStorage.getItem("username") || '';
            const isMyReview = (reviewUserId === myUserId && reviewUserId !== '') || 
                              (r.author === currentNickname && currentNickname !== '');
            const isEditing = editingReviewId === r.id;
            
            return (
              <div key={r.id} className="pd-review-item">
                <div className="pd-review-header">
                  <div className="pd-review-meta">
                    <strong className="pd-review-author">{r.author}</strong>
                    <div className="pd-review-rating-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={star <= r.rating ? "star-filled" : "star-empty"}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="pd-review-date">{new Date(r.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                  {((isMyReview && !isEditing && currentUserId) || (isAdmin && !isEditing && currentUserId)) && (
                    <div className="pd-review-actions-buttons">
                      {isMyReview && (
                        <button 
                          className="btn-edit"
                          onClick={() => startEditReview(r)}
                        >
                          수정
                        </button>
                      )}
                      <button 
                        className="btn-delete"
                        onClick={() => deleteReview(r.id)}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="pd-review-edit-form">
                    <div className="pd-review-rating-edit">
                      <label>평점:</label>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star-edit ${star <= editingReviewRating ? "star-filled" : "star-empty"}`}
                          onClick={() => setEditingReviewRating(star)}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <textarea
                      className="pd-review-content-edit"
                      value={editingReviewContent}
                      onChange={(e) => setEditingReviewContent(e.target.value)}
                      placeholder="리뷰 내용을 수정하세요."
                      rows={4}
                    />
                    <div className="pd-review-images-edit">
                      {/* 기존 이미지 */}
                      {editingReviewPics.map((pic, idx) => {
                        const picUrl = typeof pic === 'string' ? pic : (pic.url || pic);
                        // blob URL, http/https URL, //로 시작하는 URL 체크
                        let imageUrl = picUrl;
                        if (!picUrl.startsWith('http') && !picUrl.startsWith('//') && !picUrl.startsWith('blob:')) {
                          imageUrl = `${API_BASE}${picUrl.startsWith('/') ? picUrl : '/' + picUrl}`;
                        }
                        
                        return (
                          <div key={`existing-${idx}`} className="pd-review-pic-preview">
                            <img src={imageUrl} alt="" />
                            <button 
                              className="btn-remove-pic"
                              onClick={() => removeEditReviewPic(idx, true)}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                      {/* 새로 추가한 이미지 */}
                      {editingReviewNewFiles.map((pic, idx) => (
                        <div key={`new-${idx}`} className="pd-review-pic-preview">
                          <img src={pic.url} alt="" />
                          <button 
                            className="btn-remove-pic"
                            onClick={() => removeEditReviewNewPic(idx)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <label className="pd-file-label">
                        📷 사진 추가
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          onChange={onEditReviewFiles}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                    <div className="pd-review-edit-actions">
                      <button className="btn-save" onClick={() => updateReview(r.id)}>
                        저장
                      </button>
                      <button className="btn-cancel" onClick={cancelEditReview}>
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="pd-review-content">{r.content}</div>
                    {r.pics && r.pics.length > 0 && (
                      <div className="pd-review-pics">
                        {r.pics
                          .filter(picUrl => {
                            if (!picUrl) return false;
                            if (typeof picUrl === 'string') {
                              if (picUrl.trim() === '') return false;
                              if (picUrl.includes('리뷰이미지') && !picUrl.includes('/') && !picUrl.includes('http') && !picUrl.includes('.')) {
                                return false;
                              }
                              return true;
                            }
                            if (typeof picUrl === 'object') {
                              return !!(picUrl.url || picUrl.src);
                            }
                            return false;
                          })
                          .map((picUrl, idx) => {
                            let imageUrl = '';
                            if (typeof picUrl === 'string') {
                              // blob URL, http/https URL, //로 시작하는 URL은 그대로 사용
                              if (picUrl.startsWith('http') || picUrl.startsWith('//') || picUrl.startsWith('blob:')) {
                                imageUrl = picUrl;
                              } else {
                                imageUrl = `${API_BASE}${picUrl.startsWith('/') ? picUrl : '/' + picUrl}`;
                              }
                            } else if (picUrl && typeof picUrl === 'object') {
                              const objUrl = picUrl.url || picUrl.src || '';
                              // blob URL, http/https URL, //로 시작하는 URL은 그대로 사용
                              if (objUrl.startsWith('http') || objUrl.startsWith('//') || objUrl.startsWith('blob:')) {
                                imageUrl = objUrl;
                              } else {
                                imageUrl = objUrl ? `${API_BASE}${objUrl.startsWith('/') ? objUrl : '/' + objUrl}` : '';
                              }
                            }
                            
                            // 유효하지 않은 URL 필터링
                            if (!imageUrl || imageUrl.trim() === '' || (imageUrl.includes('리뷰이미지') && !imageUrl.includes('/') && !imageUrl.includes('.'))) {
                              return null;
                            }
                            
                            return (
                              <div 
                                key={idx} 
                                className="pd-review-pic-item"
                                onClick={() => onLightboxOpen && onLightboxOpen(imageUrl)}
                              >
                                <img 
                                  src={imageUrl} 
                                  alt=""
                                  loading="lazy"
                                  onError={(e) => {
                                    console.error('이미지 로드 실패:', imageUrl);
                                    e.target.parentElement.style.display = 'none';
                                  }}
                                />
                              </div>
                            );
                          })
                          .filter(item => item !== null)
                        }
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
};

export default ProductReview;
