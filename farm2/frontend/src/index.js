import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// 템플릿 CSS 파일들
import 'animate.css';
// import './css/style.css'; // 템플릿의 커스텀 CSS
import './styles/bootstrap.scss';



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </BrowserRouter>
);