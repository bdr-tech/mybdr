# Claude Cowork — 다음카페 쿠키 자동 갱신 셋업 가이드

> 작성: 2026-04-23 · 대상: 수빈
> 목적: 다음카페 세션 쿠키가 카카오 정책상 **매일 만료**되는 문제를 Cowork(desktop agent)로 완전 자동화
> 전제: Claude Max ($200) 구독 + Windows 로컬 PC 매일 ON + Chrome 에 카카오 ID/PW 저장

---

## 📋 전체 흐름

```
매일 (수빈이 설정한 시간)
  ↓
Cowork 실행 (recurring task)
  ↓
터미널에서 `npx tsx scripts/cafe-login.ts --auto-wait --push-secret --random-delay=30` 실행
  ↓
Playwright Chromium 창이 열림
  ↓
Cowork 이 창 제어:
  1. ID 입력 필드 클릭 → Chrome 자동 채움 popup → 카카오 ID 선택
  2. 비밀번호 자동 입력됨
  3. "로그인" 버튼 클릭
  ↓
스크립트가 세션 쿠키 감지 → .auth/cafe-state.json 저장
  ↓
`refresh-cafe-cookie.ts --skip-login` 자동 실행 → GitHub Secret 갱신
  ↓
완료 (수빈 개입 0)

예외:
  - CAPTCHA/2FA 발생 시 → Cowork 이 알림 메일 발송 + 태스크 중단
  - 카카오 UI 변경 → 동일
```

---

## 🛠️ 1회 셋업 (약 10분)

### Step 1. Chrome 에 카카오 ID/PW 저장

1. Chrome 실행 → `accounts.kakao.com` 접속
2. 로그인 시도 → 로그인 완료
3. Chrome 이 "비밀번호 저장하시겠습니까?" 팝업 → **저장** 클릭
4. 저장 확인: `chrome://settings/passwords` → `accounts.kakao.com` 항목 존재

> 이미 저장돼 있으면 스킵 (오늘 `cafe-login.ts` 실행 시 "간편로그인 정보 저장" 체크돼있었으니 대부분 저장돼있음)

### Step 2. Cowork 앱에서 프로젝트 연결

1. Cowork 앱 실행
2. **Projects** → **Add Project** → `C:\0. Programing\mybdr` 선택
3. 프로젝트 권한 설정 — 최소 **Terminal**, **Chrome** 접근 허용

### Step 3. Recurring Task 등록

Cowork 앱 → **Tasks** → **Create Recurring Task** → 아래 프롬프트 복붙:

```
다음카페 쿠키 자동 갱신 태스크

## 목표
다음카페(m.cafe.daum.net) 세션 쿠키를 재발급받아 GitHub Secret 을 갱신한다.

## 실행 단계
1. 터미널에서 프로젝트 디렉토리로 이동:
   cd "C:\0. Programing\mybdr"

2. 다음 명령 실행:
   npx tsx scripts/cafe-login.ts --auto-wait --push-secret --random-delay=30

3. Playwright Chromium 창이 열리면 다음 작업 수행:
   a. 페이지가 로드되면 상단에 "로그인" 버튼 클릭
   b. 카카오 로그인 페이지로 이동됨
   c. ID 입력 필드 클릭 → Chrome 자동 채움 제안 뜨면 카카오 계정 선택
      (자동 채움 안 뜨면 수동으로 cobby8@kakao.com 입력 후 Tab 키)
   d. 비밀번호 자동 채움 되었는지 확인 (안 됐으면 Chrome 비밀번호 관리자 확인)
   e. "로그인" 버튼 클릭
   f. 로그인 완료 대기 (스크립트가 세션 쿠키 자동 감지)

4. 스크립트가 자동으로 진행:
   - 쿠키 저장 (.auth/cafe-state.json)
   - GitHub Secret 갱신 (refresh-cafe-cookie.ts)
   - 종료 로그 확인

5. 성공 판정:
   - 마지막 출력에 "✅ Secret 갱신 완료" 포함
   - exit code 0

## 실패 시 (중요)
다음 중 하나라도 발생하면 **태스크 중단 + 수빈에게 알림 메일 발송**:
- CAPTCHA 이미지 출현
- 2단계 인증 코드 요청
- "비정상 접근" / "기기 인증 필요" 메시지
- 카카오 UI 가 평소와 달라 진행 불가
- auto-wait timeout (10분)
- Secret 갱신 실패 (exit code 3)

알림 메일은 다음 주소로 발송:
- cobby8@stiz.kr
- bdrbasket@gmail.com

제목: "[cafe-cowork] 쿠키 갱신 실패 — 수동 개입 필요"
본문: 실패 단계 + 스크린샷 + 마지막 터미널 출력

## 제약
- 로그인 후 추가 작업 하지 말 것 (본문 열기, 게시판 탐색 등 불필요)
- 스크립트가 알아서 Chromium 창을 닫음 — 수동으로 닫지 말 것
- 프로젝트 디렉토리의 다른 파일 수정 금지
```

