/**
 * Naver Clova OCR 연동 + 서류별 필드 추출 서비스.
 *
 * 이유: 자격증/통장 사본을 업로드하면 OCR로 텍스트를 자동 추출하여
 *       사용자가 일일이 입력하지 않아도 되게 한다.
 *       신분증은 보안상 OCR을 사용하지 않고 수동 입력만 허용한다.
 *
 * 핵심 원칙:
 *   - NAVER_OCR_INVOKE_URL / NAVER_OCR_SECRET_KEY 환경변수 없으면 graceful skip
 *   - OCR 실패가 전체 흐름을 막지 않음 (에러 시 빈 배열 반환)
 *   - 신분증(id_card)은 무조건 skipped
 */

// ── 은행명 매칭 상수 ──
// OCR 텍스트에서 은행명 키워드를 찾으면 정규화된 은행명으로 변환
const BANK_KEYWORDS: Record<string, string> = {
  국민: "KB국민은행",
  KB: "KB국민은행",
  신한: "신한은행",
  우리: "우리은행",
  하나: "하나은행",
  농협: "NH농협은행",
  NH: "NH농협은행",
  기업: "IBK기업은행",
  IBK: "IBK기업은행",
  SC: "SC제일은행",
  제일: "SC제일은행",
  카카오: "카카오뱅크",
  토스: "토스뱅크",
  케이: "케이뱅크",
  수협: "Sh수협은행",
  Sh: "Sh수협은행",
  광주: "광주은행",
  전북: "전북은행",
  경남: "경남은행",
  대구: "대구은행",
  부산: "부산은행",
  제주: "제주은행",
  산업: "KDB산업은행",
  KDB: "KDB산업은행",
  우체국: "우체국",
  새마을: "새마을금고",
  신협: "신협",
};

// ── Clova OCR 호출 ──

/**
 * Naver Clova General OCR API 호출.
 *
 * @param imageBuffer - 이미지 Buffer (최적화 완료된 상태)
 * @param format - 이미지 포맷 ("jpg", "png", "pdf")
 * @returns 인식된 텍스트 배열. 에러/환경변수 미설정 시 빈 배열.
 */
async function callClovaOCR(
  imageBuffer: Buffer,
  format: string
): Promise<string[]> {
  const invokeUrl = process.env.NAVER_OCR_INVOKE_URL;
  const secretKey = process.env.NAVER_OCR_SECRET_KEY;

  // 환경변수 미설정 → OCR 건너뜀 (에러 안 남)
  if (!invokeUrl || !secretKey) {
    console.warn(
      "[OCR] NAVER_OCR_INVOKE_URL 또는 NAVER_OCR_SECRET_KEY 미설정 — OCR 건너뜀"
    );
    return [];
  }

  // 이미지를 base64로 인코딩
  const base64Data = imageBuffer.toString("base64");

  // Clova OCR 포맷명 정규화 (MIME → 확장자)
  const ocrFormat = format
    .replace("image/jpeg", "jpg")
    .replace("image/png", "png")
    .replace("application/pdf", "pdf")
    .replace("jpeg", "jpg"); // fallback

  const requestBody = {
    version: "V2",
    requestId: `ocr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    images: [
      {
        format: ocrFormat,
        name: "document",
        data: base64Data,
      },
    ],
  };

  try {
    const response = await fetch(invokeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-OCR-SECRET": secretKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(`[OCR] Clova API 응답 에러: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as {
      images?: Array<{
        inferResult?: string;
        fields?: Array<{
          inferText: string;
          inferConfidence: number;
        }>;
      }>;
    };

    // 응답에서 인식된 텍스트 추출
    const image = data.images?.[0];
    if (!image || image.inferResult !== "SUCCESS" || !image.fields) {
      console.warn("[OCR] 인식 실패 또는 빈 결과:", image?.inferResult);
      return [];
    }

    // confidence 0.5 이상인 텍스트만 반환 (노이즈 필터)
    return image.fields
      .filter((f) => f.inferConfidence >= 0.5)
      .map((f) => f.inferText);
  } catch (error) {
    console.error("[OCR] Clova API 호출 실패:", error);
    return [];
  }
}

