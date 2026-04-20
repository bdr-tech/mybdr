# L3. 단체 - 시리즈 - 대회 3계층 IA 명확화 (장기 과제)

> 작성: 2026-04-20 (W4 Day 20 회고 · `ux-implementation-plan-2026-04-19.md` L6 연장)
> 범위: 분기 단위 (~12시간 / 2주 분산)
> 진입 시점: 다음 분기 시작 시 — L2 와 일정 조율 (L3 선행 권장)

---

## 1. 배경

도메인 상 엔티티는 **3계층**이다.

```
Organization (단체)
    └── Tournament Series (대회 시리즈)
            └── Tournament (개별 대회, N회차)
```

각각 전용 페이지가 있지만 **계층 관계가 사용자에게 보이지 않는다**.

| 경로 | 파일 | 상위 / 하위 표시 |
|------|------|-------------------|
| `/organizations/[slug]` | organizations/[slug]/page.tsx | 하위 시리즈 리스트 유무 모호 |
| `/organizations/[slug]/series/[seriesSlug]` | ...same.../page.tsx | 상위 단체로 돌아가는 경로 불투명 |
| `/series/[slug]` | series/[slug]/page.tsx | "이 시리즈의 주최 단체" 라벨 없음 |
| `/series/[slug]/[editionNumber]` | series/[slug]/[editionNumber]/page.tsx | 회차 내 대회인데 시리즈/단체 연결 흐림 |
| `/tournaments/[id]` | tournaments/[id]/page.tsx | "소속 시리즈·주최 단체" 표시 미약 |

사용자 피드백:
- "이 대회가 몇 회차인지, 과거 회차는 어디서 보는지 모르겠다"
- "단체 페이지 들어가도 이 단체가 어떤 시리즈를 여는지 한눈에 안 보인다"
- "시리즈 페이지인지 대회 페이지인지 헷갈린다"

---

## 2. 설계 결정

### 결정 A — **브레드크럼 + 역참조 단일 패스 보강** (추천, 저비용 고효과)
각 페이지 상단에 **브레드크럼**을 고정하고, 각 엔티티 페이지에서 **하위 엔티티 리스트 섹션**을 표준 블록으로 추가.

- 브레드크럼 규칙
  - Organization: `Home / 단체`
  - Series (under org): `Home / 단체 / 시리즈명`
  - Series (top-level): `Home / 시리즈 / 시리즈명`
  - Tournament: `Home / 단체 / 시리즈명 / N회차`
- 하위 엔티티 섹션
  - Organization 페이지 하단에 "이 단체의 시리즈" 카드 리스트
  - Series 페이지 하단에 "회차 목록" (과거 → 예정)
  - Tournament 페이지 측면/상단에 "← 시리즈 보기", "이전 회차", "다음 회차" 링크

### 결정 B — 경로 재편
`/series/[slug]` (단독) 과 `/organizations/[slug]/series/[seriesSlug]` (소속) 가 공존 — 일관성 낮음. **시리즈는 반드시 단체 하위로 통일** 검토.

- 장점: IA 단순화
- 단점: 기존 "슈퍼 시리즈"(단체 없이 존재) 데이터 모델 변경 필요. 리다이렉트 대량 발생
- 판단: **현 분기에서는 기각**. 먼저 A(브레드크럼) 로 시각만 통일하고 경로 재편은 데이터 정리 후 결정

### 결정 C — 공용 컴포넌트화
`Breadcrumb`, `EntityRelationPanel` (상위/하위 링크), `EditionSwitcher` (회차 이전/다음) 을 공용 컴포넌트로 제작해 3계층 페이지 전체가 동일 UX 를 쓰도록 한다.

### 추천 = **A + C** 조합
경로는 유지, 시각·네비게이션 블록만 통일.

---

## 3. 영향 페이지 · 파일

