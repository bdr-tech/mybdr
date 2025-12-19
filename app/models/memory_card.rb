# frozen_string_literal: true

class MemoryCard < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :user
  belongs_to :cardable, polymorphic: true, optional: true

  has_one_attached :card_image
  has_one_attached :thumbnail

  # =============================================================================
  # Constants - Card Types
  # =============================================================================

  # 추억 마케팅 카드 타입
  CARD_TYPES = %w[
    anniversary
    milestone_points
    milestone_3pt
    double_double
    triple_double
    game_high
    career_high
    season_summary
    highlight
    custom
  ].freeze

  # 카드 템플릿
  TEMPLATES = %w[
    default
    celebration
    minimal
    dark
    vintage
    nba_style
    championship
  ].freeze

  # 공유 플랫폼
  SHARE_PLATFORMS = %w[
    kakao
    instagram
    facebook
    twitter
    link
  ].freeze

  # =============================================================================
  # Enums
  # =============================================================================
  enum :status, {
    pending: "pending",
    generating: "generating",
    ready: "ready",
    failed: "failed"
  }, prefix: true

  # =============================================================================
  # Validations
  # =============================================================================
  validates :card_type, presence: true, inclusion: { in: CARD_TYPES }
  validates :title, presence: true
  validates :template, inclusion: { in: TEMPLATES }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :ready, -> { where(status: :ready) }
  scope :public_cards, -> { where(is_public: true) }
  scope :by_type, ->(type) { where(card_type: type) if type.present? }
  scope :recent, -> { order(created_at: :desc) }
  scope :popular, -> { order(share_count: :desc) }
  scope :for_date, ->(date) { where(reference_date: date) }
  scope :anniversaries, -> { where(card_type: "anniversary") }
  scope :milestones, -> { where(card_type: %w[milestone_points milestone_3pt]) }
  scope :achievements, -> { where(card_type: %w[double_double triple_double game_high career_high]) }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_create :generate_share_url
  after_create :schedule_image_generation

  # =============================================================================
  # Class Methods
  # =============================================================================

  # N년 전 오늘 카드 생성
  def self.create_anniversary_card!(user:, game:, years_ago:)
    stats = game.player_stats_for(user)

    create!(
      user: user,
      cardable: game,
      card_type: "anniversary",
      title: "#{years_ago}년 전 오늘",
      description: "#{game.game_date.strftime('%Y년 %m월 %d일')} #{game.tournament&.name || '경기'}",
      template: "vintage",
      reference_date: game.game_date,
      stats_data: {
        years_ago: years_ago,
        game_date: game.game_date,
        tournament_name: game.tournament&.name,
        opponent: game.opponent_team_name_for(user),
        points: stats&.dig(:points) || 0,
        rebounds: stats&.dig(:rebounds) || 0,
        assists: stats&.dig(:assists) || 0,
        result: game.result_for(user)
      },
      highlights: extract_highlights(stats)
    )
  end

  # 마일스톤 카드 생성
  def self.create_milestone_card!(user:, milestone_type:, value:, game: nil)
    titles = {
      "milestone_points" => "통산 #{value}득점 달성!",
      "milestone_3pt" => "통산 #{value}개 3점슛!",
      "double_double" => "더블더블 달성!",
      "triple_double" => "트리플더블 달성!",
      "game_high" => "경기 최고 기록!",
      "career_high" => "커리어 하이!"
    }

    create!(
      user: user,
      cardable: game,
      card_type: milestone_type,
      title: titles[milestone_type] || "마일스톤 달성!",
      description: milestone_description(milestone_type, value, game),
      template: "celebration",
      reference_date: game&.game_date || Date.current,
      stats_data: {
        milestone_type: milestone_type,
        value: value,
        achieved_at: Time.current,
        game_id: game&.id,
        game_date: game&.game_date
      }
    )
  end

  # 시즌 서머리 카드 생성
  def self.create_season_summary_card!(user:, season:, stats:)
    create!(
      user: user,
      card_type: "season_summary",
      title: "#{season} 시즌 리포트",
      description: "#{season} 시즌의 활약상",
      template: "nba_style",
      stats_data: {
        season: season,
        games_played: stats[:games_played],
        total_points: stats[:total_points],
        total_rebounds: stats[:total_rebounds],
        total_assists: stats[:total_assists],
        avg_points: stats[:avg_points],
        avg_rebounds: stats[:avg_rebounds],
        avg_assists: stats[:avg_assists],
        three_pointers_made: stats[:three_pointers_made],
        best_game: stats[:best_game],
        achievements: stats[:achievements] || []
      }
    )
  end

  # 하이라이트 카드 생성
  def self.create_highlight_card!(user:, game:, highlight_type:, stats:)
    create!(
      user: user,
      cardable: game,
      card_type: "highlight",
      title: highlight_title(highlight_type, stats),
      description: game.tournament&.name || "경기 하이라이트",
      template: "default",
      reference_date: game.game_date,
      stats_data: stats,
      highlights: [highlight_type]
    )
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def record_share!(platform)
    return unless SHARE_PLATFORMS.include?(platform)

    increment!(:share_count)
    update!(
      last_shared_at: Time.current,
      share_platforms: share_platforms.merge(
        platform => (share_platforms[platform] || 0) + 1
      )
    )
  end

  def record_view!
    increment!(:view_count)
  end

  def generate_image!
    update!(status: :generating)

    # 이미지 생성 로직 (추후 ImageMagick 또는 외부 서비스 연동)
    # 현재는 placeholder 구현
    generate_card_image

    update!(status: :ready)
  rescue StandardError => e
    update!(status: :failed, metadata: metadata.merge(error: e.message))
    raise
  end

  def card_type_label
    {
      "anniversary" => "N년 전 오늘",
      "milestone_points" => "득점 마일스톤",
      "milestone_3pt" => "3점슛 마일스톤",
      "double_double" => "더블더블",
      "triple_double" => "트리플더블",
      "game_high" => "경기 최고",
      "career_high" => "커리어 하이",
      "season_summary" => "시즌 리포트",
      "highlight" => "하이라이트",
      "custom" => "커스텀"
    }[card_type] || card_type
  end

  def template_label
    {
      "default" => "기본",
      "celebration" => "축하",
      "minimal" => "미니멀",
      "dark" => "다크",
      "vintage" => "빈티지",
      "nba_style" => "NBA 스타일",
      "championship" => "챔피언십"
    }[template] || template
  end

  def shareable?
    status_ready? && (image_url.present? || card_image.attached?)
  end

  def image_ready?
    status_ready?
  end

  # 카카오톡 공유용 데이터
  def kakao_share_data
    {
      objectType: "feed",
      content: {
        title: title,
        description: description,
        imageUrl: card_image_url,
        link: {
          webUrl: share_url,
          mobileWebUrl: share_url
        }
      },
      buttons: [
        {
          title: "자세히 보기",
          link: {
            webUrl: share_url,
            mobileWebUrl: share_url
          }
        }
      ]
    }
  end

  # 인스타그램 스토리용 URL
  def instagram_story_url
    return nil unless card_image.attached?
    # Instagram Stories API URL 생성
    card_image_url
  end

  def card_image_url
    return image_url if image_url.present?
    return Rails.application.routes.url_helpers.rails_blob_url(card_image, only_path: true) if card_image.attached?
    nil
  end

  private

  def self.extract_highlights(stats)
    highlights = []
    return highlights unless stats

    highlights << "#{stats[:points]}득점" if stats[:points].to_i >= 20
    highlights << "#{stats[:rebounds]}리바운드" if stats[:rebounds].to_i >= 10
    highlights << "#{stats[:assists]}어시스트" if stats[:assists].to_i >= 10
    highlights << "#{stats[:steals]}스틸" if stats[:steals].to_i >= 5
    highlights << "#{stats[:blocks]}블록" if stats[:blocks].to_i >= 5
    highlights << "#{stats[:three_pointers_made]}개 3점슛" if stats[:three_pointers_made].to_i >= 5

    highlights
  end

  def self.milestone_description(milestone_type, value, game)
    case milestone_type
    when "milestone_points"
      "통산 #{value}득점을 달성했습니다!"
    when "milestone_3pt"
      "통산 #{value}개의 3점슛을 성공시켰습니다!"
    when "double_double"
      "두 부문에서 두 자릿수 기록을 달성했습니다!"
    when "triple_double"
      "세 부문에서 두 자릿수 기록을 달성했습니다!"
    when "game_high"
      game ? "#{game.game_date.strftime('%Y.%m.%d')} 경기 최고 기록" : "경기 최고 기록"
    when "career_high"
      "개인 통산 최고 기록을 경신했습니다!"
    else
      "축하합니다!"
    end
  end

  def self.highlight_title(highlight_type, stats)
    case highlight_type
    when "high_points"
      "#{stats[:points]}득점 폭발!"
    when "high_rebounds"
      "#{stats[:rebounds]}리바운드 지배!"
    when "high_assists"
      "#{stats[:assists]}어시스트 플레이메이커!"
    when "efficiency"
      "효율왕! #{stats[:efficiency]}% FG"
    else
      "하이라이트"
    end
  end

  def generate_share_url
    self.share_url ||= "#{Rails.application.config.base_url}/cards/#{SecureRandom.alphanumeric(12)}"
  end

  def schedule_image_generation
    # 백그라운드 작업으로 이미지 생성 예약
    # MemoryCardImageGenerationJob.perform_later(id)
  end

  def generate_card_image
    # 이미지 생성 로직
    # 추후 ImageMagick 또는 Canvas API 등으로 구현
    # 현재는 placeholder
  end
end
