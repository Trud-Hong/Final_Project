import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import '../css/sellerProductForm.scss';
import BacktoTop from '../components/BacktoTop';
import GotoBack from '../components/GotoBack';
import { useNavigate, useParams } from "react-router-dom";

const categoryOptions = {
  // ----------------------
  // 과일류
  // ----------------------
  fruit: [
    "딸기",
    "사과",
    "배",
    "포도",
    "수박",
    "참외",
    "멜론",
    "복숭아",
    "자두",
    "귤",
    "한라봉",
    "감귤",
    "레몬",
    "오렌지",
    "블루베리",
    "라즈베리",
    "키위",
    "체리",
    "망고",
    "바나나",
    "감",
    "곶감",
    "석류",
    "기타",
  ],

  // ----------------------
  // 채소류
  // ----------------------
  vegetable: [

    "배추",
    "양배추",
    "상추",
    "깻잎",
    "시금치",
    "부추",
    "청경채",
    "로메인",

    "무",
    "당근",
    "생강",

    "오이",
    "토마토",
    "애호박",
    "가지",
    "피망",
    "파프리카",
    "고추(청양/풋) ",

    "대파",
    "쪽파",
    "양파",
    "마늘",

    "감자",
    "고구마",
    "연근",
    "우엉",
    "콩나물",
    "숙주나물",
    "기타",
  ],

  // ----------------------
  // 곡물 & 잡곡
  // ----------------------
  grain: [
    // 기본곡물
    "쌀",
    "현미",
    "보리",
    "찹쌀",
    "흑미",
    "백미",
    "옥수수",

    "귀리",
    "수수",
    "조",
    "기장",

    "콩",
    "검은콩",
    "팥",
    "녹두",
    "대두",

    "땅콩",
    "아몬드",
    "호두",
    "캐슈넛",

    "참깨",
    "들깨",
    "해바라기씨",
    "표고버섯",
    "느타리버섯",
    "팽이버섯",
    "새송이버섯",
    "기타",
  ]
};



const farmingTypes = ["관행재배", "유기농", "무농약", "수경재배", "기타"];
const DRAFT_KEY = "sellerProductDraft";

function formatKoreanWon(num) {
    if(!num) return "";

    const clean = num.toString().replace(/\D/g, "");
    if(!clean) return "";
    if (clean.length > 16) return "최대 999조까지 입력 가능";

    const bigUnits = ["", "만", "억", "조"];
    const parts = [];
    let groupIdx = 0;

    for (let i = clean.length; i > 0; i -= 4) {
        const chunk = clean.substring(Math.max(i - 4, 0), i);
        const numericChunk = parseInt(chunk, 10);
        if (numericChunk) {
            parts.unshift(`${numericChunk}${bigUnits[groupIdx]}`);
        }
        groupIdx++;
    }

    return parts.length ? parts.join(" ") + "원" : "0원";
}

