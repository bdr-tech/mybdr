# frozen_string_literal: true

class AdminLog < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :admin, class_name: "User"
  belongs_to :target, polymorphic: true, optional: true

  # =============================================================================
  # Constants
  # =============================================================================
  ACTIONS = %w[
    create update delete
    approve reject
    suspend activate
    refund cancel
    assign export
    login logout
    settings_change
    bulk_action
  ].freeze

  SEVERITIES = %w[info warning error critical].freeze

  RESOURCE_TYPES = %w[
    User Team Tournament TournamentTeam
    Game Payment Notification
    Suggestion SystemSetting
    MarketplaceItem Post Comment
  ].freeze

  # =============================================================================
  # Validations
  # =============================================================================
  validates :action, presence: true
  validates :resource_type, presence: true
  validates :severity, inclusion: { in: SEVERITIES }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :recent, -> { order(created_at: :desc) }
  scope :by_admin, ->(admin_id) { where(admin_id: admin_id) }
  scope :by_action, ->(action) { where(action: action) }
  scope :by_resource, ->(type) { where(resource_type: type) }
  scope :by_severity, ->(severity) { where(severity: severity) }
  scope :today, -> { where("created_at >= ?", Date.current.beginning_of_day) }
  scope :this_week, -> { where("created_at >= ?", 1.week.ago) }
  scope :critical_and_errors, -> { where(severity: %w[error critical]) }

  # =============================================================================
  # Class Methods
  # =============================================================================

  def self.log_action(admin:, action:, resource:, changes: {}, previous: {}, description: nil, severity: "info", request: nil)
    create!(
      admin: admin,
      target: resource.is_a?(ApplicationRecord) ? resource : nil,
      action: action,
      resource_type: resource.is_a?(ApplicationRecord) ? resource.class.name : resource.to_s,
      resource_id: resource.is_a?(ApplicationRecord) ? resource.id : nil,
      changes_made: changes,
      previous_values: previous,
      description: description,
      severity: severity,
      ip_address: request&.remote_ip,
      user_agent: request&.user_agent,
      request_id: request&.request_id
    )
  end

  def self.log_user_action(admin:, user:, action:, description: nil, request: nil)
    log_action(
      admin: admin,
      action: action,
      resource: user,
      description: description || "#{action} action on user #{user.email}",
      request: request
    )
  end

  def self.log_payment_action(admin:, payment:, action:, description: nil, request: nil)
    log_action(
      admin: admin,
      action: action,
      resource: payment,
      description: description || "#{action} action on payment #{payment.payment_code}",
      severity: action == "refund" ? "warning" : "info",
      request: request
    )
  end

  def self.log_settings_change(admin:, key:, old_value:, new_value:, request: nil)
    log_action(
      admin: admin,
      action: "settings_change",
      resource: "SystemSetting",
      changes: { key => new_value },
      previous: { key => old_value },
      description: "Changed setting '#{key}' from '#{old_value}' to '#{new_value}'",
      severity: "warning",
      request: request
    )
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  def action_label
    {
      "create" => "생성",
      "update" => "수정",
      "delete" => "삭제",
      "approve" => "승인",
      "reject" => "거절",
      "suspend" => "정지",
      "activate" => "활성화",
      "refund" => "환불",
      "cancel" => "취소",
      "assign" => "할당",
      "export" => "내보내기",
      "login" => "로그인",
      "logout" => "로그아웃",
      "settings_change" => "설정 변경",
      "bulk_action" => "일괄 처리"
    }[action] || action
  end

  def severity_badge_class
    {
      "info" => "bg-blue-100 text-blue-800",
      "warning" => "bg-yellow-100 text-yellow-800",
      "error" => "bg-red-100 text-red-800",
      "critical" => "bg-red-600 text-white"
    }[severity] || "bg-gray-100 text-gray-800"
  end

  def severity_label
    {
      "info" => "정보",
      "warning" => "주의",
      "error" => "오류",
      "critical" => "심각"
    }[severity] || severity
  end

  def resource_label
    {
      "User" => "사용자",
      "Team" => "팀",
      "Tournament" => "대회",
      "TournamentTeam" => "참가팀",
      "Game" => "경기",
      "Payment" => "결제",
      "Notification" => "알림",
      "Suggestion" => "건의사항",
      "SystemSetting" => "시스템 설정",
      "MarketplaceItem" => "마켓 상품",
      "Post" => "게시글",
      "Comment" => "댓글"
    }[resource_type] || resource_type
  end

  def summary
    "#{admin.display_name}님이 #{resource_label}(##{resource_id})을 #{action_label}"
  end
end
