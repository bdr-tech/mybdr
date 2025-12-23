# frozen_string_literal: true

class Game < ApplicationRecord
  include HasUuid

  # =============================================================================
  # Constants
  # =============================================================================
  KOREAN_CITIES = [
    "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
    "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
  ].freeze

  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :organizer, class_name: "User"
  belongs_to :court, optional: true, counter_cache: true
  belongs_to :template, class_name: "GameTemplate", optional: true
  belongs_to :cloned_from, class_name: "Game", optional: true

  has_many :clones, class_name: "Game", foreign_key: :cloned_from_id, dependent: :nullify
  has_many :game_applications, dependent: :destroy
  has_many :applicants, through: :game_applications, source: :user
  has_many :approved_applications, -> { approved }, class_name: "GameApplication"
  has_many :participants, through: :approved_applications, source: :user

  # =============================================================================
  # Enums
  # =============================================================================
  enum :game_type, {
    pickup: 0,        # 픽업게임
    guest_recruit: 1, # 게스트 모집
    team_vs_team: 2   # 팀 대 팀
  }, prefix: true

  enum :status, {
    draft: 0,       # 임시저장
    published: 1,   # 공개됨 (모집중)
    full: 2,        # 마감 (인원 충족)
    in_progress: 3, # 진행중
    completed: 4,   # 완료
    cancelled: 5    # 취소됨
  }, prefix: true

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_create :generate_game_id
  before_create :generate_uuid
  before_save :sync_location_from_court

  # =============================================================================
  # Validations
  # =============================================================================
  validates :game_type, presence: true
  validates :scheduled_at, presence: true
  validates :max_participants, numericality: { greater_than: 0 }
  validates :min_participants, numericality: { greater_than: 0 }
  validates :fee_per_person, numericality: { greater_than_or_equal_to: 0 }
  validate :scheduled_at_must_be_in_future, on: :create

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :upcoming, -> { where("scheduled_at > ?", Time.current).order(scheduled_at: :asc) }
  scope :past, -> { where("scheduled_at <= ?", Time.current).order(scheduled_at: :desc) }
  scope :today, -> { where(scheduled_at: Time.current.beginning_of_day..Time.current.end_of_day) }
  scope :this_week, -> { where(scheduled_at: Time.current.beginning_of_week..Time.current.end_of_week) }
  scope :active, -> { where(status: [:published, :full]) }
  scope :recruiting, -> { where(status: :published) }
  scope :published, -> { where(status: :published) }
  scope :in_city, ->(city) { where(city: city) }
  scope :by_game_type, ->(type) { where(game_type: type) }
  scope :with_fee, -> { where("fee_per_person > 0") }
  scope :free, -> { where(fee_per_person: 0) }
  scope :recurring, -> { where(is_recurring: true) }

  # =============================================================================
  # Instance Methods
  # =============================================================================

  # 경기 ID 생성 (GAME-YYYYMMDD-TYPE-XXXX)
  def generate_game_id
    date_part = Time.current.strftime("%Y%m%d")
    type_part = game_type.to_s[0..2].upcase
    random_part = SecureRandom.alphanumeric(4).upcase
    self.game_id = "GAME-#{date_part}-#{type_part}-#{random_part}"
  end

  def generate_uuid
    self.uuid = SecureRandom.uuid
  end

  # 장소 정보를 court에서 동기화
  def sync_location_from_court
    return unless court.present?

    self.city ||= court.city
    self.district ||= court.district
    self.venue_name ||= court.name
    self.venue_address ||= court.full_address
  end

  # 참가 가능 여부
  def can_apply?(user)
    return false if user == organizer
    return false unless status_published?
    return false if full?
    return false if already_applied?(user)
    return false if game_type_pickup? && !organizer.can_access_pickup_menu?

    true
  end

  # 이미 신청했는지
  def already_applied?(user)
    game_applications.exists?(user: user)
  end

  # 마감 여부
  def full?
    current_participants >= max_participants
  end

  # 남은 자리
  def remaining_spots
    [max_participants - current_participants, 0].max
  end

  # 참가비 있는지
  def has_fee?
    fee_per_person.to_i > 0
  end

  # 장소 표시
  def location_display
    venue_name.presence || court&.name || "미정"
  end

  # 전체 주소
  def full_location
    [city, district, venue_address].compact.join(" ")
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

  # 상태 한글명
  def status_name
    case status
    when "draft" then "임시저장"
    when "published" then "모집중"
    when "full" then "마감"
    when "in_progress" then "진행중"
    when "completed" then "완료"
    when "cancelled" then "취소됨"
    else status
    end
  end

  # 스킬 레벨 한글명
  def skill_level_name
    case skill_level
    when "beginner" then "초급"
    when "intermediate" then "중급"
    when "advanced" then "상급"
    when "all" then "모든 레벨"
    else skill_level
    end
  end

  # 호스트인지 확인
  def host?(user)
    organizer_id == user&.id
  end

  # =============================================================================
  # 복제 기능
  # =============================================================================

  # 경기 복제
  def clone!(new_scheduled_at:, new_title: nil)
    new_game = dup
    new_game.assign_attributes(
      cloned_from: self,
      scheduled_at: new_scheduled_at,
      title: new_title || title,
      status: :draft,
      game_id: nil,
      uuid: nil,
      current_participants: 0,
      applications_count: 0,
      views_count: 0
    )
    new_game.save!
    new_game
  end

  # 템플릿으로 저장
  def save_as_template!(name:, is_public: false)
    GameTemplate.create!(
      user: organizer,
      name: name,
      game_type: game_type,
      court: court,
      is_public: is_public,
      default_settings: {
        max_participants: max_participants,
        min_participants: min_participants,
        fee_per_person: fee_per_person,
        duration_hours: duration_hours,
        uniform_home_color: uniform_home_color,
        uniform_away_color: uniform_away_color,
        skill_level: skill_level,
        requirements: requirements,
        description: description
      }
    )
  end

  # =============================================================================
  # 반복 경기 생성
  # =============================================================================

  # 반복 경기 생성
  def create_recurring_games!(count: 4)
    return [] unless is_recurring && recurrence_rule.present?

    games = []
    next_date = scheduled_at

    count.times do
      next_date = calculate_next_date(next_date)
      games << clone!(new_scheduled_at: next_date)
    end

    games
  end

  # 다음 일정 계산
  def calculate_next_date(from_date)
    case recurrence_rule
    when /weekly/
      from_date + 1.week
    when /biweekly/
      from_date + 2.weeks
    when /monthly/
      from_date + 1.month
    else
      from_date + 1.week
    end
  end

  # 반복 규칙 한글명
  def recurrence_rule_name
    case recurrence_rule
    when /weekly:monday/ then "매주 월요일"
    when /weekly:tuesday/ then "매주 화요일"
    when /weekly:wednesday/ then "매주 수요일"
    when /weekly:thursday/ then "매주 목요일"
    when /weekly:friday/ then "매주 금요일"
    when /weekly:saturday/ then "매주 토요일"
    when /weekly:sunday/ then "매주 일요일"
    when /weekly/ then "매주"
    when /biweekly/ then "격주"
    when /monthly/ then "매월"
    else recurrence_rule
    end
  end

  # =============================================================================
  # 참가자 관리
  # =============================================================================

  # 참가자 수 업데이트
  def update_participants_count!
    update_column(:current_participants, approved_applications.count)

    # 상태 자동 변경
    if current_participants >= max_participants && status_published?
      update_column(:status, :full)
    elsif current_participants < max_participants && status_full?
      update_column(:status, :published)
    end
  end

  private

  def scheduled_at_must_be_in_future
    return unless scheduled_at.present?

    if scheduled_at <= Time.current
      errors.add(:scheduled_at, "은 현재 시간 이후여야 합니다")
    end
  end
end
