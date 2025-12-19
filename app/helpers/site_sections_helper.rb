# frozen_string_literal: true

module SiteSectionsHelper
  SECTION_TYPE_CONFIG = {
    "hero" => {
      icon: "🎯",
      name: "히어로",
      description: "대회 메인 배너"
    },
    "text" => {
      icon: "📝",
      name: "텍스트",
      description: "자유로운 텍스트 콘텐츠"
    },
    "schedule" => {
      icon: "📅",
      name: "일정표",
      description: "대회 일정 자동 표시"
    },
    "teams" => {
      icon: "👥",
      name: "참가팀",
      description: "참가팀 목록 표시"
    },
    "results" => {
      icon: "🏆",
      name: "결과/순위",
      description: "대회 결과 및 순위표"
    },
    "gallery" => {
      icon: "🖼️",
      name: "갤러리",
      description: "사진 갤러리"
    },
    "sponsors" => {
      icon: "🤝",
      name: "스폰서",
      description: "스폰서 로고 배너"
    },
    "youtube" => {
      icon: "📺",
      name: "유튜브",
      description: "유튜브 영상 임베드"
    },
    "instagram" => {
      icon: "📷",
      name: "인스타그램",
      description: "인스타그램 피드 연동"
    },
    "countdown" => {
      icon: "⏰",
      name: "카운트다운",
      description: "대회 시작까지 타이머"
    },
    "cta" => {
      icon: "🔘",
      name: "CTA 버튼",
      description: "클릭 유도 버튼"
    },
    "faq" => {
      icon: "❓",
      name: "FAQ",
      description: "자주 묻는 질문"
    },
    "contact" => {
      icon: "📧",
      name: "연락처",
      description: "문의 정보 표시"
    },
    "series_nav" => {
      icon: "🔗",
      name: "시리즈 네비게이션",
      description: "시리즈 회차 링크"
    },
    "boxscore" => {
      icon: "📊",
      name: "박스스코어",
      description: "경기 통계 표시"
    },
    "player_card" => {
      icon: "🏃",
      name: "선수 카드",
      description: "선수 정보 카드"
    }
  }.freeze

  def section_icon(section_type)
    SECTION_TYPE_CONFIG.dig(section_type.to_s, :icon) || "📦"
  end

  def section_type_name(section_type)
    SECTION_TYPE_CONFIG.dig(section_type.to_s, :name) || section_type.to_s.humanize
  end

  def section_type_description(section_type)
    SECTION_TYPE_CONFIG.dig(section_type.to_s, :description) || ""
  end

  def section_types_for_select
    SECTION_TYPE_CONFIG.map do |type, config|
      ["#{config[:icon]} #{config[:name]}", type]
    end
  end

  def section_form_fields(section_type)
    case section_type.to_s
    when "hero"
      %i[title subtitle background_image cta_text cta_url]
    when "text"
      %i[title body alignment]
    when "schedule"
      %i[title show_past_games max_games]
    when "teams"
      %i[title show_logos show_records]
    when "results"
      %i[title show_brackets show_standings]
    when "gallery"
      %i[title images columns]
    when "sponsors"
      %i[title sponsors layout]
    when "youtube"
      %i[title video_url autoplay]
    when "instagram"
      %i[title username post_count]
    when "countdown"
      %i[title target_date show_seconds]
    when "cta"
      %i[title description button_text button_url button_color]
    when "faq"
      %i[title questions]
    when "contact"
      %i[title email phone address sns_links]
    when "series_nav"
      %i[title series_id show_thumbnails]
    when "boxscore"
      %i[title game_id show_player_stats]
    when "player_card"
      %i[title player_id show_stats show_photo]
    else
      %i[title body]
    end
  end
end
