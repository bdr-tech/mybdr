# MyBDR UX 개선 실행 일정 + Claude Code 프롬프트 모음

> 작성: 2026-04-19  
> 기반 보고서: `Dev/ux-audit-2026-04-19.md`  
> 가정: 수빈 단독 작업 · subin 브랜치 · **하루 4~6시간** · **일요일 시작**  
> 결과물: 일자별 작업 카드 + 즉시 사용 가능한 프롬프트 22개

---

## 0. 한눈에 보기

| 주차 | 기간 | 작업 묶음 | 일수 | 결과 PR |
|------|------|----------|------|---------|
| W1 | 4/19(일) ~ 4/25(토) | Quick wins 12개 (Q1~Q12) | 5일 | PR #40 (라우트), #41 (네비/UI), #42 (발견성), #43 (폴리시) |
| W2 | 4/26(일) ~ 5/2(토) | M1 (프로필 좌측 네비) + M2 (대회 sticky 신청) | 5일 | PR #44, #45 |
| W3 | 5/3(일) ~ 5/9(토) | M3 (코트 지도) + M5 (온보딩 압축) + M6 (알림 분류) | 5일 | PR #46, #47, #48 |
| W4 | 5/10(일) ~ 5/16(토) | M4 (내 활동 통합) + M7 (팀 가입 신청자 화면) + L1 (라벨 정리) | 5일 | PR #49, #50, #51 |
| W5+ | 5월 후반~ | L2 (프로필 시각 통합) + L3 (3계층 IA) — 분기 단위 | TBD | TBD |

**총 22개 작업 / 약 20영업일 / 약 75~95시간**

---

## 1. 매일 사용할 루틴 템플릿

### 1-1. 작업 시작 (필수, 5~10분)

CLAUDE.md "오늘 작업 시작" 체크리스트를 그대로 활용. **Claude Code에 매일 첫 메시지로 이걸 붙이세요:**

```
오늘 작업 시작하자
```

→ Claude Code가 다음을 자동 수행:
1. `git remote -v` 확인
2. `git fetch origin --prune` + main/dev/subin 차이
3. 현재 브랜치가 subin인지
4. `.env` DATABASE_URL이 개발 DB인지
5. `.env.local`에 localhost:3001 오버라이드 있는지
6. 결과 요약 + "이대로 작업 시작해도 될까요?" 승인 요청

승인하면 본 작업 시작.

### 1-2. 작업 종료 (필수, 10분)

```
오늘 작업 마무리. 다음 진행:
1. tsc 통과 확인
2. 변경 요약 + 커밋 (필요시 여러 개로 분리)
3. push origin subin
4. .claude/scratchpad.md 작업 로그에 1줄 추가
5. 변경에서 새 패턴이 있으면 .claude/knowledge/conventions.md에 기록
6. 30분+ 삽질했으면 .claude/knowledge/lessons.md에 기록
```

### 1-3. PR 묶음 정리 (주말 또는 묶음 완료 시점, 15분)

```
이번 묶음 작업 PR 정리해줘.
- 묶음명: [PR 묶음 이름]
- 포함 작업: [작업 번호들]
- subin → dev PR 생성
- 본문에 변경 요약, 영향 파일, 테스트 방법 포함
```

---

## 2. W1 — Quick Wins 12개 (4/19 일 ~ 4/25 토)

### 📅 Day 1 — 일 4/19: 라우트 정리 (Q1·Q2·Q3) → **PR #40**

**오늘 목표** — 고아 라우트 4개 redirect + 시리즈 통합 + upgrade 통합. 시각 변화는 적지만 사이트 신뢰도와 SEO에 직접 효과.

#### Q1. 대회 상세 고아 라우트 4개 → 탭 경로로 redirect (60분)

```text
/tournaments/[id] 밑의 고아 라우트 4개를 정리해줘.

대상 파일:
- src/app/(web)/tournaments/[id]/bracket/page.tsx
- src/app/(web)/tournaments/[id]/schedule/page.tsx
- src/app/(web)/tournaments/[id]/standings/page.tsx
- src/app/(web)/tournaments/[id]/teams/page.tsx

요구사항:
1. 4개 모두 페이지 컨텐츠 삭제, 단순 redirect만 남기기
2. Next.js redirect()로 처리. 매핑:
   - bracket → /tournaments/[id]?tab=bracket
   - schedule → /tournaments/[id]?tab=schedule
   - standings → /tournaments/[id]?tab=teams (참가팀 탭이 standings 통합)
   - teams → /tournaments/[id]?tab=teams
3. /tournaments/[id]/page.tsx의 TournamentTabs가 ?tab= query를 읽어서 초기 활성 탭으로 설정. 기존 탭 동작은 그대로 유지
4. 외부 링크 끊기지 않게 영구 리다이렉트(307이 아닌 308 또는 next.config의 redirects)
5. 변경 후 tsc 통과 확인

CLAUDE.md 준수: 운영 DB 건드리지 말 것, push 전 커밋 메시지 명확히.
```

#### Q2. /tournament-series 입구 정리 (45분)

