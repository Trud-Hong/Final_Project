import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";


const NaverRedirect = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("========================================");
    console.log("[프론트엔드] 네이버 리다이렉트 페이지 진입");
    console.log("현재 URL:", window.location.href);
    
    const code = new URL(window.location.href).searchParams.get("code");
    const state = new URL(window.location.href).searchParams.get("state");
    
    console.log("[프론트엔드] 추출된 파라미터:");
    console.log("  - code:", code);
    console.log("  - state:", state);

    // code가 없으면 에러 처리
    if (!code) {
      console.error("[프론트엔드] 에러: code 파라미터가 없습니다.");
      setError("인증 코드를 받지 못했습니다.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      return;
    }

    const apiUrl = `http://localhost:8080/api/social/naver?code=${code}&state=${state || ""}`;
    console.log("[프론트엔드] 백엔드 API 호출 시작");
    console.log("[프론트엔드] API URL:", apiUrl);
    
    axios
      .get(apiUrl)
      .then(res => {
        console.log("[프론트엔드] 백엔드 API 응답 받음");
        console.log("[프론트엔드] 응답 상태:", res.status);
        console.log("[프론트엔드] 응답 데이터:", res.data);
        
        if (res.data && res.data.member && res.data.token) {
          console.log("[프론트엔드] 로그인 성공 - 데이터 저장 시작");
          console.log("[프론트엔드] Member 정보:", res.data.member);
          console.log("[프론트엔드] Token:", res.data.token ? "존재함" : "없음");
          
          setUser(res.data);

          // 토큰 저장 (중요!)
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("loginUser", JSON.stringify(res.data));
          localStorage.setItem("username", res.data.member.name);
          localStorage.setItem("nickname", res.data.member.nickname);
          localStorage.setItem("userId", res.data.member.userId);
          localStorage.setItem("provider", res.data.member.provider);
          localStorage.setItem("role", res.data.member.role || "ROLE_USER");
          
          console.log("[프론트엔드] 로컬 스토리지 저장 완료");
          console.log("[프론트엔드] 메인 페이지로 이동");
          console.log("========================================");
            
          //alert(`${res.data.member.nickname}님 로그인 되었습니다`);
          navigate("/");
        } else {
          console.error("[프론트엔드] 에러: 응답 데이터 구조가 올바르지 않습니다.");
          console.error("[프론트엔드] res.data:", res.data);
          console.error("[프론트엔드] res.data.member:", res.data?.member);
          console.error("[프론트엔드] res.data.token:", res.data?.token);
          throw new Error("로그인 응답 데이터가 올바르지 않습니다.");
        }
      })
      .catch(err => {
        console.error("========================================");
        console.error("[프론트엔드] 네이버 로그인 에러 발생");
        console.error("[프론트엔드] 에러 객체:", err);
        console.error("[프론트엔드] 에러 메시지:", err.message);
        console.error("[프론트엔드] 에러 스택:", err.stack);
        
        if (err.response) {
          console.error("[프론트엔드] 응답 상태:", err.response.status);
          console.error("[프론트엔드] 응답 헤더:", err.response.headers);
          console.error("[프론트엔드] 응답 데이터:", err.response.data);
        } else if (err.request) {
          console.error("[프론트엔드] 요청은 보냈지만 응답을 받지 못함");
          console.error("[프론트엔드] 요청:", err.request);
        }
        
        let errorMessage = "네이버 로그인에 실패했습니다.";
        
        if (err.response?.data) {
          // 백엔드에서 보낸 에러 메시지
          if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else if (err.response.data.message) {
            errorMessage = err.response.data.message;
          } else if (err.response.data.error) {
            errorMessage = err.response.data.error;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        console.error("[프론트엔드] 최종 에러 메시지:", errorMessage);
        console.error("========================================");
        
        setError(errorMessage);
        
        // 에러 발생 시 로그인 페이지로 리다이렉트
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      });
  }, [navigate, setUser]);

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ color: "red" }}>{error}</p>
        <p>로그인 페이지로 이동합니다...</p>
      </div>
    );
  }

  return <p>로그인 처리 중...</p>;
};

export default NaverRedirect;
