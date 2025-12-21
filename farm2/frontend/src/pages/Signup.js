import React, { useState } from "react";
import axios from "axios";
import "quill/dist/quill.snow.css";
import "./Signup.css";

const Signup = () => {
  const [form, setForm] = useState({
    userId: "",           
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    phone: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrivacyChecked, setIsPrivacyChecked] = useState(false);

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    
    const idRegex = /^[a-zA-Z0-9]+$/;

    const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

    const phoneRegex = /^[0-9]+$/;

    if (!idRegex.test(form.userId)) {
      return setError("아이디는 영어와 숫자만 입력 가능합니다.");
    }

    if (!pwRegex.test(form.password)) {
      return setError("비밀번호는 6글자 이상이며, 영어와 숫자를 모두 포함해야 합니다.");
    }

    if (!phoneRegex.test(form.phone)) {
      return setError("전화번호는 숫자만 입력 가능합니다.");
    }

    if (form.password !== form.confirmPassword) {
      return setError("비밀번호가 일치하지 않습니다.");
    }

    if (!isPrivacyChecked) {
      return setError("개인정보 처리방침에 동의해주시기 바랍니다.")
    }

    try {
      await axios.post("http://localhost:8080/api/member/signup", {
        userId: form.userId,
        name: form.name,
        email: form.email,
        password: form.password,
        nickname: form.nickname,
        phone: form.phone,
        provider: "normal",
      });

      
      window.location.href = "/login";
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("회원가입 실패. 다시 시도해주세요.");
      }
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handlePrivacyCheck = () => {
    setIsPrivacyChecked(true);
    closeModal();
  };

  return (
    <div>
    <div className="signup-container">
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit} className="signup-form">
        <input type="text" name="name" placeholder="이름" onChange={handleChange} required />
        <input type="text" name="userId" placeholder="아이디" onChange={handleChange} required />
        <input type="email" name="email" placeholder="이메일" onChange={handleChange} required />
        <input type="password" name="password" placeholder="비밀번호" onChange={handleChange} required />
        <input type="password" name="confirmPassword" placeholder="비밀번호 확인" onChange={handleChange} required />
        <input type="text" name="nickname" placeholder="닉네임" onChange={handleChange} required />
        <input type="tel" name="phone" placeholder="전화번호" onChange={handleChange} required />

        <div className="privacy-container">
          <input 
            type="checkbox" 
            id="personal" 
            name="personal" 
            checked={isPrivacyChecked}
            onChange={(e) => setIsPrivacyChecked(e.target.checked)}
            readOnly
            disabled="true"
            required
          />
          <label htmlFor="personal" className="privacy-label">
            <button 
              type="button"
              className="privacy-btn" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openModal();
              }}
            >
              개인정보 처리방침
            </button>
            에 동의합니다.
          </label>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button type="submit" className="signup-btn">회원가입</button>
      </form>

      <p className="go-login">
        이미 계정이 있으신가요? <a href="/login">로그인</a>
      </p>
    </div>

    {isModalOpen && (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>개인정보 처리방침</h3>
            <button className="modal-close-btn" onClick={closeModal}>×</button>
          </div>
          <div className="modal-body">
            <div className="privacy-text ql-editor">
              <h4 className="align-le">제1조 (개인정보의 처리목적)</h4>
              <p>
                본 서비스는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 
                이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              
              <h4>제2조 (개인정보의 처리 및 보유기간)</h4>
              <p>
                ① 본 서비스는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 
                개인정보를 처리·보유합니다.
              </p>
              <p>
                ② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
              </p>
              
              <h4>제3조 (처리하는 개인정보의 항목)</h4>
              <p>
                본 서비스는 다음의 개인정보 항목을 처리하고 있습니다:
              </p>
              <p>
                <div>· 필수항목: 아이디, 비밀번호, 이름, 이메일, 전화번호, 닉네임</div>
                <div>· 선택항목: 없음</div>
              </p>
              
              <h4>제4조 (개인정보의 제3자 제공)</h4>
              <p>
                본 서비스는 원칙적으로 정보주체의 개인정보를 제3자에게 제공하지 않습니다.
              </p>
              
              <h4>제5조 (정보주체의 권리·의무 및 행사방법)</h4>
              <p>
                정보주체는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <label className="modal-checkbox-label">
              <input 
                type="checkbox" 
                checked={isPrivacyChecked}
                onChange={handlePrivacyCheck}
              />
              <span>개인정보 처리방침에 동의합니다.</span>
            </label>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default Signup;
