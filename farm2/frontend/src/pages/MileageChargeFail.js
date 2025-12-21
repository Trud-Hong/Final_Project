import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../styles/mileageChargeFail.css';

export default function MileageChargeFail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const code = searchParams.get('code');
    const message = searchParams.get('message');

    return (
        <div className="container py-5">
            <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                    <div className="mb-3">
                        <i className="bi bi-x-circle-fill text-danger mileage-fail-icon"></i>
                    </div>
                    <h3 className="text-danger">결제에 실패했습니다</h3>
                    {code && (
                        <p className="text-muted mt-3">
                            오류 코드: {code}
                        </p>
                    )}
                    {message && (
                        <p className="text-muted">
                            {message}
                        </p>
                    )}
                    <div className="mt-4">
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/mileage')}
                        >
                            마일리지 페이지로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

