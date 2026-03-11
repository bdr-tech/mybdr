"use client";

import { GameWizard, type Permissions } from "./_components/game-wizard";

/**
 * NewGameForm — 위자드 기반 경기 만들기 폼.
 * 기존 단일 폼을 4스텝 위자드로 교체.
 * page.tsx에서 permissions prop을 전달받아 사용.
 */
export function NewGameForm({ permissions }: { permissions: Permissions }) {
  return <GameWizard permissions={permissions} />;
}