```text
/tournament-series 페이지를 정리해줘.

현재 상태:
- src/app/(web)/tournament-series/page.tsx 가 시리즈 카드 목록을 보여주는데
- 카드 클릭 시 이동할 /tournament-series/[id] 라우트가 미구현이라 깨진 입구
- 동일한 시리즈 허브가 /series/[slug] 에 이미 잘 만들어져 있음

요구사항:
1. /tournament-series 페이지를 /series 로 redirect (또는 두 페이지를 하나로 통합)
2. 통합한다면: /tournament-series 의 카드 그리드 디자인이 더 좋다면 그걸 /series 페이지로 이식
3. 시리즈 카드 클릭 시 /series/[slug] 로 정상 이동되게 링크 연결
4. 사이드 네비/슬라이드 메뉴/검색 자동완성 어디에서 /tournament-series 링크가 있는지 grep 후 모두 /series 로 교체

이전 단계 Q1과 충돌 없는지 확인 후 별도 커밋.
```

#### Q3. /upgrade ↔ /pricing 통합 (60분)

```text
/upgrade 페이지를 정리해줘.

현재 상태:
- /pricing : 동적 플랜 + 토스페이먼츠 결제 (정상 동작)
- /upgrade : 픽업/팀/대회 시나리오 카드 + "관리자 문의 메일" (결제 불가)
- 두 입구가 양립해서 결제 신뢰도 저하

방안 (선택지 A 권장):
1. /upgrade 페이지의 시나리오 카드 3개(팀 생성 / 픽업 호스팅 / 대회 관리)를 /pricing 페이지 상단에 카드 섹션으로 이식
2. /upgrade 자체는 /pricing 으로 영구 redirect
3. slide-menu.tsx 의 "PRO로 업그레이드" 배너 링크 확인 — 이미 /pricing 인 듯한데 검증
4. 코드베이스 전체에서 /upgrade 링크 grep → /pricing 으로 교체
5. 변경 후 tsc 통과 + 결제 플로우 수동 테스트는 다음 커밋에서

브랜드 톤 유지: BDR Red(#E31B23) + 다크모드 기본. 시나리오 카드는 4px border-radius.
```

**Day 1 마무리 (16:00~16:30)** — 위 1-2 종료 루틴 + PR #40 생성:

```text
오늘 Q1·Q2·Q3 완료. PR #40 생성:
- 제목: "라우트 정리: 고아 라우트 redirect + 시리즈/업그레이드 통합"
- 본문에 영향 파일 목록 + 테스트 방법(이전 URL이 새 URL로 이동하는지) 포함
- subin → dev PR
- scratchpad 작업 로그 1줄 갱신
```

---

### 📅 Day 2 — 월 4/20: 네비·UI 일관성 (Q4·Q5·Q6·Q12) → **PR #41**

**오늘 목표** — 모바일 발견성 + 라벨 통일 + 알림 배지 숫자.

#### Q4. 모바일 하단 탭 "더보기" 라벨 + 1회 툴팁 (90분)

```text
모바일 하단 탭의 "더보기" 발견성을 개선해줘.

현재 상태:
- src/app/(web)/layout.tsx 의 bottomNavItems 마지막이 "더보기" (icon: menu)
- 슬라이드 메뉴(slide-menu.tsx)에 단체·팀·코트·랭킹이 들어있는데, 안에 뭐가 있는지 외부에서 안 보임

요구사항:
1. "더보기" → "전체" 로 라벨 변경 (10pt + semibold 유지)
2. 첫 방문자에게만 1회 툴팁 노출:
   - 위치: "전체" 탭 위에 작은 말풍선
   - 내용: "단체·팀·코트·랭킹은 여기 있어요"
   - 동작: 3초 후 자동 닫힘 + localStorage 키 "more_tab_tooltip_shown" 으로 1회만
   - 닫기 X 버튼 포함
3. 디자인: BDR Red 배경 + 흰 텍스트 + 4px radius + 작은 화살표가 아이콘을 가리킴
4. 다크모드/라이트모드 모두 자연스럽게

영향 파일:
- src/app/(web)/layout.tsx 의 bottomNavItems 라벨
- 신규: src/components/shared/more-tab-tooltip.tsx (별도 컴포넌트)
- src/app/(web)/layout.tsx 의 더보기 button 영역에서 컴포넌트 마운트
```

#### Q5. 슬라이드 메뉴 라벨 통일 (15분)

```text
src/components/shared/slide-menu.tsx 13번 라인의 "경기찾기" 를 "경기" 로 변경해줘.
다른 위치(layout.tsx의 sideNavItems, bottomNavItems)와 라벨이 통일되도록.
변경 후 tsc + 시각적으로 활성/비활성 모두 정상인지 확인.
```

#### Q6. 알림 배지 미확인 개수 표기 (45분)

```text
src/app/(web)/layout.tsx 의 알림 배지를 빨간 점에서 숫자 배지로 변경해줘.

현재 (511번 라인 근처):
{unreadCount > 0 && (
  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
)}

변경 후:
- unreadCount === 0: 표시 X
- 1 <= unreadCount <= 99: 숫자 표기
- unreadCount > 99: "99+"
- 디자인: BDR Red 원형 배경 + 흰색 9pt bold 숫자
- 위치: 알림 아이콘의 우측 상단 (현재와 동일 위치, 크기 약간 키움)
- 한 자리/두 자리/99+ 모두 가시성 확보 (min-w-[16px], px-1)

PC 헤더와 모바일 헤더 동일 처리. 슬라이드 메뉴 안 알림 항목에도 같은 배지 패턴 적용 가능하면 함께.
```

#### Q12. 푸터·로그아웃 일관 점검 (60분)

