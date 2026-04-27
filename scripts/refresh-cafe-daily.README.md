# 다음카페 쿠키 일일 자동 갱신 — 설치 가이드

**최종 업데이트:** 2026-04-23 (방법 B: Chrome 프로필 재사용)

---

## 동작 원리 (중요)

`scripts/cafe-login.ts` 가 **사용자 PC 에 설치된 Chrome** 을 `.auth\chrome-profile\` 이라는 **전용 프로필**로 실행합니다. 해당 프로필에 한 번 카카오 로그인해서 비밀번호를 저장해두면, 이후 매일 Chrome 이 **자동 채움** 으로 로그인 → 쿠키 획득 → GitHub Secret 갱신까지 무인 진행됩니다.

전용 프로필이라 사용자 평소 Chrome 프로필과 격리 — 평소 Chrome 을 켜둔 상태로도 충돌 없음.

---

## 최초 1회 수동 설치 (5분)

### Step 1. `cafe-login.ts` 가 새 버전인지 확인
`scripts/cafe-login.ts:69` 부근에 아래 주석이 있어야 합니다:
```ts
// [주의] Daum/Kakao 는 페이지 방문 즉시 추적용 쿠키(TIARA, DID, __T_, _T_ANO ...)
```
없으면 이 가이드 이전 버전이므로 pull 필요.

### Step 2. 이전에 저장된 (잘못된) 쿠키·프로필 정리
```powershell
cd "C:\0. Programing\mybdr"
Remove-Item .auth\cafe-state.json -ErrorAction SilentlyContinue
Remove-Item .auth\chrome-profile -Recurse -Force -ErrorAction SilentlyContinue
```

### Step 3. **수동 로그인 모드로 1회 실행** — 비밀번호 저장이 목적
```powershell
cd "C:\0. Programing\mybdr"
npx tsx scripts/cafe-login.ts
```
(주의: `--auto-wait` 플래그 **없이** 실행 — 사람이 Enter 를 눌러야 다음 진행)

이 때 Chrome 창이 열리면:
1. 다음카페 IVHA 페이지에서 **로그인** 링크 클릭
2. Kakao 로그인 페이지에서 ID/PW 직접 입력
3. **Chrome 이 "비밀번호 저장할까요?" 배너 → 저장 클릭** ← 이 단계가 핵심
4. 로그인 후 IVHA 글 하나 열어서 본문 보이는지 확인
5. **터미널로 돌아와 Enter** → 쿠키 저장 완료

터미널 마지막 출력이:
- `✅ 장기 인증 쿠키 N개 / 최단 만료 X일 남음` ← 정상
- `⚠️  진짜 인증 쿠키...전혀 없습니다` ← 실패 (Step 3 다시)

### Step 4. **자동 모드 테스트** — 사람 없이 자동 채움 되는지 검증
```powershell
npx tsx scripts/cafe-login.ts --auto-wait --push-secret --timeout=3
```
- Chrome 창이 뜸
- IVHA 페이지 로드 → 자동으로 로그인 버튼 클릭 시도
- Kakao 로그인 페이지에서 **Chrome 자동 채움으로 ID/PW 입력 + 로그인**
- 인증 쿠키 생김 → 창 닫힘 → GitHub Secret 갱신
- exit code 0

여기서 실패하면 Chrome 자동 채움이 작동 안 하는 거라, 위 Step 3 다시 해서 비밀번호가 진짜 저장됐는지 확인.

### Step 5. Windows 작업 스케줄러 등록 (이미 등록돼 있으면 Skip)
```powershell
schtasks /Create /XML "C:\0. Programing\mybdr\scripts\refresh-cafe-daily.task.xml" /TN "MyBDR\CafeCookieRefresh" /F
```
(`/F` 는 기존 동명 작업 덮어쓰기)

---

## 일상 동작

매일 오전 9시에 작업 스케줄러가 `refresh-cafe-daily.bat` 호출 → 내부적으로:
```
npx tsx scripts/cafe-login.ts --auto-wait --push-secret --random-delay=30
```
- 0~30분 랜덤 대기 (봇 탐지 회피)
- Chrome 실행 (전용 프로필) → 자동 채움 로그인 → 쿠키 저장 → Secret 갱신
- 로그: `.auth\logs\cafe-refresh-YYYYMMDD-HHmmss.log`

성공 시 조용히 종료, 실패 시 Windows 토스트 알림.

---

## 실패 진단

### 쿠키 저장됐는지 검증 (항상 유용)
```powershell
(Get-Content .auth\cafe-state.json | ConvertFrom-Json).cookies |
  Where-Object { $_.name -in 'LSID','ALID','_T_','_T_SECURE' } |
  Select-Object name, domain
```
→ 결과 있으면 **진짜 로그인**, 비어있으면 **익명 상태**.

### 최근 로그 확인
```powershell
Get-Content (Get-ChildItem "C:\0. Programing\mybdr\.auth\logs\cafe-refresh-*.log" |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
```

### 자주 걸리는 이슈

| 증상 | 원인 | 조치 |
|---|---|---|
| `⚠️ 진짜 인증 쿠키 전혀 없음` | Chrome 자동 채움 미동작 | Step 3 다시 — 비밀번호 저장 재확인 |
| `auto-wait timeout` | 로그인 버튼 클릭 실패 or CAPTCHA | 수동으로 1회 로그인 후 Step 4 재시도 |
| `channel: chrome` 에러 | 시스템 Chrome 미설치 | Chrome 설치 또는 `channel: "chrome"` 제거해서 번들 Chromium 사용 (단 이 경우 자동 채움 없음) |
| 토스트 모듈 없음 | PowerShell 풍선 알림 fallback | `Install-Module BurntToast -Scope CurrentUser` 1회 |

---

## 완전 제거

```powershell
schtasks /Delete /TN "MyBDR\CafeCookieRefresh" /F
Remove-Item .auth\chrome-profile -Recurse -Force
Remove-Item .auth\cafe-state.json
Remove-Item .auth\logs -Recurse -Force
```