### Step 4. Schedule 설정

Cowork Task 에 **cadence** 설정:
- **Frequency**: Daily
- **Time**: 하루 중 임의 시간대 (예: 09:00 ~ 14:00 사이)
- Cowork 이 자체 랜덤 타이밍 지원 안 하면 `--random-delay=30` 플래그가 0~30분 sleep 처리 (스크립트 내부에서 랜덤화)

**추천 시간 설정**:
- 시작 시간: 09:30 (오전 러시 피한 지점)
- `--random-delay=30` 으로 실제 실행은 09:30 ~ 10:00 사이 매일 다른 시각

### Step 5. 첫 실행 (수동 트리거)

Cowork Task 등록 후 **즉시 1회 수동 실행**해서 전 과정 검증:

1. Cowork 앱 → 해당 Task → **Run Now**
2. Cowork 이 Chromium 창을 띄우고 로그인 진행 관찰
3. 완료 후 확인:
   - 터미널 마지막 출력에 `✅ Secret 갱신 완료`
   - GitHub Actions → cafe-sync-verify 수동 트리거로 I4 지표 `ok` 전환 확인

---

## 📊 관찰 첫 주 (2026-04-24 ~ 04-30)

### 매일 확인

- [ ] KST 08:10 경 도착하는 `cafe-sync-verify` 일일 리포트 메일의 **severity** 체크
  - `ok` → Cowork 정상 작동
  - `alert` (I4=0) → Cowork 전날 실패 — Cowork 로그 확인
- [ ] Gmail 에 `[cafe-cowork] 쿠키 갱신 실패` 제목 메일 없는지 확인
  - 있으면 수동 fallback: `npx tsx scripts/cafe-login.ts --push-secret`

### 주간 리뷰 (04-30)

Cowork 성공률 계산:
- 7일 중 자동 갱신 성공 몇 회?
- 실패 원인 분류 (CAPTCHA / UI 변경 / 타임아웃 / 기타)
- 성공률 **80% 이상** → 운영 유지
- **80% 미만** → PoC 종료 + B안(매일 수동 1분) 전환 검토

---

## 🚨 리스크 & 대응

| # | 리스크 | 대응 |
|---|--------|------|
| 1 | 카카오 봇 탐지 → 계정 잠금 | `--random-delay` 로 시간 분산 / User-Agent 정상 모바일 유지 / 주 1회 이상 실패 누적 시 Cowork 중단 |
| 2 | CAPTCHA 출현 | Cowork 중단 + 메일 알림 → 수빈 수동 1회 로그인 → 며칠 안 뜨면 재개 |
| 3 | 2FA 코드 요구 | 수빈 개입 필수. Cowork 이 코드 대기 중 timeout → 알림 |
| 4 | Chrome 자동 채움 실패 | 비밀번호 관리자 재확인 + 매니페스트 업데이트 / 1Password 전환 고려 |
| 5 | Cowork 토큰 비용 과다 | 실행 빈도 줄이기 (주 3회로) 또는 수동 fallback 전환 |

---

## 🔧 수동 Fallback (Cowork 실패 시)

Cowork 이 막히거나 알림 메일 수신 시:

```bash
cd "C:\0. Programing\mybdr"
npx tsx scripts/cafe-login.ts --push-secret
```

- 브라우저 열리면 **수동 로그인** → IVHA 글 1개 본문 확인 → 터미널 [Enter]
- 나머지는 자동 (Secret 갱신까지 포함)

---

## 📝 변경 히스토리

| 날짜 | 변경 |
|------|------|
| 2026-04-23 | 초안 — Cowork 기반 자동화 설계 + `--auto-wait`/`--push-secret`/`--random-delay` 플래그 도입 |