```text
푸터와 로그아웃 진입점 일관성을 점검해줘.

점검 항목:
1. src/components/layout/Footer.tsx — 모든 (web) 페이지에 일관 노출되는지 grep으로 확인
2. 모바일에서 하단 네비(56px)와 Footer가 겹치지 않는지 (현재 layout.tsx에 pb-20 있는데 Footer 위치 검증)
3. 로그아웃 진입점 매핑:
   - PC: 헤더 ProfileDropdown 안에 있는지 확인
   - 모바일: 슬라이드 메뉴 ProfileAccordion 안에 있는지 확인
   - 둘이 동일 라벨/동일 위치(메뉴 하단)인지
4. 발견되는 불일치는 작은 패치로 수정

검증: 로그인/비로그인 상태 모두에서 푸터 + 로그아웃이 자연스럽게 보이는지 모바일/PC 양쪽.
```

**Day 2 마무리** — PR #41 생성 ("네비·UI 일관성 정리").

---

### 📅 Day 3 — 화 4/21: 발견성 (Q7·Q8) → **PR #42 (1차)**

**오늘 목표** — 팀장 진입점 + 대회 신청 진입점.

#### Q7. 팀 상세에 팀장 전용 "팀 관리" 버튼 (90분)

```text
팀 상세 페이지에 팀장 전용 "팀 관리" 버튼을 추가해줘.

대상 파일:
- src/app/(web)/teams/[id]/page.tsx (히어로 영역)

요구사항:
1. 권한 체크: 팀의 owner_id === 현재 user_id 일 때만 노출
   - 현재 user는 getWebSession() 사용 (CLAUDE.md 컨벤션)
2. 디자인:
   - 위치: 히어로 우측 상단 (팀명/디비전 배지 옆 또는 4탭 위)
   - BDR Red(#E31B23) outline 버튼 + 흰 배경 + ⚙(settings) 아이콘 (Material Symbols)
   - 4px border-radius (CLAUDE.md 컨벤션)
   - 라벨: "팀 관리"
3. 모바일 대응: sm: prefix로 텍스트는 숨기고 아이콘만 (또는 작은 라벨)
4. 링크: /teams/[id]/manage 로 이동
5. 비팀장(일반 멤버, 비로그인)에게는 노출 안 함
6. 다크모드/라이트모드 둘 다 자연스럽게

기존 TeamJoinButton과 시각적으로 충돌 안 나게 배치.
```

#### Q8. 대회 상세에 "내 신청 완료" 인라인 알림 (120분)

```text
대회 상세 페이지에 이미 신청한 사용자용 인라인 알림을 추가해줘.

대상 파일:
- src/app/(web)/tournaments/[id]/page.tsx 의 히어로 영역

요구사항:
1. 권한 체크: 로그인 상태이고, 이 사용자가 이 대회에 1건 이상 신청한 기록이 있는 경우
   - DB 쿼리: tournament_team 또는 신청 모델에서 user_id 매칭 (정확한 모델명은 prisma/schema.prisma 확인)
2. 노출 위치: 히어로 영역, 참가신청 CTA 위 또는 옆
3. 디자인:
   - 초록 계열 success 배지 (var(--color-success) 또는 #22C55E 톤)
   - "✓ 신청 완료 — 내 신청 보기" 형태
   - 클릭 시 /profile/basketball 의 "참가 대회" 섹션으로 이동 (앵커 #my-tournaments)
   - 또는 신청 상세 모달 노출 (선택)
4. 신청이 여러 건이면 "✓ N건 신청 완료" 로 카운트 표기
5. 데스크톱/모바일 모두 자연스럽게

검증: 비로그인/미신청자에게는 노출 안 됨.
```

**Day 3 마무리** — Q9~Q12까지 묶을 거라 PR은 Day 4에 생성. 오늘은 commit + push만.

---

### 📅 Day 4 — 수 4/22: 발견성 마무리 (Q9·Q10·Q11) → **PR #42 (확정)**

#### Q9. 프로필 완성 배너 진행률 + 단계별 직링크 (120분)

```text
프로필 완성 배너를 단계 진행률 + 직링크 형태로 개선해줘.

대상 파일:
- src/components/shared/profile-completion-banner.tsx

요구사항:
1. 6단계 정의 (사용자 status에 맞춰 동적 계산):
   - 가입(완료)
   - 이메일/전화번호 인증 (verify)
   - 기본 정보 (profile/complete)
   - 농구 정보 (profile/basketball 또는 complete의 농구 섹션)
   - 맞춤 설정 (profile/complete/preferences)
   - 팀 가입 (선택, 이건 빼도 됨 → 5단계로)
2. 도트 진행률 표기: ●●●○○○ 또는 진행 바 + "2 / 5"
3. 각 도트는 클릭 가능 → 해당 단계 페이지로 직접 이동
4. "다음 단계 시작 →" 버튼: 가장 빠른 미완료 단계로 자동 이동
5. 닫기(X) 후 동작: localStorage 24시간 → 7일로 완화
6. 디자인:
   - BDR Red 배경 + 흰 텍스트 유지
   - 도트는 흰색 + 활성은 채움, 비활성은 빈 원
   - 진행률은 한 줄에 깔끔하게

API: /api/web/me 응답에 profile_completion_status 같은 필드가 없으면, 클라이언트에서 user 객체의 필드(name, phone, basketball, preferences) 존재 여부로 계산. API 신설은 다음 단계에서.

검증: 모든 단계 0건 / 일부 / 완료 상태 모두에서 자연스러운 표시.
```

#### Q10. 검색 자동완성 0건 처리 강화 (90분)

