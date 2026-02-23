"use client";

import { useActionState, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createGameAction } from "@/app/actions/games";

const inputCls =
  "w-full rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50";
const labelCls = "mb-1 block text-sm text-[#6B7280]";

const GAME_TYPES = [
  { value: "0", label: "픽업", emoji: "🏀", desc: "자유로운 픽업 게임" },
  { value: "1", label: "용병 모집", emoji: "🤝", desc: "팀에 합류할 용병 모집" },
  { value: "2", label: "팀 대결", emoji: "⚔️", desc: "팀 간의 정식 대결" },
];

const SKILL_LEVELS = [
  { value: "all", label: "전체" },
  { value: "beginner", label: "초급" },
  { value: "intermediate", label: "중급" },
  { value: "intermediate_advanced", label: "중고급" },
  { value: "advanced", label: "고급" },
];

const RECURRENCE_RULES = [
  { value: "weekly", label: "매주" },
  { value: "biweekly", label: "2주마다" },
  { value: "monthly", label: "매월" },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative h-6 w-12 flex-shrink-0 rounded-full transition-colors ${
        enabled ? "bg-[#0066FF]" : "bg-[#94A3B8]"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
          enabled ? "left-7" : "left-1"
        }`}
      />
    </button>
  );
}

export default function NewGamePage() {
  const [state, formAction, pending] = useActionState(createGameAction, null);

  const [gameType, setGameType] = useState("0");
  const [allowGuests, setAllowGuests] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">경기 만들기</h1>

      {state?.error && (
        <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-8">
        {/* Hidden inputs for toggle state */}
        <input type="hidden" name="game_type" value={gameType} />
        <input type="hidden" name="allow_guests" value={allowGuests.toString()} />
        <input type="hidden" name="is_recurring" value={isRecurring.toString()} />

        {/* ── Section 1: 경기 유형 ── */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold">
            경기 유형 <span className="text-[#F4A261]">*</span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {GAME_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setGameType(type.value)}
                className={`flex flex-col items-center gap-2 rounded-[16px] border-2 p-4 transition-all ${
                  gameType === type.value
                    ? "border-[#0066FF] bg-[#0066FF]/10"
                    : "border-[#CBD5E1] bg-[#FAFAFA] hover:border-[#0066FF]/50"
                }`}
              >
                <span className="text-3xl">{type.emoji}</span>
                <span className="text-sm font-medium">{type.label}</span>
                <span className="text-center text-xs text-[#6B7280]">{type.desc}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* ── Section 2: 기본 정보 ── */}
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">기본 정보</h2>
          <div>
            <label className={labelCls}>
              경기 제목 <span className="text-[#F4A261]">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              className={inputCls}
              placeholder="예: 토요일 오후 픽업 경기"
            />
          </div>
          <div>
            <label className={labelCls}>설명</label>
            <textarea
              name="description"
              rows={3}
              className={inputCls}
              placeholder="경기 상세 설명"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>
                일시 <span className="text-[#F4A261]">*</span>
              </label>
              <input
                name="scheduled_at"
                type="datetime-local"
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>경기 시간</label>
              <select name="duration_hours" className={inputCls} defaultValue="2">
                {[1, 2, 3, 4, 5].map((h) => (
                  <option key={h} value={h}>
                    {h}시간
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* ── Section 3: 장소 ── */}
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">장소</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>시/도</label>
              <input
                name="city"
                type="text"
                className={inputCls}
                placeholder="예: 서울"
              />
            </div>
            <div>
              <label className={labelCls}>구/동</label>
              <input
                name="district"
                type="text"
                className={inputCls}
                placeholder="예: 강남구"
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>장소명</label>
            <input
              name="venue_name"
              type="text"
              className={inputCls}
              placeholder="예: 잠실 실내 체육관"
            />
          </div>
          <div>
            <label className={labelCls}>상세 주소</label>
            <input
              name="venue_address"
              type="text"
              className={inputCls}
              placeholder="예: 서울시 강남구 역삼로 123"
            />
          </div>
        </Card>

        {/* ── Section 4: 참가 설정 ── */}
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">참가 설정</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>최대 인원</label>
              <input
                name="max_participants"
                type="number"
                defaultValue={10}
                min={2}
                max={100}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>최소 인원</label>
              <input
                name="min_participants"
                type="number"
                defaultValue={4}
                min={2}
                max={100}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>참가비 (원)</label>
              <input
                name="fee_per_person"
                type="number"
                defaultValue={0}
                min={0}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>기술 수준</label>
              <select name="skill_level" className={inputCls} defaultValue="all">
                {SKILL_LEVELS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-[16px] bg-[#E8ECF0] px-4 py-3">
            <div>
              <p className="font-medium">게스트 허용</p>
              <p className="text-xs text-[#6B7280]">팀에 속하지 않은 개인 참가 허용</p>
            </div>
            <Toggle enabled={allowGuests} onToggle={() => setAllowGuests(!allowGuests)} />
          </div>
          <div>
            <label className={labelCls}>참가 조건</label>
            <textarea
              name="requirements"
              rows={3}
              className={inputCls}
              placeholder="예: 남성만, 3점슈터 우대 등"
            />
          </div>
        </Card>

        {/* ── Section 5: 유니폼 & 추가 설정 ── */}
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">유니폼 & 추가 설정</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>홈 유니폼 색상</label>
              <div className="flex items-center gap-3 rounded-[16px] bg-[#E8ECF0] px-4 py-3">
                <input
                  name="uniform_home_color"
                  type="color"
                  defaultValue="#FF0000"
                  className="h-8 w-8 cursor-pointer rounded-full border-none bg-transparent"
                />
                <span className="text-sm text-[#6B7280]">홈팀 색상</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>어웨이 유니폼 색상</label>
              <div className="flex items-center gap-3 rounded-[16px] bg-[#E8ECF0] px-4 py-3">
                <input
                  name="uniform_away_color"
                  type="color"
                  defaultValue="#0000FF"
                  className="h-8 w-8 cursor-pointer rounded-full border-none bg-transparent"
                />
                <span className="text-sm text-[#6B7280]">어웨이팀 색상</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-[16px] bg-[#E8ECF0] px-4 py-3">
            <div>
              <p className="font-medium">반복 경기</p>
              <p className="text-xs text-[#6B7280]">정기적으로 반복되는 경기</p>
            </div>
            <Toggle enabled={isRecurring} onToggle={() => setIsRecurring(!isRecurring)} />
          </div>
          {isRecurring && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>반복 주기</label>
                <select name="recurrence_rule" className={inputCls} defaultValue="weekly">
                  {RECURRENCE_RULES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>총 횟수</label>
                <input
                  name="recurring_count"
                  type="number"
                  defaultValue={4}
                  min={2}
                  max={52}
                  className={inputCls}
                />
              </div>
            </div>
          )}
          <div>
            <label className={labelCls}>비고</label>
            <textarea
              name="notes"
              rows={3}
              className={inputCls}
              placeholder="기타 알아두어야 할 사항"
            />
          </div>
        </Card>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "생성 중..." : "경기 만들기"}
        </Button>
      </form>
    </div>
  );
}
