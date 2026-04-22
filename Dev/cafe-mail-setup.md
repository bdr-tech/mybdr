# cafe-sync 메일 알림 설정 가이드

> 작성: 2026-04-22 · 대상: 수빈
> Slack → 메일 전환 완료 (cafe-sync.yml, cafe-sync-verify.yml)
> 수신자 고정: **cobby8@stiz.kr**, **bdrbasket@gmail.com**

---

## 왜 메일?

| 비교 | Slack | 메일 |
|------|-------|------|
| 팀 멤버십 관리 | 워크스페이스 가입 필요 | 주소만 알면 OK |
| 히스토리 검색 | 유료 플랜 제한 | 무한 (Gmail 검색) |
| 모바일 알림 | 앱 설치 필요 | 기본 메일 앱 |
| 개인 운영 | 채널 관리 부담 | 받은편지함에 바로 |

---

## 1회 설정 (5분) — Gmail 앱 비밀번호

GitHub Actions의 SMTP 발송자 계정이 필요합니다. **Gmail 권장** (무료, 빠름).

### Step 1. 2단계 인증 활성화

발송용 Gmail 계정에 로그인 → https://myaccount.google.com/security →
**"Google에 로그인" > "2단계 인증"** 설정 (없으면).

### Step 2. 앱 비밀번호 발급

https://myaccount.google.com/apppasswords 접속 →

1. **앱 이름**: "mybdr cafe-sync" (또는 원하는 이름)
2. **생성** 클릭 → 16자리 비밀번호 표시됨 (예: `abcd efgh ijkl mnop`)
3. 공백 포함 그대로 복사 (공백은 GitHub secret 등록 시 유지해도 자동 처리됨)

> 앱 비밀번호는 **1회만 표시됨**. 못 본 채 창 닫으면 삭제 후 재발급.

### Step 3. GitHub Secret 등록

repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret 이름 | 값 |
|-------------|-----|
| `MAIL_USERNAME` | 발송 Gmail 주소 (예: `mybdr.sync@gmail.com`) |
| `MAIL_APP_PASSWORD` | 위 Step 2에서 받은 16자리 앱 비밀번호 (공백 포함 가능) |

### Step 4. 즉시 테스트

**Actions** 탭 → **cafe-sync-verify** workflow → **Run workflow** 클릭 →
`execute_issues=false`, `since_hours=24` 기본값으로 실행 →
~2분 후 **cobby8@stiz.kr / bdrbasket@gmail.com** 수신함 확인.

> `severity=ok`이면 제목만 "정상 운영 중" 한 줄, 이상 시 지표 상세 포함.

---

## 알림 종류 2개

### A. cafe-sync 실패 알림 (매시 검사 실패 시)

- 트리거: `cafe-sync.yml` workflow가 **실패한 경우만**
- 제목 예: `[cafe-sync] 실패 — 런 #1234` / `[cafe-sync] 실패 (쿠키 만료 의심) — 런 #1234`
- 본문: 게시판별 수집 요약 + 최근 로그 50줄 + (403/401 감지 시) 쿠키 갱신 안내

### B. cafe-sync-verify 일일 리포트 (매일 KST 08:10)

- 트리거: **매일 1회 자동**
- 제목 예: `[cafe-sync-verify] OK · 2026-04-22 · 최근 24h`
- 본문:
  - `severity=ok` → "정상 운영 중" 1줄 (본문 최소)
  - `severity=warn/alert` → 이상 지표 표 + 추천 조치

---

## 수신자 변경

`.github/workflows/cafe-sync.yml` + `cafe-sync-verify.yml` 의 `to:` 필드 수정:

```yaml
to: cobby8@stiz.kr, bdrbasket@gmail.com
```

콤마 구분으로 추가/제거 가능. 수정 후 push하면 바로 반영.

---

## 문제 진단

### 메일이 안 오면

1. **Secret 등록 확인** — repo Settings → Secrets에 `MAIL_USERNAME` + `MAIL_APP_PASSWORD` 둘 다 있는지
2. **workflow 실행 로그 확인** — Actions 탭 → 실패 run 열기 → "Send ... mail" step
   - `HAS_MAIL_SECRET == 'false'` → Secret 미등록 (Step 3 다시 확인)
   - "Authentication failed" → 앱 비밀번호 오타 / 2단계 인증 꺼져있음
3. **스팸함 확인** — 첫 수신 시 스팸 분류 가능. `From: cafe-sync bot <...>` 도메인을 **"스팸 아님"** 표시 필요

### Gmail 대신 회사 SMTP 쓰려면

`.github/workflows/cafe-*.yml` 의 `server_address` / `server_port` / `secure` 수정:

```yaml
server_address: smtp.stiz.kr   # 예시
server_port: 587               # STARTTLS 면 587, SSL 이면 465
secure: false                   # 587 STARTTLS 일 때 false
```

SMTP 계정 정보는 여전히 `MAIL_USERNAME` / `MAIL_APP_PASSWORD` secret 재사용.

---

## 기존 Slack 관련 정리

- 기존 `SLACK_WEBHOOK_URL` secret: **삭제하지 않고 유지** (혹시 나중에 병행할 수 있음)
- 관련 코드: 완전히 제거됨 (curl + Webhook 경로 없음)
- 되돌리기: git log에서 `fb3f5b7` / `56f7437` 전후 복원 가능
