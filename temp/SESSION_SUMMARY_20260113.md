# BDR Platform 세션 요약
> 작성일: 2026-01-13

---

## 1. Excel 데이터 임포트 (이전 세션에서 완료)

### 문제 해결: Foreign Key 타입 불일치
- **문제**: Team 모델이 `uuid`를 primary_key로 사용하지만, 관련 테이블들은 `bigint` team_id 사용
- **해결**: 모든 관련 association에 `primary_key: :id` 옵션 추가

#### 수정된 파일들
| 파일 | 수정 내용 |
|------|----------|
| `app/models/team.rb` | has_many에 `primary_key: :id` 추가 |
| `app/models/team_member.rb` | belongs_to에 `primary_key: :id` 추가 |
| `app/models/team_join_request.rb` | belongs_to에 `primary_key: :id` 추가 |
| `app/models/team_member_history.rb` | belongs_to에 `primary_key: :id` 추가 |
| `app/models/tournament_team.rb` | belongs_to에 `primary_key: :id` 추가 |
| `app/models/community_post.rb` | belongs_to에 `primary_key: :id` 추가 |

### 임포트 결과
```
대회 생성: 15개
팀 생성: 126개
대회-팀 연결: 131개
사용자 생성: 2,027명
선수 등록: 1,722명
```

---

## 2. 데이터 정리 작업

### 2.1 팀 소개 정리
- **작업**: 134개 팀에서 "BDR Join V1에서 임포트됨\n영문명: ..." 텍스트 삭제
- **결과**: 임포트 텍스트만 있던 팀은 description이 `nil`로 설정됨

```ruby
# 실행된 코드
teams = Team.where("description LIKE '%BDR Join V1에서 임포트됨%'")
teams.find_each do |team|
  new_desc = team.description.to_s
    .gsub(/BDR Join V1에서 임포트됨\n?/, '')
    .gsub(/영문명:\s*.*/, '')
    .strip
  team.update_column(:description, new_desc.presence)
end
```

### 2.2 대회 소개 정리
- **작업**: 15개 대회에서 임포트 관련 텍스트 삭제
- **패턴**: "BDR Join V1에서 임포트된 대회\n원본 URL: https://..."

```ruby
# 실행된 코드
tournaments = Tournament.where("description LIKE '%BDR Join V1에서 임포트%'")
tournaments.find_each do |t|
  new_desc = t.description.to_s
    .gsub(/BDR Join V1에서 임포트된 대회\n?/, '')
    .gsub(/원본 URL:\s*https?:\/\/[^\s\n]*\n?/, '')
    .strip
  t.update_column(:description, new_desc.presence)
end
```

---

## 3. 선수 개인기록 시스템

### 3.1 기존 시스템 확인
이미 `MatchPlayerStat` 모델이 구현되어 있음을 확인

#### 데이터 구조
```
User (선수)
  ↓
TournamentTeamPlayer (대회별 등록선수)
  ↓
MatchPlayerStat (경기별 스탯)
  ↓
TournamentMatch (경기)
  ↓
Tournament (대회)
```

#### MatchPlayerStat 필드
| 카테고리 | 필드 |
|---------|------|
| 득점 | points, field_goals_made/attempted, three_pointers, free_throws |
| 리바운드 | offensive_rebounds, defensive_rebounds, total_rebounds |
| 기타 | assists, steals, blocks, turnovers, personal_fouls |
| 고급스탯 | efficiency, true_shooting_%, effective_fg_%, assist_turnover_ratio |

### 3.2 현재 상태
- `match_player_stats` 테이블: 존재
- `TournamentTeamPlayer`: 1,928명 등록
- 경기 기록: 0개 (아직 입력 없음)

---

## 4. API 개발 (신규)

### 4.1 생성된 파일

#### Base Controller
- **파일**: `app/controllers/api/v1/base_controller.rb`
- **기능**:
  - HTTP Token 인증
  - 대회별 API 토큰 지원
  - 시스템 API 토큰 지원 (환경변수: `BDR_API_TOKEN`)
  - 에러 핸들링 (404, 422, 400)

#### Match Stats Controller
- **파일**: `app/controllers/api/v1/match_stats_controller.rb`
- **기능**:
  - 경기 스탯 조회/입력/수정/삭제
  - 일괄 스탯 입력 (bulk)
  - 대회별 통계 집계
  - 선수 통산 기록 조회

