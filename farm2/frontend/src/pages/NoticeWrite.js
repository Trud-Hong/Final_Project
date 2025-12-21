import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

export default function NoticeWrite() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  // Quill 초기화
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

  // 이미지 버튼 커스텀 핸들러 등록
  useEffect(() => {
    if (!quill) return;

    const toolbar = quill.getModule("toolbar");
    toolbar.addHandler("image", () => {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.click();

      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await axios.post(
            "http://localhost:8080/api/upload/notice-image",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          const imageUrl = res.data.url; // "/uploads/notice/xxx.jpg"

          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, "image", imageUrl);
          quill.setSelection(range.index + 1);
        } catch (err) {
          console.error(err);
          alert("이미지 업로드에 실패했습니다.");
        }
      };
    });
  }, [quill]);

  const handleSubmit = async () => {
    if (!quill) {
      alert("에디터 초기화 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const content = quill.root.innerHTML;

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력하세요.");
      return;
    }

    // 로그인할 때 localStorage에 넣어둔 로그인 아이디 사용
    const userId = localStorage.getItem("userId");
    const nickname = localStorage.getItem("nickname"); // 옵션

    if (!userId) {
      alert("로그인 정보가 없습니다. 다시 로그인 해주세요.");
      return;
    }

    try {
      await axios.post("http://localhost:8080/api/notice/write", {
        title,
        content,
        userId,
        nickname,
        pinned: isPinned,
      });
      alert("등록 완료");
      navigate("/notice");
    } catch (err) {
      console.error(err);
      alert("등록에 실패했습니다.");
    }
  };

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">공지사항 작성</h2>

      {/* 제목 입력 */}
      <input
        className="form-control mb-3"
        placeholder="제목 입력"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          borderRadius: "12px",
          padding: "10px 14px",
          borderColor: "#ddd",
        }}
      />

     {/* 에디터 영역 */}
      <div ref={quillRef} style={{ height: 350 }} />

      <div className="mt-4 d-flex align-items-center w-100 gap-2 justify-content-end">
        
        {/* 상단 고정 토글 스위치 - 등록 버튼 옆 */}
        <div className="d-flex align-items-center gap-2">
        <span style={{ fontSize: "16px", userSelect: "none" }}>상단 고정</span>
          <label
            htmlFor="pinCheck"
            style={{
              position: "relative",
              display: "inline-block",
              width: "50px",
              height: "26px",
              cursor: "pointer",
            }}
          >
            <input
              id="pinCheck"
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
                  content: '""',
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

        {/* 등록 버튼 */}
        <button
          type="button"
          onClick={handleSubmit}
          className="btn btn-primary"
          style={{ padding: "6px 12px", fontSize: "16px" }}
        >
          등록
        </button>

        {/* 취소 버튼 */}
        <button
          type="button"
          onClick={() => navigate("/notice")}
          className="btn btn-outline-primary"
          style={{ padding: "6px 12px", fontSize: "16px" }}
        >
          취소
        </button>
      </div>

    </div>
  );
}
