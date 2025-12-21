import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import Navbar from "../components/Navbar";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";



const Login = () => {
  const navigate = useNavigate();
   const { setUser } = useContext(AuthContext);
  

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // 모달 ON/OFF
  const [showFindId, setShowFindId] = useState(false);
  const [showFindPw, setShowFindPw] = useState(false);

 const [idStep, setIdStep] = useState(1); 


  // 아이디 찾기용
const [findName, setFindName] = useState("");
const [findEmail, setFindEmail] = useState("");
const [findIdCode, setFindIdCode] = useState("");
const [foundUserId, setFoundUserId] = useState("");

  // 비밀번호 찾기용
  const [pwName, setPwName] = useState("");
  const [pwUserId, setPwUserId] = useState("");
  const [pwEmail, setPwEmail] = useState("");
  const [pwCode, setPwCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwResetStep, setPwResetStep] = useState(1);
  const [confirmNewPw, setConfirmNewPw] = useState("");


  // ------------------------
  // 로그인 제출
  // ------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await axios.post("http://localhost:8080/api/member/login", {
        userId,
        password,
      });

      setUser(res.data);

      
      localStorage.setItem("loginUser", JSON.stringify(res.data));

      //userId 사용
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", res.data.name || userId);
      localStorage.setItem("nickname",res.data.nickname);
      localStorage.setItem("role", res.data.role);

      localStorage.setItem("provider", res.data.provider || "normal");

      // 11/20 혜정추가 로그인후 이전페이지로 돌아가게 코딩추가
      const urlParams = new URLSearchParams(window.location.search); //주소창에 물음표 뒤에 있는 내용들을 가져와

      const redirectPath = urlParams.get('redirect');
      //리다이렉트가 지시하는 변수를 가져와

      if (redirectPath){
        window.location.href = redirectPath; //리다이렉트가 지시하는 변수가 있다면 그곳으로 보내
      } else {
      
        window.location.href = "/"; //이부분만 기존 명갑이 코딩
      } //여기까지 혜정이가 코딩 추가함.

    //     navigate("/"); 
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "로그인에 실패했습니다.");
    }
  };

// ------------------------
// 아이디 찾기: 인증번호 보내기
// ------------------------
const sendFindIdCode = async () => {
  try {
    await axios.post("http://localhost:8080/api/member/find-id/send-code", {
      name: findName,
      email: findEmail,
    });
    alert("이메일로 인증번호가 발송되었습니다.");
    setIdStep(2); 
  } catch (error) {
    alert("해당 정보의 회원을 찾을 수 없습니다.");
  }
};


// ------------------------
// 아이디 찾기: 인증 확인 → userId 받기
// ------------------------
const verifyFindIdCode = async () => {
  try {
    const res = await axios.post( 
      "http://localhost:8080/api/member/find-id/verify",
      {
        name: findName,
        email: findEmail,
        code: findIdCode,
      }
    );

    setFoundUserId(res.data);
    alert("인증 성공! 아이디를 확인하세요.");
    setIdStep(3);
  } catch (err) {
    alert("인증번호가 올바르지 않습니다.");
  }
};


 



  // ------------------------
  // 비밀번호 찾기: 인증번호 발송
  // ------------------------
  const sendFindPwCode = async () => {
  try {
    await axios.post("http://localhost:8080/api/member/find-pw/send-code", {

      name: pwName,
      userId: pwUserId,
      email: pwEmail,
    });

    alert("이메일로 인증번호가 발송되었습니다.");
    setPwResetStep(2); // 이메일 유지
  } catch (err) {
    alert("일치하는 회원이 없습니다.");
  }
};

const verifyPwCode = async () => {
  try {
    await axios.post("http://localhost:8080/api/member/find-pw/verify", {
  name: pwName,
  userId: pwUserId,
  email: pwEmail,
  code: pwCode,
});

    alert("인증 성공! 새 비밀번호를 입력해주세요.");
    setPwResetStep(3);
  } catch (err) {
    alert("인증번호가 올바르지 않습니다.");
  }
};

  // ------------------------
  // 비밀번호 찾기: 비밀번호 재설정
  // ------------------------
