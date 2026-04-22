# 통합 스모크 테스트 체크리스트 — W4 + L3 + L2 (2026-04-22)

> **목적**: 최근 4주간(W1~W4) + L2·L3 변경 사항이 PC/모바일 × 다크/라이트 4조합에서 모두 정상 동작하는지 수동 확인.
> **예상 소요**: ~1.5h (수빈 수동)
> **결과 기록**: `.claude/scratchpad.md` "수정 요청" 테이블

---

## 🔧 테스트 환경 준비

### 개발 서버
```bash
# 포트 3001
npm run dev

# 또는 Vercel 프리뷰 (최신 dev 브랜치 기준)
# https://mybdr-git-dev-mybdr.vercel.app/
```

### 시드 상태 (2026-04-22 확인 완료)
- ✅ Organization 1건: `강남구농구협회` (slug: `org-ny6os`)
- ✅ Series 1건: `BDR 시리즈` (slug: `bdr-series`, id=8)
- ✅ BDR 시리즈 소속 대회 12건 — edition 분포 `[1, 2, 3, null, 4..11]`
- ✅ 공개 팀 14건 (총 16건 중)

→ **추가 시드 불필요.** 바로 테스트 진입 가능.

### 4조합 전환 방법
| 조합 | 방법 |
|------|------|
| **PC** | 브라우저 기본 창 크기 (≥1280px 권장) |
| **모바일** | DevTools `Ctrl+Shift+M` → iPhone 14 / 375×812 권장 |
| **다크** | OS 테마 다크 or DevTools 강제(Rendering 탭 > Emulate CSS prefers-color-scheme: dark) |
| **라이트** | 반대 |

→ 각 페이지에서 **전환 즉시 튀는 색상/배치 무너짐** 있는지 눈으로 확인.

---

## 🏆 L3 — Organization/Series/Tournament 브레드크럼 + EditionSwitcher

### L3-1. Organization 2단 브레드크럼
- **URL**: `/organizations/org-ny6os`
- [ ] 브레드크럼이 `홈 > 단체 > 강남구농구협회` 2단으로 표시
- [ ] 4조합 모두 잘 보임

### L3-2. Series 3단 브레드크럼 (하단 대회 목록 포함)
- **URL**: `/organizations/org-ny6os/series/bdr-series`
- [ ] 브레드크럼이 `홈 > 단체 > 강남구농구협회 > BDR 시리즈` 3단
- [ ] 하단에 BDR 시리즈 소속 12개 대회 목록이 정상 렌더
- [ ] edition `null`인 대회도 에러 없이 표시
- [ ] 500 / Turbopack crash 없음 (errors.md [2026-04-12] 재발 방지)