### 4.2 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/matches/:match_id/stats` | 경기 스탯 조회 |
| POST | `/api/v1/matches/:match_id/stats` | 개별 선수 스탯 입력 |
| POST | `/api/v1/matches/:match_id/stats/bulk` | 일괄 스탯 입력 |
| PATCH | `/api/v1/matches/:match_id/stats/:id` | 스탯 수정 |
| DELETE | `/api/v1/matches/:match_id/stats/:id` | 스탯 삭제 |
| GET | `/api/v1/tournaments/:id/player_stats` | 대회 전체 통계 |
| GET | `/api/v1/players/:id/stats` | 선수 통산 기록 |

### 4.3 인증 방식

```bash
# 대회별 API 토큰
curl -H "Authorization: Token {tournament_api_token}" \
     https://domain.com/api/v1/matches/{match_uuid}/stats

# 시스템 토큰 (환경변수)
export BDR_API_TOKEN=your_secure_token
```

### 4.4 Tournament 모델 업데이트

#### 새로운 컬럼
- `api_token`: string (unique index)

#### 새로운 메서드
```ruby
# API 토큰 생성
tournament.generate_api_token!

# API 토큰 재발급
tournament.regenerate_api_token!

# API 토큰 폐기
tournament.revoke_api_token!
```

### 4.5 API 사용 예시

#### 개별 선수 스탯 입력
```bash
curl -X POST /api/v1/matches/{match_uuid}/stats \
  -H "Authorization: Token {api_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "team": "home",
    "jersey_number": 7,
    "is_starter": true,
    "minutes_played": 32,
    "points": 25,
    "field_goals_made": 8,
    "field_goals_attempted": 15,
    "three_pointers_made": 3,
    "three_pointers_attempted": 7,
    "free_throws_made": 6,
    "free_throws_attempted": 8,
    "offensive_rebounds": 2,
    "defensive_rebounds": 6,
    "assists": 5,
    "steals": 2,
    "blocks": 1,
    "turnovers": 3,
    "personal_fouls": 2
  }'
```

#### 일괄 스탯 입력
```bash
curl -X POST /api/v1/matches/{match_uuid}/stats/bulk \
  -H "Authorization: Token {api_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "stats": [
      {
        "jersey_number": 7,
        "team": "home",
        "is_starter": true,
        "points": 25,
        "rebounds": 8,
        "assists": 5
      },
      {
        "jersey_number": 11,
        "team": "home",
        "is_starter": true,
        "points": 18,
        "rebounds": 12,
        "assists": 2
      }
    ]
  }'
```

#### 대회 통계 조회
```bash
curl -H "Authorization: Token {api_token}" \
     /api/v1/tournaments/{tournament_id}/player_stats
```

#### 선수 통산 기록 조회
```bash
curl -H "Authorization: Token {api_token}" \
     /api/v1/players/{user_id}/stats
```

---

## 5. 마이그레이션 실행 기록

```bash
# 실행된 마이그레이션
20260113080505_add_api_token_to_tournaments.rb
```

---

## 6. 다음 작업 예정

- [ ] API 테스트 및 검증
- [ ] 외부 시스템 연동 문서화
- [ ] 경기 기록 입력 UI 개발 (선택)
- [ ] 통계 대시보드 개발 (선택)

---

## 파일 변경 요약

### 신규 생성
| 파일 | 설명 |
|------|------|
| `app/controllers/api/v1/base_controller.rb` | API 베이스 컨트롤러 |
| `app/controllers/api/v1/match_stats_controller.rb` | 경기 스탯 API |
| `db/migrate/20260113080505_add_api_token_to_tournaments.rb` | 토큰 컬럼 추가 |

### 수정
| 파일 | 설명 |
|------|------|
| `config/routes.rb` | API 라우트 추가 |
| `app/models/tournament.rb` | API 토큰 관련 메서드 추가 |

---

## 테스트 토큰 (개발용)

```
대회: 평촌과학기술고등학교장배 청소년부 농구대회 중등부 3차
API 토큰: 083b82b72be61bd41dd61cf47f91598c002973dbcb0dfb797c8ca58c0b802c0a
```

> **주의**: 프로덕션 환경에서는 새로운 토큰을 생성하세요!
