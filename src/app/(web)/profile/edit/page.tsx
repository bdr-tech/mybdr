"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BANKS } from "@/lib/constants/banks";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

const CITIES = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

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
    city: "",
    district: "",
    position: "",
    height: "",
    weight: "",
    bio: "",
  });

  const [bankForm, setBankForm] = useState({
    bank_name: "",
    bank_code: "",
    account_number: "",
    account_holder: "",
    account_consent: false,
  });
  const [maskedAccount, setMaskedAccount] = useState<string | null>(null);
  const [hasExistingAccount, setHasExistingAccount] = useState(false);

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
          city: u.city ?? "",
          district: u.district ?? "",
          position: u.position ?? "",
          height: u.height?.toString() ?? "",
          weight: u.weight?.toString() ?? "",
          bio: u.bio ?? "",
        });
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

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const payload: Record<string, unknown> = {
        name: form.name || null,
        nickname: form.nickname || null,
        birth_date: form.birth_date || null,
        phone: form.phone || null,
        city: form.city || null,
        district: form.district || null,
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

  const inp =
    "w-full rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#0066FF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 text-sm";
  const lbl = "mb-1 block text-sm text-[#6B7280]";
  const section = "mb-6 rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-5";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#6B7280]">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/profile" className="rounded-full p-2 text-[#6B7280] hover:bg-[#EEF2FF]">
          ←
        </Link>
        <h1 className="text-xl font-bold">프로필 수정</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-[12px] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[#EF4444]">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-[12px] bg-[rgba(0,102,255,0.1)] px-4 py-3 text-sm text-[#0066FF]">{successMsg}</div>
      )}

      {/* 기본 정보 */}
      <div className={section}>
        <h2 className="mb-4 font-semibold text-[#111827]">기본 정보</h2>
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
              className={inp}
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="010-0000-0000"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>활동 지역</label>
              <select
                className={inp}
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              >
                <option value="">시/도 선택</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>세부 지역</label>
              <input
                className={inp}
                value={form.district}
                onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
                placeholder="구/군 (선택)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 경기 정보 */}
      <div className={section}>
        <h2 className="mb-4 font-semibold text-[#111827]">경기 정보</h2>
        <div className="space-y-4">
          <div>
            <label className={lbl}>포지션</label>
            <div className="flex gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, position: p.position === pos ? "" : pos }))}
                  className={`flex-1 rounded-full border py-2 text-sm font-medium transition-colors ${
                    form.position === pos
                      ? "border-[#0066FF] bg-[rgba(0,102,255,0.12)] text-[#0066FF]"
                      : "border-[#E8ECF0] text-[#6B7280] hover:border-[#0066FF]"
                  }`}
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
            <label className={lbl}>자기소개</label>
            <textarea
              className={inp}
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="간단한 자기소개 (최대 255자)"
              maxLength={255}
            />
          </div>
        </div>
      </div>

      {/* 환불 계좌 정보 */}
      <div className={section}>
        <h2 className="mb-1 font-semibold text-[#111827]">환불 계좌 정보</h2>
        <p className="mb-4 text-xs text-[#9CA3AF]">참가비·게스트비·픽업비 환불 시 사용됩니다</p>

        {hasExistingAccount && !bankForm.account_consent && (
          <div className="mb-4 rounded-[12px] bg-[#EEF2FF] px-4 py-3 text-sm text-[#6B7280]">
            현재 등록된 계좌: <span className="font-medium text-[#111827]">{maskedAccount}</span>
            <button
              type="button"
              onClick={() => setBankForm((p) => ({ ...p, account_consent: true }))}
              className="ml-2 text-xs text-[#0066FF] underline"
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
            className="mt-0.5 h-4 w-4 rounded border-[#E8ECF0] accent-[#0066FF]"
          />
          <span className="text-sm text-[#374151]">
            개인정보(계좌번호) 수집·이용에 동의합니다 <span className="text-[#EF4444]">(필수)</span>
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
              <p className="mt-1 text-xs text-[#9CA3AF]">계좌번호는 암호화되어 저장됩니다</p>
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

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-full bg-[#0066FF] py-4 text-sm font-semibold text-white hover:bg-[#0052CC] disabled:opacity-60"
      >
        {saving ? "저장 중..." : "저장"}
      </button>

      <div className="h-6" />
    </div>
  );
}
