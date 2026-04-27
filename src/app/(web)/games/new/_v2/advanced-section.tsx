"use client";

/* ============================================================
 * AdvancedSection — BDR v2 고급 설정 아코디언 (시안 외, DB 필드 보존)
 *
 * 왜 이 컴포넌트가 필요한가:
 * 시안에는 3카드만 있으나 DB/서버 액션은 9개 필드를 추가로 받음:
 *   min_participants / allow_guests / contact_phone / entry_fee_note
 *   uniform_home_color / uniform_away_color / is_recurring
 *   recurrence_rule / recurring_count / notes
 * 원칙 "DB 필드 전부 유지"를 지키려면 이들을 버릴 수 없음 →
 * 접힌 상태가 기본인 아코디언에 숨겨 UI 노이즈를 최소화.
 *
 * 일반 사용자는 시안 3카드만 채우면 되고, 고급 설정이 필요한
 * 호스트만 아코디언을 열어 사용.
 * ============================================================ */

import { useState } from "react";
import type { GameFormData } from "./game-form";

const RECURRENCE_RULES = [
  { value: "weekly", label: "매주" },
  { value: "biweekly", label: "2주마다" },
  { value: "monthly", label: "매월" },
];

interface Props {
  data: GameFormData;
  updateData: <K extends keyof GameFormData>(key: K, value: GameFormData[K]) => void;
}

export function AdvancedSection({ data, updateData }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <section
      className="card"
      style={{ marginBottom: 14, overflow: "hidden" }}
    >
      {/* 아코디언 헤더 — 클릭 시 open 토글 */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 26px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--ink)",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        <span>고급 설정 <span style={{ fontSize: 12, color: "var(--ink-dim)", fontWeight: 400 }}>(선택)</span></span>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 20,
            color: "var(--ink-mute)",
            transition: "transform .2s",
            transform: open ? "rotate(180deg)" : undefined,
          }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "18px 26px 22px" }}>
          {/* 최소 인원 + 연락처 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label className="label">최소 인원</label>
              <input
                className="input"
                type="number"
                value={data.minParticipants}
                onChange={(e) => updateData("minParticipants", Number(e.target.value) || 1)}
                min={1}
                max={data.maxParticipants}
              />
            </div>
            <div>
              <label className="label">연락처 (선택)</label>
              <input
                className="input"
                type="tel"
                value={data.contactPhone}
                onChange={(e) => updateData("contactPhone", e.target.value)}
                placeholder="010-0000-0000"
              />
            </div>
          </div>

          {/* 참가비 안내 (픽업에만 노출 — 기존 로직 유지) */}
          {data.gameType === "0" && (
            <div style={{ marginBottom: 14 }}>
              <label className="label">참가비 안내</label>
              <input
                className="input"
                type="text"
                value={data.entryFeeNote}
                onChange={(e) => updateData("entryFeeNote", e.target.value)}
                placeholder="예: 음료 지참, 5,000원 현장 납부 등"
              />
            </div>
          )}

          {/* 게스트 허용 — 팀 대결(2)에서 의미있음. 기본 true */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "var(--bg-alt)",
              borderRadius: 6,
              marginBottom: 14,
            }}
          >
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0 }}>게스트 허용</p>
              <p style={{ fontSize: 11, color: "var(--ink-mute)", margin: "2px 0 0" }}>팀 외 게스트의 참여를 받을지 여부</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={data.allowGuests}
              onClick={() => updateData("allowGuests", !data.allowGuests)}
              style={{
                position: "relative",
                height: 24,
                width: 44,
                flexShrink: 0,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: data.allowGuests ? "var(--cafe-blue)" : "var(--ink-dim)",
                transition: "background .2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  left: data.allowGuests ? 24 : 4,
                  height: 16,
                  width: 16,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left .2s",
                }}
              />
            </button>
          </div>

          {/* 유니폼 색상 (팀 대결에만 노출) */}
          {data.gameType === "2" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label className="label">홈 유니폼 색상</label>
                <input
                  type="color"
                  value={data.uniformHomeColor}
                  onChange={(e) => updateData("uniformHomeColor", e.target.value)}
                  style={{
                    width: "100%",
                    height: 40,
                    padding: 4,
                    border: "1px solid var(--border-strong)",
                    borderRadius: 6,
                    background: "var(--bg-elev)",
                    cursor: "pointer",
                  }}
                />
              </div>
              <div>
                <label className="label">원정 유니폼 색상</label>
                <input
                  type="color"
                  value={data.uniformAwayColor}
                  onChange={(e) => updateData("uniformAwayColor", e.target.value)}
                  style={{
                    width: "100%",
                    height: 40,
                    padding: 4,
                    border: "1px solid var(--border-strong)",
                    borderRadius: 6,
                    background: "var(--bg-elev)",
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>
          )}

          {/* 반복 경기 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "var(--bg-alt)",
              borderRadius: 6,
              marginBottom: data.isRecurring ? 14 : 14,
            }}
          >
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0 }}>반복 경기</p>
              <p style={{ fontSize: 11, color: "var(--ink-mute)", margin: "2px 0 0" }}>정기적으로 반복되는 경기</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={data.isRecurring}
              onClick={() => updateData("isRecurring", !data.isRecurring)}
              style={{
                position: "relative",
                height: 24,
                width: 44,
                flexShrink: 0,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: data.isRecurring ? "var(--cafe-blue)" : "var(--ink-dim)",
                transition: "background .2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  left: data.isRecurring ? 24 : 4,
                  height: 16,
                  width: 16,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left .2s",
                }}
              />
            </button>
          </div>

          {data.isRecurring && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label className="label">반복 주기</label>
                <select
                  className="input"
                  value={data.recurrenceRule}
                  onChange={(e) => updateData("recurrenceRule", e.target.value)}
                  style={{ appearance: "auto" }}
                >
                  {RECURRENCE_RULES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">총 횟수</label>
                <input
                  className="input"
                  type="number"
                  value={data.recurringCount}
                  onChange={(e) => updateData("recurringCount", parseInt(e.target.value) || 2)}
                  min={2}
                  max={52}
                />
              </div>
            </div>
          )}

          {/* 비고 (notes) */}
          <div>
            <label className="label">비고</label>
            <textarea
              className="textarea"
              rows={2}
              value={data.notes}
              onChange={(e) => updateData("notes", e.target.value)}
              placeholder="기타 안내사항"
              style={{ minHeight: 64, resize: "vertical" }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
