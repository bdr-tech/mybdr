# frozen_string_literal: true

module TipsHelper
  # 페이지별 팁 설정
  # target: CSS 셀렉터 (data-tip 속성 사용)
  # title: 팁 제목
  # description: 팁 설명
  # position: 툴팁 위치 (top, bottom, left, right)
  TIPS_CONFIG = {
    # 경기 목록 페이지
    # 순서: 항상 존재하는 요소 -> 조건부 요소 (데이터/로그인 필요)
    games_index: [
      {
        target: '[data-tip="filter"]',
        title: "필터 사용하기",
        description: "경기 타입, 지역, 날짜로 원하는 경기를 찾아보세요.",
        position: "bottom"
      },
      {
        target: '[data-tip="game-card"]',
        title: "경기 카드",
        description: "카드를 클릭하면 경기 상세 정보를 확인할 수 있어요.",
        position: "top"
      },
      {
        target: '[data-tip="create-game"]',
        title: "경기 만들기",
        description: "직접 경기를 만들어 참가자를 모집할 수 있어요.",
        position: "left"
      }
    ],

    # 경기 생성 페이지
    games_new: [
      {
        target: '[data-tip="game-type"]',
        title: "경기 타입 선택",
        description: "픽업게임, 게스트 모집, 팀 대 팀 중 선택하세요.",
        position: "right"
      },
      {
        target: '[data-tip="schedule"]',
        title: "일정 설정",
        description: "경기 날짜와 시간을 지정하세요.",
        position: "bottom"
      },
      {
        target: '[data-tip="venue"]',
        title: "장소 선택",
        description: "등록된 경기장을 선택하거나 직접 입력하세요.",
        position: "bottom"
      }
    ],

    # 팀 목록 페이지
    # 순서: 항상 존재하는 요소 -> 조건부 요소
    teams_index: [
      {
        target: '[data-tip="search"]',
        title: "팀 검색",
        description: "팀 이름이나 지역으로 원하는 팀을 찾아보세요.",
        position: "bottom"
      },
      {
        target: '[data-tip="team-card"]',
        title: "팀 카드",
        description: "팀을 클릭하면 팀 정보와 가입 신청을 할 수 있어요.",
        position: "top"
      },
      {
        target: '[data-tip="create-team"]',
        title: "팀 만들기",
        description: "나만의 팀을 만들어 함께할 동료를 모집하세요.",
        position: "left"
      }
    ],

    # 대회 목록 페이지
    # 순서: 항상 존재하는 요소만 (중첩 요소 제거)
    tournaments_index: [
      {
        target: '[data-tip="status-filter"]',
        title: "대회 상태 필터",
        description: "모집중, 진행중, 완료된 대회를 필터링하세요.",
        position: "bottom"
      },
      {
        target: '[data-tip="tournament-card"]',
        title: "대회 정보",
        description: "카드를 클릭해 대회 상세 정보, 참가팀 현황, 참가비를 확인할 수 있어요.",
        position: "top"
      }
    ],

    # 커뮤니티 페이지
    # 순서: 항상 존재하는 요소 -> 조건부 요소
    community_index: [
      {
        target: '[data-tip="category"]',
        title: "카테고리 필터",
        description: "관심 있는 주제의 게시글만 볼 수 있어요.",
        position: "bottom"
      },
      {
        target: '[data-tip="search-box"]',
        title: "게시글 검색",
        description: "키워드로 원하는 게시글을 찾아보세요.",
        position: "bottom"
      },
      {
        target: '[data-tip="post-item"]',
        title: "게시글 보기",
        description: "게시글을 클릭하면 상세 내용과 댓글을 볼 수 있어요.",
        position: "top"
      },
      {
        target: '[data-tip="write"]',
        title: "글쓰기",
        description: "농구 동호인들과 이야기를 나눠보세요.",
        position: "left"
      }
    ],

    # 홈페이지
    home_index: [
      {
        target: '[data-tip="games-section"]',
        title: "추천 경기",
        description: "지금 바로 참가할 수 있는 경기들이에요.",
        position: "bottom"
      },
      {
        target: '[data-tip="tournaments-section"]',
        title: "진행중인 대회",
        description: "현재 참가 모집 중인 대회를 확인하세요.",
        position: "bottom"
      }
    ]
  }.freeze

  # 특정 페이지의 팁 목록 반환
  def tips_for(page_key)
    TIPS_CONFIG[page_key.to_sym] || []
  end

  # 해당 페이지의 팁이 이미 완료되었는지 확인
  def tips_completed?(page_key)
    session["tips_#{page_key}"].present?
  end

  # 팁 렌더링 헬퍼
  # 사용법: <%= render_tips(:games_index) %>
  def render_tips(page_key)
    tips = tips_for(page_key)
    return if tips.empty? || tips_completed?(page_key)

    render partial: "shared/tooltip", locals: {
      page_key: page_key,
      tips: tips
    }
  end
end
