# frozen_string_literal: true

class Team < ApplicationRecord
  include HasUuid

  # Active Storage의 record_id가 UUID 타입이므로 uuid를 기본 키로 설정
  self.primary_key = "uuid"

  # =============================================================================
  # Active Storage
  # =============================================================================
  has_one_attached :logo
  has_one_attached :banner

  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :captain, class_name: "User"
  belongs_to :manager, class_name: "User", optional: true

  has_many :team_members, dependent: :destroy
  has_many :members, through: :team_members, source: :user
  has_many :team_join_requests, dependent: :destroy
  has_many :team_member_histories, dependent: :destroy
  has_many :tournament_teams, dependent: :destroy
  has_many :tournaments, through: :tournament_teams

  # Transfer history associations
  has_many :transfers_from, class_name: "TeamMemberHistory", foreign_key: :from_team_id
  has_many :transfers_to, class_name: "TeamMemberHistory", foreign_key: :to_team_id

  # =============================================================================
  # Enums
  # =============================================================================
  enum :status, {
    active: "active",
    inactive: "inactive",
    disbanded: "disbanded"
  }, prefix: true

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :generate_uuid, on: :create
  before_validation :generate_slug, on: :create
  before_validation :generate_team_code, on: :create
  after_create :add_captain_as_member
  after_create :record_team_creation_history

  # =============================================================================
  # Validations
  # =============================================================================
  validates :name, presence: true, length: { maximum: 50 }
  validates :uuid, presence: true, uniqueness: true
  validates :slug, presence: true, uniqueness: true
  validates :team_code, uniqueness: true, allow_nil: true

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :active, -> { where(status: :active) }
  scope :public_teams, -> { where(is_public: true) }
  scope :accepting, -> { where(accepting_members: true) }
  scope :in_city, ->(city) { where(city: city) }
  scope :search, ->(query) {
    where("name ILIKE :q OR city ILIKE :q", q: "%#{query}%") if query.present?
  }

  # =============================================================================
  # Instance Methods
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

  # 팀원 추가
  def add_member!(user, attributes = {})
    team_members.create!(
      user: user,
      joined_at: Time.current,
      **attributes
    )
    update_members_count!
  end

  # 팀원 제거
  def remove_member!(user)
    member = team_members.find_by!(user: user)
    member.update!(status: :left, left_at: Time.current)
    update_members_count!
  end

  # 멤버 수 업데이트
  def update_members_count!
    update_column(:members_count, team_members.active.count)
  end

  # 팀원 여부
  def member?(user)
    team_members.active.exists?(user: user)
  end

  # 팀장 여부
  def captain?(user)
    captain_id == user&.id
  end

  # 관리자 여부
  def admin?(user)
    captain?(user) || manager_id == user&.id
  end

  # 전적 표시
  def record_display
    "#{wins}승 #{losses}패 #{draws}무"
  end

  # 승률
  def win_rate
    total = wins + losses + draws
    return 0.0 if total.zero?

    (wins.to_f / total * 100).round(1)
  end

  # 가입 가능 여부
  def can_join?(user)
    return false unless accepting_members?
    return false if team_members.exists?(user: user)
    return false if team_join_requests.pending.exists?(user: user)
    true
  end

  # 주장 이전
  def transfer_captain!(new_captain, processed_by: nil)
    return false unless team_members.status_active.exists?(user: new_captain)

    transaction do
      old_captain = captain
      old_member = team_members.find_by(user: old_captain)
      new_member = team_members.find_by(user: new_captain)

      old_member&.update!(role: :member)
      new_member&.update!(role: :captain)
      update!(captain: new_captain)

      TeamMemberHistory.create!(
        user: new_captain,
        team: self,
        action: "captain_transferred",
        role: "captain",
        processed_by: processed_by,
        note: "#{old_captain.display_name}에서 #{new_captain.display_name}으로 주장 이전"
      )
    end
    true
  rescue ActiveRecord::RecordInvalid
    false
  end

  # 가입 대기 수
  def pending_requests_count
    team_join_requests.pending.count
  end

  # 팀의 모든 토너먼트 경기
  def all_tournament_matches
    tournament_team_ids = tournament_teams.pluck(:id)
    return TournamentMatch.none if tournament_team_ids.empty?

    TournamentMatch.where(
      "home_team_id IN (?) OR away_team_id IN (?)",
      tournament_team_ids,
      tournament_team_ids
    )
  end

  # 예정된 경기
  def upcoming_matches(limit: 5)
    all_tournament_matches
      .where("scheduled_at > ?", Time.current)
      .where(status: [:scheduled, :live])
      .order(scheduled_at: :asc)
      .limit(limit)
  end

  # 최근 완료된 경기
  def recent_matches(limit: 5)
    all_tournament_matches
      .where(status: :completed)
      .order(ended_at: :desc)
      .limit(limit)
  end

  # 특정 경기에서 이 팀이 승리했는지
  def won_match?(match)
    tournament_team_ids = tournament_teams.pluck(:id)
    return false unless match.winner_team_id

    tournament_team_ids.include?(match.winner_team_id)
  end

  # 특정 경기에서 이 팀의 득점
  def team_score_in_match(match)
    tournament_team_ids = tournament_teams.pluck(:id)

    if tournament_team_ids.include?(match.home_team_id)
      match.home_score
    elsif tournament_team_ids.include?(match.away_team_id)
      match.away_score
    end
  end

  # 특정 경기에서 상대팀 득점
  def opponent_score_in_match(match)
    tournament_team_ids = tournament_teams.pluck(:id)

    if tournament_team_ids.include?(match.home_team_id)
      match.away_score
    elsif tournament_team_ids.include?(match.away_team_id)
      match.home_score
    end
  end

  # 특정 경기에서 상대팀
  def opponent_in_match(match)
    tournament_team_ids = tournament_teams.pluck(:id)

    if tournament_team_ids.include?(match.home_team_id)
      match.away_team&.team
    elsif tournament_team_ids.include?(match.away_team_id)
      match.home_team&.team
    end
  end

  private

  def generate_uuid
    self.uuid ||= SecureRandom.uuid
  end

  def generate_slug
    return if slug.present?

    base_slug = name.to_s.parameterize
    base_slug = SecureRandom.hex(4) if base_slug.blank?

    slug_candidate = base_slug
    counter = 1

    while Team.exists?(slug: slug_candidate)
      slug_candidate = "#{base_slug}-#{counter}"
      counter += 1
    end

    self.slug = slug_candidate
  end

  def generate_team_code
    return if team_code.present?
    loop do
      self.team_code = "TEAM-#{SecureRandom.alphanumeric(6).upcase}"
      break unless Team.exists?(team_code: team_code)
    end
  end

  def add_captain_as_member
    team_members.create!(
      user: captain,
      role: :captain,
      joined_at: Time.current,
      status: :active
    )
  end

  def record_team_creation_history
    TeamMemberHistory.create!(
      user: captain,
      team: self,
      action: "joined",
      role: "captain",
      note: "팀 생성 및 주장으로 등록"
    )
  end
end
