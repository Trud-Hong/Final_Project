import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PasswordCheck = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (!userId) navigate("/login");
  }, [userId, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .post("http://localhost:8080/api/member/verify-password", {
        userId,
        password,
      })
      .then(() => navigate("/mypage/p_update/edit"))
      .catch(() => setError("비밀번호가 일치하지 않습니다."));
  };

  return (
    <div className="container py-5 d-flex justify-content-center">
      <div
        className="card p-4 shadow-lg"
        style={{ maxWidth: "430px", width: "100%", borderRadius: "0px" }}
      >
        <h4 className="fw-bold mb-3 text-center">비밀번호 인증</h4>

        <p className="text-muted text-center mb-4">
          회원님의 정보를 안전하게 보호하기 위해<br />
          비밀번호를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="form-label small mb-1 text-muted">비밀번호</label>

          <div className="d-flex align-items-center mb-4" style={{ gap: "10px" }}>
            <input
              type={showPw ? "text" : "password"}
              className="form-control form-control-lg"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                borderRadius: "0px",       
              }}
            />

            <button
              type="button"
              onClick={() => setShowPw((prev) => !prev)}
              className="btn shadow-sm"
              style={{
                backgroundColor: "#e8f5e9",
                border: "1px solid #c8e6c9",
                borderRadius: "0px",       
                width: "50px",
                height: "50px",
              }}
            >
              <i
                className={`fa fa-eye${showPw ? "" : "-slash"}`}
                style={{
                  color: "#2e7d32",
                  fontSize: "18px",
                }}
              ></i>
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && <div className="text-danger small mb-3">{error}</div>}

          {/* 확인 버튼 */}
            <button
              className="btn w-100 py-2 mb-3"
              style={{
                backgroundColor: "#2e7d32",
                color: "white",
                borderRadius: "0px",
                transition: "0.25s",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#388e3c"; 
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#2e7d32"; 
              }}
            >
              확인
            </button>


          {/* 뒤로가기 버튼 */}
          <button
            type="button"
            className="btn w-100 py-2"
            onClick={() => navigate("/mypage")}
            style={{
              border: "1px solid #81c784",
              color: "#2e7d32",
              backgroundColor: "#f1faf2",
              borderRadius: "0px",         
              transition: "0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#dff5e4";
              e.target.style.borderColor = "#66bb6a";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#f1faf2";
              e.target.style.borderColor = "#81c784";
            }}
          >
            뒤로가기
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordCheck;
