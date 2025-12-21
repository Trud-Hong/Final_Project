import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "quill/dist/quill.snow.css";
import "../css/MyPage.css"; 

export default function NoticeDetail() {
  const { id } = useParams();
  const [notice, setNotice] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const [isLoggedIn, setIsLoggedIn] = useState();

  // Hover states
  const [hoverList, setHoverList] = useState(false);
  const [hoverEdit, setHoverEdit] = useState(false);
  const [hoverDelete, setHoverDelete] = useState(false);

  useEffect(() => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";

      setIsLoggedIn(loggedIn);
  }, [location.pathname]);

  useEffect(() => {
    const fetch = async () => {
      await axios.post(`http://localhost:8080/api/notice/views/${id}`);
      const res = await axios.get(`http://localhost:8080/api/notice/${id}`);
      setNotice(res.data);
    };
    fetch();
  }, [id]);

  if (!notice) return <div className="container py-5">로딩중...</div>;

  return (
    <div>
      <div>
                {/* Page Header */}
            <div className="container-fluid page-header wow fadeIn" data-wow-delay="0.1s">
                <div className="container">
                    <h1 className="display-3 mb-3 animated slideInDown" style={{ marginRight: '300px' }}>
                        공지사항
                    </h1>
                    <nav aria-label="breadcrumb animated slideInDown">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><a className="text-body" href="/">홈페이지</a></li>
                            <li className="breadcrumb-item"><a className="text-body" href="#">판매정보</a></li>
                            <li className="breadcrumb-item text-dark active" aria-current="page">공지사항</li>
                        </ol>
                    </nav>
                </div>
            </div>

      {/* Content */}
      <div className="container py-5" style={{ maxWidth: "900px" }}>
        <div className="p-4 shadow rounded bg-white">
          <h2 className="fw-bold mb-3">{notice.title}</h2>

          <div className="d-flex justify-content-between text-muted small mb-4">
            <div>{new Date(notice.createdAt).toLocaleString()}</div>
            <div>👁 {notice.views}</div>
          </div>

          <hr />

          <div
            className="notice-content ql-editor mt-4"
            style={{ lineHeight: "1.8", fontSize: "1.05rem" }}
            dangerouslySetInnerHTML={{
              __html: notice.content.replaceAll(
                'src="/uploads',
                'src="http://localhost:8080/uploads'
              ),
            }}
          />

          <hr className="my-4" />

          <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-2">

          {/* 버튼 전체 컨테이너 */}
<div className="d-flex justify-content-between align-items-center mt-4 w-100">

 <button
  onClick={() => navigate(`/notice${location.search || ""}`)}
  type="button"
  className="btn btn-outline-primary"
  style={{ padding: "6px 12px", fontSize: "16px" }}
>
  목록으로
</button>


  {/* 오른쪽: 수정 + 삭제 */}
  {isLoggedIn && role === "ROLE_ADMIN" && (
    <div className="d-flex gap-2">
      <button
        type="button"
        className="btn btn-primary"
        style={{ padding: "6px 12px", fontSize: "16px" }}
        onClick={() => navigate(`/notice/edit/${id}`)}
      >
        수정
      </button>

     <button
  type="button"
  className="btn btn-outline-primary"
  style={{ padding: "6px 12px", fontSize: "16px" }}
  onClick={async () => {
    if (window.confirm("삭제하시겠습니까?")) {
      await axios.delete(
        `http://localhost:8080/api/notice/delete/${id}`
      );
      alert("삭제 완료");
      navigate(`/notice${location.search || ""}`);
    }
  }}
>
  삭제
</button>

    </div>
  )}

</div>


            </div>

        </div>
      </div>
    </div>
    </div>
  );
}
