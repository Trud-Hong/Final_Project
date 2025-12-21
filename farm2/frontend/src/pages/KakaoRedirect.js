import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const KakaoRedirect = () => {
  const navigate = useNavigate();

  const { setUser } = useContext(AuthContext);

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get("code");

    axios
      .get(`http://localhost:8080/api/social/kakao?code=${code}`)
      .then(res => {

 setUser(res.data);
          
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("provider", res.data.member.provider);
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("loginUser", JSON.stringify(res.data));
          localStorage.setItem("username", res.data.nickname); // ← 핵심: 통일
          localStorage.setItem("nickname", res.data.nickname);
          localStorage.setItem("userId", res.data.member.userId);
          localStorage.setItem("role", res.data.member.role || "ROLE_USER");

        //alert(`${res.data.member.nickname}님 로그인 되었습니다`);
        setUser(res.data);
        navigate("/");
      })
      .catch(err => {
        alert("카카오 로그인 실패!");
        console.log(err);
      });
  }, []);

  return <p>로그인 처리 중...</p>;
};

export default KakaoRedirect;
