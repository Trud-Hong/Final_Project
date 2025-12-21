import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

export default function NoticeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [isPinned, setIsPinned] = useState(false); // ✅ 상단 고정 상태

  const { quill, quillRef } = useQuill({
    theme: "snow",
    modules: {
      toolbar: [
        [{ header: 1 }, { header: 2 }],
        [{ size: [] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "image"],
        ["clean"],
      ],
    },
  });

  useEffect(() => {
    axios.get(`http://localhost:8080/api/notice/${id}`).then((res) => {
      setTitle(res.data.title);
      setIsPinned(res.data.pinned ?? false); // ✅ DB에 저장된 상단 고정 값 세팅

      const html = res.data.content.replaceAll(
        'src="/uploads',
        'src="http://localhost:8080/uploads'
      );

      quill?.clipboard.dangerouslyPasteHTML(html);
    });
  }, [id, quill]);

  const handleUpdate = async () => {
    if (!quill) return;

    const html = quill.root.innerHTML;
    const contentForSave = html.replaceAll(
      'src="http://localhost:8080/uploads',
      'src="/uploads'
    );

    await axios.put("http://localhost:8080/api/notice/update", {
      id,
      title,
      content: contentForSave,
      pinned: isPinned, // ✅ 수정 시에도 상단 고정 값 같이 전송
    });

    alert("수정 완료");
    navigate("/notice");
  };

  return (
    <div>
      {/* Header */}
      <div className="container-fluid page-header wow fadeIn" data-wow-delay="0.1s">
        <div className="container">
          <h1
            className="display-3 mb-3 animated slideInDown"
            style={{ marginRight: "300px" }}
          >
            공지사항 수정
          </h1>
        </div>
      </div>

      <div className="container py-5" style={{ maxWidth: "900px" }}>
        {/* 제목 입력 */}
        <input
          className="form-control mb-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* 에디터 */}
        <div ref={quillRef} style={{ height: 350, marginBottom: 60 }} />

        {/* ✅ 버튼 + 상단 고정 토글 (작성 페이지와 동일 스타일) */}
        <div className="mt-4 d-flex align-items-center w-100 gap-2 justify-content-end">
          {/* 상단 고정 토글 스위치 - 수정 완료 버튼 옆 */}
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: "16px", userSelect: "none" }}>상단 고정</span>
            <label
              htmlFor="pinCheckEdit"
              style={{
                position: "relative",
                display: "inline-block",
                width: "50px",
                height: "26px",
                cursor: "pointer",
              }}
            >
              <input
                id="pinCheckEdit"
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: isPinned ? "#3CB815" : "#ccc",
                  borderRadius: "26px",
                  transition: "background-color 0.3s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    height: "20px",
                    width: "20px",
                    left: "3px",
                    bottom: "3px",
                    backgroundColor: "white",
                    borderRadius: "50%",
                    transition: "transform 0.3s",
                    transform: isPinned ? "translateX(24px)" : "translateX(0)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                />
              </span>
            </label>
          </div>

          {/* 수정 완료 — 활성 버튼(초록 배경) */}
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: "6px 12px", fontSize: "16px" }}
            onClick={handleUpdate}
          >
            수정 완료
          </button>

          {/* 취소 — 아웃라인 버튼 */}
          <button
            type="button"
            className="btn btn-outline-primary"
            style={{ padding: "6px 12px", fontSize: "16px" }}
            onClick={() => navigate("/notice")}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