### L3-3. Tournament 상세 — 소속 시리즈 카드 + EditionSwitcher
- **URL**: BDR 시리즈 대회 중 edition #4 같은 중간 대회 상세 페이지
- [ ] "소속 시리즈" 카드가 렌더되고 `BDR 시리즈` 링크
- [ ] EditionSwitcher의 "이전 #3 / 전체 / 다음 #5" 3버튼 정상 노출
- [ ] 첫 회차(#1)에서 "이전" 버튼 disabled (span 폴백)
- [ ] 마지막 회차(#11)에서 "다음" 버튼 disabled
- [ ] edition `null`인 대회 상세에서 EditionSwitcher 아예 **미렌더** (설계 의도)

---

## 👤 L2 — 프로필 통합 (본인/타인/Teams/대시보드)

### L2-1. 본인 프로필 (본인 login 상태로 `/users/[본인 id]`)
- [ ] ProfileHero(공용) 정상 — 레벨 배지 `Lv.N` 표시
- [ ] MiniStat 4종(경기 수/어시스트/MVP/etc) 표시
- [ ] RecentGames 최근 3~5경기 표시
- [ ] Teams 섹션에 소속 팀 (비공개 팀 포함) 표시
- [ ] "내 프로필 수정" 링크 → `/profile/edit` 정상 이동

### L2-2. 타인 프로필 (다른 유저 `/users/[id]`)
- [ ] 본인 프로필과 달리 편집 버튼 없음
- [ ] Teams 섹션에 **공개 팀만** 표시 (비공개 팀 노출 금지)
- [ ] 레벨 배지/통계 표시 정상

### L2-3. /profile 대시보드
- **URL**: `/profile` (로그인 상태)
- [ ] 공용 ProfileHero + MiniStat + RecentGames 재사용 확인
- [ ] 편집 경로 `/profile/edit` 링크 정상

### L2-4. 레벨 배지 통합 (티어 → 레벨)
- [ ] 기존 "티어 브론즈/실버" 표기 잔존 없음
- [ ] `Lv.N` 형태로 모든 프로필 카드 통합

---

## 🌳 W4 — 최근 완료 기능 회귀

### W4-1. /profile/activity (활동 로그)
- **URL**: `/profile/activity`
- [ ] 타임라인 렌더 정상 (경기/팀 가입/배지 등)
- [ ] 페이지 진입 500 없음

### W4-2. /help/glossary (용어집)
- **URL**: `/help/glossary`
- [ ] 용어 목록 정상
- [ ] 앵커 이동/검색 동작

### W4-3. 팀 상세 가입 UI
- **URL**: 임의 팀 `/teams/[id]` (공개 팀)
- [ ] "가입 신청" 버튼/플로우 정상
- [ ] 이미 가입한 팀이면 버튼 상태 변경

### W4-4. M6 알림
- [ ] 상단 알림 아이콘 배지 정상
- [ ] 알림 목록 드롭다운/페이지 렌더

### W4-5. M3 코트 지도
- **URL**: `/courts` 또는 관련 지도 페이지
- [ ] 카카오맵 로드 정상
- [ ] 마커 클릭 → 상세 표시

### W4-6. M5 온보딩
- [ ] 신규 계정(또는 온보딩 미완료) 진입 시 온보딩 플로우 정상
- [ ] 건너뛰기/완료 처리

### W4-7. 카페 Phase 3 자동화 (GH Actions 운영 반영)
- [ ] `/games` 탭에서 카페 연동 경기 정상 표시
- [ ] `/community` 탭에서 카페 게시글 정상 (**HTML entity 디코드** 포함)
- [ ] 작성자·장소·시간 필드 정상

---

## 🆕 04-22 추가 확인 (오늘 커밋 `bb488ce`)

### 카페 community HTML entity 디코드
- **URL**: `/community` 리스트
- [ ] `&#39;` 포함 제목 → `'`로 디코드 (예: postId 277 `[시흥] 일요일팀 '지역방어'`)
- [ ] `&amp;` → `&` / `&nbsp;` → 공백
- [ ] 사이드바 인기글·실시간 인기글 제목
- [ ] `/community/[public_id]` 상세 제목/본문/작성자
- [ ] 카페 댓글 content + nickname

---

## 📝 결과 기록 포맷

테스트 중 문제 발견 시 scratchpad "수정 요청" 테이블에 추가:

```markdown
| 수빈(스모크) | [대상 파일 또는 URL] | [증상: 어떤 조합에서 무엇이 무너졌는가] | ⏳ 분석 대기 |
```

테스트 완료 시 PM에게 "스모크 테스트 완료, X건 수정요청"으로 알려주세요.

---

## ✅ 스모크 완료 기준

- [ ] L3 3항목 모두 4조합 통과
- [ ] L2 4항목 모두 4조합 통과
- [ ] W4 7항목 모두 4조합 통과 (일부만 PC/다크 대표 통과도 수용 가능)
- [ ] 오늘 커밋 `bb488ce` community 디코드 확인

→ 통과 시 PR #55(subin → dev) 머지 준비 완료 상태.
