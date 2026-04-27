"use client";

/* ============================================================
 * NewGameForm — BDR v2 경기 만들기 폼 엔트리
 *
 * 왜 단일 폼으로 교체했는가:
 * 시안(CreateGame.jsx)이 3카드 단일 폼이라 위자드(4스텝)를
 * _v2/game-form.tsx(GameFormV2)로 교체.
 * 위자드 전용 파일들(game-wizard, step-type/when-where/settings/confirm,
 * wizard-progress)은 삭제하지 않고 import만 끊음 — 자료로 보존.
 * ============================================================ */

import { GameFormV2, type Permissions } from "./_v2/game-form";

export function NewGameForm({ permissions }: { permissions: Permissions }) {
  return <GameFormV2 permissions={permissions} />;
}