// ── 서류별 필드 추출 함수 ──

/**
 * 자격증 — 텍스트 배열에서 패턴 매칭으로 필드 추출.
 *
 * 추출 대상: 자격증 번호, 유형, 등급, 발급기관, 발급일
 */
function extractCertificateInfo(texts: string[]): {
  cert_number?: string;
  cert_type?: string;
  cert_grade?: string;
  issuer?: string;
  issued_date?: string;
} {
  const result: ReturnType<typeof extractCertificateInfo> = {};
  // 전체 텍스트를 하나의 문자열로 합쳐서 검색 (줄 단위로도 분석)
  const fullText = texts.join(" ");

  // 1) 자격증 번호: "KBA-2023-12345" 또는 "제 2023-12345 호" 같은 패턴
  const certNumPatterns = [
    /KBA[-\s]?\d{4}[-\s]?\d{3,6}/i, // KBA-2023-12345
    /제\s*[\d-]+\s*호/, // 제 2023-12345 호
    /[A-Z]{2,5}[-\s]?\d{4}[-\s]?\d{3,8}/i, // 일반 코드-연도-번호 패턴
    /\d{4}[-]\d{4,8}/, // 2023-123456 (숫자만)
  ];
  for (const pattern of certNumPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      result.cert_number = match[0].trim();
      break;
    }
  }

  // 2) 유형: "심판" / "경기원" / "기록원" / "감독관" 키워드 검색
  const typeKeywords: Record<string, string> = {
    심판: "referee",
    경기원: "scorer",
    기록원: "scorer",
    감독관: "referee",
    타이머: "timer",
    기록: "scorer",
  };
  for (const [keyword, type] of Object.entries(typeKeywords)) {
    if (fullText.includes(keyword)) {
      result.cert_type = type;
      break;
    }
  }

  // 3) 등급: "1급" / "2급" / "3급" / "국제" 키워드
  const gradePatterns = [
    { pattern: /국제/i, grade: "국제" },
    { pattern: /1\s*급/, grade: "1급" },
    { pattern: /2\s*급/, grade: "2급" },
    { pattern: /3\s*급/, grade: "3급" },
    { pattern: /S\s*급/i, grade: "S급" },
    { pattern: /A\s*급/i, grade: "A급" },
    { pattern: /B\s*급/i, grade: "B급" },
  ];
  for (const { pattern, grade } of gradePatterns) {
    if (pattern.test(fullText)) {
      result.cert_grade = grade;
      break;
    }
  }

  // 4) 발급기관: 협회명 검색
  const issuerPatterns = [
    /대한[^\s]*농구[^\s]*협회/,
    /대한농구협회/,
    /대한민국농구협회/,
    /KBA/i,
    /한국농구협회/,
    /[\w가-힣]+농구협회/,
    /[\w가-힣]+체육회/,
  ];
  for (const pattern of issuerPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      result.issuer = match[0].trim();
      break;
    }
  }

  // 5) 발급일: 날짜 패턴 (YYYY.MM.DD 또는 YYYY년 MM월 DD일)
  const datePatterns = [
    /(\d{4})\s*[.년/-]\s*(\d{1,2})\s*[.월/-]\s*(\d{1,2})\s*일?/, // 2023.01.15, 2023년 1월 15일
    /(\d{4})(\d{2})(\d{2})/, // 20230115 (연속 8자리)
  ];
  for (const pattern of datePatterns) {
    const match = fullText.match(pattern);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, "0");
      const day = match[3].padStart(2, "0");
      result.issued_date = `${year}-${month}-${day}`;
      break;
    }
  }

  return result;
}

/**
 * 통장 사본 — 은행명, 계좌번호, 예금주 추출.
 */
