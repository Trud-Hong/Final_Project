import React, { useEffect, useState } from "react";
import api from "../api/api";
import PostCard from "./PostCard";
import { useLocation, useNavigate } from "react-router-dom";
import Pagination from "../components/Pagination";   // ⭐ 공용 페이징
import "../styles/sns.css";

export default function SNSHome() {
  const [posts, setPosts] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  // URL 쿼리 파라미터에서 초기값 가져오기
  const searchParams = new URLSearchParams(location.search);
  const initialPage = parseInt(searchParams.get("page") || "0", 10);
  const initialKeyword = searchParams.get("keyword") || "";

  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(6);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [totalPages, setTotalPages] = useState(0);

  // URL 쿼리 파라미터가 변경되면 상태 업데이트 (뒤로가기/앞으로가기 대응)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlPage = parseInt(params.get("page") || "0", 10);
    const urlKeyword = params.get("keyword") || "";
    
    if (urlPage !== page) {
      setPage(urlPage);
    }
    if (urlKeyword !== keyword) {
      setKeyword(urlKeyword);
    }
  }, [location.search]);

  useEffect(() => {
    api
      .get("/posts/search", { params: { page, size, keyword } })
      .then((res) => {
        setPosts(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => console.error("게시글 불러오기 오류:", err));
  }, [page, keyword]);

  // 🔹 검색 버튼 클릭 시: 페이지를 0으로 돌려서 첫 페이지부터 검색
  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set("page", "0");
    
    if (keyword && keyword.trim() !== "") {
      params.set("keyword", keyword.trim());
    }
    
    setPage(0);
    navigate({
      pathname: location.pathname,
      search: params.toString(),
    });
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(location.search);
    params.set("page", newPage);

    if (keyword && keyword.trim() !== "") {
      params.set("keyword", keyword.trim());
    } else {
      params.delete("keyword");
    }

    setPage(newPage);
    navigate({
      pathname: location.pathname,
      search: params.toString(),
    });
  };

  return (
    <>
      {/* Page Header */}
      <div className="container-fluid page-header wow fadeIn" data-wow-delay="0.1s">
          <div className="container">
              <h1 className="display-3 mb-3 animated slideInDown" style={{ marginRight: '300px' }}>
                  커뮤니티
              </h1>
              <nav aria-label="breadcrumb animated slideInDown">
                  <ol className="breadcrumb mb-0">
                      <li className="breadcrumb-item"><a className="text-body" href="/">홈페이지</a></li>
                      <li className="breadcrumb-item"><a className="text-body" href="#">판매정보</a></li>
                      <li className="breadcrumb-item text-dark active" aria-current="page">커뮤니티</li>
                  </ol>
              </nav>
          </div>
      </div>

      <div className="sns-page">
        <div 
            className="section-header text-center mx-auto mb-5 wow fadeInUp" 
            data-wow-delay="0.1s"
            style={{ maxWidth: "700px" }}
        >
            <h1 className="display-5 mb-3">농사팜 커뮤니티</h1>
            <p>여러분의 다양한 소식과 정보를 공유해보세요.</p>
        </div>
        <div className="sns-container"> 
          {/* 🔹 검색 + 버튼 바 */}
          <div className="notice-toolbar">
            <div className="notice-search-wrap">
              <input
                type="text"
                className="notice-search-input"
                placeholder="제목을 입력하세요"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
            </div>

            <div className="notice-toolbar-actions">
              {/* <button
                className="btn btn-outline-primary"
                onClick={handleSearch}
              >
                검색
              </button> */}

              {isLoggedIn && (
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/sns/create")}
                >
                  글쓰기
                </button>
              )}
            </div>
          </div>

          {/* 게시글 카드 */}
          <div className="sns-post-list">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onClick={() => {
                  // 상세페이지로 이동할 때 현재 페이지와 키워드 정보 전달
                  navigate(`/sns/post/${post.id}`, {
                    state: { 
                      returnPage: page, 
                      returnKeyword: keyword 
                    }
                  });
                }}
              />
            ))}
          </div>

          {/* ⭐ 공용 페이징 적용 */}
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </>
  );
}