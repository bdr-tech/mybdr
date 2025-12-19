# frozen_string_literal: true

class Tournament < ApplicationRecord
  # =============================================================================
  # Active Storage
  # =============================================================================
  has_one_attached :logo
  has_one_attached :banner

  # =============================================================================
  # Constants
  # =============================================================================

  # 1단계: 부별 (메인 카테고리)
  DIVISION_CATEGORIES = {
    "일반부" => { code: "general", description: "만 18세 이상 성인" },
    "대학부" => { code: "college", description: "대학교 재학생/휴학생" },
    "여성부" => { code: "women", description: "여성 선수" },
    "유소년부" => { code: "youth", description: "만 18세 미만" },
    "시니어부" => { code: "senior", description: "만 40세 이상" },
    "초보부" => { code: "beginner", description: "농구 경력 2년 미만" }
  }.freeze

  # 2단계: 조별/리그 (하위 카테고리)
  DIVISION_TIERS = {
    "1부" => { code: "tier1", description: "상위 리그" },
    "2부" => { code: "tier2", description: "중위 리그" },
    "3부" => { code: "tier3", description: "하위 리그" },
    "A조" => { code: "group_a", description: "A 그룹" },
    "B조" => { code: "group_b", description: "B 그룹" },
    "C조" => { code: "group_c", description: "C 그룹" },
    "D조" => { code: "group_d", description: "D 그룹" }
  }.freeze

  # 기존 호환성 유지
  DIVISIONS = DIVISION_CATEGORIES

  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :series, class_name: "TournamentSeries", optional: true, counter_cache: :tournaments_count
  belongs_to :organizer, class_name: "User"
  belongs_to :venue, class_name: "Court", optional: true
  belongs_to :champion_team, class_name: "Team", optional: true
  belongs_to :mvp_player, class_name: "User", optional: true

  has_many :tournament_teams, dependent: :destroy
  has_many :teams, through: :tournament_teams
  has_many :tournament_matches, dependent: :destroy

  # Tournament Admin System
  has_many :tournament_admin_members, dependent: :destroy
  has_many :admins, through: :tournament_admin_members, source: :user
  has_one :tournament_site, dependent: :destroy

  # =============================================================================
  # Enums
  # =============================================================================
  enum :status, {
    draft: "draft",
    registration_open: "registration_open",
    registration_closed: "registration_closed",
    in_progress: "in_progress",
    completed: "completed",
    cancelled: "cancelled"
  }, prefix: true

  enum :format, {
    single_elimination: "single_elimination",
    double_elimination: "double_elimination",
    round_robin: "round_robin",
    group_stage: "group_stage",
    swiss: "swiss"
  }, prefix: true

  # =============================================================================
  # Callbacks
  # =============================================================================
  after_save :update_series_counter, if: -> { series.present? }

  # =============================================================================
  # Validations
  # =============================================================================
  validates :name, presence: true, length: { maximum: 100 }
  validates :max_teams, numericality: { greater_than: 1 }
  validates :min_teams, numericality: { greater_than: 1 }
  validates :team_size, numericality: { greater_than: 0 }
  validate :registration_dates_valid
  validate :tournament_dates_valid

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :published, -> { where.not(status: :draft) }
  scope :active, -> { where(status: [:registration_open, :registration_closed, :in_progress]) }
  scope :upcoming, -> { where("start_date > ?", Time.current).order(start_date: :asc) }
  scope :past, -> { where("end_date < ?", Time.current).order(end_date: :desc) }
  scope :by_series, ->(series) { where(series: series) }
  scope :in_city, ->(city) { where(city: city) }
  scope :public_tournaments, -> { where(is_public: true) }
  scope :registering, -> { where(status: :registration_open) }

  # =============================================================================
  # Instance Methods
  # =============================================================================

  # 등록 가능 여부
  def can_register?
    status_registration_open? && !full? && registration_period_active?
  end

  # 등록 기간 활성화 여부
  def registration_period_active?
    return true unless registration_start_at && registration_end_at

    Time.current.between?(registration_start_at, registration_end_at)
  end

  # 팀 등록 여부
  def team_registered?(team)
    tournament_teams.exists?(team: team)
  end

  # 대회 마감 여부
  def full?
    teams_count >= max_teams
  end

  # 남은 자리
  def remaining_spots
    [max_teams - teams_count, 0].max
  end

  # 참가비 유무
  def has_fee?
    entry_fee.to_i > 0
  end

  # 등록 시작
  def open_registration!
    update!(status: :registration_open)
  end

  # 등록 마감
  def close_registration!
    update!(status: :registration_closed)
  end

  # 대회 시작
  def start!
    update!(status: :in_progress)
  end

  # 대회 완료
  def complete!(champion:, mvp: nil)
    update!(
      status: :completed,
      champion_team: champion,
      mvp_player: mvp
    )
  end

  # 대회 취소
  def cancel!
    update!(status: :cancelled)
  end

  # 상태 한글명
  def status_name
    case status
    when "draft" then "임시저장"
    when "registration_open" then "참가 모집중"
    when "registration_closed" then "등록 마감"
    when "in_progress" then "진행중"
    when "completed" then "완료"
    when "cancelled" then "취소됨"
    else status
    end
  end

  # 포맷 한글명
  def format_name
    case self.format
    when "single_elimination" then "싱글 엘리미네이션"
    when "double_elimination" then "더블 엘리미네이션"
    when "round_robin" then "리그전"
    when "group_stage" then "조별 리그"
    when "swiss" then "스위스 리그"
    else self.format
    end
  end

  # 대회 기간 표시
  def date_range
    return "미정" unless start_date

    if end_date && start_date != end_date
      "#{start_date.strftime('%Y.%m.%d')} ~ #{end_date.strftime('%Y.%m.%d')}"
    else
      start_date.strftime("%Y.%m.%d")
    end
  end

  # 장소 표시
  def location_display
    venue_name.presence || venue&.name || "미정"
  end

  # 회차 표시 (시리즈 내)
  def edition_display
    return nil unless edition_number

    "#{edition_number}회"
  end

  # 다음 회차 생성 (시리즈 내에서)
  def create_next_edition!(attributes = {})
    return unless series

    series.create_next_edition!(attributes)
  end

  # 팀 수 업데이트
  def update_teams_count!
    update_column(:teams_count, tournament_teams.approved.count)
  end

  # 경기 수 업데이트
  def update_matches_count!
    update_column(:matches_count, tournament_matches.count)
  end

  # =============================================================================
  # Image Methods
  # =============================================================================

  # 로고 이미지 URL (Active Storage 우선, fallback to logo_url)
  def logo_image_url
    if logo.attached?
      Rails.application.routes.url_helpers.rails_blob_path(logo, only_path: true)
    else
      logo_url
    end
  end

  # 배너 이미지 URL (Active Storage 우선, fallback to banner_url)
  def banner_image_url
    if banner.attached?
      Rails.application.routes.url_helpers.rails_blob_path(banner, only_path: true)
    else
      banner_url
    end
  end

  # 로고가 있는지 확인
  def has_logo?
    logo.attached? || logo_url.present?
  end

  # 배너가 있는지 확인
  def has_banner?
    banner.attached? || banner_url.present?
  end

  # =============================================================================
  # Color Methods
  # =============================================================================

  DEFAULT_PRIMARY_COLOR = "#E53E3E".freeze
  DEFAULT_SECONDARY_COLOR = "#ED8936".freeze

  def theme_primary_color
    primary_color.presence || DEFAULT_PRIMARY_COLOR
  end

  def theme_secondary_color
    secondary_color.presence || DEFAULT_SECONDARY_COLOR
  end

  def has_custom_colors?
    primary_color.present? || secondary_color.present?
  end

  # =============================================================================
  # Division Methods
  # =============================================================================

  # 부별 선택 여부
  def has_divisions?
    divisions.present? && divisions.any?
  end

  # 부별 목록 표시
  def divisions_display
    return "전체" unless has_divisions?
    divisions.join(", ")
  end

  # 부별 개수
  def divisions_count
    divisions&.size || 0
  end

  # 특정 부 포함 여부
  def has_division?(division_name)
    divisions&.include?(division_name)
  end

  # 부별 추가
  def add_division!(division_name)
    return unless DIVISIONS.key?(division_name)
    return if has_division?(division_name)

    update!(divisions: (divisions || []) + [division_name])
  end

  # 부별 제거
  def remove_division!(division_name)
    return unless has_division?(division_name)

    update!(divisions: divisions - [division_name])
  end

  # 부별 옵션 (select helper용)
  def self.division_options
    DIVISIONS.map { |name, info| [name, name, { data: { description: info[:description] } }] }
  end

  # =============================================================================
  # Division Tier Methods (2단계: 조별/리그)
  # =============================================================================

  # 조별 선택 여부
  def has_division_tiers?
    division_tiers.present? && division_tiers.any?
  end

  # 조별 목록 표시
  def division_tiers_display
    return nil unless has_division_tiers?
    division_tiers.join(", ")
  end

  # 전체 부별 표시 (1단계 + 2단계 조합)
  def full_divisions_display
    parts = []
    parts << divisions_display if has_divisions?
    parts << division_tiers_display if has_division_tiers?
    parts.compact.join(" / ")
  end

  # 조별 옵션 (select helper용)
  def self.division_tier_options
    DIVISION_TIERS.map { |name, info| [name, name, { data: { description: info[:description] } }] }
  end

  # =============================================================================
  # Bank Account Methods
  # =============================================================================

  # 계좌 정보 존재 여부
  def has_bank_info?
    bank_name.present? && bank_account.present?
  end

  # 계좌 정보 표시
  def bank_info_display
    return nil unless has_bank_info?

    holder = bank_holder.present? ? " (#{bank_holder})" : ""
    "#{bank_name} #{bank_account}#{holder}"
  end

  # =============================================================================
  # Admin & Site Methods
  # =============================================================================

  # Check if user is admin
  def admin?(user)
    return false unless user
    tournament_admin_members.active.exists?(user: user)
  end

  # Check if user is owner
  def owner?(user)
    return false unless user
    tournament_admin_members.active.owners.exists?(user: user)
  end

  # Add admin
  def add_admin!(user, role: :admin)
    tournament_admin_members.create!(user: user, role: role)
  end

  # Has site?
  def has_site?
    tournament_site.present?
  end

  # Site URL
  def site_url
    tournament_site&.full_url
  end

  # Create site with template
  def create_site!(subdomain:, template: nil)
    raise '이미 사이트가 존재합니다' if has_site?

    create_tournament_site!(
      subdomain: subdomain,
      site_template: template,
      site_name: name
    )
  end

  private

  def update_series_counter
    series.update_column(:tournaments_count, series.tournaments.count)
  end

  def registration_dates_valid
    return unless registration_start_at && registration_end_at

    if registration_end_at <= registration_start_at
      errors.add(:registration_end_at, "은 등록 시작일 이후여야 합니다")
    end
  end

  def tournament_dates_valid
    return unless start_date && end_date

    if end_date < start_date
      errors.add(:end_date, "은 시작일 이후여야 합니다")
    end
  end
end
