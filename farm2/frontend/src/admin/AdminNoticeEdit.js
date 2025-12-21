import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./Admin.css"; // 디자인 스타일 그대로 사용

export default function AdminNoticeEdit() {
  const { id } = useParams();
  const [form, setForm] = useState({ id: "", title: "", content: "" });
  const navigate = useNavigate();

  // 기존 공지 불러오기
  useEffect(() => {
    axios.get(`http://localhost:8080/api/notice/${id}`)
      .then(res => setForm(res.data))
      .catch(() => alert("공지 불러오기 실패"));
  }, [id]);

  const handleSave = async () => {
    await axios.put("http://localhost:8080/api/notice/update", form);
    alert("수정 완료");
    navigate("/admin/notice");
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3 style={{ margin: 0 }}>공지 수정</h3>
      </div>
      <div className="admin-card-body">
        <input
          className="admin-input mb-3"
          placeholder="제목 입력"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="admin-input"
          style={{ height: "300px", resize: "none" }}
          placeholder="내용 입력"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
        <button className="admin-btn mt-3" onClick={handleSave}>
          저장하기
        </button>
      </div>
    </div>
  );
}
