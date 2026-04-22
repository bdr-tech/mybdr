# MyBDR 주간 진행률 점검 — 2026-04-20 (월) 재점검

> 이전 2026-04-19 리포트 이후 이틀간 작업 폭증으로 전면 갱신 · 범위 2026-04-19 ~ 2026-04-20

## 0. 한 문장 요약
**4주짜리 UX 플랜(W1~W4)과 카페 sync Phase 1~3 대부분이 이틀(4/19~4/20) 만에 마무리됐고**, 남은 건 subin에 쌓인 7커밋의 dev/main 승격과 원영과의 운영 DB 분리 협의 두 건입니다.

## 1. UX 워크스트림 — **W1~W4 전부 완료**

계획 대비 실제 (scratchpad 기준):

| 주차 | 계획 공수 | 실제 공수 | 상태 |
|------|---------|---------|------|
| W1 (Q1~Q12) | 20h | ~12h | ✅ 완료 (PR #45) |
| W2 (M1 + M2) | 10h | ~6h | ✅ 완료 (PR #46) |
| W3 (M3/M5/M6) | 20h | ~7h | ✅ 완료 (PR #47) |
| W4 (M4/M7/L1) | 17h | ~3h | ✅ 완료 (PR #49) |
| 합계 | ~67h | ~28h | **2.4배 절감** |

이번 주 완료 커밋 하이라이트:
- W1: 95fa0da(Q1) / 6619069(Q2) / ddb9388(Q3) / c884ae0(Q4) / ae8e452(Q5·Q6) / 26aaf08(Q7) / 39eb8ee(Q8) / 8efc045(Q9) / 219088e(Q10) / a236634(Q11) + Q12 로그아웃 드롭다운 구분선 포함
- W2: e259d56(M1 Day 7 `/profile` 통합) + 546a5c3(M1 Day 8 설정/결제 허브) + 3405727(M2 sticky 신청 카드)
- W3: 86f1736(M3 코트 지도 폴리시) + 1e7ec68(M5 온보딩 미니멀 카드) + 5e56d0f(M6 6카테고리 알림)
- W4: de2c712(M4 `/profile/activity`) + c2b13c5(M7 팀 가입 3단계) + e5071f0(L1 `/help/glossary`)
- 후속: e6a9169(activity 탭 배지 + 병렬 캐시) + 71b817c(M7 거부 사유) + 642a8be(my-games 중복 제거) + 8dfbafe(manage 색상 5곳 변수화)

추가 보너스 — L3 조기 진입:
- eb9c910 L3 초입 "대회·시리즈 브레드크럼 4단" (`shared/breadcrumb.tsx` 재활용 패턴 확정)
- 1119991 L2/L3 장기 기획서 2종 작성 (`Dev/long-term-plan-L2.md`, `L3.md`)

버그 수습:
- 12f71bf referee 알림 벨/목록 사일런트 버그 (errors.md 6회차)
- 12da3b6 games 상세 DATE/TIME 카드 분리 렌더링

## 2. 카페 sync 워크스트림 — **Phase 1~3 대부분 완료**

Phase 1 ✅:
- 2d0f3e0 POC 3게시판 목록 수집

Phase 2a ✅ (쿠키 갱신 후 재가동):
- 2890224 article-fetcher + mask-personal-info (vitest 19/19)

Phase 2b ✅ Step 1~4 + 품질 보강:
- 6d2617d Step 1 upsert.ts + --execute 통합
- 2af6719 Step 2·3 마스킹 3중 방어 + script 제거 + venue/시간 추출
- 6d2dac5 Step 4 extract-fallbacks 본문 재추출
- 4826018 지속 동기화 기반 (postedAt fallback + created_at 게시순)
- 4bc41bf 카페 게시 순서 tie-break + 공지 방어 가드
- c84aba0 extractPostedAt 상세 HTML 폴백 복구 (.num_subject)

Phase 3 ✅ (카페 세션에서 dev로 직접):
- 621e7e2 Phase 3 #1+#3+#4 자동화 — **GH Actions `cafe-sync.yml` + 쿠키 갱신 + Slack** (dev에 반영)
- 299c395 Phase 3 #6 Pagination — common-articles cursor API (subin)

파일 확인:
- `src/lib/cafe-sync/` : board-map / fetcher / article-fetcher / **upsert** / **extract-fallbacks** 5파일 ✅
- `.github/workflows/cafe-sync.yml` ✅
- `vercel.json` cafe-sync cron — **아직 미등록** (GH Actions가 대체 중)

지연/차단: 이전 보고서의 "쿠키 만료(403)" 블로커는 **해소**. Phase 2b 전 품질 항목이 실제 실행까지 거쳤고 마스킹·게시순·공지 가드까지 붙음.

운영 지표:
- GH Actions 실행 이력 확인은 수동 (gh CLI 미설치 상태)
- cafe_posts 실제 쓰기 여부는 DB 조회 필요 — 본 보고서에서는 **확인 보류**
- Phase 3 #2(Vercel Cron 엔드포인트), #5(admin UI) 2건은 **아직 미구현** 추정 (scratchpad 남은 단위 언급 없음)

## 3. 미푸시 또는 미완료 작업

git status — 클린. scratchpad 기준 **미푸시 0건 / subin HEAD `1ffedb5` 푸시 완료**.

미승격 (가장 중요):
- **subin → dev 간 7커밋 차이** (`d30264f..HEAD` 구간): M7 후속 / L3 초입 / `/profile/activity` 배지 / 색상 audit / ops-db 초안 / index 중복 해소 / 카페 Phase 3 #6
- 오늘 오후 PR #50 이후 쌓인 분. scratchpad "다음 세션 진입점 1순위"에 명시

아직 안 한 통합 테스트:
- W4 스모크 테스트 (PC × 모바일 × 다크 × 라이트 4조합) — scratchpad 2순위에 수동 작업으로 대기

## 4. PR 현황

이번 주 머지된 PR (본 세션 + 카페 세션 합쳐 **6건**):
- #39 (04-17~19 기초 묶음) — 이미 머지
- #45 (04-19 W1 12종 + 카페 Phase 1~2a + M1 Day 7 + 유형 탭)
- #46 (M1 Day 7/8 + M2 sticky + `/games` 탭 + 카페 Phase 2b Step 1)
- #47 (W1 완료 + W3 옵션C M1~M6 + 카페 Phase 1~2b + 세션분리)
- #49 (W4 완전 마감 M4/M7/L1 + D + 카페 sync 후속)
- #50 (dev → main 머지)

**미생성 PR 2건** (다음 세션 1순위):
- PR #51 (subin → dev): 위 7커밋 squash
- PR #52 (dev → main): merge

## 5. knowledge 갱신 점검

지난 7일간 knowledge 갱신 — **매우 활발**. 04-20 하루에도:
- decisions: 세션 분리 원칙 / 카페 tie-break / 운영 DB 초안 / L3 브레드크럼 패턴
- lessons: 카페 sync C/D 실측 / 하드코딩 색상 31파일 audit / any 9회 숙제
- errors: referee 알림 사일런트 버그 (6회차)
- conventions: 플로팅 닫기 컨벤션 / breadcrumb 재활용

index.md 하단 "최근 추가된 지식" 중복 섹션은 **1ffedb5에서 해소됨** (이전 리포트 권장 사항 반영).

**권장 사항 없음** — 갱신 페이스 충분히 높음. 다만 오늘 신규 지식이 많아 다음 consolidate-memory 패스는 일주일 안에 한 번 권장.

## 6. 다음 주 우선순위 추천 1~3개

1. **PR #51/#52 승격 — 원영 협의 후 squash/merge** (최우선, 30~60분) — 7커밋이 subin에만 있는 상태가 길어질수록 dev 충돌 위험↑. 원영의 `a526b54 Merge subin/main` 작업이 있었으니 오전 짧은 확인 후 squash 가능.
2. **W4 스모크 테스트 수빈 수동 (1h)** — `/profile/activity` 3탭 / `/help/glossary` / 팀 가입 상태 UI / M6 6카테고리 / M3 코트 지도 / M5 온보딩 PC·모바일·다크·라이트 4조합. 버그 발견 시 scratchpad "수정 요청" 테이블에 기록.
3. **운영 DB 분리 협의 (30분~1h)** — `Dev/ops-db-sync-plan.md` 선결 조건 6개 체크박스를 원영과 맞춰 옵션 A(Supabase 두 번째 프로젝트) 확정. 04-18 "개발 DB라 믿은 .env가 운영 DB" 사건의 장기 해결.

그 다음 여력 있으면 L3 남은 항목 (Organization/Series 페이지 브레드크럼 + EditionSwitcher 공용 컴포넌트, ~3h) + 카페 Phase 3 #2(Vercel Cron)/#5(admin UI) 여부 판단.

## 7. 수빈에게 던지는 질문

- **4주 플랜을 이틀에 소화한 속도**가 지속 가능한지 — 무리한 페이스라면 화~금은 L3·카페 Phase 3 잔여·운영 DB 같은 **묵직한 하나에 집중**하고 시각 점검·리팩터링에 시간을 할애하는 게 안전할 것 같은데, 계속 밀어붙이시는 것과 페이스 조절 중 어느 쪽이 맞으실까요?
- **카페 Phase 3 #2(Vercel Cron)·#5(admin UI)** 지금 단계에서 필요하신가요, 아니면 GH Actions 하나로 당분간 운영해보고 운영 체감 후 추가 결정하시겠어요?
- **원영 협의 타이밍** — 운영 DB 분리 + PR 승격 2건이 원영 쪽 확인을 타는데, 오늘 저녁 또는 내일 오전 중 편하신 시간 있으실지요?
