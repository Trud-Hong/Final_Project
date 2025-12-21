import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import '../styles/mileageChargeSuccess.css';

export default function MileageChargeSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('결제 승인 중...');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const confirmPayment = async () => {
            const orderId = searchParams.get('orderId');
            const amount = searchParams.get('amount');
            const paymentKey = searchParams.get('paymentKey');

            if (!orderId || !amount || !paymentKey) {
                setStatus('결제 정보가 없습니다.');
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem('token');
                const response = await api.post('/api/toss-payment/confirm', {
                    paymentKey,
                    orderId,
                    amount: parseInt(amount)
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data.success) {
                    setStatus('마일리지 충전이 완료되었습니다!');
                    setTimeout(() => {
                        navigate('/mileage');
                    }, 2000);
                } else {
                    setStatus('충전 처리 중 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('결제 승인 실패:', error);
                setStatus(error.response?.data?.message || '결제 승인 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        confirmPayment();
    }, [searchParams, navigate]);

    return (
        <div className="container py-5">
            <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                    {loading ? (
                        <>
                            <div className="spinner-border text-primary mb-3" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <h4>{status}</h4>
                        </>
                    ) : (
                        <>
                            <div className="mb-3">
                                <i className="bi bi-check-circle-fill text-success mileage-success-icon"></i>
                            </div>
                            <h3>{status}</h3>
                            <p className="text-muted mt-3">잠시 후 마일리지 페이지로 이동합니다.</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

