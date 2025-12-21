import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, allowedRoles }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const role = localStorage.getItem("role");

  if (!isLoggedIn) {
    // 로그인 안 했으면 로그인 페이지로
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // 권한이 없으면 홈으로
    return <Navigate to="/" replace />;
  }

  // 허용된 경우
  return children;
};

export default PrivateRoute;
