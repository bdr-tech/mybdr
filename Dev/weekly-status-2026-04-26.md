# MyBDR 주간 진행률 점검 — 2026-04-26 (일)

> 점검 범위: 2026-04-19 ~ 2026-04-26 (지난 7일)
> 이전 리포트: `Dev/weekly-status-2026-04-23.md` (미커밋 untracked 상태)

## 0. 한 문장 요약
원래 UX 22개 작업과 카페 sync Phase 1~3은 04-23 시점에 이미 완료됐고, 지난 한 주는 **`design_v2` 브랜치에서 v2 시안 기반의 전면 UI 재구성(Phase 0~5)과 코트 대관(Booking) Phase A** 가 메인 워크스트림이었습니다.

## 1. UX 워크스트림 (원래 4주 플랜)
- **이번 주 완료**: 사실상 별도 추가 작업 없음. W2(M1·M2)·W3(M3·M5·M6)·W4(M4·M7·L1) 산출물은 04-22~04-23 시점에 이미 작업 트리에 반영돼 있었음 (`profile/activity`·`profile/billing`·`registration-sticky-card`·`more-tab-tooltip`·`notification-badge`·`teams/[id]/my-application`·`help/glossary` 모두 존재). 지난 보고서대로 **22개 작업 모두 완결**.
- **진행 중**: 원래 플랜 기준으로는 없음. 다만 **design_v2 재구성**이 위 기능들을 모두 v2 시안에 맞춰 다시 그리고 있음 (아래 별도 워크스트림 참조).
- **다음 주 예정**: 플랜 캘린더상 W2 시작이지만 이미 종결 → 사실상 design_v2 후속 + L2/L3 시안 후속.
- **지연/차단**: 04-23 보고서의 "수빈 재확인 5건"이 아직 처리 기록 없음 (추정 — 미확인 표시).

## 2. 카페 sync 워크스트림
- **이번 주 완료**: 운영 안정화 단계. 지난 7일에 신규 커밋 4건만 발생.
  - `1e26df3`/`11a6a3d` 쿠키 자동화 개선 #1+#3 (PR #56 머지)
  - `ac7f726` Cowork 자동 쿠키 갱신용 `cafe-login.ts` 리팩토링 + 가이드
  - `d67461c` Cowork 자동화 폐기 + **수동 일일 루틴 가이드 확정** (방향 전환)
  - `70dbc6d` 쿠키 자동 갱신 조사 결과 + 열린 결정 기록
- **다음 주 예정**: 누적 수집 건수·실패율 모니터링. 신규 untracked 3종(`scripts/refresh-cafe-daily.{README.md,bat,task.xml`}) — 윈도우 작업 스케줄러용 일일 쿠키 갱신 자동화로 보임. **커밋되지 않은 상태**, 운영 가이드 마무리 + 푸시 필요.
- **지연/차단**: 없음. Cowork 자동 쿠키 갱신은 폐기 결정으로 마무리됨. 운영 지표는 앞으로 1~2주 누적 후 첫 평가 가능.
- **참고**: `vercel.json`에 cafe-sync cron 미등록 (확인됨) — 기존대로 GH Actions 단일 운영 유지 중.

## 3. 새 워크스트림 — design_v2 (시안 기반 UI 전면 재구성)
이번 주의 **실질적 메인 작업**. 04-22~04-25 사이에 Phase 0~5 까지 일사천리로 진행, 약 30+ 커밋.

- Phase 0 — 기반 디자인 시스템 전면 교체 (`0e7e95b`)
- Phase 1 — Home·Games·GameDetail·Profile (커밋 8건)
- Phase 2 — MyGames·Notifications·Search·CreateGame·Match 목록/상세·GameResult (7건)
- Phase 3 — Teams·TeamCreate·Court 목록/상세·Orgs 목록/상세·Bracket (8건). TeamInvite 는 보류 결정 기록.
- **Phase 3 외 별건**: `442158d` 코트 대관(Booking) Phase A — MVP 무료 베타 (16파일 신규/수정, DB 마이그레이션 보류 상태)
- Phase 4 — Community 목록/상세/작성 (3건). Messages 는 DM 인프라 부재로 보류 결정.
- Phase 5 — Rank·Settings·More·Achievements·Awards·Saved·Reviews (7건). 04-25 새벽까지 진행되어 **Phase 5 종료 (`e895483`)**.

DB 미지원 항목은 일관되게 "준비 중" 표시 + scratchpad "추후 구현 목록"에 누적됨. 사용자 04-25 원칙("페이지 제거 금지") 준수.

