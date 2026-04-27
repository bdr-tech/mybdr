"use client";

// v2 디자인 Settings 페이지 박제 라우트
// 이유: BDR v2 디자인 시안 그대로 신규 라우트로 박제. DB 0% 상태 — 모든 toggle/input은 UI 미리보기 전용.
// 시안 위치: Dev/design/BDR v2/screens/Settings.jsx (185 lines)
// 정책: defaultChecked / defaultValue / 이모지 시안 그대로. 동작 미연결. billing의 "플랜 변경"만 Link.

import Link from "next/link";
import { useState, type ChangeEvent } from "react";

// 시안의 인라인 Toggle 컴포넌트 박제
// 이유: 시안의 onChange는 DOM nextSibling 직접 조작 — TS strict 환경에서 그대로 쓸 수 없으므로
//       동일한 시각 효과를 React state 기반으로 재현 (UI 동작은 시안과 동일)
function Toggle({
  label,
  desc,
  defaultChecked = false,
}: {
  label: string;
  desc?: string;
  defaultChecked?: boolean;
}) {
  // 토글 상태 — 시안의 defaultChecked 그대로 초기값 사용
  const [checked, setChecked] = useState<boolean>(defaultChecked);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
        {desc && (
          <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>
            {desc}
          </div>
        )}
      </div>
      <label
        style={{
          position: "relative",
          display: "inline-block",
          width: 44,
          height: 24,
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setChecked(e.target.checked)
          }
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: checked ? "var(--cafe-blue)" : "var(--bg-alt)",
            borderRadius: 12,
            transition: "background .2s",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: 2,
              width: 20,
              height: 20,
              background: "#fff",
              borderRadius: "50%",
              transition: "transform .2s",
              transform: checked ? "translateX(20px)" : "translateX(0)",
              boxShadow: "0 1px 3px rgba(0,0,0,.2)",
            }}
          />
        </span>
      </label>
    </div>
  );
}

// 시안의 Row 컴포넌트 박제 — label / value / action 버튼 (UI only)
function Row({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: "var(--ink-mute)" }}>{value}</span>
        <button type="button" className="btn btn--sm">
          {action}
        </button>
      </div>
    </div>
  );
}

// 좌측 nav 섹션 정의 — 시안 그대로 (이모지 포함)
type SectionId =
  | "account"
  | "profile"
  | "notify"
  | "privacy"
  | "billing"
  | "danger";

const SECTIONS: { id: SectionId; label: string; icon: string }[] = [
  { id: "account", label: "계정", icon: "👤" },
  { id: "profile", label: "프로필", icon: "🏀" },
  { id: "notify", label: "알림", icon: "🔔" },
  { id: "privacy", label: "개인정보·공개", icon: "🔒" },
  { id: "billing", label: "결제·멤버십", icon: "💳" },
  { id: "danger", label: "계정 관리", icon: "⚠️" },
];

