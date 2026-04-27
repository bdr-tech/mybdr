"use client";

/* ============================================================
 * BasicInfoSection — BDR v2 경기 정보 카드 (시안 2번 카드)
 *
 * 왜 이 컴포넌트가 필요한가:
 * 시안의 "2. 경기 정보" 카드를 구현하면서 기존 DB 필드를 전부 보존.
 * 시안 시간 input("20:30-22:30" 단일)은 사용성·DB 매핑 문제가 있어
 * **시작 시간 / 종료 시간 2개 입력**으로 분리 (durationHours 자동 계산).
 * 시안에는 없지만 기존 기능 유지:
 *   - 최근 장소 칩 (/api/web/games/my-last-game, /recent-venues)
 *   - Kakao Postcode (onOpenPostcode)
 *
 * 실력 7단계, 참가비 빠른선택(4버튼+직접입력)은 기존 UX 유지.
 * 레이아웃은 시안에 맞춰 카드 내부 그리드로 재배치.
 * ============================================================ */

import { useEffect, useRef, useState } from "react";
import type { GameFormData, RecentVenue } from "./game-form";

// 실력 7단계 (기존 step-when-where.tsx 값 그대로)
const SKILL_LEVELS = [
  { value: "lowest",                label: "최하", color: "var(--color-badge-gray)" },
  { value: "beginner",              label: "하",   color: "var(--color-badge-green)" },
  { value: "intermediate_low",      label: "중하", color: "var(--color-success)" },
  { value: "intermediate",          label: "중",   color: "var(--color-badge-blue)" },
  { value: "intermediate_advanced", label: "중상", color: "var(--color-badge-amber)" },
  { value: "advanced",              label: "상",   color: "var(--color-badge-red)" },
  { value: "highest",               label: "최상", color: "var(--color-ai-purple)" },
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ["00", "10", "20", "30", "40", "50"];

// --- TimePicker (기존 step-when-where.tsx 그대로 포팅) ---
// 12시간 AM/PM 방식 + 클릭 외부 감지 닫힘
function TimePicker({
  value,
  onChange,
  label,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [hh, mm] = value ? value.split(":").map(Number) : [19, 0];
  const isPM = hh >= 12;
  const display12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  const displayMin = String(mm).padStart(2, "0");

  const [ampm, setAmpm] = useState<"오전" | "오후">(isPM ? "오후" : "오전");
  const [selHour, setSelHour] = useState(display12);
  const [selMin, setSelMin] = useState(displayMin);

  // 외부 클릭 감지 → 닫기
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // 확인 버튼: AM/PM → 24시간 변환 후 HH:mm 전달
  const confirm = () => {
    let h24 = selHour;
    if (ampm === "오후" && selHour !== 12) h24 = selHour + 12;
    if (ampm === "오전" && selHour === 12) h24 = 0;
    onChange(`${String(h24).padStart(2, "0")}:${selMin}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input"
        style={{
          textAlign: "left",
          borderColor: error ? "var(--bdr-red)" : undefined,
        }}
      >
        {value
          ? `${ampm} ${String(display12).padStart(2, "0")}:${displayMin}`
          : <span style={{ color: "var(--ink-dim)" }}>{label}</span>}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 44,
            zIndex: 50,
            width: 220,
            transform: "translateX(-50%)",
            background: "var(--bg-elev)",
            border: "1px solid var(--border-strong)",
            borderRadius: 8,
            padding: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {(["오전", "오후"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmpm(v)}
                  style={{
                    borderRadius: 6,
                    padding: "6px 0",
                    fontSize: 12,
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    background: ampm === v ? "var(--cafe-blue)" : "transparent",
                    color: ampm === v ? "#fff" : "var(--ink-mute)",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            <div style={{ maxHeight: 150, overflowY: "auto" }}>
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setSelHour(h)}
                  style={{
                    width: "100%",
                    borderRadius: 4,
                    padding: "4px 0",
                    fontSize: 12,
                    border: "none",
                    cursor: "pointer",
                    background: selHour === h ? "var(--cafe-blue)" : "transparent",
                    color: selHour === h ? "#fff" : "var(--ink)",
                  }}
                >
                  {String(h).padStart(2, "0")}
                </button>
              ))}
            </div>
            <div style={{ maxHeight: 150, overflowY: "auto" }}>
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelMin(m)}
                  style={{
                    width: "100%",
                    borderRadius: 4,
                    padding: "4px 0",
                    fontSize: 12,
                    border: "none",
                    cursor: "pointer",
                    background: selMin === m ? "var(--cafe-blue)" : "transparent",
                    color: selMin === m ? "#fff" : "var(--ink)",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={confirm}
            className="btn btn--accent btn--sm"
            style={{ width: "100%" }}
          >
            확인
          </button>
        </div>
      )}
    </div>
  );
}

// --- 본체 ---
interface Props {
  data: GameFormData;
  updateData: <K extends keyof GameFormData>(key: K, value: GameFormData[K]) => void;
  errors: Record<string, string>;
  recentVenues: RecentVenue[];
  venuesLoading: boolean;
  onApplyVenue: (v: RecentVenue) => void;
  onOpenPostcode: () => void;
}

export function BasicInfoSection({
  data,
  updateData,
  errors,
  recentVenues,
  venuesLoading,
  onApplyVenue,
  onOpenPostcode,
}: Props) {
  // today 계산 — <input type="date">의 min 속성용
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // 시작~종료 시간이 모두 있으면 durationHours 자동 계산
  useEffect(() => {
    if (data.scheduledTime && data.endTime) {
      const [sh, sm] = data.scheduledTime.split(":").map(Number);
      const [eh, em] = data.endTime.split(":").map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      // 종료가 시작보다 작으면 다음날(익일 종료)로 간주
      if (diff <= 0) diff += 24 * 60;
      updateData("durationHours", Math.round(diff / 60 * 10) / 10);
    }
  }, [data.scheduledTime, data.endTime, updateData]);

  return (
    <section className="card" style={{ padding: "24px 26px", marginBottom: 14 }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
        2. 경기 정보
      </h2>

      {/* 제목 — 1열 풀폭 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
        <div>
          <label className="label">제목 <span style={{ color: "var(--ink-dim)", fontWeight: 400 }}>(비워두면 자동 생성)</span></label>
          <input
            className="input"
            type="text"
            value={data.title}
            onChange={(e) => updateData("title", e.target.value)}
            maxLength={50}
            placeholder="예: 목요일 저녁 미사 픽업 · 6:4"
            style={{ borderColor: errors.title ? "var(--bdr-red)" : undefined }}
          />
          {errors.title && (
            <p role="alert" style={{ fontSize: 12, color: "var(--bdr-red)", marginTop: 4 }}>
              {errors.title}
            </p>
          )}
        </div>
      </div>

      {/* 날짜 + 시작/종료 시간 (3열) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
        <div>
          <label className="label">날짜</label>
          <input
            className="input"
            type="date"
            value={data.scheduledDate}
            min={minDate}
            onChange={(e) => updateData("scheduledDate", e.target.value)}
            style={{ borderColor: errors.scheduledAt ? "var(--bdr-red)" : undefined }}
          />
        </div>
        <div>
          <label className="label">시작 시간</label>
          <TimePicker
            value={data.scheduledTime}
            onChange={(v) => updateData("scheduledTime", v)}
            label="--:--"
            error={!!errors.scheduledAt}
          />
        </div>
        <div>
          <label className="label">
            종료 시간
            {data.durationHours > 0 && data.scheduledTime && data.endTime && (
              <span style={{ marginLeft: 6, color: "var(--ink-dim)", fontWeight: 400 }}>
                · {data.durationHours}시간
              </span>
            )}
          </label>
          <TimePicker
            value={data.endTime}
            onChange={(v) => updateData("endTime", v)}
            label="--:--"
          />
        </div>
      </div>

      {errors.scheduledAt && (
        <p role="alert" style={{ fontSize: 12, color: "var(--bdr-red)", marginTop: 6 }}>
          {errors.scheduledAt}
        </p>
      )}

      {/* 코트 + 지역 (2열) — 코트 클릭 시 카카오 postcode 오픈 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        <div>
          <label className="label">코트</label>
          <input
            className="input"
            type="text"
            value={data.venueName}
            onChange={(e) => updateData("venueName", e.target.value)}
            onClick={onOpenPostcode}
            placeholder="미사강변체육관"
            style={{ cursor: "pointer" }}
          />
          {data.venueAddress && (
            <p style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>
              {data.venueAddress}
            </p>
          )}
        </div>
        <div>
          <label className="label">지역</label>
          <input
            className="input"
            type="text"
            value={[data.city, data.district].filter(Boolean).join(" ")}
            onChange={(e) => {
              // 지역은 카카오 검색 결과로 채움 → 수동 수정 시 city만 반영
              updateData("city", e.target.value);
              updateData("district", "");
            }}
            onClick={onOpenPostcode}
            placeholder="하남시"
            style={{ cursor: "pointer" }}
          />
        </div>
      </div>

      {/* 최근 장소 칩 (기존 기능 유지) */}
      {!venuesLoading && recentVenues.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 11, color: "var(--ink-dim)", marginBottom: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle", marginRight: 4 }}>history</span>
            최근 장소
          </p>
          <div style={{ display: "flex", flexWrap: "nowrap", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {recentVenues.map((v, i) => {
              const isActive = v.venue_name === data.venueName && v.city === data.city;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onApplyVenue(v)}
                  style={{
                    flexShrink: 0,
                    borderRadius: 999,
                    border: isActive ? "1px solid var(--cafe-blue)" : "1px solid var(--border)",
                    background: isActive ? "color-mix(in oklab, var(--cafe-blue) 8%, transparent)" : "var(--bg-alt)",
                    color: isActive ? "var(--cafe-blue)" : "var(--ink)",
                    padding: "4px 10px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {v.venue_name || v.district || v.city}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 수준 + 정원 + 참가비 (3열) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
        <div>
          <label className="label">수준</label>
          <select
            className="input"
            value={data.skillLevel}
            onChange={(e) => updateData("skillLevel", e.target.value)}
            style={{ appearance: "auto" }}
          >
            <option value="all">전연령</option>
            {SKILL_LEVELS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">정원</label>
          <input
            className="input"
            type="number"
            value={data.maxParticipants}
            onChange={(e) => updateData("maxParticipants", Math.max(1, Number(e.target.value) || 1))}
            min={1}
            max={100}
          />
        </div>
        <div>
          <label className="label">참가비 (원)</label>
          <input
            className="input"
            type="number"
            value={data.feePerPerson || ""}
            onChange={(e) => updateData("feePerPerson", Number(e.target.value) || 0)}
            min={0}
            step={1000}
            placeholder="5000"
          />
        </div>
      </div>

      {/* 참가비 빠른 선택 (기존 기능 유지) */}
      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {[0, 5000, 8000, 10000].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => updateData("feePerPerson", v)}
            style={{
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: data.feePerPerson === v ? "var(--cafe-blue)" : "var(--bg-alt)",
              color: data.feePerPerson === v ? "#fff" : "var(--ink-soft)",
              padding: "4px 10px",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {v === 0 ? "무료" : `${(v / 1000).toFixed(0)}천원`}
          </button>
        ))}
      </div>

      {/* 상세 설명 */}
      <div style={{ marginTop: 14 }}>
        <label className="label">상세 설명</label>
        <textarea
          className="textarea"
          rows={5}
          value={data.description}
          onChange={(e) => updateData("description", e.target.value)}
          placeholder="매주 목요일 정기 픽업입니다. 6:4 팀 분배, 21점 선취제. 주차장 무료 이용 가능, 실내 탈의실·샤워실 완비."
          style={{ resize: "vertical" }}
        />
      </div>
    </section>
  );
}
