import './App.css';
import React, { useEffect } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import WOW from 'wow.js';
import 'wow.js/css/libs/animate.css';
// import OwlCarousel from 'react-owl-carousel3';
import About from './pages/About';
import Product from './pages/Product';
import Blog from './pages/Blog';
import Feature from './pages/Feature';
import Testimonial from './pages/Testimonial';
import Contact from './pages/Contact';
import Error from './pages/Error';
import { Route, Routes, useLocation } from 'react-router-dom';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

//명갑
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AuthProvider } from "./context/AuthContext";
import MyPageUpdate from "./pages/MyPageUpdate";
import PasswordCheck from "./pages/PasswordCheck";
import Wishlist from "./pages/Wishlist";
import NoticeList from "./pages/NoticeList";
import NoticeDetail from "./pages/NoticeDetail";
import NoticeWrite from "./pages/NoticeWrite";
import NoticeEdit from "./pages/NoticeEdit";
import AdminNotice from './admin/AdminNotice';


// 기본 페이지들
import Home from './pages/Home';
import SellerProductForm from './pages/SellerProductForm';
import KakaoRedirect from "./pages/KakaoRedirect";
import NaverRedirect from "./pages/NaverRedirect";

import ProductDetailPage from './pages/ProductDetailPage';

// SNS 페이지들
import SNSHome from './pages/SNSHome';
import SNSPostDetail from './pages/SNSPostDetail';
import SNSPostCreate from './pages/SNSPostCreate';
import Predict from './pages/Predict';

//혜정 페이지
import OrderList from './pages/OrderList';
import MyPage from './pages/MyPage';
import Seller_register from './pages/Seller_register';
import SellerDetail from './pages/SellerDetail';
import SellerRegister from './pages/Seller_register';
import Cart from './pages/Cart';
import AddrList from './pages/AddrList';
import MyQnA from './pages/MyQnA';



//재혁 페이지
import SearchResultPage from './pages/SearchResultPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UserMyPosts from './pages/UserMyPosts';
import SNSPostEdit from './pages/SNSPostEdit';
import PrivateRoute from './components/PrivateRoute';
import PaymentComplete from './pages/PaymentComplete';
import ScrollToTop from './components/ScrollToTop';

import FloatingAiButton from "./components/FloatingAiButton";
import { useState } from "react";
import AiChatPopup from "./components/AiChatPopup";


import Admin from './admin/Admin';
import Mileage from './pages/Mileage';
import MileageChargeSuccess from './pages/MileageChargeSuccess';
import MileageChargeFail from './pages/MileageChargeFail';
import Seller from './seller/Seller';
import MyInquire from './pages/MyInquire';
import MyInquireDetail from './pages/MyInquireDetail';
import MyReviewList from './pages/MyReviewList';
import Market from './pages/Market';
import MarketDetail from './pages/MarketDetail';
import SellerQR from './pages/SellerQR';
import QrScan from './pages/QrScan';


function App() {

  useEffect(() => {
    new WOW().init();
  }, []);

  //지원 챗봇 API
  useEffect(() => {
    if (window.ChannelIO) {
      window.ChannelIO('shutdown');

      window.ChannelIO('boot', {
        pluginKey: "611cb22b-cab4-4c98-b987-7c8955c18955",
        hideChannelButton: true
      });
    }
  }, []);



return (
  <AuthProvider>
    <ScrollToTop />
    <div className="App">
      <RoutesWrapper/>
    </div>
  </AuthProvider>
);

}

