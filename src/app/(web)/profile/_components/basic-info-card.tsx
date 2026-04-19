"use client";

/* ============================================================
 * BasicInfoCard — /profile 허브 대시보드 "기본 정보" 읽기 전용 카드
 *
 * 왜:
 *  - 사용자가 자신의 핵심 정보(닉네임/이메일/전화/생년월일)를 한 번에 훑어보고
 *    수정이 필요하면 우상단 "수정" 버튼으로 /profile/edit 로 이동하도록.
 *
 * 어떻게:
 *  - 전화번호는 010-XXXX-XXXX 패턴이면 "010-****-****" 로 마스킹 (자신이지만 시각적 깔끔함).
 *  - 값이 없으면 "-" (CLAUDE.md 플레이스홀더 규칙).
 * ============================================================ */

import Link from "next/link";

export interface BasicInfoCardProps {
  nickname: string | null;
  email: string | null;
  phone: string | null;
  birthDate: string | null; // "YYYY-MM-DD" 또는 null
}

/** 전화번호 마스킹: 010-XXXX-XXXX → 010-****-****, 외 형태는 원본 유지 */
function maskPhone(phone: string | null): string {
  if (!phone) return "-";
  // 숫자만 추출하여 11자리 휴대폰이면 마스킹
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("010")) {
    return `${digits.slice(0, 3)}-****-****`;
  }
  // 그 외(일반 번호 등)는 가운데 일부만 마스킹 (최소 마스킹)
  return phone;
}

export function BasicInfoCard({
  nickname,
  email,
  phone,
  birthDate,
}: BasicInfoCardProps) {
  const rows: { label: string; value: string }[] = [
    { label: "닉네임", value: nickname || "-" },
    { label: "이메일", value: email || "-" },
    { label: "전화번호", value: maskPhone(phone) },
    { label: "생년월일", value: birthDate || "-" },
  ];

  return (
    <Card title="기본 정보" editHref="/profile/edit">
      <dl className="space-y-2.5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3">
            <dt
              className="shrink-0"
              style={{ color: "var(--color-text-muted)" }}
            >
              {row.label}
            </dt>
            <dd
              className="text-right"
              style={{ color: "var(--color-text-primary)" }}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/** 카드 공통 껍데기 — 제목(좌) + 수정 버튼(우) + 본문 */
function Card({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-lg border p-4 sm:p-5"
      style={{
        backgroundColor: "var(--color-card)",
        borderColor: "var(--color-border)",
        borderRadius: "4px", // CLAUDE.md 4px radius 컨벤션
      }}
    >
      <header className="mb-3 flex items-center justify-between">
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h2>
        <Link
          href={editHref}
          className="inline-flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: "var(--color-primary)" }}
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          수정
        </Link>
      </header>
      {children}
    </section>
  );
}
