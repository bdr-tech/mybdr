# frozen_string_literal: true

puts "📝 Creating content presets..."

content_presets_data = [
  {
    name: "대회 규정",
    slug: "tournament-rules",
    description: "대회 진행 방식 및 기본 규정",
    category: "rules",
    target_section_type: "text",
    target_page_types: ["notice", "home"],
    is_featured: true,
    position: 0,
    content: {
      "title" => "대회 규정",
      "body" => "## 1. 경기 방식\n- 5대5 풀코트 경기\n- 쿼터당 10분 (러닝타임)\n- 하프타임 5분\n\n## 2. 승부 결정\n- 정규 시간 종료 후 동점일 경우 3분 연장전 진행\n- 연장전에서도 동점일 경우 승부차기(3점슛 대결)\n\n## 3. 파울 규정\n- 개인 파울 5개 퇴장\n- 팀 파울 5개부터 자유투 2개\n\n## 4. 기타\n- 운동화 착용 필수 (농구화 권장)\n- 심판 판정에 이의 제기 시 테크니컬 파울"
    }
  },
  {
    name: "경기 방식",
    slug: "game-format",
    description: "토너먼트 진행 형식 설명",
    category: "rules",
    target_section_type: "text",
    target_page_types: ["notice"],
    position: 1,
    content: {
      "title" => "경기 방식",
      "body" => "## 예선 라운드\n- 조별 리그 방식 (4팀씩 2개조)\n- 각 조 상위 2팀 본선 진출\n\n## 본선 토너먼트\n- 단판 승부 토너먼트\n- 8강 → 4강 → 결승\n\n## 시드 배정\n- 예선 순위에 따른 시드 배정\n- 같은 조 팀은 결승까지 만나지 않음"
    }
  },
  {
    name: "참가 자격",
    slug: "participation-eligibility",
    description: "대회 참가 조건 및 자격 요건",
    category: "info",
    target_section_type: "text",
    target_page_types: ["notice", "registration"],
    is_featured: true,
    position: 0,
    content: {
      "title" => "참가 자격",
      "body" => "## 참가 조건\n\n### 팀 구성\n- 최소 5인 ~ 최대 12인\n- 팀 대표자 1인 필수 지정\n\n### 참가 자격\n- 만 18세 이상 성인\n- 대한농구협회 등록 선수 참가 불가\n- 타 대회 동시 출전 제한 없음\n\n### 필수 서류\n- 팀 등록서 (대표자 연락처 포함)\n- 선수 명단 (등번호, 포지션 기재)\n- 참가비 입금 확인증"
    }
  },
  {
    name: "일정 안내",
    slug: "schedule-info",
    description: "대회 일정 및 시간표",
    category: "schedule",
    target_section_type: "text",
    target_page_types: ["notice", "schedule"],
    position: 0,
    content: {
      "title" => "대회 일정",
      "body" => "## 주요 일정\n\n| 일정 | 날짜 | 비고 |\n|------|------|------|\n| 참가 신청 | 12/1 ~ 12/15 | 선착순 마감 |\n| 참가비 납부 | 신청 후 3일 이내 | 미납 시 자동 취소 |\n| 조 추첨 | 12/18 | 온라인 생중계 |\n| 예선 라운드 | 12/21 ~ 12/22 | 1일 2경기 |\n| 본선 토너먼트 | 12/28 | 당일 결승 |\n\n## 경기 시간\n- 오전 조: 10:00 ~ 12:00\n- 오후 조: 14:00 ~ 18:00\n- 저녁 조: 19:00 ~ 21:00"
    }
  },
  {
    name: "상금 안내",
    slug: "prize-info",
    description: "시상 내역 및 상금 정보",
    category: "prize",
    target_section_type: "text",
    target_page_types: ["notice", "home"],
    is_featured: true,
    position: 0,
    content: {
      "title" => "시상 내역",
      "body" => "## 상금\n\n| 순위 | 상금 | 부상 |\n|------|------|------|\n| 우승 | 100만원 | 트로피 + 메달 |\n| 준우승 | 50만원 | 트로피 |\n| 3위 | 30만원 | - |\n| 4위 | 20만원 | - |\n\n## 개인상\n- **MVP**: 상금 10만원 + 트로피\n- **득점왕**: 기념품\n- **어시스트왕**: 기념품"
    }
  },
  {
    name: "참가 신청 안내",
    slug: "registration-guide",
    description: "참가 신청 절차 및 방법",
    category: "registration",
    target_section_type: "text",
    target_page_types: ["registration", "notice"],
    is_featured: true,
    position: 0,
    content: {
      "title" => "참가 신청 방법",
      "body" => "## 신청 절차\n\n### 1단계: 팀 등록\nBDR 플랫폼에서 팀을 먼저 등록해주세요.\n\n### 2단계: 대회 신청\n대회 페이지에서 '참가 신청' 버튼을 클릭하세요.\n\n### 3단계: 참가비 납부\n- 계좌: 카카오뱅크 3333-XX-XXXXXX (홍길동)\n- 참가비: 100,000원\n- 입금자명: 팀명으로 입금\n\n### 4단계: 선수 명단 제출\n대회 시작 3일 전까지 선수 명단을 확정해주세요."
    }
  },
  {
    name: "자주 묻는 질문",
    slug: "faq-general",
    description: "대회 관련 자주 묻는 질문",
    category: "faq",
    target_section_type: "text",
    target_page_types: ["notice"],
    position: 0,
    content: {
      "title" => "자주 묻는 질문 (FAQ)",
      "body" => "### Q. 참가비 환불이 가능한가요?\n대회 시작 7일 전까지 100% 환불 가능합니다. 이후에는 50%만 환불됩니다.\n\n### Q. 용병 영입이 가능한가요?\n아니요, 등록된 선수만 출전 가능합니다. 대회 시작 3일 전까지 선수 추가가 가능합니다.\n\n### Q. 유니폼은 어떻게 준비하나요?\n홈/어웨이 구분을 위해 2가지 색상의 상의를 준비해주세요. 조끼 대여 가능합니다.\n\n### Q. 주차는 가능한가요?\n대회장 주변 유료 주차장 이용 가능합니다. 대중교통 이용을 권장합니다."
    }
  },
  {
    name: "문의처 안내",
    slug: "contact-info",
    description: "대회 문의 연락처",
    category: "contact",
    target_section_type: "text",
    target_page_types: ["notice"],
    position: 0,
    content: {
      "title" => "문의처",
      "body" => "## 대회 운영 문의\n\n- **전화**: 010-1234-5678\n- **이메일**: contact@mybdr.kr\n- **카카오톡**: @BDR농구\n\n## 운영 시간\n- 평일: 10:00 ~ 18:00\n- 주말/공휴일: 휴무\n\n※ 대회 당일에는 현장 운영진에게 문의해주세요."
    }
  }
]

content_presets_data.each do |preset_data|
  preset = ContentPreset.find_or_initialize_by(slug: preset_data[:slug])
  if preset.new_record?
    preset.assign_attributes(preset_data)
    preset.save!
    puts "  ✅ Created preset: #{preset_data[:name]} (#{preset_data[:category]})"
  else
    puts "  ⏭️  Skipped (exists): #{preset_data[:name]}"
  end
end

puts "  Total presets: #{ContentPreset.count}"
