import PDFDocument from "pdfkit";
import { decryptDocument } from "@/lib/security/document-encryption";

/**
 * 정산 서류 PDF 생성 서비스.
 *
 * 이유: 사무국장이 심판의 정산 서류(자격증/신분증/통장)를 한꺼번에
 *       PDF로 출력하기 위한 서버 전용 모듈.
 *       - 워터마크: "mybdr 정산 전용 — 외부 유출 금지" (대각선, 반투명)
 *       - 추적 코드: PRINT-{userId}-{timestamp}-{random4} (출력자 추적)
 *       - 한글 폰트 미사용: pdfkit 기본 폰트(Helvetica)로 영문/숫자만 표시.
 *         이미지 자체에 한글이 있으므로 PDF 텍스트는 최소한으로 유지.
 */

// ── 타입 정의 ──

type RefereeInfo = {
  id: bigint;
  verified_name?: string | null;
  license_number?: string | null;
  level?: string | null;
  bank_name?: string | null;
  bank_holder?: string | null;
};

type DocumentInfo = {
  doc_type: string;
  encrypted_data: string;
  file_type: string;
};

type PrintedByInfo = {
  id: bigint;
  name?: string | null;
};

export type SettlementPDFOptions = {
  referee: RefereeInfo;
  documents: DocumentInfo[];
  association: { name: string };
  printedBy: PrintedByInfo;
};

// ── 서류 타입별 라벨 (영문 — 한글 폰트 없으므로) ──
const DOC_TYPE_LABEL: Record<string, string> = {
  certificate: "Certificate",
  id_card: "ID Card",
  bankbook: "Bankbook",
};

// ── 등급 한글 → 영문 매핑 (PDF 텍스트에 사용) ──
const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  international: "International",
};

/**
 * 정산 PDF 생성.
 *
 * @param options - 심판 정보, 서류 3종(암호화), 협회명, 출력자 정보
 * @returns PDF Buffer (Content-Type: application/pdf 로 응답용)
 */
export async function generateSettlementPDF(
  options: SettlementPDFOptions
): Promise<Buffer> {
  const { referee, documents, association, printedBy } = options;

  // 추적 코드 생성: PRINT-{출력자ID}-{timestamp}-{랜덤4자리}
  const timestamp = Date.now();
  const random4 = Math.floor(1000 + Math.random() * 9000);
  const trackingCode = `PRINT-${String(printedBy.id)}-${timestamp}-${random4}`;

  // 현재 날짜 문자열 (YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10);

  return new Promise<Buffer>((resolve, reject) => {
    // PDF 문서 생성 (A4 사이즈)
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: `Settlement Documents - Referee ${String(referee.id)}`,
        Author: "mybdr",
        Subject: "Settlement Documents",
      },
    });

    // Buffer 수집
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err: Error) => reject(err));

    // ── 1페이지: 표지 (심판 정보 요약) ──
    addCoverPage(doc, {
      associationName: association.name,
      today,
      referee,
      trackingCode,
      printedBy,
    });

    // ── 서류 이미지 페이지 (각각 새 페이지) ──
    // 서류를 certificate → id_card → bankbook 순서로 정렬
    const sortOrder = ["certificate", "id_card", "bankbook"];
    const sortedDocs = [...documents].sort(
      (a, b) => sortOrder.indexOf(a.doc_type) - sortOrder.indexOf(b.doc_type)
    );

    for (const docInfo of sortedDocs) {
      doc.addPage();

      // 서류 타입 헤더
      const label = DOC_TYPE_LABEL[docInfo.doc_type] || docInfo.doc_type;
      doc.fontSize(14).font("Helvetica-Bold").text(label, { align: "center" });
      doc.moveDown(0.5);

      // 암호화된 이미지 복호화 → PDF에 삽입
      try {
        const imgBuffer = decryptDocument(docInfo.encrypted_data);

        // 이미지 삽입 — 페이지 너비에 맞추어 중앙 배치
        // A4 기준: 595 x 842 pt, 여백 50 → 사용 가능 영역 495 x 700
        doc.image(imgBuffer, 50, doc.y, {
          fit: [495, 650],
          align: "center",
          valign: "center",
        });
      } catch {
        // 복호화 실패 시 에러 메시지 표시
        doc.moveDown(2);
        doc
          .fontSize(12)
          .font("Helvetica")
          .text("[Image decryption failed]", { align: "center" });
      }

      // 워터마크 추가
      addWatermark(doc);

      // 추적 코드 + 푸터
      addFooter(doc, trackingCode);
    }

    // 표지에도 워터마크 + 푸터 (첫 페이지로 돌아갈 수 없으므로 표지 생성 시 이미 추가)

    doc.end();
  });
}