// AuthContext 안에서만 useContext 사용
const RoutesWrapper = () => {

  const [isAiOpen, setIsAiOpen] = useState(false);

  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isAdminPage && <Navbar />}

      <main style={{ flex: 1 }}>
      {isAdminPage ? (
        <Admin />
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Product />} />
          <Route path="/sellerinfo" element={<Blog />} />
          <Route path="/feature" element={<Feature />} />
          <Route path="/testimonial" element={<Testimonial />} />
          <Route path="/contact" element={<Contact />} />
          {/* 명갑 */}
          <Route path="/notice" element={<NoticeList />} />
          <Route path="/notice/:id" element={<NoticeDetail />} />
          <Route path="/notice/write" element={<NoticeWrite />} />
          <Route path="/notice/edit/:id" element={<NoticeEdit />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/admin/notice" element={<AdminNotice />} />
        
          <Route 
            path="/seller/products" 
            element={
              <PrivateRoute allowedRoles={['ROLE_SELLER','ROLE_ADMIN']}>
                <SellerProductForm/>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/seller/products/:productId" 
            element={
              <PrivateRoute allowedRoles={['ROLE_SELLER','ROLE_ADMIN']}>
                <SellerProductForm/>
              </PrivateRoute>
            } 
          />
          <Route path='/payment/complete' element={<PaymentComplete/>}/>
          <Route path='/products/detail/:productId' element={<ProductDetailPage/>}/>
          <Route path="/mypage/p_update" element={<PasswordCheck />} />
          <Route path="/mypage/p_update/edit" element={<MyPageUpdate />} />
        
          <Route path="/oauth/kakao" element={<KakaoRedirect />} />
          <Route path="/oauth/naver" element={<NaverRedirect />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/sns" element={<SNSHome />} />
          <Route path="/market" element={<Market />} />
          <Route path="/marketdetail/:code" element={<MarketDetail />} />
          <Route path="/sns/post/:id" element={<SNSPostDetail />} />
          <Route path="/sns/create" element={<SNSPostCreate />} />
          <Route path="/mypage/myposts" element={<UserMyPosts />} />
          <Route path="/sns/edit/:id" element={<SNSPostEdit />} />
         
          {/* 11/18 혜정 구매내역, 마이페이지 추가 */ }
          <Route 
            path="/userpage/orderlist" 
            element={
              <PrivateRoute allowedRoles={['ROLE_USER','ROLE_SELLER','ROLE_ADMIN']}>
                <OrderList />
              </PrivateRoute>
            } 
          /> 
          <Route 
            path="/mypage/mileage" 
            element={
              <PrivateRoute allowedRoles={['ROLE_USER','ROLE_SELLER','ROLE_ADMIN']}>
                <Mileage/>
              </PrivateRoute>
            } 
          />
          <Route path="/mileage" element={<Mileage/>} />
          <Route path="/mileage/charge/success" element={<MileageChargeSuccess/>} />
          <Route path="/mileage/charge/fail" element={<MileageChargeFail/>} />
          <Route path="/userpage" element={<MyPage />} /> 
          {/* 11/22 혜정 구매내역, 마이페이지,카트, 배송지관리 추가 */ }
          <Route path="/mypage/myqna" element={<MyQnA />} />
          <Route path="/mypage/cart" element={<Cart />} />
          <Route path="/mypage/orderlist" element={<OrderList />} /> 
          <Route path="/mypage" element={<MyPage />} /> 
          <Route path="/mypage/seller_register" element={<Seller_register />} />
          <Route path="/mypage/addrlist" element={<AddrList />} />
          <Route path="/mypage/myreview" element={<MyReviewList />}  />

          <Route path="/seller/:id" element={<SellerDetail />} />
          <Route path="/seller/edit/:id" element={<SellerRegister editMode={true} />} />
          {/* 판매자 등록 (신규) */}
          <Route path="/seller/register" element={<SellerRegister />} />


          <Route path="/searchresult" element={<SearchResultPage />} />


          <Route path="/seller" element={<Seller />} />
          <Route path="/seller/dashboard" element={<Seller />} />
          <Route path="/seller/product" element={<Seller />} />
          <Route path="/seller/product/create" element={<Seller />} />
          <Route path="/seller/order" element={<Seller />} />
          <Route path="/seller/question" element={<Seller />} />
          <Route path="/seller/settings" element={<Seller />} />
          <Route path="/seller/order/:orderId/qr" element={<SellerQR />} />
          <Route path="/qr-scan" element={<QrScan />} />



          <Route path="/myinquire" element={<MyInquire />} />
          <Route path="/myinquiredetail/:id" element={<MyInquireDetail />} />

          <Route
            path="*"
            element={<Error />}
          />
        </Routes>
      )}
      </main>

      {/* AI 상담 버튼은 팝업이 꺼져 있을 때만 보이게 */}
      {!isAdminPage && !isAiOpen && (
        <FloatingAiButton onClick={() => setIsAiOpen(true)} />
      )}

      {/* 팝업 */}
      {isAiOpen && (
        <AiChatPopup
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
        />
      )}
      
      
      {!isAdminPage && <Footer />}
    </div>
  );
};

export default App;