```text
헤더 검색 자동완성에서 결과 0건일 때 안내를 강화해줘.

대상 파일:
- src/app/(web)/layout.tsx 의 SearchAutocomplete 컴포넌트

현재:
- 입력이 있는데 결과 0건이면 자동완성 드롭다운이 안 열림 (results 비어있으면 categories 비어서 isOpen 안 됨)

변경:
1. 결과 0건이어도 드롭다운 노출, 안내 메시지 + 인기 검색어 표시
2. 표시할 항목:
   - "검색 결과가 없어요" 메시지
   - 인기 검색어 5개 (정적 배열로 시작: ["픽업게임", "코트", "BDR 챌린지", "농구화", "강남"])
   - 추천 카테고리: "팀 둘러보기", "근처 코트 찾기" 같은 빠른 진입 링크
3. 디자인은 기존 자동완성 카테고리 헤더 패턴 재사용
4. 인기 검색어 클릭 시 saveRecentSearch + /search?q= 이동
5. 디바운스 후 결과 처리 분기를 명확히 (isLoading 상태에서는 빈 화면 X)

향후 인기 검색어를 DB에서 집계하는 건 별도 과제. 지금은 정적 데이터로.
```

#### Q11. /pricing/fail 사유 표기 (60분)

```text
결제 실패 페이지에 토스페이먼츠 errorCode 기반 사유 안내를 추가해줘.

대상 파일:
- src/app/(web)/pricing/fail/page.tsx

요구사항:
1. URL 쿼리에서 code, message 읽기 (토스페이먼츠 fail URL이 보통 ?code=...&message=... 형태)
2. 자주 나오는 errorCode 매핑 테이블 작성:
   - PAY_PROCESS_CANCELED → "결제를 취소하셨어요"
   - INVALID_CARD_NUMBER → "카드 번호가 올바르지 않아요"
   - INVALID_CARD_EXPIRATION → "카드 유효기간을 다시 확인해주세요"
   - EXCEED_MAX_DAILY_PAYMENT_COUNT → "오늘 결제 한도를 초과했어요"
   - NOT_ENOUGH_BALANCE → "잔액이 부족해요"
   - REJECT_CARD_COMPANY → "카드사에서 거절했어요"
   - 기타: 토스페이먼츠 공식 에러 코드 표 참고 (web search 가능)
3. 매핑 안 된 코드는 message 그대로 + "관리자 문의" 안내
4. 재시도 버튼은 기존 유지
5. 디자인은 기존 페이지 톤 유지 (단순 깔끔)

검증: 다양한 code query로 페이지 직접 접근해서 메시지 확인.
```

**Day 4 마무리** — Q7~Q11 묶어 PR #42 생성 ("발견성·신뢰도 개선 5종 묶음").

---

### 📅 Day 5 — 목 4/23: 폴리시 + 검증 (PR 정리 + 통합 테스트)

**오늘 목표** — Quick wins 12개 통합 검증 + 묶음 PR 정리 + 첫 주 회고.

```text
W1 묶음 작업 통합 검증 부탁해.

체크 항목:
1. dev 브랜치 fetch 후 subin과 conflict 없는지
2. tsc 전체 통과
3. 변경한 페이지 12개 모두 PC + 모바일 + 다크/라이트 4조합 시각 점검 (개발 프리뷰 https://mybdr-git-dev-mybdr.vercel.app/ 활용)
4. 라우트 redirect 4개 + tournament-series + upgrade 통합 정상 동작
5. 알림 배지 숫자 + 팀 관리 버튼 + 신청 완료 알림 정상 노출
6. 프로필 완성 배너 진행률 + 검색 자동완성 폴백 + pricing/fail 사유 정상

발견된 이슈 → errors.md 갱신, 수정 후 추가 커밋.
완료되면 .claude/scratchpad.md "W1 완료" 1줄 + .claude/knowledge/decisions.md 에 "Quick wins 12종 묶음 결정/이유" 1건 추가.
```

**금/토는 휴식 또는 W2 사전 점검 (선택).**

---

## 3. W2 — 핵심 IA 변경 (4/26 일 ~ 5/2 토)

### 📅 Day 6~8 — 일·월·화 4/26~4/28: M1 프로필 좌측 탭 네비 (PR #44, ~12시간)

가장 큰 부피 작업. 3일에 나눠 진행.

#### Day 6 (일): 좌측 네비 + 페이지 구조 재배치

```text
프로필 영역에 좌측 탭 네비를 도입해줘. (1차 — 구조 + 네비 컴포넌트)

대상 파일:
- src/app/(web)/profile/layout.tsx (대대적 변경)
- 신규: src/components/profile/profile-side-nav.tsx
- 기존 9개 서브페이지: /profile, /profile/edit, /profile/basketball, /profile/growth, /profile/preferences, /profile/payments, /profile/subscription, /profile/notification-settings, /profile/weekly-report

요구사항:
1. profile/layout.tsx 에 PC(lg+) 좌측 240px 고정 사이드 네비 추가
2. 네비 항목 6개 (하위 페이지 통합):
   - 내 정보 (현재 /profile/edit, 그룹 카드로 묶음: 기본정보·환불계좌·회원탈퇴)
   - 내 농구 (현재 /profile/basketball)
   - 내 성장 (현재 /profile/growth)
   - 설정 (현재 preferences + notification-settings 통합)
   - 결제 (현재 subscription + payments 통합)
   - 주간 리포트 (현재 /profile/weekly-report)
3. 모바일은 상단 탭(가로 스크롤) 또는 접이식 드롭다운
4. 활성 항목: BDR Red 좌측 4px border + 채워진 아이콘
5. 디자인 패턴은 (web)/layout.tsx 의 sideNavItems와 시각 일관성

이 단계에서는:
- 기존 /profile, /profile/edit 등 페이지는 살려둠
- profile/layout.tsx 만 좌측 네비 추가하고, children은 그대로 렌더
- 다음 단계에서 페이지 통합 진행

검증: PC에서 좌측 네비 + 콘텐츠 자연 배치, 모바일에서 상단 탭 작동.
```

