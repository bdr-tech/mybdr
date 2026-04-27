// Phase 3 TeamCreate v2 — 시안 4스텝 멀티스텝 폼으로 교체
// 이유:
//  - 기존 단일 카드 폼을 시안의 stepper 기반 4스텝(기본정보/엠블럼/활동/검토)으로 전환
//  - 서버 액션(createTeamAction) / Zod 스키마 / Prisma 는 변경 없음 — UI 만 교체
//  - B 옵션(영문 팀명 보존): Step1 의 보조 입력으로 살아 있음 (기존 기능 100% 보존)
//  - 본 파일은 호환을 위한 얇은 wrapper. page.tsx 변경 없음.

import { TeamFormV2 } from "./_v2/team-form";

export function NewTeamForm() {
  return <TeamFormV2 />;
}
