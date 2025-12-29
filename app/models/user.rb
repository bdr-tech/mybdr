# frozen_string_literal: true

class User < ApplicationRecord
  include HasPublicId

  # =============================================================================
  # Authentication
  # =============================================================================
  has_secure_password

  # =============================================================================
  # Active Storage
  # =============================================================================
  has_one_attached :avatar

  # Avatar validations
  validate :avatar_validation

  def avatar_validation
    return unless avatar.attached?

    # File size validation (1MB max)
    if avatar.blob.byte_size > 1.megabyte
      errors.add(:avatar, "파일 크기는 1MB 이하여야 합니다")
      avatar.purge
    end

    # Content type validation
    acceptable_types = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"]
    unless acceptable_types.include?(avatar.blob.content_type)
      errors.add(:avatar, "PNG, JPG, SVG 형식의 이미지만 업로드 가능합니다")
      avatar.purge
    end
  end

  # =============================================================================
  # Associations
  # =============================================================================
  has_many :organized_games, class_name: "Game", foreign_key: :organizer_id, dependent: :destroy
  has_many :game_applications, dependent: :destroy
  has_many :applied_games, through: :game_applications, source: :game
  has_many :game_templates, dependent: :destroy

  # Tournament associations
  has_many :organized_series, class_name: "TournamentSeries", foreign_key: :organizer_id, dependent: :destroy
  has_many :organized_tournaments, class_name: "Tournament", foreign_key: :organizer_id, dependent: :destroy
  has_many :tournament_team_players, dependent: :destroy
  has_many :tournament_teams_as_player, through: :tournament_team_players, source: :tournament_team
  has_many :match_mvps, class_name: "TournamentMatch", foreign_key: :mvp_player_id
  has_many :tournament_mvps, class_name: "Tournament", foreign_key: :mvp_player_id

  # Tournament Admin associations
  has_many :tournament_admin_members, dependent: :destroy
  has_many :administrated_tournaments, through: :tournament_admin_members, source: :tournament

  # Team associations
  has_many :team_memberships, class_name: "TeamMember", dependent: :destroy
  has_many :teams, through: :team_memberships
  has_many :captained_teams, class_name: "Team", foreign_key: :captain_id, dependent: :nullify
  has_many :team_join_requests, dependent: :destroy

  # Notification & Payment associations
  has_many :notifications, dependent: :destroy
  has_many :payments, dependent: :destroy
  has_many :memory_cards, dependent: :destroy

  # Marketplace associations
  has_many :marketplace_items, dependent: :destroy
  has_many :marketplace_favorites, dependent: :destroy
  has_many :favorite_items, through: :marketplace_favorites, source: :marketplace_item

  # Court associations
  has_many :court_infos, dependent: :destroy
  has_many :court_reviews, dependent: :destroy
  has_many :court_checkins, dependent: :destroy

  # Community associations
  has_many :posts, dependent: :destroy
  has_many :comments, dependent: :destroy
  has_many :community_posts, dependent: :destroy
  has_many :board_favorites, dependent: :destroy

  # =============================================================================
  # Enums
  # =============================================================================
  enum :membership_type, {
    free: 0,
    pro: 1,
    pickup_host: 2,
    tournament_admin: 3,
    super_admin: 4
  }, prefix: true

  enum :position, {
    point_guard: "PG",
    shooting_guard: "SG",
    small_forward: "SF",
    power_forward: "PF",
    center: "C"
  }, prefix: true

  # =============================================================================
  # Validations
  # =============================================================================
  validates :email,
            presence: true,
            uniqueness: { case_sensitive: false },
            format: { with: URI::MailTo::EMAIL_REGEXP }

  validates :password,
            presence: true,
            length: { minimum: 8 },
            if: -> { new_record? || password.present? }

  validates :nickname,
            uniqueness: { case_sensitive: false, allow_blank: true },
            length: { minimum: 2, maximum: 20 },
            allow_blank: true

  validates :phone,
            uniqueness: { allow_blank: true },
            format: { with: /\A01[0-9]-?\d{3,4}-?\d{4}\z/, allow_blank: true }

  validates :height,
            numericality: { only_integer: true, greater_than: 100, less_than: 250, allow_nil: true }

  validates :weight,
            numericality: { only_integer: true, greater_than: 30, less_than: 200, allow_nil: true }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_save :normalize_email
  before_save :normalize_phone

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :active, -> { where(status: "active") }
  scope :admins, -> { where(is_admin: true) }
  scope :by_membership, ->(type) { where(membership_type: type) }
  scope :with_active_subscription, -> { where(subscription_status: "active").where("subscription_expires_at > ?", Time.current) }

  # =============================================================================
  # Membership Methods
  # =============================================================================

  # Check if subscription is currently active
  def subscription_active?
    return true if membership_type_super_admin?
    return false if membership_type_free?

    subscription_status == "active" && subscription_expires_at&.future?
  end

  # Check if user can view tournament results
  # Free users can only view results from tournaments that ended within 2 weeks
  def can_view_tournament_results?(tournament)
    return true if subscription_active?
    return true if membership_type_super_admin?

    # Free users: can view if tournament ended within last 2 weeks
    tournament.ended_at.present? && tournament.ended_at > 2.weeks.ago
  end

  # Check if user can create teams
  # Pro members and above can create teams
  def can_create_team?
    membership_type_pro? ||
    membership_type_pickup_host? ||
    membership_type_tournament_admin? ||
    membership_type_super_admin?
  end

  # Get team creation limit based on membership
  def team_creation_limit
    case membership_type
    when "pro"
      2
    when "pickup_host", "tournament_admin", "super_admin"
      10
    else
      0
    end
  end

  # Check if user has reached team creation limit
  def can_create_more_teams?
    return false unless can_create_team?
    return true if membership_type_super_admin?

    teams_as_captain_count < team_creation_limit
  end

  # Check if user can access pickup game menu
  # Only pickup_host and above
  def can_access_pickup_menu?
    membership_type_pickup_host? ||
    membership_type_tournament_admin? ||
    membership_type_super_admin?
  end

  # Check if user can create tournaments
  # Only tournament_admin and super_admin
  def can_create_tournament?
    membership_type_tournament_admin? ||
    membership_type_super_admin?
  end

  # Check if user can manage tournament sites
  def can_manage_tournament_site?
    can_create_tournament?
  end

  # Check if user has admin privileges
  def admin?
    is_admin? || membership_type_super_admin?
  end

  # =============================================================================
  # Status Methods
  # =============================================================================

  def active?
    status == "active"
  end

  def suspended?
    status == "suspended" && suspended_at.present?
  end

  def suspend!(reason = nil)
    update!(
      status: "suspended",
      suspended_at: Time.current
    )
  end

  def activate!
    update!(
      status: "active",
      suspended_at: nil
    )
  end

  # =============================================================================
  # Subscription Methods
  # =============================================================================

  def start_subscription!(type, duration_months = 1)
    update!(
      membership_type: type,
      subscription_status: "active",
      subscription_started_at: Time.current,
      subscription_expires_at: duration_months.months.from_now
    )
  end

  def cancel_subscription!
    update!(
      subscription_status: "cancelled",
      subscription_expires_at: Time.current
    )
  end

  def renew_subscription!(duration_months = 1)
    new_expiry = if subscription_expires_at&.future?
                   subscription_expires_at + duration_months.months
                 else
                   duration_months.months.from_now
                 end

    update!(
      subscription_status: "active",
      subscription_expires_at: new_expiry
    )
  end

  def days_until_subscription_expires
    return nil unless subscription_expires_at

    (subscription_expires_at.to_date - Date.current).to_i
  end

  # =============================================================================
  # Display Methods
  # =============================================================================

  def display_name
    nickname.presence || name.presence || email.split("@").first
  end

  def membership_badge_class
    case membership_type
    when "free" then "badge-free"
    when "pro" then "badge-pro"
    when "pickup_host" then "badge-pickup-host"
    when "tournament_admin" then "badge-tournament-admin"
    when "super_admin" then "badge-super-admin"
    else "badge-secondary"
    end
  end

  def membership_label
    I18n.t("membership.#{membership_type}", default: membership_type.titleize)
  end

  def position_label
    return nil unless position

    I18n.t("positions.#{position}", default: position)
  end

  def full_address
    [city, district].compact.join(" ")
  end

  # Format phone number for display
  def formatted_phone
    return nil unless phone

    phone.gsub(/(\d{3})(\d{3,4})(\d{4})/, '\1-\2-\3')
  end

  # =============================================================================
  # Payment & Account Methods
  # =============================================================================

  # 계좌 정보 있는지
  def has_payment_info?
    bank_name.present? && account_number.present?
  end

  # 전체 계좌 정보
  def full_account_info
    return nil unless has_payment_info?

    "#{bank_name} #{account_number} #{account_holder}"
  end

  # 복사용 계좌 정보
  def account_info_for_copy
    full_account_info
  end

  # 토스 딥링크 URL 생성
  def toss_transfer_url(amount:, message: nil)
    encoded_message = message.present? ? CGI.escape(message.to_s) : ""

    if toss_id.present?
      # 토스 아이디로 송금
      url = "supertoss://send?receiver=#{toss_id}&amount=#{amount}"
      url += "&msg=#{encoded_message}" if message.present?
      url
    elsif account_number.present? && bank_code.present?
      # 계좌번호로 송금
      clean_account = account_number.to_s.gsub(/[^0-9]/, "")
      url = "supertoss://send?bank=#{bank_code}&accountNo=#{clean_account}&amount=#{amount}"
      url += "&msg=#{encoded_message}" if message.present?
      url
    end
  end

  # 은행 코드 (토스 딥링크용)
  BANK_CODES = {
    "카카오뱅크" => "090",
    "토스뱅크" => "092",
    "KB국민은행" => "004",
    "신한은행" => "088",
    "우리은행" => "020",
    "하나은행" => "081",
    "NH농협은행" => "011",
    "IBK기업은행" => "003",
    "SC제일은행" => "023",
    "씨티은행" => "027",
    "새마을금고" => "045",
    "신협" => "048",
    "우체국" => "071",
    "케이뱅크" => "089"
  }.freeze

  # 은행 이름으로 코드 가져오기
  def resolved_bank_code
    bank_code.presence || BANK_CODES[bank_name]
  end

  # =============================================================================
  # Placeholder for associations (to be added later)
  # =============================================================================

  # Count of teams where user is captain
  def teams_as_captain_count
    captained_teams.count
  end

  # =============================================================================
  # Board Favorites Methods
  # =============================================================================

  # Get ordered list of favorite board categories
  def favorite_board_categories
    board_favorites.ordered.pluck(:category)
  end

  # Check if a category is favorited
  def favorited_board?(category)
    board_favorites.exists?(category: category)
  end

  # =============================================================================
  # Admin Mode Methods
  # =============================================================================

  # Check if user should see admin mode toggle
  def show_admin_mode?
    can_create_tournament? || can_access_pickup_menu?
  end

  # Check if admin mode is currently active
  def admin_mode_active?
    prefer_admin_mode && show_admin_mode?
  end

  # =============================================================================
  # Notification Methods
  # =============================================================================

  def unread_notifications_count
    notifications.unread.count
  end

  def push_enabled?
    push_token.present? && push_notifications_enabled?
  end

  def push_notifications_enabled?
    # 기본값 true, 설정에서 비활성화 가능
    metadata&.dig("push_notifications") != false
  end

  # =============================================================================
  # Memory Marketing Methods
  # =============================================================================

  def total_career_points
    player_game_stats.sum(:points)
  end

  def previous_total_points
    # 마지막 경기 제외한 누적 득점 (마일스톤 체크용)
    player_game_stats.order(created_at: :desc).offset(1).sum(:points)
  end

  def total_career_three_pointers
    player_game_stats.sum(:three_pointers_made)
  end

  def previous_total_three_pointers
    player_game_stats.order(created_at: :desc).offset(1).sum(:three_pointers_made)
  end

  def career_high_stats
    {
      points: player_game_stats.maximum(:points) || 0,
      rebounds: player_game_stats.maximum(:rebounds) || 0,
      assists: player_game_stats.maximum(:assists) || 0
    }
  end

  private

  def normalize_email
    self.email = email.to_s.downcase.strip
  end

  def normalize_phone
    self.phone = phone.to_s.gsub(/[^0-9]/, "") if phone.present?
  end
end