#### Day 7 (월): /profile 허브 → 통합 대시보드로 변경

```text
프로필 좌측 네비 2단계 — /profile 허브 페이지를 통합 대시보드로 재구성.

대상 파일:
- src/app/(web)/profile/page.tsx

요구사항:
1. 기존 4카드 허브(내 정보·내 농구·내 성장·계정 카드)를 제거하고
2. 좌측 네비의 첫 항목 "내 정보" 와 동일한 콘텐츠로 변경
   - 즉 /profile === /profile (내 정보) 가 되도록
3. 그룹 카드 형태:
   - 기본 정보 카드 (닉네임, 전화번호, 이메일, 프로필 사진)
   - 팀 / 대회 요약 카드 (소속팀 N개, 참가대회 N회, 다음 경기 D-N)
   - 환불 계좌 카드
   - 위험 영역 카드 (회원 탈퇴)
4. /profile/edit 라우트는 임시 유지 + 위 카드들의 "수정" 버튼이 (현재는) /profile/edit 로 이동. 다음 단계에서 모달 또는 인라인 편집으로 변경 가능
5. profile/layout.tsx 의 좌측 네비에서 "내 정보" 가 활성 상태로 표시되게

상단 히어로:
- 아바타 + 닉네임 + 포지션 + 지역 + Lv + 팔로우 통계
- /users/[id] 의 히어로와 시각적으로 유사 (다음 단계 L2의 사전 작업)
```

#### Day 8 (화): 설정·결제 페이지 통합 + PR #44

```text
프로필 좌측 네비 3단계 — 설정/결제 페이지 통합.

요구사항:
1. /profile/preferences + /profile/notification-settings 를 /profile/settings 한 페이지에 탭 2개로 통합
   - 신규: src/app/(web)/profile/settings/page.tsx
   - 기존 두 페이지는 → /profile/settings?tab=preferences 또는 ?tab=notifications 로 redirect
2. /profile/subscription + /profile/payments 를 /profile/billing 한 페이지에 탭 2개로 통합
   - 신규: src/app/(web)/profile/billing/page.tsx
   - 기존 두 페이지 → /profile/billing?tab=subscription 또는 ?tab=payments 로 redirect
3. 좌측 네비에서 "설정" → /profile/settings, "결제" → /profile/billing 링크
4. 검증: 모든 redirect 정상, 탭 전환 자연스러움, 모바일에서도 가독성 OK

오늘 끝나면 M1 완료. PR #44 생성:
- 제목: "프로필 영역 IA 재구성: 좌측 네비 + 6항목 통합"
- 본문에 변경 페이지 일람 + redirect 매핑표 + 스크린샷 (있으면)
- subin → dev PR

knowledge/conventions.md 에 "프로필 6항목 좌측 네비 패턴" 기록.
knowledge/architecture.md 에 "프로필 통합 IA" 기록.
```

---

### 📅 Day 9~10 — 수·목 4/29~4/30: M2 대회 상세 sticky 신청 카드 (PR #45, ~6시간)

#### Day 9 (수): sticky 카드 컴포넌트 + 데스크톱

```text
대회 상세 페이지에 우측 sticky 신청 카드를 추가해줘.

대상 파일:
- src/app/(web)/tournaments/[id]/page.tsx
- 신규: src/components/tournaments/registration-sticky-card.tsx

요구사항:
1. 데스크톱(lg+) 1024px 이상에서만 노출
2. 위치: 메인 콘텐츠 우측, 320px 너비, top sticky (헤더 56px 고려: top-20)
3. 카드 내용:
   - 제목 "참가신청"
   - 마감까지 D-N (registration_end_at 기반)
   - 잔여석 N / 총 N (디비전별 합계)
   - 참가비 (entryFee 또는 디비전별 평균)
   - 큰 BDR Red 버튼 "신청하기 →" (registration_open 일 때만 활성)
   - 비활성 시: 상태 배지 (준비중/접수마감/진행중/종료)
4. 이미 신청한 사용자에게는 카드 하단에 "✓ N건 신청 완료 — 내 신청 보기" 추가 (Q8과 연계)
5. 비로그인: 버튼 라벨 "로그인 후 신청"
6. 모바일은 기존 하단 sticky CTA 그대로 유지 (이 카드는 lg:block hidden)

디자인:
- 카드 배경 var(--color-card), border var(--color-border), 4px radius
- 마감 D-N 은 7일 이내면 BDR Red, 그 외 회색
- 잔여석 0이면 "마감" 빨간 배지

검증: 4개 탭 모두 옮겨다녀도 카드 sticky 유지. 모바일에서 카드 안 보임. 비로그인/로그인/이미 신청 3상태 모두 정상.
```

#### Day 10 (목): 폴리시 + PR #45

