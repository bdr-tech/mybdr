# 작업 스크래치패드

## 현재 작업
- **요청**: subin → dev PR #39 정리 + Coworker 4파일 수습 + Vercel 빌드 복구
- **상태**: ✅ **완료** — PR #39 mergeable CLEAN, Vercel SUCCESS, 수빈 프리뷰 확인 대기
- **현재 담당**: 수빈 (프리뷰 확인 + dev 머지 판단)

### PR #39 요약
| 항목 | 값 |
|------|-----|
| URL | https://github.com/bdr-tech/mybdr/pull/39 |
| 제목 | 2026-04-17~19 subin: 카페 파서 + UX 개선 + 다음카페 Phase 1 + E2E |
| 커밋/파일 | **24 커밋 / 51 파일 / +3842 / -626** |
| mergeable | CLEAN |
| Vercel | ✅ SUCCESS (`39eb8ee`) |
| DB 스키마 변경 | **없음** |

### 수빈 수동 확인 필요 (dev 머지 전)
Vercel 프리뷰 URL(PR 댓글 Vercel 봇 링크)에서 6개:
1. 모바일 더보기 탭 툴팁 (localStorage 초기화 후 첫 방문)
2. 헤더 알림 배지 (알림 있을 때 빨간 숫자)
3. 팀 상세 히어로 "팀 관리" 버튼 (팀장 계정)
4. 대회 상세 "신청 완료" 배지 (이미 신청한 대회)
5. `/games` 데이터 정상성 (시간/장소/비용 필드)
6. 로그인 보호 경로 안내 다이얼로그 (`/games/new` 비로그인)

## 전체 프로젝트 현황
| 항목 | 값 |
|------|-----|
| 현재 브랜치 | subin (origin/subin = 39eb8ee) |
| 진행 중 PR | **#39 OPEN / mergeable CLEAN / Vercel PASS** |
| 미푸시 커밋 | 0 |

## 남은 과제
- **PR #39 머지** — 수빈 프리뷰 확인 → subin → dev (수빈 판단) → main (원영 담당)
- **다음카페 Phase 2** — 본문 fetch(HTTP+Playwright) + upsert + 개인정보 마스킹 (4~6h)
- **다음카페 Phase 3** — Vercel Cron + GH Actions + admin UI + 알림 (6~8h)
- **원영 영역 공식 기록 가드** — public-bracket API, _site/*.tsx
- **대회 vs 경기 명확화** — 라벨 통일

## 운영 팁
- **gh 인증 풀림**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **gh pr edit 스코프 부족 시**: `gh api -X PATCH repos/OWNER/REPO/pulls/N -f title="..." --field "body=@file.md"`
- **API 진단**: `curl /api/...` 1회 필수 (apiSuccess 미들웨어 재발 4회)
- **포트 죽이기**: `netstat -ano | findstr :<포트>` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **tsx 환경변수**: `npx tsx --env-file=.env.local scripts/xxx.ts` (Node 22 기능)
- **커밋 전 파일 diff 확인 필수**: Coworker와 공유 파일은 **내 변경만 들어갔는지** 점검 (c884ae0 NotificationBadge 모듈 누락 사고 교훈)
- **일회성 DB 스크립트**: `scripts/_templates/` 기반, dry-run → --execute → 완료 후 삭제, DELETE 0 원칙
- **공식 기록 쿼리**: `officialMatchWhere()` 유틸 필수

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-19 | pm | PR #39 정리: Coworker 4파일 3커밋 + Vercel 복구 + 제목/본문 갱신 (24커밋, +3842/-626, 51파일) | ✅ mergeable CLEAN |
| 04-19 | tester | MoreTabTooltip Playwright E2E 6/6 PASS (모바일 Pixel 7 + 데스크톱 1440x900) | ✅ |
| 04-19 | pm+developer | 다음카페 Phase 1 POC — 3게시판 30건 실제 수집 (articles.push 정규식 파싱) | ✅ tsc + 수집 |
| 04-19 | pm | 크롤링 정책 리서치(9가드) + decisions.md 승격 | ✅ 조건부 진행 승인 |
| 04-19 | general-purpose | 다음카페 크롤링 법적/기술 리스크 리서치 (robots/약관/판례/개인정보/저작권) | ✅ 리스크 낮음~중간 |
| 04-18 | developer | MoreTabTooltip + NotificationBadge + 팀장 CTA + 대회 신청 배지 (Coworker, 내가 커밋 수습) | ✅ tsc + Vercel |
| 04-18 | developer | W1 Day 1 Q1 — 고아 라우트 4개 308 redirect + 탭 쿼리 초기화 (7파일, Coworker) | ✅ tsc |
| 04-18 | planner-architect | 다음카페 3개 게시판 동기화 계획 수립 (Phase 1/2/3) | ✅ decisions 승격 |
| 04-18 | pm | `.env`=운영 DB 확인, 직접 연결 유지 결정 | ✅ |
| 04-18 | pm | 오늘 시작 점검 + dev → subin 머지 (7커밋) + push 8커밋 | ✅ |