### 신규
- `src/components/ia/breadcrumb.tsx` — 엔티티 트리 기반 브레드크럼 (props: trail)
- `src/components/ia/entity-relation-panel.tsx` — 하위 엔티티 카드 섹션
- `src/components/ia/edition-switcher.tsx` — 이전/다음 회차 링크

### 직접 수정
- `src/app/(web)/organizations/[slug]/page.tsx` — 브레드크럼 + "이 단체의 시리즈" 섹션
- `src/app/(web)/organizations/[slug]/series/[seriesSlug]/page.tsx` — 브레드크럼 + 회차 목록
- `src/app/(web)/series/[slug]/page.tsx` — 브레드크럼(단체 연결) + 회차 목록
- `src/app/(web)/series/[slug]/[editionNumber]/page.tsx` — 브레드크럼 4단 + edition switcher
- `src/app/(web)/tournaments/[id]/page.tsx` — 브레드크럼 4단 + "소속 시리즈" 카드 + edition switcher

### API
- `GET /api/web/series/[slug]/editions` — 회차 목록 (소속 대회 id·이름·startDate·status) — 아마 이미 존재하는 prisma query 를 한 번에 써도 되지만 컴포넌트 재사용을 위해 공용 endpoint 검토
- `GET /api/web/organizations/[slug]/series` — 단체 소속 시리즈 목록

---

## 4. 예상 공수 (총 ~12h)

| 단계 | 작업 | 공수 |
|------|------|------|
| 1 | DB / Prisma 관계 재확인 (tournament_series / tournaments / organizations) + 데이터 정합 audit | 1.5h |
| 2 | `Breadcrumb` 공용 컴포넌트 (CSS 변수 기반, 다크/라이트 자동) | 1.5h |
| 3 | `EntityRelationPanel` 공용 컴포넌트 (상위/하위 공통 디자인) | 1.5h |
| 4 | `EditionSwitcher` 공용 컴포넌트 (이전/다음/전체 보기 3버튼) | 1h |
| 5 | 5개 페이지에 브레드크럼·섹션 적용 | 3h |
| 6 | 신규 API 2종 (회차 목록 / 단체 소속 시리즈) | 1.5h |
| 7 | 다크/라이트·PC/모바일 검증 + 링크 회귀 | 1h |
| 8 | `knowledge/architecture.md` 에 "3계층 IA 규약" 기록 | 1h |

---

## 5. 선결 조건 / 리스크

- **선결**: Prisma `tournament_series` / `organizations` 관계 실상 파악. 현재 모든 대회가 시리즈에 속하는지, 모든 시리즈가 단체에 속하는지 audit (아니면 nullable 처리 + "소속 없음" UI)
- **리스크**: 기존 시리즈 슬러그와 단체 슬러그가 동일 문자열일 경우 브레드크럼이 혼동을 주어 자동 매핑 실패 가능 → Prisma relation 명시적 사용 (slug 문자열 비교 금지)
- **L2(프로필 통합) 와 교차**: 사용자 프로필에 "소속 팀 → 팀이 참가한 대회 → 해당 대회의 시리즈/단체" 체인이 나올 수 있음. **L3 선행 → L2 에서 브레드크럼 재활용** 하는 흐름이 공수 절감에 유리

---

## 6. 완료 기준 (DoD)

- [ ] 5개 페이지 모두 상단에 일관된 브레드크럼이 표시된다 (4단까지)
- [ ] Organization / Series 페이지에서 하위 엔티티 리스트 섹션이 카드 디자인으로 노출된다
- [ ] Tournament 페이지에서 "이전 회차 / 다음 회차 / 시리즈 보기" 3링크가 동작한다
- [ ] 신규 공용 컴포넌트 3종 (`Breadcrumb`, `EntityRelationPanel`, `EditionSwitcher`) 이 `src/components/ia/` 아래 존재한다
- [ ] `knowledge/architecture.md` 에 "3계층 IA 규약 (2026-Qn)" 항목이 추가된다
- [ ] 기존 링크 404 발생 0건 (경로 유지)
