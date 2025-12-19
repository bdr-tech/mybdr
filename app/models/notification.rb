# frozen_string_literal: true

class Notification < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :user
  belongs_to :notifiable, polymorphic: true, optional: true

  # =============================================================================
  # Constants - Notification Types
  # =============================================================================

  # 팀 관련 알림
  TEAM_NOTIFICATIONS = %w[
    team_join_request
    team_join_approved
    team_join_rejected
    team_member_left
    team_role_changed
    team_disbanded
  ].freeze

  # 결제 관련 알림
  PAYMENT_NOTIFICATIONS = %w[
    payment_completed
    payment_refunded
    payment_cancelled
    payment_failed
  ].freeze

  # 마켓플레이스 관련 알림
  MARKETPLACE_NOTIFICATIONS = %w[
    phone_request_received
    phone_request_approved
    phone_request_rejected
    item_price_dropped
    item_sold
    favorite_item_updated
  ].freeze

  # 경기 관련 알림
  GAME_NOTIFICATIONS = %w[
    game_application_received
    game_application_approved
    game_application_rejected
    game_application_cancelled
    game_reminder
    game_cancelled
    game_updated
  ].freeze

  # 대회 관련 알림
  TOURNAMENT_NOTIFICATIONS = %w[
    tournament_registration_opened
    tournament_registration_confirmed
    tournament_schedule_updated
    tournament_result_posted
  ].freeze

  # 추억 마케팅 알림 (데이터 마케팅)
  MEMORY_NOTIFICATIONS = %w[
    anniversary
    milestone_points
    milestone_3pt
    double_double
    triple_double
    game_high
    season_summary
    career_high
  ].freeze

  # 시스템 알림
  SYSTEM_NOTIFICATIONS = %w[
    system_announcement
    welcome
    profile_incomplete
    verification_required
  ].freeze

  ALL_NOTIFICATION_TYPES = (
    TEAM_NOTIFICATIONS +
    PAYMENT_NOTIFICATIONS +
    MARKETPLACE_NOTIFICATIONS +
    GAME_NOTIFICATIONS +
    TOURNAMENT_NOTIFICATIONS +
    MEMORY_NOTIFICATIONS +
    SYSTEM_NOTIFICATIONS
  ).freeze

  # =============================================================================
  # Enums
  # =============================================================================
  enum :status, {
    unread: "unread",
    read: "read",
    archived: "archived"
  }, prefix: true

  # =============================================================================
  # Validations
  # =============================================================================
  validates :notification_type, presence: true, inclusion: { in: ALL_NOTIFICATION_TYPES }
  validates :title, presence: true
  validates :status, presence: true

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :unread, -> { where(status: :unread) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_type, ->(type) { where(notification_type: type) if type.present? }
  scope :not_expired, -> { where("expired_at IS NULL OR expired_at > ?", Time.current) }
  scope :team_related, -> { where(notification_type: TEAM_NOTIFICATIONS) }
  scope :payment_related, -> { where(notification_type: PAYMENT_NOTIFICATIONS) }
  scope :marketplace_related, -> { where(notification_type: MARKETPLACE_NOTIFICATIONS) }
  scope :game_related, -> { where(notification_type: GAME_NOTIFICATIONS) }
  scope :tournament_related, -> { where(notification_type: TOURNAMENT_NOTIFICATIONS) }
  scope :memory_related, -> { where(notification_type: MEMORY_NOTIFICATIONS) }
  scope :system_related, -> { where(notification_type: SYSTEM_NOTIFICATIONS) }

  # =============================================================================
  # Callbacks
  # =============================================================================
  after_create :set_sent_at

  # =============================================================================
  # Class Methods
  # =============================================================================

  # 팀 가입 신청 알림 생성
  def self.create_team_join_request!(team:, requester:)
    team.captain.notifications.create!(
      notification_type: "team_join_request",
      title: "팀 가입 신청",
      content: "#{requester.display_name}님이 #{team.name} 팀에 가입을 신청했습니다.",
      notifiable: team,
      action_url: "/teams/#{team.id}/join_requests",
      action_type: "review",
      metadata: { requester_id: requester.id, requester_name: requester.display_name }
    )
  end

  # 팀 가입 승인 알림 생성
  def self.create_team_join_approved!(team:, member:)
    member.notifications.create!(
      notification_type: "team_join_approved",
      title: "팀 가입 승인",
      content: "#{team.name} 팀 가입이 승인되었습니다!",
      notifiable: team,
      action_url: "/teams/#{team.id}",
      action_type: "view"
    )
  end

  # 팀 가입 거절 알림 생성
  def self.create_team_join_rejected!(team:, user:, reason: nil)
    content = "#{team.name} 팀 가입이 거절되었습니다."
    content += " 사유: #{reason}" if reason.present?

    user.notifications.create!(
      notification_type: "team_join_rejected",
      title: "팀 가입 거절",
      content: content,
      notifiable: team,
      metadata: { reason: reason }
    )
  end

  # 전화번호 요청 알림 생성
  def self.create_phone_request!(item:, requester:)
    item.user.notifications.create!(
      notification_type: "phone_request_received",
      title: "연락처 요청",
      content: "#{requester.display_name}님이 '#{item.title}' 상품의 연락처를 요청했습니다.",
      notifiable: item,
      action_url: "/marketplace/items/#{item.id}/phone_requests",
      action_type: "review",
      metadata: { requester_id: requester.id, item_title: item.title }
    )
  end

  # 전화번호 요청 승인 알림 생성
  def self.create_phone_request_approved!(item:, requester:)
    requester.notifications.create!(
      notification_type: "phone_request_approved",
      title: "연락처 요청 승인",
      content: "'#{item.title}' 판매자가 연락처 공개를 승인했습니다.",
      notifiable: item,
      action_url: "/marketplace/items/#{item.id}",
      action_type: "contact",
      metadata: { phone: item.user.phone, item_title: item.title }
    )
  end

  # 전화번호 요청 거절 알림 생성
  def self.create_phone_request_rejected!(item:, requester:)
    requester.notifications.create!(
      notification_type: "phone_request_rejected",
      title: "연락처 요청 거절",
      content: "'#{item.title}' 판매자가 연락처 공개를 거절했습니다.",
      notifiable: item,
      metadata: { item_title: item.title }
    )
  end

  # 찜 상품 가격 인하 알림 생성
  def self.create_price_drop!(item:, user:, old_price:, new_price:)
    discount_percent = ((old_price - new_price) / old_price.to_f * 100).round

    user.notifications.create!(
      notification_type: "item_price_dropped",
      title: "찜 상품 가격 인하",
      content: "'#{item.title}' 가격이 #{discount_percent}% 인하되었습니다! (#{old_price.to_i.to_fs(:delimited)}원 → #{new_price.to_i.to_fs(:delimited)}원)",
      notifiable: item,
      action_url: "/marketplace/items/#{item.id}",
      action_type: "view",
      metadata: {
        old_price: old_price,
        new_price: new_price,
        discount_percent: discount_percent
      }
    )
  end

  # 추억 마케팅 알림 생성 (N년 전 오늘)
  def self.create_anniversary!(user:, game:, years_ago:)
    user.notifications.create!(
      notification_type: "anniversary",
      title: "#{years_ago}년 전 오늘",
      content: "#{years_ago}년 전 오늘, #{game.tournament&.name || '경기'}에서 멋진 플레이를 펼쳤습니다!",
      notifiable: game,
      action_url: "/games/#{game.id}",
      action_type: "memory_card",
      metadata: {
        years_ago: years_ago,
        game_date: game.game_date,
        stats: game.player_stats_for(user)&.slice(:points, :rebounds, :assists)
      }
    )
  end

  # 마일스톤 알림 생성
  def self.create_milestone!(user:, milestone_type:, value:, game: nil)
    titles = {
      "milestone_points" => "통산 #{value}득점 달성!",
      "milestone_3pt" => "통산 #{value}개 3점슛 달성!",
      "double_double" => "더블더블 달성!",
      "triple_double" => "트리플더블 달성!",
      "game_high" => "경기 최고 기록!",
      "career_high" => "개인 최고 기록 경신!"
    }

    contents = {
      "milestone_points" => "축하합니다! 통산 #{value}득점을 달성했습니다.",
      "milestone_3pt" => "축하합니다! 통산 #{value}개의 3점슛을 성공시켰습니다.",
      "double_double" => "두 부문에서 두 자릿수 기록을 달성했습니다!",
      "triple_double" => "세 부문에서 두 자릿수 기록을 달성했습니다!",
      "game_high" => "이번 경기에서 최고 기록을 세웠습니다!",
      "career_high" => "개인 통산 최고 기록을 경신했습니다!"
    }

    user.notifications.create!(
      notification_type: milestone_type,
      title: titles[milestone_type] || "마일스톤 달성!",
      content: contents[milestone_type] || "축하합니다!",
      notifiable: game,
      action_url: game ? "/games/#{game.id}" : "/profile/stats",
      action_type: "memory_card",
      metadata: { milestone_type: milestone_type, value: value }
    )
  end

  # 시즌 서머리 알림 생성
  def self.create_season_summary!(user:, season:, stats:)
    user.notifications.create!(
      notification_type: "season_summary",
      title: "#{season} 시즌 리포트",
      content: "#{season} 시즌의 활약을 확인해보세요!",
      action_url: "/profile/seasons/#{season}",
      action_type: "memory_card",
      metadata: {
        season: season,
        games_played: stats[:games_played],
        total_points: stats[:total_points],
        avg_points: stats[:avg_points]
      }
    )
  end

  # 경기 신청 접수 알림 생성 (주최자에게)
  def self.create_game_application_received!(game:, applicant:)
    game.organizer.notifications.create!(
      notification_type: "game_application_received",
      title: "경기 신청 접수",
      content: "#{applicant.display_name}님이 '#{game.title}' 경기에 신청했습니다.",
      notifiable: game,
      action_url: "/games/#{game.uuid}",
      action_type: "review",
      metadata: { applicant_id: applicant.id, applicant_name: applicant.display_name, game_title: game.title }
    )
  end

  # 경기 신청 승인 알림 생성 (신청자에게)
  def self.create_game_application_approved!(game:, applicant:)
    applicant.notifications.create!(
      notification_type: "game_application_approved",
      title: "경기 신청 승인",
      content: "'#{game.title}' 경기 참가가 승인되었습니다!",
      notifiable: game,
      action_url: "/games/#{game.uuid}",
      action_type: "view",
      metadata: { game_title: game.title, game_date: game.game_date&.to_s }
    )
  end

  # 경기 신청 거절 알림 생성 (신청자에게)
  def self.create_game_application_rejected!(game:, applicant:, reason: nil)
    content = "'#{game.title}' 경기 신청이 거절되었습니다."
    content += " 사유: #{reason}" if reason.present?

    applicant.notifications.create!(
      notification_type: "game_application_rejected",
      title: "경기 신청 거절",
      content: content,
      notifiable: game,
      metadata: { game_title: game.title, reason: reason }
    )
  end

  # 경기 취소 알림 생성 (참가자들에게)
  def self.create_game_cancelled!(game:, participant:, reason: nil)
    content = "'#{game.title}' 경기가 취소되었습니다."
    content += " 사유: #{reason}" if reason.present?

    participant.notifications.create!(
      notification_type: "game_cancelled",
      title: "경기 취소",
      content: content,
      notifiable: game,
      metadata: { game_title: game.title, reason: reason }
    )
  end

  # 경기 리마인더 알림 생성
  def self.create_game_reminder!(game:, participant:, hours_before: 24)
    participant.notifications.create!(
      notification_type: "game_reminder",
      title: "경기 알림",
      content: "'#{game.title}' 경기가 #{hours_before}시간 후에 시작됩니다.",
      notifiable: game,
      action_url: "/games/#{game.uuid}",
      action_type: "view",
      metadata: { game_title: game.title, hours_before: hours_before, game_date: game.game_date&.to_s }
    )
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def mark_as_read!
    update!(status: :read, read_at: Time.current)
  end

  def mark_as_unread!
    update!(status: :unread, read_at: nil)
  end

  def archive!
    update!(status: :archived)
  end

  def read?
    status_read?
  end

  def unread?
    status_unread?
  end

  def expired?
    expired_at.present? && expired_at < Time.current
  end

  def team_notification?
    TEAM_NOTIFICATIONS.include?(notification_type)
  end

  def payment_notification?
    PAYMENT_NOTIFICATIONS.include?(notification_type)
  end

  def marketplace_notification?
    MARKETPLACE_NOTIFICATIONS.include?(notification_type)
  end

  def tournament_notification?
    TOURNAMENT_NOTIFICATIONS.include?(notification_type)
  end

  def memory_notification?
    MEMORY_NOTIFICATIONS.include?(notification_type)
  end

  def system_notification?
    SYSTEM_NOTIFICATIONS.include?(notification_type)
  end

  def notification_type_label
    {
      # 팀 관련
      "team_join_request" => "팀 가입 신청",
      "team_join_approved" => "가입 승인",
      "team_join_rejected" => "가입 거절",
      "team_member_left" => "팀원 탈퇴",
      "team_role_changed" => "역할 변경",
      "team_disbanded" => "팀 해체",
      # 결제 관련
      "payment_completed" => "결제 완료",
      "payment_refunded" => "환불 완료",
      "payment_cancelled" => "결제 취소",
      "payment_failed" => "결제 실패",
      # 마켓플레이스 관련
      "phone_request_received" => "연락처 요청",
      "phone_request_approved" => "연락처 승인",
      "phone_request_rejected" => "연락처 거절",
      "item_price_dropped" => "가격 인하",
      "item_sold" => "판매 완료",
      "favorite_item_updated" => "찜 상품 업데이트",
      # 경기 관련
      "game_application_received" => "경기 신청 접수",
      "game_application_approved" => "경기 신청 승인",
      "game_application_rejected" => "경기 신청 거절",
      "game_application_cancelled" => "경기 신청 취소",
      "game_reminder" => "경기 알림",
      "game_cancelled" => "경기 취소",
      "game_updated" => "경기 정보 변경",
      # 대회 관련
      "tournament_registration_opened" => "참가 신청 시작",
      "tournament_registration_confirmed" => "참가 확정",
      "tournament_schedule_updated" => "일정 변경",
      "tournament_result_posted" => "결과 등록",
      # 추억 마케팅
      "anniversary" => "N년 전 오늘",
      "milestone_points" => "득점 마일스톤",
      "milestone_3pt" => "3점슛 마일스톤",
      "double_double" => "더블더블",
      "triple_double" => "트리플더블",
      "game_high" => "경기 최고",
      "season_summary" => "시즌 리포트",
      "career_high" => "커리어 하이",
      # 시스템
      "system_announcement" => "공지사항",
      "welcome" => "환영",
      "profile_incomplete" => "프로필 미완성",
      "verification_required" => "인증 필요"
    }[notification_type] || notification_type
  end

  def icon_name
    case notification_type
    when *TEAM_NOTIFICATIONS then "users"
    when *PAYMENT_NOTIFICATIONS then "credit-card"
    when *MARKETPLACE_NOTIFICATIONS then "shopping-bag"
    when *GAME_NOTIFICATIONS then "calendar"
    when *TOURNAMENT_NOTIFICATIONS then "trophy"
    when *MEMORY_NOTIFICATIONS then "star"
    when *SYSTEM_NOTIFICATIONS then "bell"
    else "bell"
    end
  end

  def game_notification?
    GAME_NOTIFICATIONS.include?(notification_type)
  end

  private

  def set_sent_at
    update_column(:sent_at, Time.current)
  end
end