```text
M2 마무리:
1. sticky 카드의 마감 D-N 자동 계산 검증 (timezone 한국 KST 기준)
2. 잔여석 계산 정확성 — tournament_categories 의 max_teams - approved_count 같은 식인지 확인
3. 디비전이 여러 개일 때 합산 표기 정확한지
4. 다크/라이트 모드 시각 점검
5. PR #45 생성: "대회 상세 데스크톱 우측 sticky 신청 카드"
6. knowledge/conventions.md 에 "대회 상세 sticky 신청 카드 패턴" 기록

W2 회고: scratchpad에 1주차 결과 요약.
```

**금/토 휴식.**

---

## 4. W3 — 코트 지도 + 온보딩 + 알림 (5/3 일 ~ 5/9 토)

### 📅 Day 11~12 — 일·월 5/3~5/4: M3 코트 목록 지도 뷰 (PR #46, ~10시간)

```text
코트 목록 페이지에 지도 뷰 토글을 추가해줘.

대상 파일:
- src/app/(web)/courts/page.tsx
- 신규: src/components/courts/courts-map-view.tsx
- 신규: src/components/courts/courts-view-toggle.tsx

요구사항 (Day 11 — 1차: 지도 컴포넌트 + 토글):
1. 페이지 상단에 토글 버튼: [리스트] [지도] (2-way 토글)
   - 기본은 리스트 (기존 동작 유지)
   - localStorage "courts_view_mode" 로 사용자 선택 기억
2. 지도 뷰: 카카오맵 SDK (이미 사용 중인 KAKAO_MAPS_KEY 환경변수 활용)
   - 모든 코트(또는 viewport 안 코트만)에 핀 표시
   - 핀 클릭 시 작은 인포 윈도우: 코트명 + 평점 + "상세 보기"
   - 인포 윈도우 "상세 보기" 클릭 → /courts/[id]
3. 위치 권한 요청 (선택):
   - 권한 있으면 사용자 위치 마커 + 가까운 순 정렬
   - 권한 없으면 서울 시청 중심 기본
4. 모바일 우선: 지도 높이 calc(100vh - 헤더 - 하단탭 - 토글 = 약 60vh)
5. 빈 상태: "주변에 등록된 코트가 없어요" + 지역 선택 드롭다운

요구사항 (Day 12 — 2차: 폴리시 + 통합):
1. 리스트 ↔ 지도 토글 시 데이터 재요청 X (같은 코트 데이터 활용)
2. 지도 클러스터링 (코트 많을 때) — 카카오맵 markerClusterer 활용
3. 검색/필터 결과가 지도 뷰에서도 반영
4. PR #46 생성

knowledge/decisions.md 에 "코트 목록 지도 뷰 — 카카오맵 클러스터링" 기록.
```

---

### 📅 Day 13 — 화 5/5: M5 온보딩 압축 (PR #47, ~5시간)

```text
온보딩 플로우를 4단계 → 점진적 완성 모델로 변경.

대상 파일:
- src/app/(web)/signup/page.tsx
- src/app/(web)/verify/page.tsx
- src/app/(web)/profile/complete/page.tsx
- src/app/(web)/profile/complete/preferences/page.tsx
- src/components/shared/profile-completion-banner.tsx (Q9 작업과 연결)

요구사항:
1. signup 직후 → verify 강제 (전화번호만 필수, 이메일 선택 유지)
2. verify 완료 → /profile/complete 가 아니라 / (홈) 으로 이동
3. /profile/complete 는 미니멀 3필드(닉네임/포지션/지역)만 빠르게 입력하는 페이지로 단축
   - "지금 채우기 (1분)" / "나중에" 옵션 카드 형태
4. /profile/complete/preferences 는 더 이상 강제 단계가 아니라 홈 진입 후 1주일 후 알림 또는 설정 페이지에서 진입
5. 홈에서 ProfileCompletionBanner (Q9 진행률 배너) 가 점진적으로 안내

이유:
- 가입 직후 첫 화면이 홈이어야 가치 체감 (현재는 4단계 거쳐야 가치)
- 미완성도 매칭 가능하게 두고, 점진적 완성 유도

검증:
- 신규 가입 → verify → 홈까지 2~3 클릭
- 홈에서 진행률 배너가 자연스럽게 다음 단계 유도
- 기존 가입자(미완성)도 새 배너 정상 표시

PR #47 생성. knowledge/decisions.md 갱신.
```

---

### 📅 Day 14~15 — 수·목 5/6~5/7: M6 알림 분류 + 일괄 읽음 (PR #48, ~5시간)

```text
/notifications 페이지에 카테고리 탭 + 일괄 읽음 추가.

대상 파일:
- src/app/(web)/notifications/page.tsx
- 신규 또는 기존: src/components/notifications/notifications-client.tsx

요구사항 (Day 14):
1. 페이지 상단 카테고리 탭 6개:
   - 전체 / 대회 / 경기 / 팀 / 커뮤니티 / 시스템
   - 각 탭에 미확인 개수 표기 (예: "전체 5", "대회 2")
2. 우측 상단 "모두 읽음 ✓" 버튼 (미확인 0건일 땐 비활성)
3. 알림 항목 디자인:
   - 좌측에 종류 아이콘 (Material Symbols: emoji_events / sports_basketball / groups / forum / settings)
   - 미확인은 좌측 ● 점 + bold 제목
   - 읽음은 일반 텍스트 + 회색 톤
4. notification_type 매핑 테이블 작성 (DB 값 → 카테고리 + 아이콘)

요구사항 (Day 15):
1. 일괄 읽음 API 추가: POST /api/web/notifications/mark-all-read (필터 파라미터 지원)
2. 헤더 알림 배지(Q6)와 연동: 일괄 읽음 후 즉시 카운트 0으로 갱신
3. 무한 스크롤 또는 "더 보기" 버튼 (현재 50건 제한)
4. PR #48 생성

knowledge/conventions.md 에 "알림 카테고리 매핑" 기록.
```

