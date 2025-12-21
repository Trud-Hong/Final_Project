import React, { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/postcard.css";

const BACKEND_URL = "http://localhost:8080";

// 날짜 포맷 함수 ...
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = (now - date) / 1000;

  const minutes = Math.floor(diff / 60);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;

  const weeks = Math.floor(days / 7);
  return `${weeks}주 전`;
};

// 조회수 포맷 함수
const formatViews = (num) => {
  if (!num) return 0;
  if (num < 1000) return num;
  if (num < 10000) return (num / 1000).toFixed(1) + "천";
  return (num / 10000).toFixed(1) + "만";
};

export default function PostCard({ post, onClick }) {
  const postId = post._id || post.id;

  // 좋아요 상태 + 좋아요 개수
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);

useEffect(() => {
  const userId = localStorage.getItem("userId");

  // 좋아요 개수는 항상 불러오기
  api.get(`/likes/count/${postId}`).then((res) => {
    setLikeCount(res.data);
  });

  // 로그인한 경우에만 '내가 좋아요 눌렀는지' 체크
  if (userId) {
    api.post(`/likes/check`, { postId, userId }).then((res) => {
      setLiked(res.data.liked);
    });
  } else {
    setLiked(false); // 로그아웃 상태에서는 항상 🤍 표시
  }
}, [postId]);


  return (
    <div className="mag-card" onClick={onClick}>
      <div className="mag-image-box">
        {post.imageUrl && post.imageUrl.trim() !== "" ? (
          <img
            src={`http://localhost:8080${post.imageUrl}`}
            className="mag-image"
            alt="post"
          />
        ) : null}   {/* ← 이미지 없으면 아무것도 렌더링하지 않음 */}
      </div>


      <div className="mag-content">
        <h3 className="mag-title">{post.title}</h3>
        <p className="mag-desc">{post.content.slice(0, 60)}</p>

        <div className="mag-meta">
          {/* 작성자 */}
          <span className="mag-author">{post.nickname || "익명"}</span>

          {/* 날짜 */}
          <span>{formatDate(post.createdAt)}</span>

          {/* 조회수 */}
          <span>
            <i className="fa fa-eye"></i> {formatViews(post.views)}
          </span>

          {/* 댓글 */}
         <span className="mag-comment">💬 {post.commentCount || 0}</span>


          {/* ❤️ 좋아요 표시 */}
          <span className="mag-like">
            {liked ? "❤️" : "🤍"} {likeCount}
          </span>
          
        </div>
      </div>
    </div>
  );
}
