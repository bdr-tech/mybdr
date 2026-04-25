"use client";

/* ============================================================
 * ProfileSectionV2 — Settings "선수 프로필" 섹션 (시안 인라인 9필드 폼)
 *
 * 왜:
 *  - 시안 Settings.jsx profile 섹션을 인라인 폼으로 그대로 이식.
 *  - 기존 PATCH /api/web/profile 가 받는 필드만 사용 → API 0 변경.
 *  - 시안의 "등번호 / 주로 뛰는 손" 2 필드는 DB 미지원 → 추후 구현 목록으로
 *    이관(scratchpad 🚧 Phase 5 Settings). 이번 9 필드는 PATCH 지원 필드 한정.
 *
 * 어떻게:
 *  - 9 필드: nickname / name / position / height / weight / city / district /
 *           birth_date / bio
 *  - 초기값: 부모가 GET /api/web/profile 결과를 prop 으로 내려줌 (신규 fetch 0).
 *  - 저장 버튼 클릭 → fetch PATCH /api/web/profile (기존 호출 그대로).
 *  - 닉네임 2~20자 클라 검증(서버도 검증하지만 즉시 피드백).
 *  - 성공/실패 메시지 표시 + 진행중 disabled.
 * ============================================================ */

import { useState, useEffect, type FormEvent } from "react";
import { SettingsHeader } from "./settings-ui";

// 부모에서 받는 사용자 정보 (GET /api/web/profile 의 user 필드 일부)
export interface ProfileFormUser {
  nickname?: string | null;
  name?: string | null;
  position?: string | null;
  height?: number | null;
  weight?: number | null;
  city?: string | null;
  district?: string | null;
  birth_date?: string | null; // YYYY-MM-DD (PATCH 응답 / GET 변환 후)
  bio?: string | null;
}

interface Props {
  user: ProfileFormUser | null;
  onSaved?: (next: ProfileFormUser) => void;
}

