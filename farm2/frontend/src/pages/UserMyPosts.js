import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import Pagination from "../components/Pagination";   // ⭐ 페이징 공용 컴포넌트
import "../styles/myposts.css";                      // 기존 스타일 유지
import "../styles/pagination.css";                   // ⭐ 검색창 + 페이징 디자인

import GotoBack from "../components/GotoBack";

export default function UserMyPosts() {
  const [myPosts, setMyPosts] = useState([]);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(6);
  const [keyword, setKeyword] = useState("");
  const [totalPages, setTotalPages] = useState(0);

  const navigate = useNavigate();

  // 로그인 체크
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
  }, []);

  // 🔥 검색 + 페이징 기반 데이터 로딩
  useEffect(() => {
    const userId = localStorage.getItem("userId");

    api
      .get("/posts/search", {
        params: {
          page,
          size,
          keyword,
          userId,
        },
      })
      .then((res) => {
        setMyPosts(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => console.error("내 글 가져오기 오류:", err));
  }, [page, keyword]);

  // 삭제 기능 유지
  const handleDelete = async (postId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    await api.delete(`/posts/${postId}`);

    setMyPosts(myPosts.filter((post) => post.id !== postId));
  };

  return (
    <div className="myposts-wrapper">
      <h2 className="myposts-title">내가 작성한 게시글</h2>

      {/* 🔍 검색창 */}
      <div className="sns-search-box">
        <input
          type="text"
          className="sns-search-input"
          placeholder="제목 검색"
          value={keyword}
          onChange={(e) => {
            setPage(0);
            setKeyword(e.target.value);
          }}
        />
      </div>

      {/* 게시글 없음 */}
      {myPosts.length === 0 && (
        <p className="myposts-empty">작성한 게시글이 없습니다.</p>
      )}

      {/* 게시글 카드 */}
      <div className="myposts-list">
        {myPosts.map((post) => (
          <div key={post.id} className="myposts-card">
            <div className="myposts-image-box">
              <img
                src={
                  post.imageUrl && post.imageUrl.trim() !== ""
                    ? `http://localhost:8080${post.imageUrl}`
                    : "/defaultImage.jpg"
                }
                alt="post"
                className="myposts-image"
              />
            </div>

            <div className="myposts-content">
              <h3 className="myposts-post-title">{post.title}</h3>
              <p className="myposts-post-date">
                {post.createdAt?.slice(0, 10)}
              </p>

              <div className="myposts-buttons">
                <button
                  className="myposts-edit-btn"
                  onClick={() => navigate(`/sns/edit/${post.id}`)}
                >
                  수정하기
                </button>

                <button
                  className="myposts-delete-btn"
                  onClick={() => handleDelete(post.id)}
                >
                  삭제하기
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* ⭐ 페이징 */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
               <GotoBack />
    </div>
  );
}