**금/토 휴식.**

---

## 5. W4 — 통합 + 라벨 정리 (5/10 일 ~ 5/16 토)

### 📅 Day 16~17 — 일·월 5/10~5/11: M4 내 활동 통합 뷰 (PR #49, ~8시간)

```text
프로필 좌측 네비에 "내 활동" 항목 추가 + 통합 뷰 페이지 신설.

요구사항:
1. 신규 페이지: src/app/(web)/profile/activity/page.tsx
2. 좌측 네비(M1)에 "내 활동" 항목 추가 (네비 항목 6 → 7)
3. 페이지 구성: 상단 탭 3개
   - 내 대회 신청 (tournament_team 또는 신청 모델 join)
   - 내 경기 신청 (game_applications) ← /games/my-games 의 데이터 일부 이전
   - 내 팀 가입 (team_members 또는 팀 가입 신청 모델)
4. 각 탭에 카드 리스트:
   - 대상명 + 일정/장소 + 상태 배지 (대기/승인/거부/완료)
   - 카드 클릭 시 상세 페이지로 이동
5. 정렬: 최신 활동 순
6. 빈 상태: 각 탭별 "아직 ~~ 가 없어요" + 진입 CTA (대회 보러 가기, 경기 만들기, 팀 둘러보기)
7. /games/my-games 는 redirect → /profile/activity?tab=games

API 신설:
- /api/web/me/activity?type=tournaments|games|teams 통합 엔드포인트
- 또는 기존 3개 API를 클라이언트에서 조합

PR #49 생성. M7 (팀 가입 신청자 측 화면) 와 연동되니 다음 작업과 묶을지 결정.
```

---

### 📅 Day 18 — 화 5/12: M7 팀 가입 신청자 측 화면 (PR #50, ~5시간)

```text
팀 가입 신청자가 자신의 신청 상태를 보는 UI 개선.

대상 파일:
- src/app/(web)/teams/[id]/page.tsx (가입 버튼 → 신청 후 상태 표시)
- src/app/(web)/profile/activity/page.tsx (M4 작업의 "내 팀 가입" 탭)

요구사항:
1. 팀 상세에서 "가입 신청" 버튼을 누른 후:
   - 즉시 버튼 라벨 → "신청 중 (대기)" + 회색 비활성
   - 신청 시각, 신청 메시지(있으면) 표시
2. 신청 상태 분기:
   - 대기: "팀장의 승인을 기다리고 있어요"
   - 승인: 자동으로 팀 멤버로 표시 + 환영 메시지 (1회)
   - 거부: "팀장이 신청을 거절했어요" + 다른 팀 둘러보기 CTA
3. 신청 취소 가능 (대기 상태에서만): "신청 취소" 작은 텍스트 버튼
4. 프로필 활동 탭에서도 동일 상태 표시 + 빠른 액션

API 신설 (필요 시):
- GET /api/web/teams/[id]/my-application
- DELETE /api/web/teams/[id]/my-application (취소)

검증: 동일 팀에 중복 신청 불가, 거부된 후 재신청 가능 여부는 정책 결정 필요.

PR #50 생성.
```

---

### 📅 Day 19 — 수 5/13: L1 라벨 정리 (PR #51, ~4시간)

```text
"경기" vs "대회" 멘탈모델을 명확히 하는 라벨 통일 + 도움말 페이지 신설.

요구사항:
1. 메인 네비 라벨 변경 검토:
   - 옵션 A (보수적): "경기" 유지하되 부제 추가 (PC 사이드에서 "경기 / 픽업·게스트 모집")
   - 옵션 B (적극): "경기" → "픽업·게임" 으로 변경
   - 추천: 옵션 A (기존 라벨 익숙도 보존)
2. 도움말 페이지 신설: /help/glossary
   - 도메인 용어 사전 (대회, 경기, 픽업, 게스트, 디비전, 시드, 토너먼트, 풀리그 등)
   - 각 용어에 짧은 설명 + 예시 + 관련 링크
3. 첫 가입자 온보딩 또는 / 홈 비로그인 화면에 도움말 링크 노출
4. 푸터에 "도움말" 링크 추가

대상 파일:
- src/app/(web)/layout.tsx (라벨 검토)
- 신규: src/app/(web)/help/glossary/page.tsx
- src/components/layout/Footer.tsx

PR #51 생성. knowledge/conventions.md 에 "도메인 용어 정의" 기록.
```

---

### 📅 Day 20 — 목 5/14: 통합 테스트 + W4 회고 + L2/L3 기획

```text
W2~W4 모든 변경 통합 검증:
1. 프로필 영역 좌측 네비 + 7항목 (M1 + M4)
2. 대회 상세 sticky 카드 (M2)
3. 코트 지도 뷰 (M3)
4. 온보딩 점진적 완성 (M5)
5. 알림 분류 + 일괄 읽음 (M6)
6. 팀 가입 상태 (M7)
7. 라벨 + 도움말 (L1)

각 영역에 대해 PC + 모바일 + 다크/라이트 4조합 점검.
.claude/scratchpad.md 에 "W1-W4 완료" 요약.
.claude/knowledge/index.md 갱신.

L2 (본인/타인 프로필 시각 통합) + L3 (3계층 IA) 기획서 작성:
- 각각 1페이지 짜리 markdown 으로 Dev/long-term-plan-L2.md, L3.md
- 설계 결정 + 영향 페이지 + 예상 공수
- 다음 분기 시작 시점에 진입
```

