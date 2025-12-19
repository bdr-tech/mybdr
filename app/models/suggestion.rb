# frozen_string_literal: true

class Suggestion < ApplicationRecord
  include HasUuid

  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :user
  belongs_to :assigned_to, class_name: "User", optional: true
  belongs_to :responded_by, class_name: "User", optional: true

  has_many_attached :attachments

  # =============================================================================
  # Constants
  # =============================================================================
  CATEGORIES = %w[
    general
    bug_report
    feature_request
    improvement
    payment
    tournament
    team
    marketplace
    other
  ].freeze

  STATUSES = %w[
    pending
    in_review
    in_progress
    resolved
    rejected
    closed
  ].freeze

  PRIORITIES = {
    low: 0,
    normal: 1,
    high: 2,
    urgent: 3
  }.freeze

  # =============================================================================
  # Enums
  # =============================================================================
  enum :status, {
    pending: "pending",
    in_review: "in_review",
    in_progress: "in_progress",
    resolved: "resolved",
    rejected: "rejected",
    closed: "closed"
  }, prefix: true

  # =============================================================================
  # Validations
  # =============================================================================
  validates :title, presence: true, length: { maximum: 200 }
  validates :content, presence: true, length: { maximum: 5000 }
  validates :category, presence: true, inclusion: { in: CATEGORIES }
  validates :priority, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 3 }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :recent, -> { order(created_at: :desc) }
  scope :by_category, ->(category) { where(category: category) if category.present? }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_priority, ->(priority) { where(priority: priority) if priority.present? }
  scope :pending_review, -> { where(status: %w[pending in_review]) }
  scope :active, -> { where.not(status: %w[resolved rejected closed]) }
  scope :high_priority, -> { where(priority: [2, 3]) }
  scope :unassigned, -> { where(assigned_to: nil) }
  scope :this_week, -> { where("created_at >= ?", 1.week.ago) }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :generate_uuid, on: :create
  after_create :notify_admins

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def assign_to!(admin)
    update!(assigned_to: admin, status: :in_review)
  end

  def start_progress!
    update!(status: :in_progress)
  end

  def resolve!(admin:, response:)
    update!(
      status: :resolved,
      admin_response: response,
      responded_by: admin,
      responded_at: Time.current
    )
    notify_user_resolved
  end

  def reject!(admin:, response:)
    update!(
      status: :rejected,
      admin_response: response,
      responded_by: admin,
      responded_at: Time.current
    )
    notify_user_rejected
  end

  def close!
    update!(status: :closed)
  end

  def reopen!
    update!(status: :pending, admin_response: nil, responded_at: nil, responded_by: nil)
  end

  def pending?
    status_pending?
  end

  def resolved?
    status_resolved?
  end

  def can_respond?
    !status_resolved? && !status_rejected? && !status_closed?
  end

  def response_time_hours
    return nil unless responded_at

    ((responded_at - created_at) / 1.hour).round(1)
  end

  def category_label
    {
      "general" => "일반",
      "bug_report" => "버그 신고",
      "feature_request" => "기능 요청",
      "improvement" => "개선 제안",
      "payment" => "결제 관련",
      "tournament" => "대회 관련",
      "team" => "팀 관련",
      "marketplace" => "마켓플레이스",
      "other" => "기타"
    }[category] || category
  end

  def status_label
    {
      "pending" => "대기중",
      "in_review" => "검토중",
      "in_progress" => "처리중",
      "resolved" => "해결됨",
      "rejected" => "반려됨",
      "closed" => "종료"
    }[status] || status
  end

  def status_badge_class
    {
      "pending" => "bg-yellow-100 text-yellow-800",
      "in_review" => "bg-blue-100 text-blue-800",
      "in_progress" => "bg-purple-100 text-purple-800",
      "resolved" => "bg-green-100 text-green-800",
      "rejected" => "bg-red-100 text-red-800",
      "closed" => "bg-gray-100 text-gray-800"
    }[status] || "bg-gray-100 text-gray-800"
  end

  def priority_label
    {
      0 => "낮음",
      1 => "보통",
      2 => "높음",
      3 => "긴급"
    }[priority] || "보통"
  end

  def priority_badge_class
    {
      0 => "bg-gray-100 text-gray-600",
      1 => "bg-blue-100 text-blue-600",
      2 => "bg-orange-100 text-orange-600",
      3 => "bg-red-100 text-red-600"
    }[priority] || "bg-gray-100 text-gray-600"
  end

  private

  def generate_uuid
    self.uuid ||= SecureRandom.uuid
  end

  def notify_admins
    # 관리자들에게 새 건의사항 알림
    User.where(is_admin: true).find_each do |admin|
      admin.notifications.create!(
        notification_type: "system_announcement",
        title: "새 건의사항",
        content: "#{user.display_name}님이 건의사항을 등록했습니다: #{title}",
        notifiable: self,
        action_url: "/admin/suggestions/#{uuid}",
        action_type: "review"
      )
    end
  end

  def notify_user_resolved
    user.notifications.create!(
      notification_type: "system_announcement",
      title: "건의사항 처리 완료",
      content: "'#{title}' 건의사항이 처리되었습니다.",
      notifiable: self,
      action_url: "/suggestions/#{uuid}",
      action_type: "view",
      metadata: { response: admin_response }
    )
  end

  def notify_user_rejected
    user.notifications.create!(
      notification_type: "system_announcement",
      title: "건의사항 반려",
      content: "'#{title}' 건의사항이 반려되었습니다.",
      notifiable: self,
      action_url: "/suggestions/#{uuid}",
      action_type: "view",
      metadata: { response: admin_response }
    )
  end
end