const resetPassword = async () => {
  if (newPw !== confirmNewPw) {
    alert("비밀번호가 서로 일치하지 않습니다.");
    return;
  }

  try {
    await axios.post("http://localhost:8080/api/member/find-pw/reset", {
      name: pwName,
   userId: pwUserId,
      email: pwEmail,
      code: pwCode, 
      newPassword: newPw,
    });


    alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
    setShowFindPw(false);
    setPwResetStep(1);
  } catch (err) {
    alert("비밀번호 변경 실패. 인증 상태를 확인하세요.");
  }
};



  return (
  //  <div>
    <div className="login-container">
      <h2>로그인</h2>

      <form onSubmit={handleSubmit}>
        <label>아이디</label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />

        <label>비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {errorMsg && <p className="error-msg">{errorMsg}</p>}

        <button type="submit">로그인</button>
      </form>

      <button className="signup-btn" onClick={() => navigate("/signup")}>
        회원가입
      </button>

     
      <div className="find-links">
         <span className="find-id" onClick={() => setShowFindId(true)}>아이디 찾기</span> |{" "}
          <span className="find-pw" onClick={() => setShowFindPw(true)}>비밀번호 찾기</span>
      </div>

     
     <button
  className="social-btn kakao-btn"
  onClick={() => {
    window.location.href =
      "https://kauth.kakao.com/oauth/authorize?client_id=96a4a7dfe35ee2e71a6d030c21bfacec&redirect_uri=http://localhost:3000/oauth/kakao&response_type=code";
  }}
>
  <span className="social-icon kakao-icon">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M12 3C7.03 3 3 6.21 3 10.18c0 2.34 1.52 4.39 3.85 5.6L6 21l4.07-2.23c.62.09 1.26.14 1.93.14 4.97 0 9-3.21 9-7.73C21 6.21 16.97 3 12 3z"
        fill="#3B1E1E"  
      />
    </svg>
  </span>
  <span>카카오 로그인</span>
</button>


      <button
        className="social-btn naver-btn"
        onClick={() => {
          window.location.href = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=b3OBagSlwW4Riy478hl0&redirect_uri=http://localhost:3000/oauth/naver&state=hURfwxHrsB`;
        }}
      >
        <span className="social-icon">🅝</span>
        네이버 로그인
      </button>


{showFindId && (
  <div className="modal-backdrop">
    <div className="modal-box">
      <h3>아이디 찾기</h3>

      {idStep === 1 && (
        <>
          <input
            type="text"
            placeholder="이름"
            value={findName}
            onChange={(e) => setFindName(e.target.value)}
          />
          <input
            type="text"
            placeholder="이메일"
            value={findEmail}
            onChange={(e) => setFindEmail(e.target.value)}
          />
          <button onClick={sendFindIdCode}>인증번호 보내기</button>
        </>
      )}

      {idStep === 2 && (
        <>
          <input
            type="text"
            placeholder="인증번호"
            value={findIdCode}
            onChange={(e) => setFindIdCode(e.target.value)}
          />
          <button onClick={verifyFindIdCode}>아이디 확인</button>
        </>
      )}

      {idStep === 3 && (
        <div className="result-box">
          <p>회원님의 아이디는</p>
          <h2>{foundUserId}</h2>
        </div>
      )}

      <button
        className="close-btn"
        onClick={() => {
          setShowFindId(false);
          setIdStep(1);
          setFindName("");
          setFindEmail("");
          setFindIdCode("");
          setFoundUserId("");
        }}
      >
        닫기
      </button>
    </div>
  </div>
)}



    

      {showFindPw && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>비밀번호 찾기</h3>

            {pwResetStep === 1 && (
  <>
    <input
      type="text"
      placeholder="이름"
      value={pwName}
      onChange={(e) => setPwName(e.target.value)}
    />
    <input
      type="text"
      placeholder="아이디"
      value={pwUserId}
      onChange={(e) => setPwUserId(e.target.value)}
    />
    <input
      type="text"
      placeholder="이메일"
      value={pwEmail}
      onChange={(e) => setPwEmail(e.target.value)}
    />

    <button onClick={sendFindPwCode}>인증번호 보내기</button>
  </>
)}

 {pwResetStep === 2 && (
  <>
    <input
      type="text"
      placeholder="인증번호"
      value={pwCode}
      onChange={(e) => setPwCode(e.target.value)}
    />

  <button
  onClick={async () => {
    try {
      await axios.post("http://localhost:8080/api/member/find-pw/verify", {
        name: pwName,
        userId: pwUserId,
        email: pwEmail,
        code: pwCode,
      });
      alert("인증 성공! 새 비밀번호를 입력하세요.");
      
      setPwResetStep(3);
    } catch (err) {
      alert("인증번호가 올바르지 않습니다.");
    }
  }}
>
  확인
</button>

  </>
)}

{pwResetStep === 3 && (
  <>
    <input
      type="password"
      placeholder="새 비밀번호"
      value={newPw}
      onChange={(e) => setNewPw(e.target.value)}
    />
    <input
      type="password"
      placeholder="새 비밀번호 확인"
      value={confirmNewPw}
      onChange={(e) => setConfirmNewPw(e.target.value)}
    />
    <button onClick={resetPassword}>비밀번호 재설정</button>
  </>
)}




            <button className="close-btn" onClick={() => setShowFindPw(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