**금/토 휴식.**

---

## 6. W5+ — 장기 과제 (분기 단위)

### L2. 본인/타인 프로필 시각 통합 (~15시간 / 2주)
### L3. 단체-시리즈-대회 3계층 IA 명확화 (~12시간 / 2주)

→ 기획서 먼저 작성 (Day 20), 운영 DB 동기화·원영 영역 협의 같은 기존 과제와 함께 일정 조율.

---

## 7. 매일 사용할 체크리스트

### 시작 (Claude Code 첫 메시지)

```
오늘 작업 시작하자
```

### 종료 (Claude Code 마지막 메시지)

```
오늘 작업 마무리:
1. tsc 통과 확인
2. 변경 요약 + 의미 단위 커밋 (필요 시 분리)
3. push origin subin
4. .claude/scratchpad.md 작업 로그 1줄 추가
5. 새 패턴 → conventions.md / 30분+ 삽질 → lessons.md / 기술 결정 → decisions.md
6. 미푸시 커밋 알림
```

### 묶음 완료 시 (PR 생성)

```
[묶음명] PR 생성:
- 묶음 작업: [작업 번호 리스트]
- subin → dev PR
- 본문에 변경 요약, 영향 파일, 테스트 방법, 스크린샷(있으면) 포함
```

---

## 8. 위험 요소 + 대응

| 위험 | 가능성 | 대응 |
|------|--------|------|
| dev 브랜치 빠르게 변동 (원영님 작업) | 중 | 매일 시작 루틴에서 dev fetch + merge 권장 |
| Q1 redirect 변경으로 외부 링크 깨짐 | 낮음 | 308 영구 리다이렉트로 SEO·외부 링크 모두 보존 |
| M1 프로필 IA 재구성 후 기존 사용자 혼란 | 중 | 첫 로그인 시 1회 변경 안내 모달 (Q9 배너 패턴 재사용) |
| M3 카카오맵 API 쿼터 초과 | 낮음 | 클러스터링 + viewport 제한 + 캐시 |
| 미완성 작업으로 PR 누적 | 중 | 매일 종료 시 commit + push, 묶음 완료 시 PR. 미완성 작업은 draft PR로 |
| 온보딩 변경 후 가입 전환율 측정 어려움 | 중 | M5 적용 전후 가입→첫 경기 신청까지의 클릭 수를 수동 비교 |

---

## 9. 자주 쓸 추가 프롬프트

### 시각 점검 요청

```text
방금 변경한 [페이지명] 을 PC + 모바일 + 다크 + 라이트 4조합으로 점검해줘.
개발 프리뷰 https://mybdr-git-dev-mybdr.vercel.app/[경로] 활용.
이슈 발견 시 errors.md 갱신 후 수정 커밋.
```

### 컴포넌트 일관성 점검

```text
방금 만든 [컴포넌트명] 이 다른 유사 컴포넌트와 시각·동작 일관성이 있는지 검토해줘.
디자인 시스템: BDR Red(#E31B23), 4px radius, Material Symbols, Pretendard.
하드코딩 색상은 var(--color-*) 변수로.
```

### 권한 분기 검증

```text
[페이지명] 의 권한 분기를 검증해줘:
1. 비로그인
2. 일반 사용자
3. 팀장 (해당 시)
4. 협회 admin (해당 시)
5. super_admin

각 케이스에서 노출/비노출/리다이렉트가 정상인지 확인.
```

### 작업 정리 (knowledge 갱신)

```text
오늘 작업한 내용을 knowledge에 정리해줘:
- 새 패턴이면 conventions.md
- 기술 결정이면 decisions.md
- 30분+ 삽질이면 lessons.md
- 구조 변경이면 architecture.md
- 에러 발견이면 errors.md
- index.md 최종 갱신

scratchpad는 100줄 이내 유지.
```

---

## 10. 마무리

이 일정은 **수빈님 단독 + 하루 4~6시간 + subin 브랜치 단일 흐름** 가정입니다. 실제 진행하다 보면:

- **Quick wins(W1)는 예상보다 빠를 가능성** — Claude Code가 단순 변경에 강하니까 Day 5는 검증·회고로 비우는 걸 권장
- **M1 프로필 재구성(W2)은 예상보다 느릴 가능성** — 9개 서브페이지의 데이터 의존성·redirect·기존 사용자 호환을 신경 써야 해서. 3일이 부족하면 M2를 W3로 미루세요
- **M3 코트 지도(W3 시작)는 카카오맵 SDK 적응 시간이 변수** — 이미 코드에 카카오맵을 쓰고 있다면 절반 시간으로 끝날 수도 있음

각 작업의 프롬프트는 **"파일 경로·요구사항·디자인 스펙·검증 방법"** 4요소를 포함했으니 그대로 복붙 가능하고, 필요하면 끝에 **"이 작업 시작 전에 영향 파일 한 번 더 grep 해줘"** 한 줄 추가해서 안전 마진을 두세요.

진행 중에 일정 조정이 필요하면, 같은 형식으로 새 일정 카드를 이어 추가해드릴 수 있어요.
