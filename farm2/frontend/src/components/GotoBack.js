import React from 'react';
import '../css/GotoBack.css'

const GotoBack = () => {

    //뒤로가기 버튼
    const goBack = () => {
        window.history.back();
    }
    
    return (
        <div>
            <button type="button" className="back-btn-fixed" onClick={goBack}>← 뒤로가기</button>
        </div>
    );
};

export default GotoBack;