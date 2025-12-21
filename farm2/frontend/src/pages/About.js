import PriceTrend from "../components/PriceTrend";

const About = () => {
    return (
        <div>
            <div className="container-fluid page-header mb-5 wow fadeIn" data-wow-delay="0.1s">
                <div className="container">
                    <h3 className="display-3 mb-3 animated slideInDown" style={{marginRight:'300px'}}>도매 가격 현황</h3>
                    <nav aria-label="breadcrumb animated slideInDown">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><a className="text-body" href="/">홈페이지</a></li>
                            <li className="breadcrumb-item text-dark active" aria-current="page">가격추세</li>
                        </ol>
                    </nav>
                </div>
            </div>
            {/* <!-- Page Header End --> */}

            <PriceTrend />



        </div>
    );
};

export default About;