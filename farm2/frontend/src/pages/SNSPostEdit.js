import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/sns.css";

export default function SNSPostEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/posts/${id}`).then((res) => {
      setTitle(res.data.title);
      setContent(res.data.content);
      setPreview(res.data.imageUrl);
      setLoading(false);
    });
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const submitEdit = () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    const userId = localStorage.getItem("userId");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("userId", userId);

    if (imageFile) formData.append("image", imageFile);

    api
      .put(`/posts/${id}`, formData)
      .then(() => {
        alert("게시글이 수정되었습니다.");
        navigate(`/sns/post/${id}`);
      })
      .catch((err) => {
        console.error("수정 오류:", err);
        alert("게시글 수정에 실패했습니다.");
      });
  };

  if (loading) return <div className="sns-loading">Loading...</div>;

  return (
    <div className="sns-create-container">
      <div className="sns-create-box">
        <h2 className="sns-create-title">게시글 수정</h2>

        {/* 이미지 업로드 */}
        <label className="sns-label">이미지 변경</label>
        <div className="sns-file-upload">
          <label htmlFor="imageUploadEdit" className="btn btn-primary">
            이미지 선택
          </label>
          <input
            id="imageUploadEdit"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="sns-file-input"
          />
          <span className="sns-file-name">
            {imageFile ? imageFile.name : preview ? "기존 이미지 사용" : "선택된 파일 없음"}
          </span>
        </div>

        {/* 이미지 미리보기 */}
        {preview && preview.trim() !== "" && (
          <img
            src={
              preview.startsWith("blob")
                ? preview
                : `http://localhost:8080${preview}`
            }
            alt="preview"
            className="sns-preview"
          />
        )}

        {/* 제목 */}
        <label className="sns-label">제목</label>
        <input
          className="sns-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
        />

        {/* 내용 */}
        <label className="sns-label">내용</label>
        <textarea
          className="sns-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요"
        />

        {/* 버튼 영역 */}
        <div className="sns-edit-actions">
          <button className="btn btn-outline-primary" onClick={() => navigate(`/sns/post/${id}`)}>
            취소
          </button>
          <button className="btn btn-primary" onClick={submitEdit}>
            수정완료
          </button>
        </div>
      </div>
    </div>
  );
}