export function ProfileSectionV2({ user, onSaved }: Props) {
  // 9 필드 로컬 상태. 빈 문자열 = "비우기" 의도. 서버는 빈 문자열을 null 로 저장.
  const [form, setForm] = useState({
    nickname: "",
    name: "",
    position: "",
    height: "",
    weight: "",
    city: "",
    district: "",
    birth_date: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);
  // 저장 결과 메시지: success | error | null
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // 부모 user 가 도착/갱신될 때 폼 초기화
  useEffect(() => {
    if (!user) return;
    setForm({
      nickname: user.nickname ?? "",
      name: user.name ?? "",
      position: user.position ?? "",
      height: user.height != null ? String(user.height) : "",
      weight: user.weight != null ? String(user.weight) : "",
      city: user.city ?? "",
      district: user.district ?? "",
      birth_date: user.birth_date ?? "",
      bio: user.bio ?? "",
    });
  }, [user]);

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    setMessage(null);

    // 닉네임 길이 클라 검증 (서버도 검증하지만 즉시 피드백)
    const trimmedNick = form.nickname.trim();
    if (trimmedNick.length > 0 && (trimmedNick.length < 2 || trimmedNick.length > 20)) {
      setMessage({ kind: "error", text: "닉네임은 2자 이상 20자 이하여야 합니다." });
      return;
    }

    setSaving(true);
    try {
      // PATCH /api/web/profile 기존 시그니처 그대로
      const res = await fetch("/api/web/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 빈 문자열은 서버에서 null 처리됨 (route.ts: `value as string || null`)
          nickname: form.nickname,
          name: form.name,
          position: form.position,
          // height/weight 는 숫자 변환은 서버에서 처리. 빈문자열이면 null.
          height: form.height,
          weight: form.weight,
          city: form.city,
          district: form.district,
          // birth_date 도 빈문자열이면 서버에서 null 처리
          birth_date: form.birth_date,
          bio: form.bio,
        }),
      });
      if (!res.ok) {
        // apiError 형태: { error: string } — 가능하면 메시지 추출
        let errText = "저장에 실패했습니다.";
        try {
          const data = await res.json();
          if (data?.error && typeof data.error === "string") errText = data.error;
        } catch {
          // ignore
        }
        setMessage({ kind: "error", text: errText });
        return;
      }
      // apiSuccess: { ...updated user fields }. snake_case 그대로 (CLAUDE.md).
      // 부모에 변경 알림 (header 등 공유 데이터 갱신용)
      try {
        const data = await res.json();
        onSaved?.({
          nickname: data?.nickname ?? form.nickname,
          name: data?.name ?? form.name,
          position: data?.position ?? form.position,
          height: data?.height ?? (form.height ? Number(form.height) : null),
          weight: data?.weight ?? (form.weight ? Number(form.weight) : null),
          city: data?.city ?? form.city,
          district: data?.district ?? form.district,
          birth_date: data?.birth_date ?? form.birth_date,
          bio: data?.bio ?? form.bio,
        });
      } catch {
        // ignore parse error — UI 메시지는 그대로 success
      }
      setMessage({ kind: "success", text: "프로필이 저장되었습니다." });
    } catch {
      setMessage({ kind: "error", text: "네트워크 오류로 저장에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <SettingsHeader
        title="선수 프로필"
        desc="경기 및 랭킹에 표시되는 정보"
      />

      {/* 시안의 2열 그리드 — 8 단순 필드 + 마지막 자기소개는 1열 풀폭 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Field
          label="닉네임"
          name="nickname"
          value={form.nickname}
          onChange={(v) => setField("nickname", v)}
          maxLength={20}
          placeholder="2~20자"
        />
        <Field
          label="실명"
          name="name"
          value={form.name}
          onChange={(v) => setField("name", v)}
          placeholder="공개하지 않음"
        />
        <Field
          label="포지션"
          name="position"
          value={form.position}
          onChange={(v) => setField("position", v)}
          placeholder="가드 / 포워드 / 센터 등"
        />
        <Field
          label="키 (cm)"
          name="height"
          value={form.height}
          onChange={(v) => setField("height", v.replace(/[^0-9]/g, ""))}
          placeholder="예: 182"
          inputMode="numeric"
        />
        <Field
          label="몸무게 (kg)"
          name="weight"
          value={form.weight}
          onChange={(v) => setField("weight", v.replace(/[^0-9]/g, ""))}
          placeholder="예: 78"
          inputMode="numeric"
        />
        <Field
          label="도시"
          name="city"
          value={form.city}
          onChange={(v) => setField("city", v)}
          placeholder="예: 서울"
        />
        <Field
          label="활동 지역(구/동)"
          name="district"
          value={form.district}
          onChange={(v) => setField("district", v)}
          placeholder="예: 강남구"
        />
        <Field
          label="생년월일"
          name="birth_date"
          type="date"
          value={form.birth_date}
          onChange={(v) => setField("birth_date", v)}
        />
      </div>

      {/* 자기소개 — textarea (시안 동일) */}
      <label
        style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-mute)" }}
        htmlFor="profile-bio"
      >
        자기소개
      </label>
      <textarea
        id="profile-bio"
        className="input"
        rows={3}
        style={{ marginTop: 6, resize: "vertical", width: "100%" }}
        value={form.bio}
        onChange={(e) => setField("bio", e.target.value)}
        placeholder="강남·송파 위주 픽업. 토요일 오전 고정."
      />

      {/* 저장 버튼 + 메시지 영역 */}
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={saving}
          // 저장 중이면 시각적으로 진행 표시
          style={saving ? { opacity: 0.7, cursor: "wait" } : undefined}
        >
          {saving ? "저장 중..." : "변경사항 저장"}
        </button>
        {message && (
          <span
            style={{
              fontSize: 13,
              color:
                message.kind === "success" ? "var(--ok)" : "var(--accent)",
            }}
            role={message.kind === "error" ? "alert" : "status"}
          >
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}

/* ----- 단일 라벨+input 묶음. 시안 토큰(.input) 사용 ----- */
function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  maxLength,
  inputMode,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label
        htmlFor={`profile-${name}`}
        style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-mute)" }}
      >
        {label}
      </label>
      <input
        id={`profile-${name}`}
        name={name}
        className="input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        style={{ marginTop: 6, width: "100%" }}
      />
    </div>
  );
}
