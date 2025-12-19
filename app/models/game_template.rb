# frozen_string_literal: true

class GameTemplate < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :user
  belongs_to :court, optional: true
  has_many :games, foreign_key: :template_id, dependent: :nullify

  # =============================================================================
  # Enums
  # =============================================================================
  enum :game_type, {
    pickup: 0,        # 픽업게임
    guest_recruit: 1, # 게스트 모집
    team_vs_team: 2   # 팀 대 팀
  }, prefix: true

  # =============================================================================
  # Validations
  # =============================================================================
  validates :name, presence: true, uniqueness: { scope: :user_id }
  validates :game_type, presence: true

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :public_templates, -> { where(is_public: true) }
  scope :private_templates, -> { where(is_public: false) }
  scope :by_game_type, ->(type) { where(game_type: type) }
  scope :popular, -> { order(use_count: :desc) }

  # =============================================================================
  # Instance Methods
  # =============================================================================

  # 템플릿에서 경기 생성
  def create_game!(scheduled_at:, additional_params: {})
    settings = default_settings.symbolize_keys

    game = Game.new(
      organizer: user,
      game_type: game_type,
      court: court,
      scheduled_at: scheduled_at,
      template: self,
      max_participants: settings[:max_participants] || 10,
      min_participants: settings[:min_participants] || 4,
      fee_per_person: settings[:fee_per_person] || 0,
      duration_hours: settings[:duration_hours] || 2,
      uniform_home_color: settings[:uniform_home_color] || "#FF0000",
      uniform_away_color: settings[:uniform_away_color] || "#0000FF",
      skill_level: settings[:skill_level] || "all",
      requirements: settings[:requirements],
      description: settings[:description],
      **additional_params
    )

    if game.save
      increment!(:use_count)
    end

    game
  end

  # 기본 설정값 가져오기
  def setting(key)
    default_settings[key.to_s]
  end

  # 게임 타입 한글명
  def game_type_name
    case game_type
    when "pickup" then "픽업게임"
    when "guest_recruit" then "게스트 모집"
    when "team_vs_team" then "팀 대 팀"
    else game_type
    end
  end
end