export default function SettingsPage() {
  // 현재 선택된 섹션 — 시안 초기값 'account'
  const [section, setSection] = useState<SectionId>("account");

  return (
    <div className="page">
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* 헤더 — eyebrow + h1 + 부제 */}
        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow">설정 · SETTINGS</div>
          <h1
            style={{
              margin: "6px 0 2px",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.015em",
            }}
          >
            환경 설정
          </h1>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            계정, 알림, 공개 범위를 관리합니다
          </div>
          {/* DB 0% 안내 — UI 미리보기 전용임을 명시 */}
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-dim)",
              marginTop: 8,
            }}
          >
            현재 환경 설정은 준비 중입니다. UI 미리보기로만 동작합니다.
          </div>
        </div>

        {/* 좌측 sticky nav (220px) + 우측 콘텐츠 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          <nav
            className="card"
            style={{ padding: 8, position: "sticky", top: 120 }}
          >
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 12px",
                  background:
                    section === s.id ? "var(--bg-alt)" : "transparent",
                  border: 0,
                  cursor: "pointer",
                  textAlign: "left",
                  borderRadius: 6,
                  fontWeight: section === s.id ? 700 : 500,
                  fontSize: 14,
                  color:
                    section === s.id ? "var(--ink)" : "var(--ink-soft)",
                }}
              >
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>

          <div className="card" style={{ padding: "24px 28px" }}>
            {/* 계정 섹션 — Row 5개 */}
            {section === "account" && (
              <>
                <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
                  계정 정보
                </h2>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-mute)",
                    marginBottom: 16,
                  }}
                >
                  로그인과 보안 관련 설정
                </div>
                <Row label="이메일" value="rdm_captain@mybdr.kr" action="변경" />
                <Row
                  label="비밀번호"
                  value="마지막 변경 3개월 전"
                  action="변경"
                />
                <Row label="연결된 계정" value="카카오 · 구글" action="관리" />
                <Row label="2단계 인증" value="비활성" action="켜기" />
                <Row
                  label="로그인 기기"
                  value="3대 (iPhone, MacBook, 크롬)"
                  action="관리"
                />
              </>
            )}

            {/* 프로필 섹션 — 6개 input 그리드 + 자기소개 textarea + 저장 버튼 */}
            {section === "profile" && (
              <>
                <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
                  선수 프로필
                </h2>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-mute)",
                    marginBottom: 16,
                  }}
                >
                  경기 및 랭킹에 표시되는 정보
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--ink-mute)",
                      }}
                    >
                      닉네임
                    </label>
                    <input
                      className="input"
                      style={{ marginTop: 6 }}
                      defaultValue="rdm_captain"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--ink-mute)",
                      }}
                    >
                      실명
                    </label>
                    <input
                      className="input"
                      style={{ marginTop: 6 }}
                      defaultValue="김*수"
                      placeholder="공개하지 않음"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--ink-mute)",
                      }}
                    >
                      포지션
                    </label>
                    <input
                      className="input"
                      style={{ marginTop: 6 }}
                      defaultValue="가드"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--ink-mute)",
                      }}
                    >
                      등번호
                    </label>
                    <input
                      className="input"
                      style={{ marginTop: 6 }}
                      defaultValue="7"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--ink-mute)",
                      }}
                    >
                      키 (cm)
                    </label>
                    <input
                      className="input"
                      style={{ marginTop: 6 }}
                      defaultValue="182"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--ink-mute)",
                      }}
                    >
                      주로 뛰는 손
                    </label>
                    <input
                      className="input"
                      style={{ marginTop: 6 }}
                      defaultValue="오른손"
                    />
                  </div>
                </div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--ink-mute)",
                  }}
                >
                  자기소개
                </label>
                <textarea
                  className="input"
                  rows={3}
                  style={{ marginTop: 6, resize: "vertical" }}
                  defaultValue="강남·송파 위주 픽업. 토요일 오전 고정."
                />
                <button
                  type="button"
                  className="btn btn--primary"
                  style={{ marginTop: 16 }}
                >
                  변경사항 저장
                </button>
              </>
            )}

            {/* 알림 섹션 — Toggle 8개 */}
            {section === "notify" && (
              <>
                <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
                  알림 설정
                </h2>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-mute)",
                    marginBottom: 8,
                  }}
                >
                  받을 알림 종류를 선택하세요
                </div>
                <Toggle
                  label="이메일 알림"
                  desc="주요 알림을 이메일로 받음"
                  defaultChecked
                />
                <Toggle label="푸시 알림" desc="모바일 앱 푸시" defaultChecked />
                <Toggle label="대회 접수 마감 D-3 알림" defaultChecked />
                <Toggle label="경기 신청 승인/거절" defaultChecked />
                <Toggle label="댓글·멘션" defaultChecked />
                <Toggle label="좋아요" />
                <Toggle label="팀 소식" defaultChecked />
                <Toggle label="마케팅·프로모션" />
              </>
            )}

            {/* 개인정보·공개 섹션 — Toggle 5개 */}
            {section === "privacy" && (
              <>
                <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
                  공개 범위
                </h2>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-mute)",
                    marginBottom: 8,
                  }}
                >
                  프로필·활동 정보 노출 설정
                </div>
                <Toggle
                  label="프로필 검색 허용"
                  desc="닉네임 검색에 노출"
                  defaultChecked
                />
                <Toggle
                  label="경기 기록 공개"
                  desc="다른 사용자가 스탯·전적 열람"
                  defaultChecked
                />
                <Toggle label="활동 타임라인 공개" />
                <Toggle label="실명 표시" desc="소속팀 페이지에서만 표시" />
                <Toggle label="DM 수신" defaultChecked />
              </>
            )}

            {/* 결제·멤버십 섹션 — 현재 플랜 카드 + Row 3개 + 버튼 2개 */}
            {section === "billing" && (
              <>
                <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
                  멤버십·결제
                </h2>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-mute)",
                    marginBottom: 16,
                  }}
                >
                  현재 구독 중인 플랜과 결제 정보
                </div>
                <div
                  style={{
                    padding: "18px 20px",
                    background:
                      "linear-gradient(135deg, var(--cafe-blue), var(--cafe-blue-deep))",
                    color: "#fff",
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: ".1em",
                      fontWeight: 800,
                      opacity: 0.9,
                    }}
                  >
                    현재 플랜
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--ff-display)",
                      fontSize: 26,
                      fontWeight: 900,
                      margin: "4px 0",
                    }}
                  >
                    BDR+
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>
                    ₩4,900/월 · 다음 결제 2026.05.20
                  </div>
                </div>
                <Row label="결제수단" value="카드 **** 8822" action="변경" />
                <Row label="결제 내역" value="최근 6건" action="보기" />
                <Row
                  label="영수증·세금계산서"
                  value="월말 발행"
                  action="발급"
                />
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  {/* 시안의 setRoute('pricing') → /pricing 라우트 Link로 대체 */}
                  <Link href="/pricing" className="btn btn--sm">
                    플랜 변경
                  </Link>
                  <button type="button" className="btn btn--sm">
                    구독 취소
                  </button>
                </div>
              </>
            )}

            {/* 계정 관리 (Danger) — 카드 3개 (내보내기 / 비활성화 / 삭제) */}
            {section === "danger" && (
              <>
                <h2
                  style={{
                    margin: "0 0 4px",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--accent)",
                  }}
                >
                  계정 관리
                </h2>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-mute)",
                    marginBottom: 16,
                  }}
                >
                  신중히 결정하세요 — 되돌릴 수 없는 작업들
                </div>
                <div
                  style={{
                    padding: "16px 18px",
                    border: "2px solid var(--border)",
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    데이터 내보내기
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-mute)",
                      marginBottom: 10,
                    }}
                  >
                    프로필·경기 기록·게시물 전체를 ZIP으로 받기
                  </div>
                  <button type="button" className="btn btn--sm">
                    요청하기
                  </button>
                </div>
                <div
                  style={{
                    padding: "16px 18px",
                    border: "2px solid var(--border)",
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    계정 비활성화
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-mute)",
                      marginBottom: 10,
                    }}
                  >
                    30일간 숨김 처리, 로그인 시 복구 가능
                  </div>
                  <button type="button" className="btn btn--sm">
                    비활성화
                  </button>
                </div>
                <div
                  style={{
                    padding: "16px 18px",
                    border: "2px solid var(--accent)",
                    borderRadius: 8,
                    background:
                      "color-mix(in oklab, var(--accent) 6%, transparent)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 4,
                      color: "var(--accent)",
                    }}
                  >
                    계정 삭제
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-mute)",
                      marginBottom: 10,
                    }}
                  >
                    모든 데이터 영구 삭제. 복구 불가.
                  </div>
                  <button
                    type="button"
                    className="btn btn--sm"
                    style={{
                      background: "var(--accent)",
                      color: "#fff",
                      borderColor: "var(--accent)",
                    }}
                  >
                    계정 삭제
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
