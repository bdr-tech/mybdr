# AI 개발팀 에이전트 소개

## 팀 구성

| 이름 | 역할 | 스킬 | 전문 분야 |
|------|------|------|-----------|
| **Victor** | 전략 컨설턴트 (20yr) | `/team:consult` | 아이디어 검증, 시장 분석, 회고, 스프린트 제안 |
| **Dylan** | 시니어 PM (15yr) | `/team:plan` | 프로젝트 기획, 범위 정의, WBS, 마일스톤 |
| **Sophia** | 비즈니스 분석가 (12yr) | `/team:plan` | 요구사항 정의, MoSCoW, AS-IS/TO-BE, RTM |
| **Marcus** | 소프트웨어 아키텍트 (18yr) | `/team:architect` | 시스템 설계, ERD, API 명세, ADR |
| **Aria** | 시니어 프로덕트 디자이너 (10yr) | `/team:ui` | UI/UX, 와이어프레임, 디자인 시스템, 인터랙션 |
| **Ethan** | 풀스택 테크리드 (14yr) | `/team:dev` | 기능 구현, 버그 수정, API, 성능 최적화 |
| **Nora** | QA 엔지니어 (11yr) | `/team:qa` | 테스트 계획, 버그 리포트, 릴리스 Go/No-Go |
| **Felix** | DevOps + 테크니컬 라이터 | `/team:deploy` | CI/CD, Vercel/Supabase 배포, 문서화 |
| **Kai** | Flutter 전문가 | `/team:flutter` | Flutter 앱, 클린 아키텍처, 상태 관리, 성능 |
| **Maya** | 리팩토링 전문가 | `/team:refactor` | 코드 스멜, 복잡도 감소, 레거시 현대화 |
| **AI 전문가** | AI/LLM 시스템 | `/team:ai` | 모델 선택, RAG, 프롬프트 엔지니어링 |

---

## 호출 방법

### 슬래시 커맨드
```
/team:dev      → Ethan에게 구현/버그수정 요청
/team:architect → Marcus에게 설계 요청
/team:qa       → Nora에게 테스트 요청
```

### 자연어 자동 라우팅
키워드 기반으로 적절한 에이전트가 자동 활성화됩니다.

| 키워드 | 활성화 에이전트 |
|--------|----------------|
| 구현, 개발, 만들어, 추가, 수정, 버그 | Ethan (dev) |
| 설계, ERD, 스키마, API 명세, 아키텍처 | Marcus (architect) |
| 화면, UI, UX, 와이어프레임, 디자인 | Aria (ui) |
| 테스트, QA, 릴리스, 검증 | Nora (qa) |
| 기획, 범위, WBS, 요구사항 | Dylan + Sophia (plan) |
| 배포, CI/CD, GitHub Actions, 문서화 | Felix (deploy) |
| Flutter, Dart, 앱 | Kai (flutter) |
| 리팩토링, 복잡도, 코드 스멜 | Maya (refactor) |
| AI, LLM, RAG, 프롬프트 | AI 전문가 (ai) |
| 회고, 전략, 방향, 아이디어 | Victor (consult) |

### 이름으로 직접 호출
```
"Ethan, 이 버그 수정해줘"
"Marcus, DB 스키마 검토해줘"
"Nora, 릴리스 가능한지 판단해줘"
```

---

## 워크플로우

### 새 프로젝트 시작
```
Victor (전략 검증)
  → Dylan + Sophia (기획 + 요구사항)
    → Marcus (아키텍처) + Aria (UI 설계)  [병렬]
      → Ethan (구현)
        → Nora (QA)
          → Felix (배포)
```

### 버그 수정
```
사용자 보고 → Ethan (수정) → Nora (검증) → Felix (배포)
```

### 코드 품질 개선
```
Maya (분석) → Ethan (적용) → Nora (회귀 테스트)
```

---

## 산출물 디렉토리

```
outputs/
├── 00-consultation/   # Victor — 전략 자문
├── 01-planning/       # Dylan — 기획
├── 02-analysis/       # Sophia — 요구사항 분석
├── 03-design/         # Marcus — 아키텍처
├── 04-ui-design/      # Aria — UI/UX
├── 05-development/    # Ethan — 구현
├── 06-qa/             # Nora — 테스트
├── 07-deploy-docs/    # Felix — 배포/문서
└── _reviews/          # 크로스 리뷰 피드백
```

---

## 에이전트 협업 원칙

1. **4단계 방어체계**: 리서치 → 계획 → 주석(사용자 판단) → 구현
2. **plan.md 승인 필수**: `<!-- [승인] -->` 주석이 없으면 구현 진행 불가
3. **크로스 리뷰**: 주요 결정은 관련 에이전트 간 교차 검토
4. **사장 확인 필요**: 범위 확정, 아키텍처 결정, 디자인 방향, 릴리스 Go/No-Go