function extractBankbookInfo(texts: string[]): {
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
} {
  const result: ReturnType<typeof extractBankbookInfo> = {};
  const fullText = texts.join(" ");

  // 1) 은행명: BANK_KEYWORDS에서 키워드 매칭
  for (const [keyword, bankName] of Object.entries(BANK_KEYWORDS)) {
    if (fullText.includes(keyword)) {
      result.bank_name = bankName;
      break;
    }
  }

  // 2) 계좌번호: 숫자-하이픈 패턴 (최소 10자리)
  // 통장에 나타나는 다양한 계좌번호 포맷
  const accountPatterns = [
    /\d{3,4}[-\s]?\d{2,4}[-\s]?\d{4,6}[-\s]?\d{1,4}/, // 123-456-789012-3
    /\d{10,16}/, // 연속 숫자 (10~16자리)
  ];
  for (const pattern of accountPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      // 공백 제거하고 저장
      result.account_number = match[0].replace(/\s/g, "");
      break;
    }
  }

  // 3) 예금주: "예금주" 키워드 뒤 또는 근처의 한글 이름
  // "예금주 : 홍길동" 또는 "예금주: 홍길동" 패턴
  const holderPatterns = [
    /예금주\s*[:\s]\s*([가-힣]{2,5})/,
    /성명\s*[:\s]\s*([가-힣]{2,5})/,
    /이름\s*[:\s]\s*([가-힣]{2,5})/,
  ];
  for (const pattern of holderPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      result.account_holder = match[1];
      break;
    }
  }

  // fallback: 예금주 패턴 못 찾으면, 각 텍스트에서 2~4자 한글 이름 시도
  if (!result.account_holder) {
    for (const text of texts) {
      const trimmed = text.trim();
      // 순수 한글 2~4자인 텍스트 (이름일 가능성 높음)
      if (/^[가-힣]{2,4}$/.test(trimmed)) {
        // 은행명이 아닌 경우에만
        if (!BANK_KEYWORDS[trimmed]) {
          result.account_holder = trimmed;
          break;
        }
      }
    }
  }

  return result;
}

/**
 * 신분증 — OCR 미사용 (보안).
 *
 * 이유: 신분증에는 주민번호가 있어서 OCR로 추출하면 보안 위험.
 *       이 함수는 일관성을 위해 존재하지만 항상 빈 객체를 반환한다.
 */
function extractIdCardInfo(
  _texts: string[]
): Record<string, string | undefined> {
  return {};
}

// ── 통합 OCR 처리 함수 ──

/**
 * 서류 이미지를 OCR 처리하고 서류 유형에 맞는 필드를 추출한다.
 *
 * @param imageBuffer - 복호화된 이미지 Buffer
 * @param format - 파일 MIME 타입 (예: "image/jpeg")
 * @param docType - 서류 유형 ("certificate" | "id_card" | "bankbook")
 * @returns raw_texts(OCR 원본 텍스트 배열) + extracted(추출된 필드)
 */
export async function processDocumentOCR(
  imageBuffer: Buffer,
  format: string,
  docType: "certificate" | "id_card" | "bankbook"
): Promise<{
  raw_texts: string[];
  extracted: Record<string, string | undefined>;
}> {
  // 신분증은 OCR 절대 안 함
  if (docType === "id_card") {
    return { raw_texts: [], extracted: {} };
  }

  // Clova OCR 호출
  const rawTexts = await callClovaOCR(imageBuffer, format);

  // 빈 배열이면 (환경변수 없음 또는 OCR 실패) 그대로 반환
  if (rawTexts.length === 0) {
    return { raw_texts: [], extracted: {} };
  }

  // 서류 유형에 맞는 필드 추출
  let extracted: Record<string, string | undefined>;
  switch (docType) {
    case "certificate":
      extracted = extractCertificateInfo(rawTexts);
      break;
    case "bankbook":
      extracted = extractBankbookInfo(rawTexts);
      break;
    default:
      extracted = extractIdCardInfo(rawTexts);
  }

  return { raw_texts: rawTexts, extracted };
}
