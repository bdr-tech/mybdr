"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * /referee/admin/members/new — 심판 사전 등록 폼.
 *
 * 이유: 협회 관리자가 아직 가입하지 않은 심판을 이름+전화번호로 미리 등록한다.
 *      등록 후 해당 유저가 가입하면 자동 매칭된다.
 *
 * 필수 입력: 이름, 전화번호
 * 선택 입력: 생년월일, 등급, 역할, 자격번호, 지역
 */

// 등급 옵션
const LEVEL_OPTIONS = [
  { value: "", label: "선택 안 함" },
  { value: "beginner", label: "초급" },
  { value: "intermediate", label: "중급" },
  { value: "advanced", label: "상급" },
  { value: "international", label: "국제" },
] as const;

// 역할 옵션
const ROLE_OPTIONS = [
  { value: "referee", label: "심판" },
  { value: "scorer", label: "기록원" },
  { value: "timer", label: "타이머" },
] as const;

// 시도 목록
const SIDO_LIST = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

export default function AdminMemberNewPage() {
  const router = useRouter();

  // 폼 상태
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [residentId, setResidentId] = useState(""); // 주민번호 (정산용, 선택)
  const [birthDate, setBirthDate] = useState("");
  const [level, setLevel] = useState("");
  const [roleType, setRoleType] = useState("referee");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [regionSido, setRegionSido] = useState("");
  const [regionSigungu, setRegionSigungu] = useState("");

  // 제출 상태
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // 클라이언트 기본 검증
    if (!name.trim()) {
      setErrorMsg("이름을 입력해주세요.");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("전화번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/web/referee-admin/members", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registered_name: name.trim(),
          registered_phone: phone.trim(),
          resident_id: residentId.trim() || null,
          registered_birth_date: birthDate || null,
          level: level || null,
          role_type: roleType || "referee",
          license_number: licenseNumber.trim() || null,
          region_sido: regionSido || null,
          region_sigungu: regionSigungu.trim() || null,
        }),
      });

      if (res.ok) {
        setSuccessMsg("심판이 사전 등록되었습니다.");
        // 2초 후 목록 페이지로 이동
        setTimeout(() => router.push("/referee/admin/members"), 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(
          (data as { error?: string }).error ??
            "등록에 실패했습니다. 다시 시도해주세요."
        );
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 뒤로가기 */}
      <Link
        href="/referee/admin/members"
        className="inline-flex items-center gap-1 text-sm font-bold"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        목록으로
      </Link>

      {/* 헤더 */}
      <header>
        <h1
          className="text-2xl font-black uppercase tracking-wider"
          style={{ color: "var(--color-text-primary)" }}
        >
          심판 사전 등록
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          아직 가입하지 않은 심판을 미리 등록합니다. 해당 유저가 가입하면 자동으로
          매칭됩니다.
        </p>
      </header>

      {/* 에러/성공 메시지 */}
      {errorMsg && (
        <div
          className="px-3 py-2 text-xs"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-primary)",
            border: "1px solid var(--color-primary)",
            borderRadius: 4,
          }}
        >
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div
          className="px-3 py-2 text-xs"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-success, #22c55e)",
            border: "1px solid var(--color-success, #22c55e)",
            borderRadius: 4,
          }}
        >
          {successMsg}
        </div>
      )}

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 필수 입력 섹션 */}
        <section
          className="space-y-4 p-5"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
          }}
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            필수 정보
          </h2>

          {/* 이름 */}
          <div>
            <label
              className="mb-1 block text-xs font-bold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              이름 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            />
          </div>

          {/* 전화번호 */}
          <div>
            <label
              className="mb-1 block text-xs font-bold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              전화번호 *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
              className="w-full px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            />
          </div>
          {/* 주민등록번호 (정산용, 선택) */}
          <div>
            <label
              className="mb-1 block text-xs font-bold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              주민등록번호 (정산용, 선택)
            </label>
            <input
              type="password"
              value={residentId}
              onChange={(e) => {
                // 하이픈 자동 삽입: 6자리 입력 후 자동으로 하이픈 추가
                const raw = e.target.value.replace(/[^0-9-]/g, "");
                if (raw.length === 7 && !raw.includes("-")) {
                  setResidentId(raw.slice(0, 6) + "-" + raw.slice(6));
                } else {
                  setResidentId(raw.slice(0, 14)); // 최대 14자 (000000-0000000)
                }
              }}
              placeholder="000000-0000000"
              maxLength={14}
              className="w-full px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            />
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              주민번호는 암호화 저장되며, 정산 목적으로만 사용됩니다.
            </p>
          </div>
        </section>

        {/* 선택 입력 섹션 */}
        <section
          className="space-y-4 p-5"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
          }}
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            추가 정보 (선택)
          </h2>

          {/* 생년월일 */}
          <div>
            <label
              className="mb-1 block text-xs font-bold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              생년월일
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            />
          </div>

          {/* 등급 + 역할 (가로 배치) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="mb-1 block text-xs font-bold"
                style={{ color: "var(--color-text-secondary)" }}
              >
                등급
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 text-sm"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                }}
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-bold"
                style={{ color: "var(--color-text-secondary)" }}
              >
                역할
              </label>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                className="w-full px-3 py-2 text-sm"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                }}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 자격번호 */}
          <div>
            <label
              className="mb-1 block text-xs font-bold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              자격번호
            </label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="REF-2026-001"
              className="w-full px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            />
          </div>

          {/* 지역 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="mb-1 block text-xs font-bold"
                style={{ color: "var(--color-text-secondary)" }}
              >
                시/도
              </label>
              <select
                value={regionSido}
                onChange={(e) => setRegionSido(e.target.value)}
                className="w-full px-3 py-2 text-sm"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                }}
              >
                <option value="">선택 안 함</option>
                {SIDO_LIST.map((sido) => (
                  <option key={sido} value={sido}>
                    {sido}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-bold"
                style={{ color: "var(--color-text-secondary)" }}
              >
                시/군/구
              </label>
              <input
                type="text"
                value={regionSigungu}
                onChange={(e) => setRegionSigungu(e.target.value)}
                placeholder="강남구"
                className="w-full px-3 py-2 text-sm"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        </section>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-opacity"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "#fff",
            borderRadius: 4,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          {submitting ? "등록 중..." : "심판 사전 등록"}
        </button>
      </form>
    </div>
  );
}