// ── 표지 페이지 생성 ──
function addCoverPage(
  doc: PDFKit.PDFDocument,
  opts: {
    associationName: string;
    today: string;
    referee: RefereeInfo;
    trackingCode: string;
    printedBy: PrintedByInfo;
  }
) {
  const { today, referee, trackingCode, printedBy } = opts;

  // 제목
  doc.fontSize(22).font("Helvetica-Bold").text("Settlement Documents", {
    align: "center",
  });
  doc.moveDown(0.3);

  // 날짜
  doc.fontSize(10).font("Helvetica").text(`Date: ${today}`, {
    align: "center",
  });
  doc.moveDown(2);

  // 구분선
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor("#cccccc")
    .stroke();
  doc.moveDown(1);

  // 심판 정보 테이블 형식
  doc.fontSize(12).font("Helvetica-Bold").text("Referee Information");
  doc.moveDown(0.5);

  const infoItems: [string, string][] = [
    ["ID", String(referee.id)],
    ["Name", referee.verified_name ?? "-"],
    ["License No.", referee.license_number ?? "-"],
    [
      "Level",
      referee.level ? (LEVEL_LABEL[referee.level] ?? referee.level) : "-",
    ],
    ["Bank", referee.bank_name ?? "-"],
    ["Account Holder", referee.bank_holder ?? "-"],
  ];

  doc.fontSize(10).font("Helvetica");
  for (const [label, value] of infoItems) {
    doc.text(`${label}: ${value}`, 70);
    doc.moveDown(0.3);
  }

  doc.moveDown(1);

  // 구분선
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor("#cccccc")
    .stroke();
  doc.moveDown(1);

  // 출력자 정보
  doc.fontSize(10).font("Helvetica");
  doc.text(
    `Printed by: ${printedBy.name ?? "Admin"} (ID: ${String(printedBy.id)})`,
    70
  );
  doc.moveDown(0.3);
  doc.text(`Tracking: ${trackingCode}`, 70);

  doc.moveDown(2);

  // 경고 문구 (영문)
  doc.fontSize(9).font("Helvetica-Bold");
  doc.text(
    "NOTICE: This document is exclusively for settlement purposes.",
    50,
    doc.y,
    { align: "center" }
  );
  doc.text(
    "Unauthorized distribution is subject to legal liability.",
    { align: "center" }
  );

  // 워터마크
  addWatermark(doc);

  // 푸터
  addFooter(doc, trackingCode);
}

// ── 워터마크 추가 (각 페이지마다 호출) ──
function addWatermark(doc: PDFKit.PDFDocument) {
  // 현재 상태 저장
  doc.save();

  // 반투명 설정
  doc.opacity(0.06);

  // 중앙 기준 45도 회전
  const centerX = 297.5; // A4 절반 (595/2)
  const centerY = 421; // A4 절반 (842/2)
  doc.rotate(45, { origin: [centerX, centerY] });

  // 워터마크 텍스트 반복 배치 (여러 줄로)
  doc.fontSize(36).font("Helvetica-Bold");
  const wmText = "mybdr SETTLEMENT ONLY";
  for (let y = -200; y < 800; y += 120) {
    doc.text(wmText, centerX - 250, centerY + y - 200, {
      align: "center",
      width: 500,
    });
  }

  // 상태 복원
  doc.restore();
}

// ── 푸터 추가 (추적 코드 + 경고) ──
function addFooter(doc: PDFKit.PDFDocument, trackingCode: string) {
  // 페이지 하단에 고정 위치로 푸터 배치
  // A4: 842pt 높이, 하단 여백 30pt 영역 사용
  const footerY = 800;

  doc.save();
  doc.opacity(1);

  // 구분선
  doc
    .moveTo(50, footerY - 10)
    .lineTo(545, footerY - 10)
    .strokeColor("#dddddd")
    .stroke();

  // 추적 코드 (좌측)
  doc.fontSize(7).font("Helvetica").fillColor("#999999");
  doc.text(trackingCode, 50, footerY, { width: 250, align: "left" });

  // 경고 문구 (우측)
  doc.text(
    "For settlement use only. Unauthorized distribution prohibited.",
    295,
    footerY,
    { width: 250, align: "right" }
  );

  doc.restore();
}
