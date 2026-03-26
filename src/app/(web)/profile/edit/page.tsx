"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// lucide-react 제거 → Material Symbols Outlined 사용
import { BANKS } from "@/lib/constants/banks";
import { RegionPicker, type Region } from "@/components/shared/region-picker";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

interface ProfileEditData {
  name: string | null;
  nickname: string | null;
  birth_date: string | null;
  phone: string | null;
  city: string | null;
  district: string | null;
  position: string | null;
  height: number | null;
  weight: number | null;
  bio: string | null;
  bank_name: string | null;
  bank_code: string | null;
  account_number_masked: string | null;
  account_holder: string | null;
  has_account: boolean;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    nickname: "",
    birth_date: "",
    phone: "",
    position: "",
    height: "",
    weight: "",
    bio: "",
  });
  const [regions, setRegions] = useState<Region[]>([{ city: "", district: "" }]);

  const [bankForm, setBankForm] = useState({
    bank_name: "",
    bank_code: "",
    account_number: "",
    account_holder: "",
    account_consent: false,
  });
  const [maskedAccount, setMaskedAccount] = useState<string | null>(null);
  const [hasExistingAccount, setHasExistingAccount] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);

  useEffect(() => {
    fetch("/api/web/profile")
      .then((r) => r.json())
      .then((data: { user?: ProfileEditData; error?: string }) => {
        if (data.error || !data.user) {
          router.push("/login");
          return;
        }
        const u = data.user;
        setForm({
          name: u.name ?? "",
          nickname: u.nickname ?? "",
          birth_date: u.birth_date ?? "",
          phone: u.phone ?? "",
          position: u.position ?? "",
          height: u.height?.toString() ?? "",
          weight: u.weight?.toString() ?? "",
          bio: u.bio ?? "",
        });
        // city/district 콤마 구분 → Region[]으로 변환
        const cities = (u.city ?? "").split(",").filter(Boolean);
        const districts = (u.district ?? "").split(",").filter(Boolean);
        if (cities.length > 0) {
          setRegions(cities.map((c, i) => ({ city: c, district: districts[i] ?? "" })));
        }
        setBankForm((prev) => ({
          ...prev,
          bank_name: u.bank_name ?? "",
          bank_code: u.bank_code ?? "",
          account_holder: u.account_holder ?? "",
        }));
        setMaskedAccount(u.account_number_masked);
        setHasExistingAccount(u.has_account);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const togglePosition = (pos: string) => {
    setForm((p) => {
      const selected = p.position ? p.position.split(",") : [];
      const idx = selected.indexOf(pos);
      if (idx >= 0) {
        selected.splice(idx, 1);
      } else {
        selected.push(pos);
      }
      return { ...p, position: selected.join(",") };
    });
  };

  const selectedPositions = form.position ? form.position.split(",") : [];

  const handleGenerateBio = async () => {
    setGeneratingBio(true);
    try {
      const res = await fetch("/api/web/profile/generate-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      const bio = data.bio ?? data.data?.bio;
      if (bio) setForm((p) => ({ ...p, bio }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI 자기소개 생성에 실패했습니다.");
    } finally {
      setGeneratingBio(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const filledRegions = regions.filter((r) => r.city);
      const payload: Record<string, unknown> = {
        name: form.name || null,
        nickname: form.nickname || null,
        birth_date: form.birth_date || null,
        phone: form.phone || null,
        city: filledRegions.map((r) => r.city).join(",") || null,
        district: filledRegions.map((r) => r.district).join(",") || null,
        position: form.position || null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        bio: form.bio || null,
      };

      if (bankForm.account_consent) {
        payload.account_consent = true;
        payload.bank_name = bankForm.bank_name || null;
        payload.bank_code = bankForm.bank_code || null;
        payload.account_holder = bankForm.account_holder || null;
        if (bankForm.account_number) {
          payload.account_number = bankForm.account_number;
        }
      }

      const res = await fetch("/api/web/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setSuccessMsg("저장되었습니다.");
      setTimeout(() => router.push("/profile"), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  /* 입력필드/라벨/섹션 공통 스타일 - CSS 변수로 다크모드 자동 대응 */
  const inp =
    "w-full rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 text-sm";
  const lbl = "mb-1 block text-sm text-[var(--color-text-muted)]";
  const section = "mb-6 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-card)] p-5";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[var(--color-text-muted)]">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/profile" className="rounded-[10px] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-bright)]">
          ←
        </Link>
        <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>프로필 수정</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-[12px] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[var(--color-error,#EF4444)]">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-[12px] bg-[rgba(0,102,255,0.1)] px-4 py-3 text-sm text-[var(--color-accent)]">{successMsg}</div>
      )}

      {/* 기본 정보 */}
      <div className={section}>
        <h2 className="mb-4 font-semibold uppercase tracking-wide text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>기본 정보</h2>
        <div className="space-y-4">
          <div>
            <label className={lbl}>이름 (실명)</label>
            <input
              className={inp}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="홍길동"
            />
          </div>
          <div>
            <label className={lbl}>닉네임</label>
            <input
              className={inp}
              value={form.nickname}
              onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))}
              placeholder="표시될 이름"
            />
          </div>
          <div>
            <label className={lbl}>생년월일</label>
            <input
              type="date"
              className={inp}
              value={form.birth_date}
              onChange={(e) => setForm((p) => ({ ...p, birth_date: e.target.value }))}
            />
          </div>
          <div>
            <label className={lbl}>전화번호</label>
            <input
              type="tel"
              inputMode="numeric"
              className={inp}
              value={form.phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                let formatted = digits;
                if (digits.length > 7) formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
                else if (digits.length > 3) formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
                setForm((p) => ({ ...p, phone: formatted }));
              }}
              placeholder="01012345678"
            />
          </div>
          <RegionPicker value={regions} onChange={setRegions} max={3} />
        </div>
      </div>

      {/* 경기 정보 */}
      <div className={section}>
        <h2 className="mb-4 font-semibold uppercase tracking-wide text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>경기 정보</h2>
        <div className="space-y-4">
          <div>
            <label className={lbl}>포지션 <span className="text-xs text-[var(--color-text-secondary)]">(복수 선택 가능)</span></label>
            <div className="flex gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => togglePosition(pos)}
                  className={`flex-1 rounded-full border py-2 text-sm font-medium transition-colors ${
                    selectedPositions.includes(pos)
                      ? "border-[var(--color-accent)] bg-[rgba(27,60,135,0.12)] text-[var(--color-accent)]"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]"
                  }`}
                  style={{ borderRadius: "10px" }}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>키 (cm)</label>
              <input
                type="number"
                className={inp}
                value={form.height}
                onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))}
                placeholder="예: 180"
                min={100}
                max={250}
              />
            </div>
            <div>
              <label className={lbl}>몸무게 (kg)</label>
              <input
                type="number"
                className={inp}
                value={form.weight}
                onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
                placeholder="예: 75"
                min={30}
                max={200}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm text-[var(--color-text-muted)]">자기소개</label>
              <button
                type="button"
                onClick={handleGenerateBio}
                disabled={generatingBio}
                className="flex items-center gap-1 rounded-[10px] border border-[#7C3AED]/30 px-2.5 py-1.5 text-xs font-medium text-[#7C3AED] transition-colors hover:bg-[#7C3AED]/10 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-xs ${generatingBio ? "animate-spin" : ""}`}>auto_awesome</span>
                {generatingBio ? "생성 중..." : "AI 자동 작성"}
              </button>
            </div>
            <textarea
              className={inp}
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="간단한 자기소개 (최대 255자)"
              maxLength={255}
            />
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {form.bio.length}/255자 · AI가 내 활동 데이터를 기반으로 작성해줍니다
            </p>
          </div>
        </div>
      </div>

      {/* 환불 계좌 정보 */}
      <div className={section}>
        <h2 className="mb-1 font-semibold uppercase tracking-wide text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>환불 계좌 정보</h2>
        <p className="mb-4 text-xs text-[var(--color-text-secondary)]">참가비·게스트비·픽업비 환불 시 사용됩니다</p>

        {hasExistingAccount && !bankForm.account_consent && (
          <div className="mb-4 rounded-[12px] bg-[var(--color-surface-bright)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
            현재 등록된 계좌: <span className="font-medium text-[var(--color-text-primary)]">{maskedAccount}</span>
            <button
              type="button"
              onClick={() => setBankForm((p) => ({ ...p, account_consent: true }))}
              className="ml-2 text-xs text-[var(--color-accent)] underline"
            >
              변경하기
            </button>
          </div>
        )}

        <label className="mb-4 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={bankForm.account_consent}
            onChange={(e) => setBankForm((p) => ({ ...p, account_consent: e.target.checked }))}
            className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
          />
          <span className="text-sm text-[var(--color-text-primary)]">
            개인정보(계좌번호) 수집·이용에 동의합니다 <span className="text-[var(--color-error)]">(필수)</span>
          </span>
        </label>

        {bankForm.account_consent && (
          <div className="space-y-4">
            <div>
              <label className={lbl}>은행</label>
              <select
                className={inp}
                value={bankForm.bank_code}
                onChange={(e) => {
                  const selected = BANKS.find((b) => b.value === e.target.value);
                  setBankForm((p) => ({
                    ...p,
                    bank_code: e.target.value,
                    bank_name: selected?.label ?? "",
                  }));
                }}
              >
                <option value="">은행 선택</option>
                {BANKS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>계좌번호</label>
              <input
                className={inp}
                value={bankForm.account_number}
                onChange={(e) => setBankForm((p) => ({ ...p, account_number: e.target.value }))}
                placeholder={maskedAccount ?? "계좌번호 입력 (숫자만)"}
                inputMode="numeric"
              />
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">계좌번호는 암호화되어 저장됩니다</p>
            </div>
            <div>
              <label className={lbl}>예금주명</label>
              <input
                className={inp}
                value={bankForm.account_holder}
                onChange={(e) => setBankForm((p) => ({ ...p, account_holder: e.target.value }))}
                placeholder="예금주 이름"
                maxLength={20}
              />
            </div>
          </div>
        )}
      </div>

      {/* 선호 설정 안내 카드 - 별도 페이지로 이동하는 링크 */}
      <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2
          className="mb-1 font-semibold uppercase tracking-wide text-[var(--color-text-primary)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          맞춤 설정
        </h2>
        <p className="mb-4 text-xs text-[var(--color-text-secondary)]">
          관심 종별, 경기 유형, 게시판을 설정하면 맞춤 콘텐츠를 받아볼 수 있습니다
        </p>
        <Link
          href="/profile/preferences"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover,#142D6B)]"
        >
          <span className="material-symbols-outlined text-base">auto_awesome</span>
          맞춤 설정 관리
        </Link>
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-[10px] bg-[var(--color-accent)] py-4 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover,#142D6B)] disabled:opacity-60"
      >
        {saving ? "저장 중..." : "저장"}
      </button>

      <div className="h-6" />
    </div>
  );
}
