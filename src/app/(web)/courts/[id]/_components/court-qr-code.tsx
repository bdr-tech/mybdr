"use client";

/* ============================================================
 * CourtQrCode -- 코트 QR 코드 생성 + 다운로드/인쇄 모달
 *
 * Google Charts API로 QR 코드 이미지를 생성한다.
 * QR을 스캔하면 /courts/{id}/checkin 페이지로 이동 → 자동 체크인.
 * GPS 검증 없이 현장에 있다는 것을 QR로 증명하는 방식.
 * ============================================================ */

import { useState, useCallback, useRef } from "react";

interface CourtQrCodeProps {
  courtId: string;
  courtName: string;
}

export function CourtQrCode({ courtId, courtName }: CourtQrCodeProps) {
  // 모달 열림/닫힘 상태
  const [open, setOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // QR 코드가 가리킬 URL (체크인 전용 페이지)
  const checkinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/courts/${courtId}/checkin`
    : `/courts/${courtId}/checkin`;

  // Google Charts QR API URL (300x300 픽셀)
  const qrImageUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(checkinUrl)}&choe=UTF-8`;

  // QR 이미지 다운로드 (canvas로 변환 후 PNG 저장)
  const handleDownload = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    // canvas에 QR 이미지를 그려서 PNG blob으로 변환
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, 300, 300);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // 파일명: 코트이름_qr.png
      a.download = `${courtName}_qr.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [courtName]);

  // 인쇄 기능 (새 창에서 QR만 인쇄)
  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank", "width=400,height=500");
    if (!printWindow) return;

    // 인쇄용 HTML: 코트 이름 + QR 이미지 + 안내 문구
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${courtName} QR 코드</title>
        <style>
          body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            font-family: -apple-system, sans-serif;
          }
          h2 { margin-bottom: 8px; }
          p { color: #666; font-size: 14px; margin-top: 8px; }
          img { margin: 16px 0; }
        </style>
      </head>
      <body>
        <h2>${courtName}</h2>
        <img src="${qrImageUrl}" width="250" height="250" alt="QR Code" />
        <p>QR을 스캔하면 자동 체크인됩니다</p>
      </body>
      </html>
    `);
    printWindow.document.close();
    // 이미지 로드 후 인쇄
    printWindow.onload = () => {
      printWindow.print();
    };
  }, [courtName, qrImageUrl]);

  return (
    <>
      {/* QR 코드 생성 버튼 (코트 상세 페이지에 배치) */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-[4px] px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
        style={{
          backgroundColor: "var(--color-surface-bright)",
          color: "var(--color-text-primary)",
        }}
      >
        <span className="material-symbols-outlined text-base">qr_code_2</span>
        QR 체크인
      </button>

      {/* 모달 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
          onClick={() => setOpen(false)}
        >
          {/* 모달 본체 (클릭 전파 차단) */}
          <div
            className="relative w-full max-w-sm rounded-2xl p-6"
            style={{
              backgroundColor: "var(--color-card)",
              boxShadow: "var(--shadow-card)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 rounded-full p-1 transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* 제목 */}
            <h3
              className="text-lg font-bold text-center mb-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              QR 체크인
            </h3>
            <p
              className="text-sm text-center mb-4"
              style={{ color: "var(--color-text-muted)" }}
            >
              {courtName}
            </p>

            {/* QR 코드 이미지 */}
            <div className="flex justify-center mb-4">
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "#ffffff" }}
              >
                {/* crossOrigin으로 canvas 변환 허용 */}
                <img
                  ref={imgRef}
                  src={qrImageUrl}
                  alt={`${courtName} QR 코드`}
                  width={250}
                  height={250}
                  crossOrigin="anonymous"
                  className="block"
                />
              </div>
            </div>

            {/* 안내 문구 */}
            <p
              className="text-xs text-center mb-4"
              style={{ color: "var(--color-text-disabled)" }}
            >
              <span className="material-symbols-outlined align-middle mr-0.5" style={{ fontSize: "14px" }}>
                info
              </span>
              QR을 스캔하면 GPS 없이 바로 체크인됩니다
            </p>

            {/* 다운로드 + 인쇄 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[4px] px-4 py-3 text-sm font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: "var(--color-surface-bright)",
                  color: "var(--color-text-primary)",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  download
                </span>
                다운로드
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[4px] px-4 py-3 text-sm font-bold text-white transition-all active:scale-95"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  print
                </span>
                인쇄
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
