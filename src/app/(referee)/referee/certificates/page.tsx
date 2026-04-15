"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/**
 * /referee/certificates — 내 자격증 목록 + 추가 폼 (Client Component)
 *
 * 이유: 본인 자격증 CRUD가 한 페이지에 집약되므로 클라이언트 상태로 관리.
 *      GET 실패(400 NO_REFEREE_PROFILE) 시 프로필 등록 안내로 분기.
 *      verified 필드는 읽기 전용 뱃지로만 노출 (수정 불가).
 */

type Certificate = {
  id: string;
  cert_type: string;
  cert_grade: string;
  issuer: string;
  cert_number: string | null;
  issued_at: string;
  expires_at: string | null;
  verified: boolean;
};

type NewCertForm = {
  cert_type: string;
  cert_grade: string;
  issuer: string;
  cert_number: string;
  issued_at: string;
  expires_at: string;
};

const initialNewCert: NewCertForm = {
  cert_type: "referee",
  cert_grade: "",
  issuer: "",
  cert_number: "",
  issued_at: "",
  expires_at: "",
};

export default function RefereeCertificatesPage() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 추가 폼 상태 (접힌 상태가 기본)
  const [formOpen, setFormOpen] = useState(false);
  const [newCert, setNewCert] = useState<NewCertForm>(initialNewCert);
  const [submitting, setSubmitting] = useState(false);

  // 목록 조회 함수 (새 항목 추가 후 재호출용)
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/web/referee-certificates", {
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as { items: Certificate[] };
        setItems(data.items ?? []);
        setErrorCode(null);
      } else {
        // 에러 바디의 code 필드로 분기
        let code: string | null = null;
        let msg: string | null = null;
        try {
          const data = (await res.json()) as {
            code?: string;
            error?: string;
          };
          code = data.code ?? null;
          msg = data.error ?? null;
        } catch {
          /* 무시 */
        }
        setErrorCode(code);
        setErrorMsg(msg ?? "자격증 목록을 불러올 수 없습니다.");
        setItems([]);
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  // 신규 자격증 제출
  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);

      const payload = {
        cert_type: newCert.cert_type,
        cert_grade: newCert.cert_grade,
        issuer: newCert.issuer,
        cert_number: newCert.cert_number || null,
        issued_at: newCert.issued_at,
        expires_at: newCert.expires_at || null,
      };

      try {
        const res = await fetch("/api/web/referee-certificates", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          let message = "추가하지 못했습니다.";
          try {
            const data = (await res.json()) as { error?: string };
            if (data?.error) message = data.error;
          } catch {
            /* 무시 */
          }
          setErrorMsg(message);
          setSubmitting(false);
          return;
        }

        // 성공 → 폼 초기화 + 목록 재조회
        setNewCert(initialNewCert);
        setFormOpen(false);
        setErrorMsg(null);
        await loadList();
      } catch {
        setErrorMsg("네트워크 오류가 발생했습니다.");
      } finally {
        setSubmitting(false);
      }
    },
    [newCert, loadList],
  );

  // 프로필 미등록 상태: CTA 카드
  if (errorCode === "NO_REFEREE_PROFILE") {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div
          className="flex flex-col items-center px-6 py-16 text-center"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
          }}
        >
          <span
            className="material-symbols-outlined text-5xl"
            style={{ color: "var(--color-text-muted)" }}
          >
            badge
          </span>
          <h2
            className="mt-4 text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            심판 프로필이 필요합니다
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            자격증을 등록하려면 먼저 심판 프로필을 등록하세요.
          </p>
          <Link
            href="/referee/profile/edit"
            className="mt-6 px-5 py-2.5 text-sm font-bold uppercase tracking-wide"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-on-primary, #fff)",
              borderRadius: 4,
            }}
          >
            프로필 등록하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      {/* 에러 배너 */}
      {errorMsg && errorCode !== "NO_REFEREE_PROFILE" && (
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

      {/* 신규 추가 토글 버튼 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="flex items-center gap-1 px-4 py-2 text-xs font-bold uppercase tracking-wider"
          style={{
            backgroundColor: formOpen
              ? "var(--color-surface)"
              : "var(--color-primary)",
            color: formOpen ? "var(--color-text-primary)" : "#fff",
            borderRadius: 4,
          }}
        >
          <span className="material-symbols-outlined text-base">
            {formOpen ? "close" : "add"}
          </span>
          {formOpen ? "닫기" : "신규 추가"}
        </button>
      </div>

      {/* 신규 추가 폼 (접힘/펼침) */}
      {formOpen && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 p-5"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
          }}
        >
          {/* cert_type + cert_grade 한 줄 */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="유형">
              <select
                value={newCert.cert_type}
                onChange={(e) =>
                  setNewCert({ ...newCert, cert_type: e.target.value })
                }
                className="w-full px-3 py-2 text-sm"
                style={inputStyle()}
              >
                <option value="referee">referee</option>
                <option value="scorer">scorer</option>
                <option value="timer">timer</option>
              </select>
            </Field>
            <Field label="등급">
              <input
                type="text"
                required
                maxLength={20}
                value={newCert.cert_grade}
                onChange={(e) =>
                  setNewCert({ ...newCert, cert_grade: e.target.value })
                }
                placeholder="1급 / 국제 등"
                className="w-full px-3 py-2 text-sm"
                style={inputStyle()}
              />
            </Field>
          </div>

          {/* 발급 협회 */}
          <Field label="발급 협회">
            <input
              type="text"
              required
              maxLength={100}
              value={newCert.issuer}
              onChange={(e) =>
                setNewCert({ ...newCert, issuer: e.target.value })
              }
              placeholder="대한민국농구협회"
              className="w-full px-3 py-2 text-sm"
              style={inputStyle()}
            />
          </Field>

          {/* 자격번호 */}
          <Field label="자격번호 (선택)">
            <input
              type="text"
              maxLength={50}
              value={newCert.cert_number}
              onChange={(e) =>
                setNewCert({ ...newCert, cert_number: e.target.value })
              }
              placeholder="KBA-2023-12345"
              className="w-full px-3 py-2 text-sm"
              style={inputStyle()}
            />
          </Field>

          {/* 발급일 + 만료일 */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="발급일">
              <input
                type="date"
                required
                value={newCert.issued_at}
                onChange={(e) =>
                  setNewCert({ ...newCert, issued_at: e.target.value })
                }
                className="w-full px-3 py-2 text-sm"
                style={inputStyle()}
              />
            </Field>
            <Field label="만료일 (선택)">
              <input
                type="date"
                value={newCert.expires_at}
                onChange={(e) =>
                  setNewCert({ ...newCert, expires_at: e.target.value })
                }
                className="w-full px-3 py-2 text-sm"
                style={inputStyle()}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setNewCert(initialNewCert);
              }}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider"
              style={{
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-text-on-primary, #fff)",
                borderRadius: 4,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "추가 중..." : "추가"}
            </button>
          </div>
        </form>
      )}

      {/* 목록 — 에러 발생 시 빈 목록 메시지는 숨김 (에러 배너만 표시) */}
      {loading ? (
        <p
          className="p-8 text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          불러오는 중...
        </p>
      ) : items.length === 0 && !errorMsg ? (
        <p
          className="p-12 text-center text-sm"
          style={{
            backgroundColor: "var(--color-card)",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
          }}
        >
          등록된 자격증이 없습니다.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/referee/certificates/${c.id}`}
                className="flex items-start justify-between gap-3 p-4"
                style={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className="truncate text-sm font-bold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {c.cert_type} · {c.cert_grade}
                    </h3>
                    {/* verified 뱃지 (읽기 전용) */}
                    {c.verified ? (
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: "var(--color-primary)",
                          color: "var(--color-text-on-primary, #fff)",
                          borderRadius: 4,
                        }}
                      >
                        <span className="material-symbols-outlined text-xs">
                          check_circle
                        </span>
                        검증
                      </span>
                    ) : (
                      <span
                        className="inline-flex px-1.5 py-0.5 text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: "var(--color-surface)",
                          color: "var(--color-text-muted)",
                          borderRadius: 4,
                        }}
                      >
                        미검증
                      </span>
                    )}
                  </div>
                  <p
                    className="mt-0.5 truncate text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {c.issuer}
                  </p>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    발급: {formatDate(c.issued_at)}
                    {c.expires_at && ` · 만료: ${formatDate(c.expires_at)}`}
                  </p>
                </div>
                <span
                  className="material-symbols-outlined text-base"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  arrow_forward
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

function PageHeader() {
  return (
    <header>
      <h1
        className="text-2xl font-black uppercase tracking-wider"
        style={{ color: "var(--color-text-primary)" }}
      >
        내 자격증
      </h1>
      <p
        className="mt-1 text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        보유 자격증을 등록하고 관리하세요. 검증은 관리자가 처리합니다.
      </p>
    </header>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-bold uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// 공통 input/select 스타일 (inline 중복 제거용)
function inputStyle(): React.CSSProperties {
  return {
    backgroundColor: "var(--color-surface)",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
    borderRadius: 4,
  };
}

// YYYY-MM-DD 형식 변환 (API는 ISO 문자열로 반환)
function formatDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}
