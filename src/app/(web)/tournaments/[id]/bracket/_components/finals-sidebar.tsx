// 대진표 우측 사이드바 컴포넌트
// Finals Countdown + Tournament Info + Official Store
// 시안: bdr_2(다크) / bdr_3(라이트) 참조

"use client";

import { useState, useEffect } from "react";

type FinalsSidebarProps = {
  finalsDate: string | null; // 결승전 scheduledAt (ISO string)
  venueName: string | null;
  city: string | null;
  entryFee: number | null;
};

// 카운트다운 계산 함수
function getTimeLeft(targetDate: string | null) {
  if (!targetDate) return null;
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}

export function FinalsSidebar({
  finalsDate,
  venueName,
  city,
  entryFee,
}: FinalsSidebarProps) {
  // 클라이언트에서 카운트다운 업데이트
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(finalsDate));

  useEffect(() => {
    if (!finalsDate) return;
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(finalsDate));
    }, 60000); // 1분마다 업데이트
    return () => clearInterval(timer);
  }, [finalsDate]);

  return (
    <div className="space-y-6">
      {/* Finals Countdown 카드 - 빨간 배경 */}
      {timeLeft && (
        <div
          className="p-8 rounded text-white"
          style={{
            background: "linear-gradient(to bottom, var(--color-primary), #C41820)",
          }}
        >
          <h4
            className="text-xs font-black uppercase tracking-[0.3em] mb-4"
            style={{ opacity: 0.9 }}
          >
            Finals Countdown
          </h4>
          {/* 카운트다운 숫자 */}
          <div className="flex justify-between items-center">
            <CountdownUnit value={timeLeft.days} label="Days" />
            <span className="text-xl" style={{ opacity: 0.5 }}>:</span>
            <CountdownUnit value={timeLeft.hours} label="Hrs" />
            <span className="text-xl" style={{ opacity: 0.5 }}>:</span>
            <CountdownUnit value={timeLeft.minutes} label="Min" />
          </div>
          {/* 결승전 티켓 버튼 (placeholder) */}
          <button
            className="w-full mt-8 py-4 font-bold text-sm rounded uppercase tracking-widest transition-colors"
            style={{
              backgroundColor: "var(--color-on-primary)",
              color: "var(--color-primary)",
            }}
          >
            Get Final Tickets
          </button>
        </div>
      )}

      {/* Tournament Info 카드 */}
      <div
        className="p-6 rounded"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <h4
          className="text-xs font-bold uppercase tracking-widest mb-4"
          style={{ color: "var(--color-text-muted)" }}
        >
          Tournament Info
        </h4>
        <div className="space-y-4">
          {/* 장소 */}
          {venueName && (
            <InfoRow
              icon="location_on"
              title={venueName}
              subtitle={city ?? ""}
            />
          )}

          {/* 참가비 */}
          {entryFee != null && entryFee > 0 && (
            <InfoRow
              icon="payments"
              title={`${Number(entryFee).toLocaleString("ko-KR")}원`}
              subtitle="참가비"
            />
          )}

          {/* VIP - placeholder (DB에 없음) */}
          <InfoRow
            icon="confirmation_number"
            title="대회 상세 페이지 참조"
            subtitle="추가 정보"
          />
        </div>
      </div>

      {/* Official Store 배너 - 그라디언트 placeholder */}
      <div
        className="relative overflow-hidden rounded h-48 group cursor-pointer"
        style={{
          background: "linear-gradient(135deg, var(--color-secondary) 0%, #142D66 100%)",
        }}
      >
        {/* 배경 아이콘 */}
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "128px",
              fontVariationSettings: "'FILL' 1",
              color: "var(--color-on-primary)",
            }}
          >
            shopping_bag
          </span>
        </div>
        {/* 텍스트 */}
        <div className="absolute bottom-4 left-4">
          <span
            className="text-white text-xs font-bold px-2 py-1 uppercase rounded-sm"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Official Store
          </span>
          <div className="text-lg font-bold text-white mt-1">
            Get 2024 Team Kits
          </div>
        </div>
      </div>
    </div>
  );
}

// 카운트다운 숫자 컴포넌트
function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div
        className="text-3xl font-bold"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {String(value).padStart(2, "0")}
      </div>
      <div
        className="text-xs font-bold uppercase"
        style={{ opacity: 0.7 }}
      >
        {label}
      </div>
    </div>
  );
}

// 정보 행 컴포넌트
function InfoRow({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span
        className="material-symbols-outlined"
        style={{ color: "var(--color-primary)" }}
      >
        {icon}
      </span>
      <div>
        <div
          className="text-sm font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </div>
        <div
          className="text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}
