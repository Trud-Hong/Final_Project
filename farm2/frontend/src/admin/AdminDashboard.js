import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Admin.css';

// 커스텀 Tooltip 컴포넌트 - ROLE별 통계 표시
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const roleStats = data.roleStats || {};
        
        // ROLE 이름을 더 읽기 쉽게 변환
        const formatRoleName = (role) => {
            if (role === 'ROLE_USER') return '일반 사용자';
            if (role === 'ROLE_ADMIN') return '관리자';
            if (role === 'ROLE_SELLER') return '판매자';
            return role.replace('ROLE_', '');
        };
        
        return (
            <div style={{
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>
                    {data.date}
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>
                    누적 가입자: <strong>{data.count}명</strong>
                </p>
                {Object.keys(roleStats).length > 0 && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
                            권한별 인원:
                        </p>
                        {Object.entries(roleStats)
                            .sort((a, b) => b[1] - a[1]) // 인원 수가 많은 순으로 정렬
                            .map(([role, count]) => (
                                <p key={role} style={{ margin: '4px 0', fontSize: '12px', color: '#555' }}>
                                    {formatRoleName(role)}: <strong>{count}명</strong>
                                </p>
                            ))
                        }
                    </div>
                )}
            </div>
        );
    }
    return null;
};

const AdminDashboard = () => {

    const [markets, setMarkets] = useState([]);
    const [members, setMembers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [ordersWithRefund, setordersWithRefund] = useState([]);
    const [userCount, setUserCount] = useState(0);
    const [userStats, setUserStats] = useState([]);

    // 시장 목록 가져오기
    useEffect(() => {
        const fetchMarkets = async () => {
            try {
                const response = await axios.get(
                    "http://localhost:8080/api/price/markets"
                );
                const marketData = response.data.Grid_20240625000000000661_1;

                if (marketData && marketData.row) {
                    // 210005(부산국제수산시장) 제외
                    const filteredMarkets = marketData.row.filter(m => m.CODEID !== '210005');
                    setMarkets(filteredMarkets);
                }
            } catch (err) {
                console.error("Error fetching markets:", err);
            }
        };
        fetchMarkets();
    }, []);

    // 회원 정보 가져오기
    useEffect(() => {
        axios.get("http://localhost:8080/api/member/all")
            .then(res => {
                setMembers(res.data);
            })
            .catch(err => console.log(err));
    },[]);

    // 문의 정보 가져오기
    
    useEffect(() => {
        const param = encodeURIComponent("문의 완료");
        axios.get(`http://localhost:8080/api/contact/status?status=${param}`)
            .then(res => {
                setContacts(res.data);
            })
            .catch(err => console.log(err));
    },[]);

    // 누적 가입자 정보
    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem("token");

            try {
                // ✅ 사용자 통계
                const usersRes = await axios.get("http://localhost:8080/api/member/all");
                const users = usersRes.data || [];
                console.log("사용자 데이터:", users);
                console.log("첫 번째 사용자 샘플:", users[0]);
                
                setUserCount(users.length);
                
                // 날짜별 가입자 수 및 ROLE별 통계 계산
                const userMap = {};
                const roleMapByDate = {}; // 날짜별 ROLE 통계
                let nullCount = 0;
                users.forEach((user, index) => {
                    // 다양한 필드명 시도 (createdAt, created_at, createdAt 등)
                    const createdAt = user.createdAt || user.created_at || user.createAt;
                    const role = user.role || 'ROLE_USER'; // 기본값 설정
                    
                    if (createdAt) {
                        // LocalDateTime 형식 처리 (예: "2024-01-15T10:30:00" 또는 배열 형식)
                        let dateStr;
                        try {
                            if (Array.isArray(createdAt)) {
                                // MongoDB의 LocalDateTime이 배열로 올 수 있음 [년, 월, 일, 시, 분, 초, 나노초]
                                // 인덱스: 0=년, 1=월, 2=일, 3=시, 4=분, 5=초
                                // 이미 한국 시간으로 저장되어 있으므로 그대로 사용
                                const year = createdAt[0];
                                const month = createdAt[1] !== undefined ? createdAt[1] : 1;
                                const day = createdAt[2] !== undefined ? createdAt[2] : 1;
                                dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            } else if (typeof createdAt === 'string') {
                                // 문자열 형식인 경우
                                // 백엔드가 KST로 저장하므로, 타임존 정보가 없으면 이미 KST로 간주
                                if (createdAt.includes('T')) {
                                    // ISO 8601 형식
                                    if (createdAt.endsWith('Z') || createdAt.includes('+00:00') || createdAt.includes('-00:00')) {
                                        // UTC로 명시된 경우 한국 시간으로 변환
                                        const dateObj = new Date(createdAt);
                                        const kstDate = new Date(dateObj.getTime() + (9 * 60 * 60 * 1000));
                                        dateStr = kstDate.toISOString().split("T")[0];
                                    } else {
                                        // 타임존 정보가 없으면 이미 KST로 간주하고 날짜만 추출
                                        dateStr = createdAt.split('T')[0];
                                    }
                                } else if (createdAt.includes(' ')) {
                                    // 공백으로 구분된 형식
                                    dateStr = createdAt.split(' ')[0];
                                } else {
                                    // 날짜만 있는 형식
                                    dateStr = createdAt.substring(0, 10);
                                }
                            } else if (createdAt instanceof Date) {
                                // Date 객체인 경우 - 한국 시간으로 변환
                                const kstDate = new Date(createdAt.getTime() + (9 * 60 * 60 * 1000));
                                dateStr = kstDate.toISOString().split("T")[0];
                            } else if (typeof createdAt === 'object' && createdAt.$date) {
                                // MongoDB의 Date 형식 - 한국 시간으로 변환
                                const dateObj = new Date(createdAt.$date);
                                const kstDate = new Date(dateObj.getTime() + (9 * 60 * 60 * 1000));
                                dateStr = kstDate.toISOString().split("T")[0];
                            } else {
                                // 숫자 타임스탬프인 경우 - 한국 시간으로 변환
                                const dateObj = new Date(createdAt);
                                const kstDate = new Date(dateObj.getTime() + (9 * 60 * 60 * 1000));
                                dateStr = kstDate.toISOString().split("T")[0];
                            }
                            
                            // 유효한 날짜인지 확인
                            if (dateStr && dateStr.length === 10 && !isNaN(new Date(dateStr).getTime())) {
                                userMap[dateStr] = (userMap[dateStr] || 0) + 1;
                                
                                // ROLE별 통계 추가
                                if (!roleMapByDate[dateStr]) {
                                    roleMapByDate[dateStr] = {};
                                }
                                roleMapByDate[dateStr][role] = (roleMapByDate[dateStr][role] || 0) + 1;
                            } else {
                                console.warn(`사용자 ${index}의 createdAt 파싱 실패:`, createdAt, '->', dateStr);
                                nullCount++;
                            }
                        } catch (error) {
                            console.warn(`사용자 ${index}의 createdAt 처리 중 오류:`, createdAt, error);
                            nullCount++;
                        }
                    } else {
                        nullCount++;
                        if (index < 3) { // 처음 3개만 로그 출력
                            console.warn(`사용자 ${index}에 createdAt 필드가 없습니다.`);
                        }
                    }
                });
                
                if (nullCount > 0) {
                    console.warn(`총 ${nullCount}명의 사용자가 createdAt 정보가 없어 그래프에서 제외되었습니다.`);
                }

                const sortedUserDates = Object.keys(userMap).sort();
                // 날짜별 누적 가입자 수 계산 및 ROLE 통계 포함
                let cumulative = 0;
                const cumulativeRoleMap = {}; // 누적 ROLE 통계
                const userData = sortedUserDates.map((date) => {
                    cumulative += userMap[date];
                    
                    // 해당 날짜의 ROLE 통계를 누적 통계에 추가
                    if (roleMapByDate[date]) {
                        Object.keys(roleMapByDate[date]).forEach(role => {
                            cumulativeRoleMap[role] = (cumulativeRoleMap[role] || 0) + roleMapByDate[date][role];
                        });
                    }
                    
                    // 날짜 형식을 더 읽기 쉽게 변환 (YYYY-MM-DD -> MM/DD)
                    const dateObj = new Date(date);
                    const formattedDate = `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`;
                    
                    // 원본 날짜와 ROLE 통계를 함께 저장
                    return { 
                        date: formattedDate, 
                        fullDate: date, // 원본 날짜 저장
                        count: cumulative,
                        roleStats: { ...cumulativeRoleMap } // 해당 시점까지의 누적 ROLE 통계
                    };
                });
                console.log("그래프 데이터:", userData);
                setUserStats(userData);
            } catch (err) {
                console.error("❌ 사용자 조회 실패:", err.response?.data || err.message);
                setUserStats([]);
            }
        };
        fetchStats();
    }, []);

    
    // 전체 거래 건수 가져오기
    useEffect(() => {

        // 한국 시간(KST) 기준으로 오늘 날짜 계산
        const now = new Date();
        // 현재 UTC 시간에 9시간을 더해 KST 시간 계산
        const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const kstYear = kstTime.getUTCFullYear();
        const kstMonth = kstTime.getUTCMonth();
        const kstDate = kstTime.getUTCDate();
        
        // 한국 시간 기준 오늘 00:00:00을 UTC로 변환
        // Date.UTC로 KST 날짜/시간을 만들고, 9시간을 빼서 UTC로 변환
        const kstStart = new Date(Date.UTC(kstYear, kstMonth, kstDate, 0, 0, 0));
        const startDate = new Date(kstStart.getTime() - (9 * 60 * 60 * 1000));
        const startDateString = startDate.toISOString().slice(0,19);
        console.log(startDateString)    // 한국 시간 기준 오늘 00:00:00 (UTC로 변환)
        
        // 한국 시간 기준 오늘 23:59:59을 UTC로 변환
        const kstEnd = new Date(Date.UTC(kstYear, kstMonth, kstDate, 23, 59, 59));
        const endDate = new Date(kstEnd.getTime() - (9 * 60 * 60 * 1000));
        const endDateString = endDate.toISOString().slice(0,19);
        console.log(endDateString)      // 한국 시간 기준 오늘 23:59:59 (UTC로 변환)

        axios.get(`http://localhost:8080/api/orders/allacountperiod?startDate=${startDateString}&endDate=${endDateString}`)
            .then(res => {
                setOrders(res.data);
            })
            .catch(err => console.log(err));
    },[])

    // 환불 제외 전체 거래 건수 가져오기
    useEffect(() => {

        // 한국 시간(KST) 기준으로 오늘 날짜 계산
        const now = new Date();
        // 현재 UTC 시간에 9시간을 더해 KST 시간 계산
        const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const kstYear = kstTime.getUTCFullYear();
        const kstMonth = kstTime.getUTCMonth();
        const kstDate = kstTime.getUTCDate();
        
        // 한국 시간 기준 오늘 00:00:00을 UTC로 변환
        // Date.UTC로 KST 날짜/시간을 만들고, 9시간을 빼서 UTC로 변환
        const kstStart = new Date(Date.UTC(kstYear, kstMonth, kstDate, 0, 0, 0));
        const startDate = new Date(kstStart.getTime() - (9 * 60 * 60 * 1000));
        const startDateString = startDate.toISOString().slice(0,19);
        console.log(startDateString)    // 한국 시간 기준 오늘 00:00:00 (UTC로 변환)
        
        // 한국 시간 기준 오늘 23:59:59을 UTC로 변환
        const kstEnd = new Date(Date.UTC(kstYear, kstMonth, kstDate, 23, 59, 59));
        const endDate = new Date(kstEnd.getTime() - (9 * 60 * 60 * 1000));
        const endDateString = endDate.toISOString().slice(0,19);
        console.log(endDateString)      // 한국 시간 기준 오늘 23:59:59 (UTC로 변환)

        axios.get(`http://localhost:8080/api/orders/allacountperiodwithoutrefund?status=환불완료&startDate=${startDateString}&endDate=${endDateString}`)
            .then(res => {
                setordersWithRefund(res.data);
            })
            .catch(err => console.log(err));
    },[])

    return (
            <div>
                <div className="admin-stats-grid">

                    {/* 시장 개수 */}
                    <div className="admin-stat-card">
                    <p style={{fontSize: '13px', color: '#777', marginBottom: '10px'}}>총 시장</p>
                    <h3 style={{fontSize: '32px', color: '#333', margin: '0 0 5px 0'}}>{markets.length}</h3>
                    <small style={{fontSize: '12px', color: '#999'}}>개</small>
                    </div>

                    {/* 사용자 수 */}
                    <div className="admin-stat-card">
                    <p style={{fontSize: '13px', color: '#777', marginBottom: '10px'}}>총 사용자</p>
                    <h3 style={{fontSize: '32px', color: '#27ae60', margin: '0 0 5px 0'}}>
                        {members.length}
                    </h3>
                    <small style={{fontSize: '12px', color: '#999'}}>명</small>
                    </div>

                    {/* 금일 거래 건수 */}
                    <div className="admin-stat-card">
                    <p style={{fontSize: '13px', color: '#777', marginBottom: '10px'}}>금일 거래 건수<br/>(환불 제외 금일 거래 건수)</p>
                    <h3 style={{fontSize: '32px', color: '#333', margin: '0 0 5px 0'}}>
                        {orders.length} ({orders.length - ordersWithRefund.length})
                    </h3>
                    <small style={{fontSize: '12px', color: '#999'}}>건</small>
                    </div>

                    {/* 미처리 문의 개수 */}
                    <div className="admin-stat-card">
                    <p style={{fontSize: '13px', color: '#777', marginBottom: '10px'}}>미처리 문의 수</p>
                    <h3 style={{fontSize: '32px', color: '#3498db', margin: '0 0 5px 0'}}>{contacts.length}</h3>
                    <small style={{fontSize: '12px', color: '#999'}}>개</small>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-card-header">
                    <h3 style={{fontSize: '18px', color: '#333', margin: 0}}>사용자 가입 현황</h3>
                    </div>
                    <div className="admin-card-body">
                    {userStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={userStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend formatter={() => "누적 가입자 수"}/>
                                <Line type="monotone" dataKey="count" stroke="#ff7043" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            데이터를 불러오는 중...
                        </div>
                    )}
                    </div>
                </div>
            </div>
    );
};

export default AdminDashboard;