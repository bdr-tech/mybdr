"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

/**
 * /referee/certificates/[id] — 자격증 상세/수정/삭제 (Client Component)
 *
 * 이유: 단건 조회 + 수정/삭제 인터랙션이 섞여 있어 클라이언트 상태로 관리.
 *      verified / verified_at은 읽기 전용 표시만. 수정 필드는 스키마와 동일한 6개.
 *      소유권 검증은 서버가 처리 (404 반환) — 프런트는 에러 메시지만 보여주면 됨.
 */

type Certificate = {
  id: string;
  referee_id: string;
  cert_type: string;
  cert_grade: string;
  issuer: string;
  cert_number: string | null;
  issued_at: string;
  expires_at: string | null;
  verified: boolean;
  verified_at: string | null;
};

type FormState = {
  cert_type: string;
  cert_grade: string;
  issuer: string;
  cert_number: string;
  issued_at: string;
  expires_at: string;
};

export default function CertificateDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [cert, setCert] = useState<Certificate | null>(null);
  const [form, setForm] = useState<FormState>({
    cert_type: "referee",
    cert_grade: "",
    issuer: "",
    cert_number: "",
    issued_at: "",
    expires_at: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // 최초 로드
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/web/referee-certificates/${id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 404) setNotFound(true);
          else setErrorMsg("자격증을 불러올 수 없습니다.");
          return;
        }
        const data = (await res.json()) as Certificate;
        if (cancelled) return;
        setCert(data);
        // 폼 초기값 주입 (ISO → YYYY-MM-DD)
        setForm({
          cert_type: data.cert_type,
          cert_grade: data.cert_grade,
          issuer: data.issuer,
          cert_number: data.cert_number ?? "",
          issued_at: data.issued_at ? data.issued_at.slice(0, 10) : "",
          expires_at: data.expires_at ? data.expires_at.slice(0, 10) : "",
        });
      } catch {
        if (!cancelled) setErrorMsg("네트워크 오류가 발생했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // 수정 제출
  const handleUpdate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!id) return;
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        cert_type: form.cert_type,
        cert_grade: form.cert_grade,
        issuer: form.issuer,
        cert_number: form.cert_number || null,
        issued_at: form.issued_at,
        expires_at: form.expires_at || null,
      };

      try {
        const res = await fetch(`/api/web/referee-certificates/${id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          let message = "수정하지 못했습니다.";
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
        // 성공 → 목록으로 이동
        router.push("/referee/certificates");
        router.refresh();
      } catch {
        setErrorMsg("네트워크 오류가 발생했습니다.");
        setSubmitting(false);
      }
    },
    [form, id, router],
  );

  // 삭제
  const handleDelete = useCallback(async () => {
    if (!id) return;
    // 벌써 확인 프롬프트 있어야 안전
    if (!window.confirm("정말로 이 자격증을 삭제하시겠습니까?")) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/web/referee-certificates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setErrorMsg("삭제하지 못했습니다.");
        setSubmitting(false);
        return;
      }
      router.push("/referee/certificates");
      router.refresh();
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }, [id, router]);

  if (loading) {
    return (
      <div
        className="p-8 text-center text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        불러오는 중...
      </div>
    );
  }

  if (notFound || !cert) {
    return (
      <div className="space-y-6">
        <header>
          <h1
            className="text-2xl font-black uppercase tracking-wider"
            style={{ color: "var(--color-text-primary)" }}
          >
            자격증
          </h1>
        </header>
        <div
          className="p-8 text-center text-sm"
          style={{
            backgroundColor: "var(--color-card)",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
          }}
        >
          자격증을 찾을 수 없습니다.
          <div className="mt-4">
            <Link
              href="/referee/certificates"
              className="text-xs font-semibold"
              style={{ color: "var(--color-primary)" }}
            >
              ← 목록으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-black uppercase tracking-wider"
            style={{ color: "var(--color-text-primary)" }}
          >
            자격증 수정
          </h1>
          <div
            className="mt-1 flex items-center gap-2 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {/* verified 상태는 읽기 전용 뱃지 */}
            {cert.verified ? (
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
                관리자 검증 완료
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
            {cert.verified_at && (
              <span>
                · 검증일 {(() => {
                  try { return new Date(cert.verified_at).toISOString().slice(0, 10); }
                  catch { return cert.verified_at; }
                })()}
              </span>
            )}
          </div>
        </div>
        <Link
          href="/referee/certificates"
          className="text-xs font-semibold"
          style={{ color: "var(--color-text-muted)" }}
        >
          ← 목록
        </Link>
      </header>

      {/* 폼 */}
      <form
        onSubmit={handleUpdate}
        className="space-y-4 p-5"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="유형">
            <select
              value={form.cert_type}
              onChange={(e) => setForm({ ...form, cert_type: e.target.value })}
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
              value={form.cert_grade}
              onChange={(e) =>
                setForm({ ...form, cert_grade: e.target.value })
              }
              className="w-full px-3 py-2 text-sm"
              style={inputStyle()}
            />
          </Field>
        </div>

        <Field label="발급 협회">
          <input
            type="text"
            required
            maxLength={100}
            value={form.issuer}
            onChange={(e) => setForm({ ...form, issuer: e.target.value })}
            className="w-full px-3 py-2 text-sm"
            style={inputStyle()}
          />
        </Field>

        <Field label="자격번호 (선택)">
          <input
            type="text"
            maxLength={50}
            value={form.cert_number}
            onChange={(e) => setForm({ ...form, cert_number: e.target.value })}
            className="w-full px-3 py-2 text-sm"
            style={inputStyle()}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="발급일">
            <input
              type="date"
              required
              value={form.issued_at}
              onChange={(e) =>
                setForm({ ...form, issued_at: e.target.value })
              }
              className="w-full px-3 py-2 text-sm"
              style={inputStyle()}
            />
          </Field>
          <Field label="만료일 (선택)">
            <input
              type="date"
              value={form.expires_at}
              onChange={(e) =>
                setForm({ ...form, expires_at: e.target.value })
              }
              className="w-full px-3 py-2 text-sm"
              style={inputStyle()}
            />
          </Field>
        </div>

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

        {/* 액션 버튼 (수정 + 삭제 분리) */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase tracking-wider"
            style={{
              color: "var(--color-primary)",
              border: "1px solid var(--color-primary)",
              borderRadius: 4,
              opacity: submitting ? 0.6 : 1,
            }}
          >
            <span className="material-symbols-outlined text-base">delete</span>
            삭제
          </button>
          <div className="flex gap-2">
            <Link
              href="/referee/certificates"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider"
              style={{
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            >
              취소
            </Link>
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
              {submitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </form>
    </div>
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

function inputStyle(): React.CSSProperties {
  return {
    backgroundColor: "var(--color-surface)",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
    borderRadius: 4,
  };
}
