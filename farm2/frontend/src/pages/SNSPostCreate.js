import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import "../styles/sns.css";

export default function SNSPostCreate() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const navigate = useNavigate();

  //로그인 기록 없으면 못 들어옴
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      window.location.href = "/login";
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // 🔥 이미지 없으면 등록 못 하게 막는 부분 ONLY 수정!
  const submit = () => {
    const userId = localStorage.getItem("userId");
    const nickname = localStorage.getItem("nickname");

    // 🔥 이미지 필수 체크 추가
    if (!imageFile) {
      alert("이미지를 첨부해야 게시글을 등록할 수 있습니다.");
      return; // 전송 중단
    }

    if (!nickname) {
      alert("닉네임 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("nickname", nickname);
    formData.append("userId", userId);
    formData.append("type", "blog");
    formData.append("image", imageFile); // 이미지 확실히 존재함

    api
      .post("/posts", formData)
      .then(() => {
        navigate("/sns");
      })
      .catch((err) => {
        console.error("게시글 등록 오류:", err);
        alert(err.response?.data?.message || "게시글 등록에 실패했습니다.");
      });
  };

  return (
    <>
    <div className="sns-create-container">
      <div className="sns-create-box">
        <h2>글 작성</h2>

          {/* 이미지 업로드 */}
          <label className="sns-label">이미지 업로드</label>

          <div className="sns-file-upload">
            <label htmlFor="imageUpload" className="btn btn-primary">
              이미지 선택
            </label>

            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="sns-file-input"
            />

            <span className="sns-file-name">
              {imageFile ? imageFile.name : "선택된 파일 없음"}
            </span>
          </div>

          {/* 미리보기 */}
          {preview && <img src={preview} alt="preview" className="sns-preview" />}

          <label className="sns-label">제목 입력</label>
          <input
            className="sns-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
          />

          <label className="sns-label">내용 입력</label>
          <textarea
            className="sns-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
          />

          <button className="btn btn-primary" onClick={submit}>
            등록하기
          </button>
        </div>
      </div>
    </>
  );
}
