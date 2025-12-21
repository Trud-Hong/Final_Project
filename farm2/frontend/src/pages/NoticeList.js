import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Pagination from "../components/Pagination";

export default function NoticeList() {
  const [list, setList] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");  
  const [searchKeyword, setSearchKeyword] = useState(""); 
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState();
  const [initialized, setInitialized] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const pageParam = parseInt(params.get("page") || "0", 10);
    const keywordParam = params.get("keyword") || "";

    setPage(isNaN(pageParam) ? 0 : pageParam);
    setKeywordInput(keywordParam);
    setSearchKeyword(keywordParam);
    setInitialized(true); 
  }, [location.search]);

  useEffect(() => {
    if (!initialized) return; 

    const fetchData = async () => {
      const res = await axios.get("http://localhost:8080/api/notice/list", {
        params: { page, size: 10, keyword: searchKeyword },
      });
      setList(res.data.content);
     setTotalPages(res.data.totalPages);
    };

   fetchData();
  }, [page, searchKeyword, initialized]);

  const handleSearch = () => {
   const params = new URLSearchParams(location.search);
   const trimmed = keywordInput.trim();

   // 항상 첫 페이지부터 검색
   params.set("page", 0);

   if (trimmed) {
      params.set("keyword", trimmed);
    } else {
      params.delete("keyword"); // 검색어 없으면 깔끔하게 제거
    }

    navigate({
     pathname: location.pathname,
      search: params.toString(),
    });
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(location.search);
    params.set("page", newPage);

    if (searchKeyword && searchKeyword.trim() !== "") {
      params.set("keyword", searchKeyword.trim());
    } else {
      params.delete("keyword");
    }

    navigate({
      pathname: location.pathname,
      search: params.toString(),
    });
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("ko-KR").replace(/\.$/, "");

  return (
    <div>
      {/* Page Header */}
      <div
        className="container-fluid page-header wow fadeIn"
        data-wow-delay="0.1s"
      >
        <div className="container">
          <h1
            className="display-3 mb-3 animated slideInDown"
            style={{ marginRight: "300px" }}
          >
            공지사항
          </h1>
          <nav aria-label="breadcrumb animated slideInDown">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a className="text-body" href="/">
                  홈페이지
                </a>
              </li>
              <li className="breadcrumb-item">
                <a className="text-body" href="#">
                  판매정보
                </a>
              </li>
              <li
                className="breadcrumb-item text-dark active"
                aria-current="page"
              >
                공지사항
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="container py-5">
        {/* 검색 + 버튼 바 */}
        <div className="notice-toolbar">
          <div className="notice-search-wrap">
            <input
              type="text"
              className="notice-search-input"
              placeholder="검색어를 입력하세요"
              value={keywordInput}  
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch(); 
              }}
            />
          </div>

          <div className="notice-toolbar-actions">
            <button className="btn btn-outline-primary" onClick={handleSearch}>
              검색
            </button>

            {isLoggedIn && role === "ROLE_ADMIN" && (
              <button
                className="btn btn-primary"
                onClick={() => navigate("/notice/write")}
              >
                공지사항 작성
              </button>
            )}
          </div>
        </div>

        {list.length === 0 ? (
  <div className="text-center text-muted py-4">
    등록된 공지사항이 없습니다.
  </div>
) : (
  <div className="notice-list-wrapper">
    <ul className="notice-list mt-3">
      {list.map((n) => (
        <li
          key={n.id}
          className={`notice-item ${n.pinned ? "notice-item-pinned" : ""}`}
          onClick={() => navigate(`/notice/${n.id}${location.search}`)}
        >

          <div className="notice-left">
            <span className={`notice-tag ${n.pinned ? "notice-tag-pinned" : ""}`}>
              [공지]
            </span>
            <span className="notice-title">{n.title}</span>
          </div>

          <div className="notice-right">
            <span className="notice-writer">{n.writerNickname}</span>
            <span className="notice-date">
              {formatDate(n.createdAt)}
            </span>
            <span className="notice-views">
              {n.views} <span className="ms-1">👁</span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  </div>
)}


                {totalPages > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

      </div>
    </div>
  );
}