const SellerProductForm = () => {
    const navigate = useNavigate();
    //수정을 위한 params
    const {productId} = useParams();
    const isEditMode = !!productId;
    // 상품 기본 정보
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [priceDisplay, setPriceDisplay] = useState(""); 
    const [stock, setStock] = useState("");
    const [unit, setUnit] = useState("kg");
    const [origin, setOrigin] = useState("");
    const [originDetail, setOriginDetail] = useState("");
    const [farmingType, setFarmingType] = useState("");
    const [harvestDate, setHarvestDate] = useState("");
    const [expirationDate, setExpirationDate] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [storageMethod, setStorageMethod] = useState("");
    const [shippingConditions, setShippingConditions] = useState("");
    const [discountRate, setDiscountRate] = useState("");
    const [discountStart, setDiscountStart] = useState("");
    const [discountEnd, setDiscountEnd] = useState("");
    const [bulkMinQuantity, setBulkMinQuantity] = useState("");
    const [bulkDiscountRate, setBulkDiscountRate] = useState("");
    const [stockWarningThreshold, setStockWarningThreshold] = useState("");
    const [shippingFreeThreshold, setShippingFreeThreshold] = useState("");
    const [additionalShippingFee, setAdditionalShippingFee] = useState("");
    const [certifications, setCertifications] = useState([]);
    const [certFileNames, setCertFileNames] = useState([]);
    const [certFileUrls, setCertFileUrls] = useState([]);

    // 여러 단위 옵션 지원
    const [useUnitOptions, setUseUnitOptions] = useState(false);
    const [unitOptions, setUnitOptions] = useState([]);

    // 이미지 업로드
    const [images, setImages] = useState([]);
    const [imageUrls, setImageUrls] = useState([]);
    const [mainIndex, setMainIndex] = useState(0);
    const fileInputRef = useRef(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);

    const [mainCategory, setMainCategory] = useState("");
    const [item, setItem] = useState("");


    const buildDraftPayload = () => ({
        name,
        price,
        priceDisplay,
        stock,
        unit,
        origin,
        originDetail,
        farmingType,
        harvestDate,
        expirationDate,
        mainCategory,
        item,
        description,
        tags,
        tagInput,
        storageMethod,
        shippingConditions,
        discountRate,
        discountStart,
        discountEnd,
        bulkMinQuantity,
        bulkDiscountRate,
        stockWarningThreshold,
        shippingFreeThreshold,
        additionalShippingFee,
        imageUrls,
        mainIndex,
        certFileNames,
        useUnitOptions,
        unitOptions,
    });

    const applyDraftPayload = (draft) => {
        if (!draft) return;
        setName(draft.name || "");
        setPrice(draft.price || "");
        setPriceDisplay(draft.priceDisplay || "");
        setStock(draft.stock || "");
        setUnit(draft.unit || "kg");
        setOrigin(draft.origin || "");
        setOriginDetail(draft.originDetail || "");
        setFarmingType(draft.farmingType || "");
        setHarvestDate(draft.harvestDate || "");
        setExpirationDate(draft.expirationDate || "");
        setMainCategory(draft.mainCategory || draft.categoryType || "");
        setItem(draft.item || draft.itemType || "");
        setDescription(draft.description || "");
        setTags(draft.tags || []);
        setTagInput(draft.tagInput || "");
        setStorageMethod(draft.storageMethod || "");
        setShippingConditions(draft.shippingConditions || "");
        setDiscountRate(draft.discountRate || "");
        setDiscountStart(draft.discountStart || "");
        setDiscountEnd(draft.discountEnd || "");
        setBulkMinQuantity(draft.bulkMinQuantity || "");
        setBulkDiscountRate(draft.bulkDiscountRate || "");
        setStockWarningThreshold(draft.stockWarningThreshold || "");
        setShippingFreeThreshold(draft.shippingFreeThreshold || "");
        setAdditionalShippingFee(draft.additionalShippingFee || "");
        setImageUrls(draft.imageUrls || []);
        setMainIndex(draft.mainIndex || 0);
        setCertFileNames(draft.certFileNames || []);
        setUseUnitOptions(draft.useUnitOptions || false);
        setUnitOptions(draft.unitOptions || []);
    };

    useEffect(() => {
        if(productId) {
            // 수정 모드: 상품 데이터 로드
            const fetchProduct = async () => {
                try {
                    const res = await axios.get(`http://localhost:8080/seller/products/id/${productId}`,{
                        headers: {Authorization: `Bearer ${localStorage.getItem("token")}`},
                    });
                    const product = res.data;
                    setName(product.name || "");
                    setPrice(product.price ? product.price.toString() : "");
                    setStock(product.stock ? product.stock.toString() : "");
                    setUnit(product.unit || "kg");
                    setOrigin(product.origin || "");
                    setOriginDetail(product.originDetail || "");
                    setMainCategory(product.categoryType || "");
                    setItem(product.itemType || "");
                    setDescription(product.description || "");
                    setTags(product.tags || []);
                    setImageUrls(product.images || []);
                    setMainIndex(product.images && product.images.length > 0 ? (product.images.findIndex(img => img === product.mainImage) >= 0 ? product.images.findIndex(img => img === product.mainImage) : 0) : 0);
                    setCertFileUrls(product.certificates || []);
                    setFarmingType(product.farmingType || "");
                    setHarvestDate(product.harvestDate || "");
                    setExpirationDate(product.expirationDate || "");
                    setStorageMethod(product.storageMethod || "");
                    setShippingConditions(product.shippingConditions || "");
                    setDiscountRate(product.discountRate != null ? product.discountRate.toString() : "");
                    setDiscountStart(product.discountStart || "");
                    setDiscountEnd(product.discountEnd || "");
                    setBulkMinQuantity(product.bulkMinQuantity != null ? product.bulkMinQuantity.toString() : "");
                    setBulkDiscountRate(product.bulkDiscountRate != null ? product.bulkDiscountRate.toString() : "");
                    setStockWarningThreshold(product.stockWarningThreshold != null ? product.stockWarningThreshold.toString() : "");
                    setShippingFreeThreshold(product.shippingFreeThreshold != null ? product.shippingFreeThreshold.toString() : "");
                    setAdditionalShippingFee(product.additionalShippingFee != null ? product.additionalShippingFee.toString() : "");
                    
                    // unitOptions 처리
                    if (product.unitOptions && product.unitOptions.length > 0) {
                        setUseUnitOptions(true);
                        setUnitOptions(product.unitOptions.map(opt => ({
                            productName: opt.productName || '',
                            unit: opt.unit || '',
                            price: opt.price || 0,
                            stock: opt.stock || 0,
                            isDefault: opt.isDefault || false
                        })));
                    } else {
                        setUseUnitOptions(false);
                        setUnitOptions([]);
                    }
                    
                    setIsDraftLoaded(true);
                } catch (err) { 
                    console.error("상품 불러오기 실패", err); 
                    alert("상품 정보를 불러오는 데 실패했습니다.");
                    setIsDraftLoaded(true);
                }
            };
            fetchProduct();
        } else {
            // 신규 등록 모드: 폼 초기화 및 draft 삭제
            localStorage.removeItem(DRAFT_KEY); // 등록 모드로 진입 시 draft 삭제
            setName(""); setPrice(""); setStock(""); 
            setUnit("kg"); setOrigin(""); setOriginDetail("");
            setMainCategory(""); setItem(""); setDescription(""); setTags([]);
            setTagInput("");
            setImages([]); setMainIndex(0); setImageUrls([]);
            setPriceDisplay("");
            setFarmingType(""); setHarvestDate(""); setExpirationDate("");
            setStorageMethod(""); setShippingConditions("");
            setDiscountRate(""); setDiscountStart(""); setDiscountEnd("");
            setBulkMinQuantity(""); setBulkDiscountRate("");
            setStockWarningThreshold(""); setShippingFreeThreshold("");
            setAdditionalShippingFee("");
            setCertifications([]); setCertFileNames([]); setCertFileUrls([]);
            setIsDraftLoaded(true);
        }
    }, [productId]);

    // useUnitOptions가 true일 때, 기본 옵션의 가격을 price state에 자동 반영
    useEffect(() => {
        if (useUnitOptions && unitOptions && unitOptions.length > 0) {
            const defaultOption = unitOptions.find(opt => opt.isDefault);
            if (defaultOption && defaultOption.price) {
                const priceValue = typeof defaultOption.price === 'string' 
                    ? defaultOption.price.replace(/\D/g, '') 
                    : defaultOption.price.toString();
                if (priceValue) {
                    setPrice(priceValue);
                }
            }
        }
    }, [useUnitOptions, unitOptions]);

    useEffect(() => {
        if (!isDraftLoaded) return;
        const payload = buildDraftPayload();
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    }, [
        isDraftLoaded,
        name,
        price,
        priceDisplay,
        stock,
        unit,
        origin,
        originDetail,
        farmingType,
        harvestDate,
        expirationDate,
        mainCategory,
        item,
        description,
        tags,
        tagInput,
        storageMethod,
        shippingConditions,
        discountRate,
        discountStart,
        discountEnd,
        bulkMinQuantity,
        bulkDiscountRate,
        stockWarningThreshold,
        shippingFreeThreshold,
        additionalShippingFee,
        imageUrls,
        mainIndex,
        certFileNames,
        useUnitOptions,
        unitOptions,
    ]);

    const handleSaveDraft = () => {
        const payload = buildDraftPayload();
        localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraftPayload()));
        console.log("임시 저장 완료:", payload);
        alert("임시 저장이 완료되었습니다.");
    };

    const resetForm = () => {
        setName(""); setPrice(""); setStock(""); 
        setUnit("kg"); setOrigin(""); setOriginDetail("");
        setMainCategory(""); setItem(""); setDescription(""); setTags([]);
        setTagInput("");
        setImages([]); setMainIndex(0); setImageUrls([]);
        setPriceDisplay("");
        setFarmingType(""); setHarvestDate(""); setExpirationDate("");
        setStorageMethod(""); setShippingConditions("");
        setDiscountRate(""); setDiscountStart(""); setDiscountEnd("");
        setBulkMinQuantity(""); setBulkDiscountRate("");
        setStockWarningThreshold(""); setShippingFreeThreshold("");
        setAdditionalShippingFee("");
        setCertifications([]); setCertFileNames([]); setCertFileUrls([]);
        setUseUnitOptions(false);
        setUnitOptions([]);
    };

    // 단위 옵션 관리 함수들
    const addUnitOption = () => {
        setUnitOptions([...unitOptions, { productName: '', unit: '', price: '', stock: '', isDefault: false }]);
    };

    const removeUnitOption = (index) => {
        setUnitOptions(unitOptions.filter((_, i) => i !== index));
    };

    const updateUnitOption = (index, field, value) => {
        const updated = [...unitOptions];
        if (field === 'price' || field === 'stock') {
            updated[index][field] = value.replace(/\D/g, '');
        } else if (field === 'isDefault') {
            // 기본 옵션은 하나만 선택 가능
            updated.forEach((opt, i) => {
                opt.isDefault = (i === index);
            });
        } else {
            updated[index][field] = value;
        }
        setUnitOptions(updated);
    };

    const handleUseUnitOptionsChange = (e) => {
        const checked = e.target.checked;
        setUseUnitOptions(checked);
        if (checked && unitOptions.length === 0) {
            // 체크 시 빈 옵션 하나 추가하거나, 기존 price/stock/unit으로 초기화 (productName은 빈 값)
            if (price && stock && unit) {
                setUnitOptions([{
                    productName: '',
                    unit: unit,
                    price: price,
                    stock: stock,
                    isDefault: true
                }]);
            } else {
                setUnitOptions([{ productName: '', unit: '', price: '', stock: '', isDefault: true }]);
            }
        } else if (!checked) {
            setUnitOptions([]);
        }
    };

    const handleClearDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        if(!isEditMode) resetForm();
    };

    const handlePreviewOpen = () => setShowPreview(true);
    const handlePreviewClose = () => setShowPreview(false);

    const validationWarnings = useMemo(() => {
        const warnings = [];
        if (harvestDate && expirationDate && harvestDate > expirationDate) {
            warnings.push({ level: "error", message: "수확일이 유통기한보다 늦습니다." });
        }
        if (discountStart && discountEnd && discountStart > discountEnd) {
            warnings.push({ level: "error", message: "할인 종료일이 시작일보다 빠릅니다." });
        }
        if (discountRate && Number(discountRate) > 90) {
            warnings.push({ level: "warn", message: "할인율이 90%를 초과했습니다. 입력값을 확인하세요." });
        }
        if (bulkDiscountRate && Number(bulkDiscountRate) > 90) {
            warnings.push({ level: "warn", message: "대량 구매 할인율이 90%를 초과했습니다." });
        }
        if (stockWarningThreshold && stock && Number(stockWarningThreshold) > Number(stock)) {
            warnings.push({ level: "warn", message: "재고 경고선이 실제 재고보다 큽니다." });
        }
        return warnings;
    }, [
        harvestDate,
        expirationDate,
        discountStart,
        discountEnd,
        discountRate,
        bulkDiscountRate,
        stockWarningThreshold,
        stock,
    ]);

    const hasBlockingValidation = validationWarnings.some((w) => w.level === "error");

    const previewData = useMemo(() => {
        const mainImageUrl = imageUrls[mainIndex] || imageUrls[0] || "https://placehold.co/360x240?text=Preview";
        return {
            mainImage: mainImageUrl,
            name: name || "상품명 미입력",
            priceText: priceDisplay || formatKoreanWon(price),
            unit: unit || "단위 미입력",
            origin: origin || "원산지 정보 없음",
            tags,
            description: description || "상세 설명이 아직 작성되지 않았습니다.",
            storageMethod,
            shippingConditions,
        };
    }, [
        imageUrls,
        mainIndex,
        name,
        priceDisplay,
        price,
        unit,
        origin,
        tags,
        description,
        storageMethod,
        shippingConditions,
    ]);

    // 이미지 선택
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImages(prev => [...prev, ...files]);
        const newUrls = files.map(file => URL.createObjectURL(file));
        setImageUrls(prev => [...prev, ...newUrls]);
    };

    // 드래그&드롭으로 이미지 선택
    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        // 기존 이미지에 추가
        setImages(prev => [...prev, ...files]);
        const newUrls = files.map(file => URL.createObjectURL(file));
        setImageUrls(prev => [...prev, ...newUrls]);
    };
    const handleDragOver = (e) => e.preventDefault();

    // 태그 공통 처리
    const handleTagKeyDown = (e, currentTags, setCurrentTags, currentInput, setCurrentInput) => {
        if ((e.key === "Enter" || e.key === ",") && currentInput.trim() !== "") {
            e.preventDefault();
            const newTag = currentInput.replace(",", "").trim();
            if (!currentTags.includes(newTag)) {
                setCurrentTags([...currentTags, newTag]);
            }
            setCurrentInput("");
        }
    };

    const handleTagRemove = (tag, currentTags, setCurrentTags) => {
        setCurrentTags(currentTags.filter(t => t !== tag));
    };

    const handleNumericChange = (setter, maxLength = 12) => (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (maxLength && value.length > maxLength) value = value.slice(0, maxLength);
        setter(value);
    };

    const addTag = (e) => handleTagKeyDown(e, tags, setTags, tagInput, setTagInput);
    const removeTag = (tag) => handleTagRemove(tag, tags, setTags);

    // 이미지 삭제
    const removeImage = (idx) => {
        const newImages = [...images];
        const newUrls = [...imageUrls];
        newImages.splice(idx, 1);
        newUrls.splice(idx, 1);
        setImages(newImages);
        setImageUrls(newUrls);
        if (mainIndex === idx) setMainIndex(0);
    }

    // 인증서 파일
    const certInputRef = useRef(null);

    const handleCertChange = (e) => {
    setCertifications(prev => [...prev, ...Array.from(e.target.files)]);
    };

    const handleCertDrop = (e) => {
    e.preventDefault();
    setCertifications(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    };

    const removeCertFile = (idx) => {
    setCertifications(prev => prev.filter((_, i) => i !== idx));
    };


    // 파일 업로드 (이미지/인증 공용)
    const uploadFiles = async (files, type = "product") => {
        if(!files || files.length === 0) return [];

        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        formData.append("type", type)

        try {
            const res = await axios.post(
                "http://localhost:8080/files/upload", 
                formData, 
                { 
                headers: {Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "multipart/form-data"} 
                }
            );
            return res.data;
        } catch (err) {
            console.error("파일 업로드 실패", err)
            return [];
        }
    }

    const toInt = (value) => value ? parseInt(value, 10) : null;
    const toFloat = (value) => value ? parseFloat(value) : null;


    // 상품 등록
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validationWarnings.some(w => w.level === "error")) {
            alert("입력값을 다시 확인해 주세요. (날짜 순서 등)");
            return;
        }

        const uploadedImageUrls = await uploadFiles(images,"product-images");
        if (uploadedImageUrls.length) setImageUrls(uploadedImageUrls);

        const uploadedCertUrls = await uploadFiles(certifications,"certificates");
        if (uploadedCertUrls.length) setCertFileUrls(uploadedCertUrls);

        let finalImageUrls = uploadedImageUrls.length
            ? uploadedImageUrls
            : (images.length ? [] : imageUrls);
        const finalCertUrls = uploadedCertUrls.length
            ? uploadedCertUrls
            : (certifications.length ? [] : certFileUrls);
        const safeMainImage = finalImageUrls[mainIndex] || finalImageUrls[0] || "";
        
        // 대표이미지를 배열의 첫 번째로 배치
        if (safeMainImage && finalImageUrls.length > 0) {
            const mainImageIndex = finalImageUrls.findIndex(img => img === safeMainImage);
            if (mainImageIndex > 0) {
                // 대표이미지를 찾아서 첫 번째로 이동
                finalImageUrls = [
                    safeMainImage,
                    ...finalImageUrls.filter((_, idx) => idx !== mainImageIndex)
                ];
            }
        }

        // unitOptions 검증 및 정리
        let validUnitOptions = null;
        if (useUnitOptions) {
            if (!unitOptions || unitOptions.length === 0) {
                alert("단위 옵션을 최소 1개 이상 추가해주세요.");
                return;
            }
            
            // 유효한 옵션만 필터링 (productName, unit, price, stock이 모두 있어야 함)
            validUnitOptions = unitOptions
                .filter(opt => {
                    const hasProductName = opt && opt.productName && opt.productName.trim() !== '';
                    const hasUnit = opt && opt.unit && opt.unit.trim() !== '';
                    const hasPrice = opt && opt.price !== undefined && opt.price !== null && parseInt(opt.price) > 0;
                    const hasStock = opt && opt.stock !== undefined && opt.stock !== null && parseInt(opt.stock) >= 0;
                    return hasProductName && hasUnit && hasPrice && hasStock;
                })
                .map(opt => ({
                    productName: opt.productName.trim(),
                    unit: opt.unit.trim(),
                    price: parseInt(opt.price),
                    stock: parseInt(opt.stock),
                    isDefault: opt.isDefault === true
                }));
            
            if (validUnitOptions.length === 0) {
                alert("유효한 단위 옵션을 최소 1개 이상 추가해주세요. (제품명, 단위, 가격, 재고가 모두 입력되어야 합니다)");
                return;
            }
            
            // 기본 옵션이 없으면 첫 번째를 기본으로 설정
            if (!validUnitOptions.some(opt => opt.isDefault)) {
                validUnitOptions[0].isDefault = true;
            }
        }

        // useUnitOptions가 true이면 기본 옵션의 가격을 기본 가격으로 사용
        let finalPrice = parseInt(price);
        let finalStock = parseInt(stock);
        let finalUnit = unit;
        
        if (useUnitOptions && validUnitOptions && validUnitOptions.length > 0) {
            const defaultOption = validUnitOptions.find(opt => opt.isDefault) || validUnitOptions[0];
            finalPrice = defaultOption.price;
            finalStock = defaultOption.stock;
            finalUnit = defaultOption.unit;
        }

        const productData = {
            sellerId: localStorage.getItem("userId"),
            sellerName: localStorage.getItem("username"),

            name,
            price: finalPrice,
            stock: finalStock,
            unit: finalUnit,
            origin,
            originDetail,
            farmingType,
            harvestDate,
            expirationDate,
            categoryType: mainCategory,
            itemType: item,
            description,
            tags,
            storageMethod,
            shippingConditions,
            discountRate: toFloat(discountRate),
            discountStart,
            discountEnd,
            bulkMinQuantity: toInt(bulkMinQuantity),
            bulkDiscountRate: toFloat(bulkDiscountRate),
            stockWarningThreshold: toInt(stockWarningThreshold),
            shippingFreeThreshold: toInt(shippingFreeThreshold),
            additionalShippingFee: toInt(additionalShippingFee),
            images: finalImageUrls,
            mainImage: safeMainImage,
            certificates: finalCertUrls,
            unitOptions: validUnitOptions, // 여러 단위 옵션 추가
        };

        try { if (productId) { // 수정: productId 있으면 PUT 요청
            await axios.put(`http://localhost:8080/seller/products/${productId}`, productData, 
            { 
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, 
            }); 
            alert("상품 수정 완료!"); 
        } else { // 신규 등록 
            await axios.post("http://localhost:8080/seller/products", productData, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, }); 
            alert("상품 등록 완료!"); } 
            
            resetForm(); 
            localStorage.removeItem(DRAFT_KEY); 
            navigate("/products"); 
        } catch (err) { 
            console.error("상품 처리 실패", err); 
            alert("상품 처리 중 오류가 발생했습니다."); 
        } 
    }

    // 가격 입력 처리: 숫자만 허용, 최대 16자리 제한 (~999조까지)
    const handlePriceChange = (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if(value.length > 16) value = value.slice(0,16);
        setPrice(value);
        setPriceDisplay(formatKoreanWon(value));
    }

    // 재고 입력 처리
    const handleStockChange = (e) => {
        const value = e.target.value.replace(/\D/g, "");
        setStock(value);
        if(!unit) setUnit("개"); 
    };

    return (
        <div>
            
        <div className="product-form-container">
            <GotoBack/>
            <h2>{productId ? "상품 수정" : "판매자 상품 등록"}</h2>

            <form onSubmit={handleSubmit}>

                {/* 상품 기본정보 */}
                <div className="section">
                    <div className="section-header">
                        <h3>상품 기본정보</h3>
                        <p className="section-description">상품의 기본적인 정보를 입력해주세요</p>
                    </div>

                    <div className="row">
                        <div className="input-group">
                            <input 
                            type="text" 
                            value={name}
                            placeholder="예: 신선한 사과 1kg" 
                            onChange={(e)=>setName(e.target.value)} 
                            required />
                            <label>상품명 <span>*</span></label>
                        </div>
                        {/* 상품종 (제철 비교용 카테고리 + 품목) */}
<div className="input-group">

  {/* 대분류 선택 */}
  <select 
    value={mainCategory}
    onChange={(e) => {
      setMainCategory(e.target.value);
      setItem("");   // 카테고리 변경 시 품목 초기화
    }}
    className={mainCategory ? "has-value" : ""}
    required
  >
    <option value="">카테고리 선택</option>
    <option value="fruit">과일</option>
    <option value="vegetable">채소</option>
    <option value="grain">곡물&기타</option>
  </select>

  {/* 소분류(품목) 선택 */}
  <select
    value={item}
    disabled={!mainCategory}
    onChange={(e) => setItem(e.target.value)}
    className={item ? "has-value" : ""}
    required
  >
    <option value="">품목 선택</option>
    {mainCategory &&
      categoryOptions[mainCategory].map((i) => (
        <option key={i} value={i}>
          {i}
        </option>
      ))}
  </select>

  <label>상품종 <span>*</span></label>
</div>


                    </div>

                    <div className="row">
                        <div className="input-group price"> 
                            <input 
                                placeholder="예: 15000, 1kg당 가격을 적어주세요" 
                                type="text" 
                                value={price.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} 
                                onChange={handlePriceChange} 
                                disabled={useUnitOptions}
                                required={!useUnitOptions}
                            />
                            <label>가격(원) <span>*</span> {useUnitOptions && <span className="text-muted" style={{fontSize: '12px', fontWeight: 'normal'}}>(단위 옵션 사용 시 기본 옵션 가격 자동 설정)</span>}</label>
                            {priceDisplay && <div className="price-display">{priceDisplay}</div>}
                        </div>
                        <div className="input-group">
                            <input placeholder="예: 경상북도 안동시" type="text" value={origin} onChange={(e)=>setOrigin(e.target.value)} required />
                            <label>원산지 <span>*</span></label>
                        </div>
                       
                    </div>

                    {/* 여러 단위 옵션 사용 여부 */}
                    <div className="row">
                        <div className="unit-options-checkbox-wrapper">
                            <input
                                type="checkbox"
                                id="useUnitOptions"
                                checked={useUnitOptions}
                                onChange={handleUseUnitOptionsChange}
                            />
                            <label htmlFor="useUnitOptions" className="unit-options-checkbox-label">
                                여러 단위 옵션 사용 (예: 1kg, 500g, 100g 등)
                            </label>
                        </div>
                    </div>

                    {useUnitOptions ? (
                        /* 여러 단위 옵션 입력 - 표 형식 */
                        <div className="row">
                            <div className="unit-options-section">
                                <label className="unit-options-label">단위 옵션 <span>*</span></label>
                                <div className="unit-options-table-wrapper">
                                    <table className="unit-options-table">
                                        <thead>
                                            <tr>
                                                <th>제품명</th>
                                                <th>단위</th>
                                                <th>가격</th>
                                                <th>재고</th>
                                                <th>기본</th>
                                                <th>삭제</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {unitOptions.map((opt, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="unit-option-input"
                                                            placeholder="예: 신선한 사과 1kg"
                                                            value={opt.productName || ''}
                                                            onChange={(e) => updateUnitOption(index, 'productName', e.target.value)}
                                                            required
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="unit-option-input"
                                                            placeholder="예: 1kg"
                                                            value={opt.unit || ''}
                                                            onChange={(e) => updateUnitOption(index, 'unit', e.target.value)}
                                                            required
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="unit-option-input"
                                                            placeholder="가격"
                                                            value={opt.price || ''}
                                                            onChange={(e) => updateUnitOption(index, 'price', e.target.value)}
                                                            required
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="unit-option-input"
                                                            placeholder="재고"
                                                            value={opt.stock || ''}
                                                            onChange={(e) => updateUnitOption(index, 'stock', e.target.value)}
                                                            required
                                                        />
                                                    </td>
                                                    <td>
                                                        <label className="unit-option-default">
                                                            <input
                                                                type="radio"
                                                                name="defaultOption"
                                                                checked={opt.isDefault || false}
                                                                onChange={() => updateUnitOption(index, 'isDefault', true)}
                                                            />
                                                            기본
                                                        </label>
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="unit-option-delete-btn"
                                                            onClick={() => removeUnitOption(index)}
                                                        >
                                                            삭제
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button
                                    type="button"
                                    className="unit-option-add-btn"
                                    onClick={addUnitOption}
                                >
                                    + 옵션 추가
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* 기본 단일 단위 입력 */
                        <div className="row">
                            <div className="input-group stock-unit">
                                <div className="stock-unit-wrapper">
                                    <input 
                                    type="text"
                                    value={stock}
                                    onChange={handleStockChange}
                                    placeholder="100"
                                    required={!useUnitOptions}
                                    />
                                    <span className="unit-separator">/</span>
                                    <input 
                                    type="text"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    placeholder="kg"
                                    required={!useUnitOptions}
                                    />
                                </div>
                                <label>재고 / 단위 <span>*</span></label>
                            </div>
                        </div>
                    )}

                    <div className="row">
                        <div className="input-group">
                            <input 
                            type="text"
                            value={originDetail}
                            onChange={(e)=>setOriginDetail(e.target.value)}
                            placeholder="예: 안동시 풍산면 유명리"
                            />
                            <label>산지 상세정보</label>
                        </div>
                        <div className="input-group">
                            <select 
                            value={farmingType}
                            className={farmingType ? "has-value" : ""}
                            onChange={(e)=>setFarmingType(e.target.value)}
                            >
                                <option value="">재배 방식 선택</option>
                                {farmingTypes.map((type, idx)=><option key={idx} value={type}>{type}</option>)}
                            </select>
                            <label>재배 방식</label>
                        </div>
                    </div>

                    <div className="row">
                        <div className="input-group">
                            <input 
                            type="date"
                            value={harvestDate}
                            onChange={(e)=>setHarvestDate(e.target.value)}
                            className={harvestDate ? "has-value" : ""}
                            />
                            <label>수확일</label>
                        </div>
                        <div className="input-group">
                            <input 
                            type="date"
                            value={expirationDate}
                            onChange={(e)=>setExpirationDate(e.target.value)}
                            className={expirationDate ? "has-value" : ""}
                            />
                            <label>유통기한</label>
                        </div>
                    </div>
                </div>

                {/* 보관/배송 정책 */}
                <div className="section">
                    <div className="section-header">
                        <h3>보관 · 배송 정책</h3>
                        <p className="section-description">고객에게 안내할 보관 방법과 배송 조건을 설정해주세요</p>
                    </div>
                    <div className="row">
                        <div className="input-group">
                            <input 
                            type="text"
                            value={stockWarningThreshold}
                            onChange={handleNumericChange(setStockWarningThreshold, 6)}
                            placeholder="예: 10"
                            />
                            <label>재고 경고선 (수량)</label>
                        </div>
                        <div className="input-group">
                            <input 
                            type="text"
                            value={shippingFreeThreshold}
                            onChange={handleNumericChange(setShippingFreeThreshold, 9)}
                            placeholder="예: 50000"
                            />
                            <label>무료배송 기준 (원)</label>
                        </div>
                        <div className="input-group">
                            <input 
                            type="text"
                            value={additionalShippingFee}
                            onChange={handleNumericChange(setAdditionalShippingFee, 7)}
                            placeholder="예: 3000"
                            />
                            <label>지역 추가 배송비 (원)</label>
                        </div>
                    </div>
                    <div className="textarea-grid">
                        <div className="textarea-wrapper">
                            <textarea 
                            className={storageMethod ? "has-value" : ""}
                            placeholder=''
                            value={storageMethod}
                            onChange={(e)=>setStorageMethod(e.target.value)}
                            />
                            <label>보관 방법</label>
                        </div>
                        <p className="helper-text">예: 0~5℃ 냉장 보관, 개봉 후 2일 이내 섭취</p>
                        <div className="textarea-wrapper">
                            <textarea 
                            placeholder=''
                            value={shippingConditions}
                            onChange={(e)=>setShippingConditions(e.target.value)}
                            />
                            <label>배송 조건/제한</label>
                        </div>
                        <p className="helper-text">예: 월~목 출고, 도서산간 2~3일 추가, 냉장 배송</p>
                    </div>
                </div>

                {/* 프로모션 */}
                <div className="section">
                    <div className="section-header">
                        <h3>프로모션 · 할인</h3>
                        <p className="section-description">할인 및 프로모션 정보를 설정해주세요 (선택사항)</p>
                    </div>
                    <div className="row">
                        <div className="input-group">
                            <input 
                            type="text"
                            value={discountRate}
                            onChange={handleNumericChange(setDiscountRate, 3)}
                            placeholder="예: 10"
                            />
                            <label>기본 할인율 (%)</label>
                        </div>
                        <div className="input-group">
                            <input 
                            type="date"
                            value={discountStart}
                            onChange={(e)=>setDiscountStart(e.target.value)}
                            className={discountStart ? "has-value" : ""}
                            />
                            <label>할인 시작일</label>
                        </div>
                        <div className="input-group">
                            <input 
                            type="date"
                            value={discountEnd}
                            onChange={(e)=>setDiscountEnd(e.target.value)}
                            className={discountEnd ? "has-value" : ""}
                            />
                            <label>할인 종료일</label>
                        </div>
                    </div>
                    <div className="row">
                        <div className="input-group">
                            <input 
                            type="text"
                            value={bulkMinQuantity}
                            onChange={handleNumericChange(setBulkMinQuantity, 6)}
                            placeholder="예: 5"
                            />
                            <label>대량 구매 최소 수량</label>
                        </div>
                        <div className="input-group">
                            <input 
                            type="text"
                            value={bulkDiscountRate}
                            onChange={handleNumericChange(setBulkDiscountRate, 3)}
                            placeholder="예: 15"
                            />
                            <label>대량 구매 할인율 (%)</label>
                        </div>
                    </div>
                </div>

                {/* 태그 */}
                <div className="section">
                    <div className="section-header">
                        <h3>태그</h3>
                        <p className="section-description">상품 검색에 도움이 되는 태그를 입력해주세요 (선택사항)</p>
                    </div>
                    <div className="tag-sets">
                        <div className="tag-box">
                            {tags.map(tag=>(
                                <span key={tag} className="tag">{tag} <b onClick={()=>removeTag(tag)}>×</b></span>
                            ))}
                            <input placeholder="태그 입력 후 Enter 또는 쉼표(,) 입력" value={tagInput} onChange={(e)=>setTagInput(e.target.value)} onKeyDown={addTag}/>
                        </div>
                    </div>
                </div>

                {/* 상세설명 */}
                <div className="section">
                    <div className="section-header">
                        <h3>상품 상세설명</h3>
                        <p className="section-description">상품에 대한 자세한 설명을 작성해주세요</p>
                    </div>
                    <div className="textarea-wrapper">
                        <textarea 
                        placeholder="상품의 특징, 재배 과정, 맛과 영양 정보 등을 자세히 작성해주세요"
                        value={description} onChange={(e)=>setDescription(e.target.value)} required />
                        <label>상세설명 <span>*</span></label>
                    </div>
                </div>

                {/* 인증서 */}
<div className="section">
  <div className="section-header">
    <h3>품질 인증 · 검사서</h3>
    <p className="section-description">유기농 인증서, 검사서 등을 첨부해주세요 (선택사항)</p>
  </div>

  <div
    className="dropzone cert-dropzone"
    onDrop={handleCertDrop}
    onDragOver={handleDragOver}
    onClick={() => certInputRef.current.click()}
  >
    <div className="dropzone-icon">📎</div>
    <div className="dropzone-text">
      <strong>파일을 드래그하거나 클릭하여 업로드</strong>
      <span>이미지 또는 PDF를 첨부할 수 있습니다</span>
    </div>
    <input
      type="file"
      ref={certInputRef}
      multiple
      accept="image/*,.pdf"
      style={{ display: "none" }}
      onChange={handleCertChange}
    />
  </div>

  {certifications.length > 0 && (
    <div className="preview">
      {certifications.map((file, idx) => (
        <div key={idx} className="img-box">
          {file.type.startsWith("image") ? (
            <img src={URL.createObjectURL(file)} alt={`인증서-${idx}`} />
          ) : (
            <div className="pdf-placeholder">{file.name}</div>
          )}
          <span className="remove-btn" onClick={() => removeCertFile(idx)}>×</span>
        </div>
      ))}
    </div>
  )}
</div>

                {/* 이미지 */}
                <div className="section">
                    <div className="section-header">
                        <h3>상품 이미지</h3>
                        <p className="section-description">상품을 잘 보여줄 수 있는 이미지를 등록해주세요</p>
                    </div>
                    <div
                        className="dropzone"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current.click()}
                    >
                        <div className="dropzone-icon">📷</div>
                        <div className="dropzone-text">
                            <strong>이미지를 드래그하거나 클릭하여 업로드</strong>
                            <span>JPG, PNG 파일을 지원합니다</span>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            multiple
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleImageChange}
                        />
                    </div>

                    <div className="preview">
                        {imageUrls.map((url, idx) => (
                            <div key={idx} className={`img-box ${mainIndex === idx ? "main" : ""}`}>
                                <img src={url} alt={`상품이미지-${idx}`} />
                                
                                {/* 대표 이미지 배지 */}
                                {mainIndex === idx && <span className="badge">대표</span>}

                                {/* 삭제 버튼 */}
                                <span className="remove-btn" onClick={() => removeImage(idx)}>×</span>

                                {/* 대표 이미지 선택 버튼 */}
                                {mainIndex !== idx && (
                                    <span
                                        className="set-main-btn"
                                        onClick={() => setMainIndex(idx)}
                                    >
                                        대표선택
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {validationWarnings.length > 0 && (
                    <div className="validation-box">
                        <p>확인 필요한 항목</p>
                        <ul>
                            {validationWarnings.map((warning, idx) => (
                                <li key={`${warning.message}-${idx}`} className={warning.level === "error" ? "error" : ""}>
                                    {warning.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="form-actions">
                    <div className="action-buttons">
                        <button type="button" className="secondary-btn" onClick={handlePreviewOpen}>
                            미리보기
                        </button>
                        <button type="button" className="secondary-btn" onClick={handleSaveDraft}>
                            임시 저장
                        </button>
                        <button type="button" className="ghost-btn" onClick={handleClearDraft}>
                            초기화
                        </button>
                    </div>
                    <div>
                        <button className="submit-btn" type="submit">
                            { productId ? "수정 완료" : "상품 등록하기" }
                        </button>
                    </div>
                    
                </div>
            </form>

            <BacktoTop/>

            {showPreview && (
                <div className="preview-modal">
                    <div className="preview-modal__content">
                        <button type="button" className="close-btn" onClick={handlePreviewClose}>×</button>
                        <div className="preview-card">
                            <div className="preview-card__image">
                                <img src={previewData.mainImage} alt="상품 미리보기" />
                            </div>
                            <div className="preview-card__body">
                                <h4>{previewData.name}</h4>
                                <p className="price">{previewData.priceText || "가격 정보 없음"}</p>
                                <p className="meta">{previewData.origin} · {previewData.unit}</p>
                                <div className="preview-tags">
                                    {previewData.tags && previewData.tags.length > 0 ? (
                                        previewData.tags.map((tag) => <span key={tag}>#{tag}</span>)
                                    ) : (
                                        <span className="muted">태그 없음</span>
                                    )}
                                </div>
                                <p className="desc">
                                    {previewData.description}
                                </p>
                                <div className="preview-extra">
                                    <div>
                                        <strong>보관</strong>
                                        <p>{previewData.storageMethod || "정보 없음"}</p>
                                    </div>
                                    <div>
                                        <strong>배송</strong>
                                        <p>{previewData.shippingConditions || "정보 없음"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </div>
    )
}

export default SellerProductForm;