## 4. 미푸시 또는 미완료 작업
- **현재 브랜치 `design_v2`** — `subin` 아님. 04-23 시점까지는 subin 위주였지만, 이번 주 모든 design_v2 커밋이 별도 브랜치로 들어감. **CLAUDE.md "subin = 수빈 개인" 원칙 이탈 여부 확인 필요** (의도적 분리인지, 단순 브랜치 전환인지).
- `git status` 결과 modified 파일 매우 많음 (대부분 추정 CRLF↔LF 줄끝 노이즈, 04-23 보고서와 동일 패턴) — 푸시 의미 없음.
- **Untracked 5건 — 푸시 검토 필요**:
  - `Dev/weekly-status-2026-04-23.md` (지난 보고서, 커밋 누락)
  - `Dev/design/BDR v2/` (시안 폴더, 추정 figma 익스포트)
  - `scripts/refresh-cafe-daily.{README.md, bat, task.xml}` (윈도우 일일 쿠키 갱신 스케줄러 산출물)
- design_v2 가 origin/design_v2 와 up-to-date — 즉 미푸시 커밋은 없으나, **dev/main 으로의 머지 흐름이 아직 시작 안 됨**.

## 5. PR 현황
- 이번 주 새로 머지된 PR: **PR #56** (`11a6a3d` 카페 sync 쿠키 자동화 개선) — subin → dev 머지 흐름.
- 새로 열린 PR: 없음 (추정, `gh` CLI 미설치로 직접 조회 불가).
- design_v2 브랜치 → dev PR: **아직 미생성**. Phase 0~5 가 한 PR로 묶일지, 단계별로 쪼갤지 결정 필요.

## 6. knowledge 갱신 점검
지난 7일간 갱신: **6건 이상** (04-25: 3건 / 04-22: 3건 / 04-21: 3건).
- architecture: 코트 대관 시스템 설계 (04-25)
- decisions: 코트 대관 court_managers N:M 보류, payments.payable_type 재활용 (04-25), 세션 역할 재정의 (04-22)
- conventions: Tailwind v4 color-mix 문법, any 예외 규칙 (04-22)
- lessons: 영역 단위 정비 (04-22)
- index.md 최종 갱신: 2026-04-25

→ **갱신 빈도 양호**. design_v2 Phase 0~5 자체에 대한 architecture/decisions 항목은 아직 미정리 상태로 보임 — 다음 주 정리 권장.

## 7. 다음 주 우선순위 추천 1~3개

1. **design_v2 → dev 머지 전략 결정 + PR 분할** (1~2시간, 가장 시급)
   - 사유: 5개 Phase × 30+ 커밋이 단일 브랜치에 쌓여 있고 origin 에는 푸시되었지만 dev/main 통합이 안 됨. 분할 PR 일정을 안 잡으면 머지 충돌·롤백 비용이 누적됨. design_v2 의 architecture/decisions knowledge 정리도 PR 작성 과정에서 함께.

2. **수빈 재확인 5건 + design_v2 시각 스모크** (1~2시간)
   - 사유: 04-23 보고서의 미처리 5건 + design_v2 30+ 페이지의 PC/Mobile/Light/Dark 4조합 점검. 04-22 자동화 60/60 PASS는 **v1 시점** 산출물이라 v2 재구성 후 재실행 필요. 머지 전 마지막 게이트.

3. **운영 환경 정리: 운영 DB 분리 옵션 A 합의 + design_v2 배포 전략 + 일일 쿠키 갱신 푸시** (30분 미팅 + 30분 작업)
   - 사유: 운영 DB 분리는 04-18 사고 이후 미해결. design_v2 가 main 까지 가기 전에 환경 분리가 안전. 윈도우 일일 쿠키 갱신 산출물(`refresh-cafe-daily.*`)도 untracked 상태라 다른 머신에서 못 씀 — 가이드 마무리 후 커밋 필요.

## 8. 수빈에게 던지는 질문
- design_v2 가 별도 장기 브랜치로 운영될 계획인지, 곧 dev/main 으로 통합 예정인지 — 그에 따라 다음 주 작업 흐름이 크게 달라집니다.
- 코트 대관 Phase A SQL 마이그레이션(`prisma/migrations/manual/court_booking_phase_a.sql`)이 보류 상태로 머물러 있는데, 운영 DB 분리 합의를 기다리는 건지 별도 일정이 있는 건지 — 이 결정이 Phase B(결제) 진입 시점을 좌우합니다.
- 04-23 보고서에 있던 "재확인 5건" 진행 여부 (자동화 커버 불가 케이스) — 지난 주 design_v2 작업으로 쓸려나갔는지, 아직 큐에 남아 있는지 확인 필요합니다.
