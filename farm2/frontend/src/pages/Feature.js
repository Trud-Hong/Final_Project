import React from 'react';

const Feature = () => {

    const featureData = [
        {
            id: 1,
            icon: "img/icon-1.png",
            title: "유기농 식품의 특징",
            description: "유기농 농산물은 화학 비료나 합성 농약을 사용하지 않고 재배됩니다. 인체에 안전하고 환경을 보호하며 지속 가능한 농업을 실천하는 데 중요한 역할을 합니다.",
            link: "https://www.enviagro.go.kr/portal/main/main.do"
        },
        {
            id: 2,
            icon: "img/icon-2.png",
            title: "제철 농산물의 장점",
            description: "자연 상태에서 가장 잘 자라는 시기에 수확되어 신선하고 영양소가 풍부합니다. 저장 과정이 적어 화학 처리를 최소화할 수 있으며 탄소 배출도 줄일 수 있습니다.",
            link: "https://www.foodnuri.go.kr/portal/bbs/B0000283/list.do?menuNo=300063"
        },
        {
            id: 3,
            icon: "img/icon-3.png",
            title: "로컬푸드의 장점",
            description: "지역에서 생산된 농산물을 가까운 소비자에게 공급하여 신선하고 탄소 배출을 줄일 수 있습니다. 지역경제 활성화에도 큰 도움이 됩니다.",
            link: "https://nhlocalfood.com/about/local-food.html"
        },
        {
            id: 4,
            icon: "img/icon-1.png",
            title: "친환경 재배 방식",
            description: "토양, 수질, 생태계를 보호하는 방법으로 재배된 농산물은 환경 부담을 줄이고 소비자에게도 건강한 먹거리를 제공합니다.",
            link: "https://soil.rda.go.kr/soilmap/ecoEvm.do"
        },
        {
            id: 5,
            icon: "img/icon-2.png",
            title: "산지직송의 장점",
            description: "유통 단계를 최소화하여 신선한 농산물을 빠르게 소비자에게 전달할 수 있습니다. 또한 중간 유통 마진이 줄어 가격 경쟁력이 높습니다.",
            link: "https://www.nongsaro.go.kr/portal/ps/psx/psxs/newsMainView.ps?newsSeqNo=130138&menuId=PS65437"
        },
        {
            id: 6,
            icon: "img/icon-3.png",
            title: "GAP 인증이란?",
            description: "농산물 우수관리 인증(GAP)은 안전하고 깨끗한 농산물을 생산하기 위해 토양, 농약, 수확, 유통까지 철저히 관리하는 체계적인 기준을 충족한 농산물에 부여됩니다.",
            link: "http://www.knusafety.or.kr/gap/gap_introduce.asp"
        },
    ];

     const handleClick = (link) => {
        if (!link) return;  // 링크 없는 항목 클릭 방지
        window.open(link, "_blank"); // 새 탭에서 열기
    };

    return (
        <div>
            {/* Page Header */}
            <div className="container-fluid page-header wow fadeIn" data-wow-delay="0.1s">
                <div className="container">
                    <h1 className="display-3 mb-3 animated slideInDown" style={{ marginRight: '300px' }}>
                        농산물 정보
                    </h1>
                    <nav aria-label="breadcrumb animated slideInDown">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><a className="text-body" href="/">홈페이지</a></li>
                            <li className="breadcrumb-item"><a className="text-body" href="#">판매정보</a></li>
                            <li className="breadcrumb-item text-dark active" aria-current="page">제품정보</li>
                        </ol>
                    </nav>
                </div>
            </div>

            {/* Feature Section */}
            <div className="container py-6">
                <div 
                    className="section-header text-center mx-auto mb-5 wow fadeInUp" 
                    data-wow-delay="0.1s"
                    style={{ maxWidth: "700px"}}
                >
                    <h1 className="display-5 mb-3">농산물 관련 정보</h1>
                    <p>건강하고 안전한 농산물을 선택하기 위한 필수 정보를 확인해보세요.</p>
                </div>

                <div className="row g-5">
                    {featureData.map((item, idx) => (
                        <div 
                            className="col-lg-6 wow fadeInUp" 
                            key={item.id}
                            data-wow-delay={`${0.1 * (idx + 1)}s`}
                        >
                            <div className="d-flex bg-light p-4 rounded shadow-sm align-items-center"
                             style={{ cursor: item.link ? "pointer" : "default" , height: "180px" }}
                                onClick={() => handleClick(item.link)}>
                                <img 
                                    src={item.icon} 
                                    alt={item.title} 
                                    style={{ width: "80px", marginRight: "20px" }} 
                                />
                                <div>
                                    <h4 className="mb-3">{item.title}</h4>
                                    <p className="mb-0">{item.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
            
        </div>
    );
};

export default Feature;
