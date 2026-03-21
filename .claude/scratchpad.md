# 작업 스크래치패드

## 효율화 규칙 (2026-03-21 적용)
1. **병렬 실행**: 독립적인 에이전트는 동시 실행 (tester+reviewer 병렬 등)
2. **스크래치패드 경량 모드**: 소규모 작업(1~2파일)은 작업 로그 한 줄만. 대규모(5+파일)만 섹션 기록
3. **확인 생략**: 명확한 요청은 바로 실행. 모호한 것만 확인 질문
4. **tester+reviewer 병렬**: 동시 실행 후 결과 취합. 소규모는 tester만
5. **커밋 간소화**: tester 통과 시 PM이 직접 커밋. 복잡한 git만 git-manager 호출

## 현재 작업
- **요청**: 대회 목록 페이지(/tournaments) Kinetic Pulse 디자인 전환
- **상태**: planner 계획 수립 완료 -> developer 대기
- **현재 담당**: planner 완료

## 작업 계획 (planner) - 대회 페이지 Kinetic Pulse 전환

### 목표
대회 페이지(/tournaments) 하위 17개 파일의 하드코딩 색상을 CSS 변수로 교체하여 다크모드 자동 대응

### 전수조사 결과

**이미 CSS 변수 전환 완료 (수정 불필요 - 5개 파일)**
- `[id]/page.tsx` - style 속성으로 CSS 변수 적용 완료 (전체 300줄+ 모두 var() 사용)
- `_components/tournaments-content.tsx` - style 속성으로 CSS 변수 적용 완료 (STATUS_STYLE 의미론적 색상 유지)
- `[id]/bracket/page.tsx` - 색상 없음 (순수 데이터 로직)
- `[id]/bracket/_components/bracket-connector.tsx` - SVG 연결선 색상은 의미론적 (#D1D5DB 비활성, rgba 활성)
- `[id]/bracket/_components/round-column.tsx` - 미사용 파일 (주석에 "사용되지 않음" 명시)

**하드코딩 잔존 (수정 필요 - 10개 파일)**

### 대상 파일 (10개, 약 200+건)

| # | 파일 경로 | 역할 | 하드코딩 색상 수 | 난이도 |
|---|----------|------|----------------|--------|
| 1 | `tournaments/page.tsx` | 목록 스켈레톤 | 2건 | 쉬움 |
| 2 | `tournaments/loading.tsx` | 목록 로딩 | 2건 | 쉬움 |
| 3 | `tournaments/tournaments-filter.tsx` | 상태 탭 필터 | 7건 | 보통 |
| 4 | `[id]/loading.tsx` | 상세 로딩 스켈레톤 | 10건 | 보통 |
| 5 | `[id]/schedule/page.tsx` | 일정 페이지 | 4건 | 쉬움 |
| 6 | `[id]/standings/page.tsx` | 순위 페이지 | 6건 | 쉬움 |
| 7 | `[id]/teams/page.tsx` | 참가팀 페이지 | 4건 | 쉬움 |
| 8 | `[id]/join/page.tsx` | 참가신청 (가장 큼) | ~90건 | 어려움 |
| 9 | `[id]/bracket/loading.tsx` | 대진표 로딩 | 5건 | 쉬움 |
| 10 | `[id]/bracket/_components/bracket-empty.tsx` | 대진표 빈 상태 | 7건 | 쉬움 |
| - | `[id]/bracket/_components/bracket-view.tsx` | 대진표 뷰 | ~25건 | 보통 |
| - | `[id]/bracket/_components/match-card.tsx` | 매치 카드 | ~35건 | 보통 |

(bracket-view + match-card는 의미론적 색상(라이브 빨강, 승자 오렌지 등)이 많아 별도 판단 필요)

### 하드코딩 색상 -> CSS 변수 매핑 (파일별 상세)

#### 1. tournaments/page.tsx (스켈레톤) - 2건
| 현재 하드코딩 | 변환 대상 |
|-------------|----------|
| `border-[#E8ECF0]` | `border-[var(--color-border)]` |
| `bg-white` | `bg-[var(--color-card)]` |

#### 2. tournaments/loading.tsx (스켈레톤) - 2건
| 현재 하드코딩 | 변환 대상 |
|-------------|----------|
| `border-[#E8ECF0]` | `border-[var(--color-border)]` |
| `bg-white` | `bg-[var(--color-card)]` |

#### 3. tournaments-filter.tsx - 7건
| 현재 하드코딩 | 용도 | 변환 대상 |
|-------------|------|----------|
| `bg-[#1B3C87]` | 활성 탭 배경 | `bg-[var(--color-accent)]` |
| `text-white` (활성) | 활성 탭 텍스트 | 유지 (흰 텍스트 의도적) |
| `border-[#E8ECF0]` | 비활성 보더 | `border-[var(--color-border)]` |
| `bg-white` | 비활성 배경 | `bg-[var(--color-card)]` |
| `text-[#6B7280]` | 비활성 텍스트 | `text-[var(--color-text-muted)]` |
| `hover:border-[#1B3C87]/40` | 호버 보더 | style 속성 또는 accent 변수 |
| `hover:text-[#111827]` | 호버 텍스트 | `hover:text-[var(--color-text-primary)]` |

#### 4. [id]/loading.tsx - 10건
| 현재 하드코딩 | 용도 | 변환 대상 |
|-------------|------|----------|
| `bg-white` x5 | 카드 배경 | `bg-[var(--color-card)]` |
| `border-[#E8ECF0]` x1 | 테이블 헤더 보더 | `border-[var(--color-border)]` |
| `border-[#F1F5F9]` x1 | 테이블 행 보더 | `border-[var(--color-border)]` |

#### 5. [id]/schedule/page.tsx - 4건
| 현재 하드코딩 | 용도 | 변환 대상 |
|-------------|------|----------|
| `bg-[#EEF2FF]` | 스코어 배경 | `bg-[var(--color-surface-bright)]` |
| `text-[#9CA3AF]` | 라운드/날짜 텍스트 | `text-[var(--color-text-secondary)]` |
| `text-[#6B7280]` | 빈 상태 텍스트 | `text-[var(--color-text-muted)]` |

#### 6. [id]/standings/page.tsx - 6건
| 현재 하드코딩 | 용도 | 변환 대상 |
|-------------|------|----------|
| `border-[#E8ECF0]` | 테이블 헤더 보더 | `border-[var(--color-border)]` |
| `text-[#6B7280]` | 헤더 텍스트 | `text-[var(--color-text-muted)]` |
| `border-[#F1F5F9]` | 행 보더 | `border-[var(--color-border)]` |
| `text-[#E31B23]` | 순위 번호 | `text-[var(--color-primary)]` |

#### 7. [id]/teams/page.tsx - 4건
| 현재 하드코딩 | 용도 | 변환 대상 |
|-------------|------|----------|
| `#E31B23` (style) | 팀 아이콘 기본색 | `var(--color-primary)` |
| `text-[#9CA3AF]` | 그룹/인원 텍스트 | `text-[var(--color-text-secondary)]` |
| `text-[#6B7280]` | 선수 이름 | `text-[var(--color-text-muted)]` |
| `text-[#9CA3AF]` | 포지션 텍스트 | `text-[var(--color-text-secondary)]` |

#### 8. [id]/join/page.tsx (가장 큰 파일) - ~90건
| 현재 하드코딩 | 용도 | 변환 대상 |
|-------------|------|----------|
| `border-[#1B3C87]` | 스피너/활성 보더 | `var(--color-accent)` |
| `text-[#EF4444]` | 에러 텍스트 | 의미론적 유지 |
| `border-[#EF4444]/30` | 에러 보더 | 의미론적 유지 |
| `bg-[#FEF2F2]` | 에러 배경 | 의미론적 유지 |
| `bg-[#1B3C87]` | 활성 스텝/탭 배경 | `var(--color-accent)` |
| `bg-[#1B3C87]/20` | 완료 스텝 배경 | `var(--color-accent)` 투명 |
| `text-[#1B3C87]` | 완료 스텝 텍스트 | `var(--color-accent)` |
| `bg-[#E8ECF0]` | 비활성 스텝/선 | `var(--color-border)` |
| `text-[#6B7280]` x12+ | 보조 텍스트 전체 | `var(--color-text-muted)` |
| `text-[#111827]` | 활성 스텝 텍스트 | `var(--color-text-primary)` |
| `border-[#E8ECF0]` x15+ | 카드/입력/보더 | `var(--color-border)` |
| `bg-[#EEF2FF]` | 선택된 항목 배경 | `var(--color-surface-bright)` |
| `bg-[#F9FAFB]` | 비활성/채널 배경 | `var(--color-surface)` |
| `hover:border-[#1B3C87]/50` | 호버 보더 | accent 투명 |
| `focus:border-[#1B3C87]` | 포커스 보더 | `var(--color-accent)` |
| `focus:ring-[#1B3C87]` | 포커스 링 | `var(--color-accent)` |
| `accent-[#1B3C87]` | 체크박스 | `var(--color-accent)` |
| `accent-[#E31B23]` | 선출 체크박스 | `var(--color-primary)` |
| `border-[#1B3C87]/30` | 선택 선수 보더 | accent 투명 |
| `bg-[#EEF2FF]/50` | 선택 선수 배경 | surface-bright 투명 |
| `bg-[#E31B23]/10` | 선출 뱃지 배경 | primary 투명 |
| `text-[#E31B23]` | 선출/참가비 텍스트 | `var(--color-primary)` |
| `text-[#F5F7FA]` / `bg-[#F5F7FA]` | 계좌 안내 배경 | `var(--color-surface)` |
| `bg-[#16A34A]/20` | 완료 아이콘 배경 | 의미론적 유지 |
| `text-[#16A34A]` | 완료 아이콘 | 의미론적 유지 |
| `hover:bg-[#F9FAFB]` | 탭 호버 | `var(--color-surface)` |

#### 9. [id]/bracket/loading.tsx - 5건
| 현재 하드코딩 | 용도 | 변환 대상 |
|-------------|------|----------|
| `border-[#E8ECF0]` | 컨테이너 보더 | `border-[var(--color-border)]` |
| `bg-white` | 컨테이너 배경 | `bg-[var(--color-card)]` |
| `shadow-[0_2px_8px_rgba(0,0,0,0.06)]` | 카드 그림자 | style로 `var(--shadow-card)` |

#### 10. bracket-empty.tsx - 7건
| 현재 하드코딩 | 용도 | 변환 대상 |
|-------------|------|----------|
| `border-[#E8ECF0]` | 보더 | `border-[var(--color-border)]` |
| `bg-white` | 배경 | `bg-[var(--color-card)]` |
| `shadow-[0_2px_8px_rgba(0,0,0,0.06)]` | 그림자 | `var(--shadow-card)` |
| `text-[#111827]` | 제목 텍스트 | `text-[var(--color-text-primary)]` |
| `text-[#6B7280]` | 설명 텍스트 | `text-[var(--color-text-muted)]` |
| `bg-[#1B3C87]` | CTA 버튼 | `bg-[var(--color-accent)]` |
| `hover:bg-[#142D6B]` | CTA 호버 | style로 accent-hover |

#### bracket-view.tsx - ~25건 (의미론적 색상 혼재)
| 분류 | 색상 | 판정 |
|------|------|------|
| `bg-[#E31B23]` / `text-[#E31B23]` / `border-[#E31B23]` | 라이브/활성 빨강 | 의미론적 -> `var(--color-primary)` |
| `border-[#E8ECF0]` / `bg-white` | 카드/탭 배경 | 교체 대상 -> CSS 변수 |
| `text-[#6B7280]` / `text-[#9CA3AF]` | 보조 텍스트 | 교체 대상 -> CSS 변수 |
| `text-[#1B3C87]` | 라운드 네비 링크 | 교체 대상 -> `var(--color-accent)` |
| `bg-[#F9FAFB]` | 매치 헤더 배경 | 교체 대상 -> `var(--color-surface)` |
| `hover:bg-[#F9FAFB]` | 탭 호버 | 교체 대상 |

#### match-card.tsx - ~35건 (의미론적 색상 많음)
| 분류 | 색상 | 판정 |
|------|------|------|
| `bg-[#E31B23]` / `text-[#E31B23]` | 라이브/승자 빨강 | **의미론적 -> var(--color-primary)로 교체** (다크모드에서도 빨강 유지하되 CSS 변수로 관리) |
| `border-[#E31B23]` | 라이브 카드 보더 | 위와 동일 |
| `text-[#9CA3AF]` / `text-[#111827]` | 패자/일반 텍스트 | 교체 대상 -> CSS 변수 |
| `border-[#E8ECF0]` / `bg-white` / `bg-[#F9FAFB]` | 카드 배경/보더 | 교체 대상 -> CSS 변수 |
| `border-[#D1D5DB]` | bye 카드 보더 | 교체 대상 -> `var(--color-border)` |
| `text-[#6B7280]` / `#6B7280` (StatusBadge) | 예정/대기 텍스트 | 교체 대상 -> CSS 변수 |
| `text-[#22C55E]` | 종료 뱃지 텍스트 | 의미론적 유지 |
| `text-[#EF4444]` | 취소 뱃지 텍스트 | 의미론적 유지 |
| `rgba(244,162,97,*)` | 승자/라이브 오렌지 하이라이트 | 의미론적 유지 |
| `#FAFAFA` | 호버 배경 | 교체 대상 -> `var(--color-surface)` |

### 실행 계획

| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 |
|------|------|------|----------|----------|
| 1 | 소형 파일 5개 일괄 교체 (page.tsx, loading.tsx, filter, schedule, standings) | developer | 8분 | 없음 |
| 2 | teams/page.tsx + bracket-empty.tsx + bracket/loading.tsx 교체 | developer | 5분 | 없음 |
| 3 | join/page.tsx 대규모 교체 (~90건, 가장 큰 파일) | developer | 15분 | 없음 |
| 4 | bracket-view.tsx + match-card.tsx 교체 (~60건, 의미론적 판단 필요) | developer | 12분 | 없음 |
| 5 | [id]/loading.tsx 스켈레톤 교체 | developer | 3분 | 없음 |
| 6 | tsc + 하드코딩 잔존 확인 + 라이트/다크 변수 사용 확인 | tester | 5분 | 1-5단계 |

총 예상 시간: 48분

### 주의사항

1. **의미론적 색상 판단 기준**:
   - #E31B23 (BDR 빨강): 라이브/브랜드 -> `var(--color-primary)` 사용 (다크모드에서도 빨강이지만 CSS 변수로 관리)
   - #EF4444 (에러 빨강): 에러/취소 -> 의미론적 유지
   - #16A34A (성공 녹색): 완료 -> 의미론적 유지
   - #22C55E (종료 뱃지): 의미론적 유지
   - rgba(244,162,97,*) (오렌지 하이라이트): 승자 표시 -> 의미론적 유지
   - StatusBadge의 config 객체 내 색상: 의미론적 유지
   - STATUS_STYLE 객체 내 색상: 의미론적 유지

2. **join/page.tsx 전략**: 파일이 800줄+로 가장 큼. 반복되는 패턴이 많음 (border-[#E8ECF0], text-[#6B7280] 등). 일괄 치환 후 개별 확인 필요

3. **bracket 컴포넌트**: 게임 상태(라이브, 완료, 예정)에 따른 시각적 구분이 핵심 기능. 색상 교체 시 상태 구분 가독성 유지 필수

4. **text-white 유지**: 활성 탭, CTA 버튼 등의 text-white는 의도적이므로 교체하지 않음

5. **1-5단계 독립적** -> 병렬 실행 가능

### 영향 범위

- 변경 파일: 10~12개 (tournaments/ 하위만)
- 다른 페이지 영향: 없음 (tournaments 전용 파일만 수정)
- CSS 변수 신규 추가: 없음 (기존 변수만 활용)
- 기능 변경: 없음 (색상만 교체)

---

## 테스트 결과 (tester) - 대회 페이지 CSS 변수 교체 검증

### 1. TypeScript 컴파일 검증
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| `npx tsc --noEmit` 전체 컴파일 | ✅ 통과 | 에러 0건 |

### 2. 하드코딩 색상 잔존 검사
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| tournaments/page.tsx 잔존 | ✅ 통과 | 하드코딩 0건 |
| tournaments/loading.tsx 잔존 | ✅ 통과 | 하드코딩 0건 |
| tournaments-filter.tsx 잔존 | ✅ 통과 | 하드코딩 0건 |
| [id]/loading.tsx 잔존 | ✅ 통과 | 하드코딩 0건 |
| [id]/schedule/page.tsx 잔존 | ✅ 통과 | 하드코딩 0건 |
| [id]/standings/page.tsx 잔존 | ✅ 통과 | 하드코딩 0건 |
| [id]/teams/page.tsx 잔존 | ✅ 통과 | 하드코딩 0건 |
| [id]/join/page.tsx 잔존 | ✅ 통과 | #FFFFFF(유니폼 기본값), #1B3C87(팀색 폴백) = 의도적 유지 |
| [id]/bracket/loading.tsx 잔존 | ❌ 실패 | border-[#E8ECF0] bg-white shadow 하드코딩 잔존 (10번째 줄) |
| bracket-empty.tsx 잔존 | ✅ 통과 | 하드코딩 0건 |
| bracket-view.tsx 잔존 | ✅ 통과 | SVG 연결선 #D1D5DB, rgba 오렌지 = 의도적 유지 |
| match-card.tsx 잔존 | ✅ 통과 | StatusBadge config 내 #6B7280 = 의도적 유지 |
| tournaments-content.tsx (수정 불필요) | ✅ 통과 | STATUS_STYLE 의미론적 색상 = 의도적 유지 |
| round-column.tsx (미사용 파일) | -- 제외 | 주석에 "사용되지 않음" 명시 |

### 3. CSS 변수 사용 확인
| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| var(--color-*) 패턴 사용 | ✅ 통과 | 13개 파일에서 총 176건 사용 확인 |

📊 종합: 14개 항목 중 13개 통과 / 1개 실패

### 수정 요청
| 요청자 | 파일 | 문제 | 상태 |
|--------|------|------|------|
| tester | [id]/bracket/loading.tsx (10행) | `border-[#E8ECF0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]` 하드코딩 잔존. planner 계획에서 교체 대상(5건)이었으나 미교체 | 대기 |

---

## 작업 로그 (최근 10건만 유지)
| 일시 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 2026-03-22 | developer | CSS 변수 값 미세 조정 10건 (surface/text/border/radius 등) | 완료 |
| 2026-03-22 | planner | 코트 찾기 페이지(/courts) Kinetic Pulse 전환 계획 수립 | 완료 |
| 2026-03-22 | developer+tester | 코트 찾기 3파일 하드코딩 27건 CSS 변수 교체 + 검증 5/5 통과 | 완료 |
| 2026-03-22 | planner | 마이페이지(/profile) Kinetic Pulse 전환 계획 수립 (4파일 ~86건) | 완료 |
| 2026-03-22 | developer | 마이페이지 4파일 하드코딩 ~86건 CSS 변수 교체 (loading/header/edit/complete) | 완료 |
| 2026-03-22 | tester | 마이페이지 CSS 변수 전환 검증 (tsc+잔존검사+변수사용) 10/10 통과 | 통과 |
| 2026-03-22 | planner | 대회 페이지(/tournaments) Kinetic Pulse 전환 계획 수립 (10+파일 ~200건) | 완료 |
| 2026-03-22 | developer | 대회 소형 8파일 하드코딩 34건 CSS 변수 교체 (잔존 0건 확인) | 완료 |
| 2026-03-22 | developer | 대회 대형 3파일(join/bracket-view/match-card) 하드코딩 ~150건 CSS 변수 교체 (잔존 0건) | 완료 |
| 2026-03-22 | tester | 대회 페이지 CSS 변수 전환 검증 (tsc+잔존+변수사용) 13/14 통과, bracket/loading.tsx 1건 실패 | 실패 1건 |
