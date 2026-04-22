"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Breadcrumb } from "@/components/shared/breadcrumb";

/**
 * GameEditPage — 경기 수정 페이지
 * - GET /api/web/games/[uuid] 로 기존 데이터 로드
 * - PATCH /api/web/games/[uuid] 로 수정 반영
 * - 호스트가 아니면 403 → 경기 상세로 리다이렉트
 */

// 경기 데이터 타입 (API 응답 기반)
interface GameData {
  id: string;
  uuid: string;
  title: string | null;
  description: string | null;
  game_type: number;
  status: number;
  city: string | null;
  district: string | null;
  venue_name: string | null;
  venue_address: string | null;
  scheduled_at: string | null;
  duration_hours: number | null;
  max_participants: number | null;
  min_participants: number | null;
  fee_per_person: number | null;
  skill_level: string | null;
  requirements: string | null;
  notes: string | null;
  contact_phone: string | null;
  organizer_id: string;
}

// 실력 수준 옵션
const SKILL_OPTIONS = [
  { value: "all", label: "모든 수준" },
  { value: "beginner", label: "초급" },
  { value: "intermediate", label: "중급" },
  { value: "advanced", label: "상급" },
];

export default function GameEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // 폼 상태
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 수정 가능한 필드 상태
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationHours, setDurationHours] = useState(2);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [minParticipants, setMinParticipants] = useState(4);
  const [feePerPerson, setFeePerPerson] = useState(0);
  const [skillLevel, setSkillLevel] = useState("all");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [requirements, setRequirements] = useState("");
  const [notes, setNotes] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // 기존 데이터 로드
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/web/games/${id}`);
        if (res.status === 404) {
          setError("존재하지 않는 경기입니다.");
          return;
        }
        if (!res.ok) throw new Error();
        const json = await res.json();
        const data: GameData = json.data;
        setGame(data);

        // 폼 초기값 설정
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        // ISO 날짜를 datetime-local 형식으로 변환
        if (data.scheduled_at) {
          const d = new Date(data.scheduled_at);
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
          setScheduledAt(local.toISOString().slice(0, 16));
        }
        setDurationHours(data.duration_hours ?? 2);
        setMaxParticipants(data.max_participants ?? 10);
        setMinParticipants(data.min_participants ?? 4);
        setFeePerPerson(data.fee_per_person ?? 0);
        setSkillLevel(data.skill_level ?? "all");
        setVenueName(data.venue_name ?? "");
        setVenueAddress(data.venue_address ?? "");
        setRequirements(data.requirements ?? "");
        setNotes(data.notes ?? "");
        setContactPhone(data.contact_phone ?? "");
      } catch {
        setError("경기 정보를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // 수정 제출 핸들러
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!game) return;

    // 제목 필수 검증
    if (title.trim().length < 2) {
      alert("제목은 2자 이상 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/web/games/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          // datetime-local 값을 ISO 형식으로 변환
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          duration_hours: durationHours,
          max_participants: maxParticipants,
          min_participants: minParticipants,
          fee_per_person: feePerPerson,
          skill_level: skillLevel,
          venue_name: venueName.trim() || null,
          venue_address: venueAddress.trim() || null,
          requirements: requirements.trim() || null,
          notes: notes.trim() || null,
          contact_phone: contactPhone.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? "수정 중 오류가 발생했습니다.");
        return;
      }
      // 수정 성공 → 상세 페이지로 이동
      router.push(`/games/${id}`);
      router.refresh();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[var(--color-text-muted)]">
        불러오는 중...
      </div>
    );
  }

  // 에러 상태
  if (error || !game) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-[var(--color-error)]">{error ?? "경기를 찾을 수 없습니다."}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-[var(--color-primary)] underline"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 브레드크럼 */}
      <Breadcrumb
        items={[
          { label: "경기", href: "/games" },
          { label: game.title ?? "경기", href: `/games/${id}` },
          { label: "수정" },
        ]}
      />

      <h1
        className="text-2xl font-bold text-[var(--color-text-primary)]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        경기 수정
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 카드 */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
            <span className="material-symbols-outlined mr-1.5 align-middle text-base">info</span>
            기본 정보
          </h2>
          <div className="space-y-4">
            {/* 제목 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                경기 제목 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            {/* 설명 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
        </Card>

        {/* 일정 + 장소 카드 */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
            <span className="material-symbols-outlined mr-1.5 align-middle text-base">schedule</span>
            일정 및 장소
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* 경기 일시 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                경기 일시
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            {/* 경기 시간 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                경기 시간 (시간)
              </label>
              <input
                type="number"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                min={1}
                max={12}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            {/* 장소명 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                장소명
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            {/* 장소 주소 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                장소 주소
              </label>
              <input
                type="text"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
        </Card>

        {/* 참가 조건 카드 */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
            <span className="material-symbols-outlined mr-1.5 align-middle text-base">group</span>
            참가 조건
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* 최대 인원 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                최대 인원
              </label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                min={2}
                max={50}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            {/* 최소 인원 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                최소 인원
              </label>
              <input
                type="number"
                value={minParticipants}
                onChange={(e) => setMinParticipants(Number(e.target.value))}
                min={1}
                max={50}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            {/* 참가비 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                참가비 (원)
              </label>
              <input
                type="number"
                value={feePerPerson}
                onChange={(e) => setFeePerPerson(Number(e.target.value))}
                min={0}
                step={1000}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            {/* 실력 수준 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                실력 수준
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              >
                {SKILL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* 참가 조건 텍스트 */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              참가 조건 (선택)
            </label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={2}
              placeholder="예: 실내화 필수, 유니폼 지참"
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </Card>

        {/* 추가 정보 카드 */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
            <span className="material-symbols-outlined mr-1.5 align-middle text-base">more_horiz</span>
            추가 정보
          </h2>
          <div className="space-y-4">
            {/* 비고 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                비고
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            {/* 연락처 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                연락처
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
        </Card>

        {/* 하단 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-elevated)]"
          >
            취소
          </button>
          <Button
            type="submit"
            disabled={saving}
            className="flex-1"
          >
            {saving ? "저장 중..." : "수정 완료"}
          </Button>
        </div>
      </form>
    </div>
  );
}
