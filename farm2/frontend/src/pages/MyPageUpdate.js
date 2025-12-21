import React, { useState, useEffect } from "react";
import axios from "axios";
import GotoBack from "../components/GotoBack";

const MyPageUpdate = () => {
  const userId = localStorage.getItem("userId");

  const [form, setForm] = useState({
    userId: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    phone: "",
  });

  // 정규식 (회원가입 동일)
  const userIdRegex = /^[a-zA-Z0-9]+$/;
  const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
  const phoneRegex = /^[0-9]+$/;

  // DB에서 회원 정보 불러오기
  useEffect(() => {
    axios
      .get(`http://localhost:8080/api/member/user/${userId}`)
      .then((res) => {
        setForm({
          userId: res.data.userId,
          name: res.data.name,
          email: res.data.email,
          password: "",
          confirmPassword: "",
          nickname: res.data.nickname,
          phone: res.data.phone,
        });
      })
      .catch(() => alert("회원 정보를 불러오지 못했습니다."));
  }, [userId]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!userIdRegex.test(form.userId)) {
      return alert("아이디는 영어와 숫자만 가능합니다.");
    }

    if (form.password !== "") {
      if (!pwRegex.test(form.password)) {
        return alert(
          "비밀번호는 6글자 이상이며 영어와 숫자를 모두 포함해야 합니다."
        );
      }
      if (form.password !== form.confirmPassword) {
        return alert("비밀번호가 일치하지 않습니다.");
      }
    }

    if (!phoneRegex.test(form.phone)) {
      return alert("전화번호는 숫자만 입력 가능합니다.");
    }

    axios
      .put("http://localhost:8080/api/member/update", {
        userId: form.userId,
        name: form.name,
        email: form.email,
        password: form.password,
        nickname: form.nickname,
        phone: form.phone,
      })
      .then(() => {
        localStorage.setItem("nickname", form.nickname);
        localStorage.setItem("username", form.name);
        alert("회원 정보가 수정되었습니다.");
        window.location.href = "/userpage";
      })
      .catch(() => alert("수정 중 오류가 발생했습니다."));
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "게시한 판매목록 및 게시글이 모두 삭제됩니다. 탈퇴하시겠습니까?"
      )
    )
      return;

    try {
      await axios.delete(
        `http://localhost:8080/api/member/delete/${form.userId}`
      );

      alert("회원 탈퇴가 완료되었습니다.");
      localStorage.clear();

      window.location.replace("/?status=deleted");
    } catch (err) {
      alert("회원 탈퇴 중 오류가 발생했습니다.");
    }
  };

  return (
    <div
      className="py-5"
      style={{ backgroundColor: "#f8f9fa", minHeight: "70vh" }}
    >
      <div
        className="card shadow-lg border-0 mx-auto"
        style={{ maxWidth: "720px", borderRadius: "0px" }} 
      >
        <div className="card-body p-4 p-md-5">
          {/* 상단 헤더 */}
          <div className="text-center mb-4">
            <h2 className="fw-bold mb-2">회원 정보 수정</h2>
            <p className="text-muted small mb-0">
              이름, 연락처, 비밀번호 등을 수정할 수 있습니다.
              <br />
              아이디는 변경할 수 없습니다.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* 이름 / 닉네임 */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold small text-muted">
                  이름
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  style={{ borderRadius: "0px" }} 
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold small text-muted">
                  닉네임
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  style={{ borderRadius: "0px" }}
                  name="nickname"
                  value={form.nickname}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* 아이디 / 이메일 */}
            <div className="mb-3">
              <label className="form-label fw-semibold small text-muted">
                아이디
              </label>
              <input
                type="text"
                className="form-control form-control-lg bg-light"
                style={{ borderRadius: "0px", cursor: "not-allowed" }}
                name="userId"
                value={form.userId}
                readOnly
                disabled
              />
              <div className="form-text small">
                가입 시 생성된 아이디는 변경할 수 없습니다.
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold small text-muted">
                이메일
              </label>
              <input
                type="email"
                className="form-control form-control-lg"
                style={{ borderRadius: "0px" }}
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            {/* 비밀번호 변경 섹션 */}
            <div
              className="p-3 p-md-3 mb-3"
              style={{
                backgroundColor: "#f8f9fa",
                borderRadius: "0px", 
              }}
            >
              <label className="form-label fw-semibold small text-muted mb-2">
                비밀번호 변경 (선택)
              </label>
              <div className="row">
                <div className="col-md-6 mb-3 mb-md-0">
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    style={{ borderRadius: "0px" }}
                    placeholder="새 비밀번호"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    style={{ borderRadius: "0px" }}
                    placeholder="비밀번호 확인"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-text small mt-1">
                6글자 이상, 영어와 숫자를 모두 포함해야 합니다.
              </div>
            </div>

            {/* 전화번호 */}
            <div className="mb-4">
              <label className="form-label fw-semibold small text-muted">
                전화번호
              </label>
              <input
                type="text"
                className="form-control form-control-lg"
                style={{ borderRadius: "0px" }}
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="숫자만 입력"
              />
            </div>

            {/* 저장 버튼 */}
          <button
            type="submit"
            className="btn w-100 fw-semibold mb-3"
            style={{
              backgroundColor: "#2e7d32",
              borderColor: "#2e7d32",
              color: "white",
              fontSize: "16px",
              padding: "12px 0",
              borderRadius: "0px",   
              transition: "0.25s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#388e3c";
              e.target.style.borderColor = "#388e3c";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#2e7d32";
              e.target.style.borderColor = "#2e7d32";
            }}
          >
            저장하기
          </button>



            <hr className="my-4" />

            {/* 탈퇴 섹션 */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span className="text-muted small">
                더 이상 서비스를 이용하지 않으실 경우 회원 탈퇴를 진행할 수 있습니다.
              </span>
              <button
              type="button"
              className="btn fw-semibold"
              onClick={handleDelete}
              style={{
                padding: "10px 20px",
                fontSize: "15px",
                border: "1px solid #e57373",
                backgroundColor: "white",
                color: "#d32f2f",
                borderRadius: "0px", 
                transition: "0.25s",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#fdecea";
                e.target.style.borderColor = "#d32f2f";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "white";
                e.target.style.borderColor = "#e57373";
              }}
            >
              회원 탈퇴
            </button>

            </div>
          </form>
        </div>
      </div> <GotoBack />
    </div>
  );
};

export default MyPageUpdate;
