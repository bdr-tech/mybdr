# frozen_string_literal: true

class GameApplication < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :game, counter_cache: :applications_count
  belongs_to :user

  # =============================================================================
  # Enums
  # =============================================================================
  enum :status, {
    pending: 0,   # 대기중
    approved: 1,  # 승인됨
    rejected: 2,  # 거절됨
    cancelled: 3, # 취소됨
    attended: 4,  # 참석 완료
    no_show: 5    # 노쇼
  }, prefix: true

  enum :payment_status, {
    unpaid: 0,   # 미결제
    paid: 1,     # 결제완료
    refunded: 2  # 환불됨
  }, prefix: true

  # =============================================================================
  # Callbacks
  # =============================================================================
  after_save :update_game_participants_count, if: :saved_change_to_status?
  after_destroy :update_game_participants_count
  after_create :notify_organizer_of_application
  after_save :notify_applicant_of_status_change, if: :saved_change_to_status?

  # =============================================================================
  # Validations
  # =============================================================================
  validates :user_id, uniqueness: { scope: :game_id, message: "이미 신청하셨습니다" }
  validate :cannot_apply_own_game

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :approved, -> { where(status: :approved) }
  scope :pending_approval, -> { where(status: :pending) }
  scope :confirmed, -> { where(status: [:approved, :attended]) }
  scope :awaiting_payment, -> { where(status: :approved, payment_status: :unpaid) }

  # =============================================================================
  # Instance Methods
  # =============================================================================

  # 승인
  def approve!
    update!(
      status: :approved,
      approved_at: Time.current,
      payment_required: game.has_fee?
    )
  end

  # 거절
  def reject!(reason: nil)
    update!(
      status: :rejected,
      rejected_at: Time.current,
      admin_note: reason
    )
  end

  # 취소
  def cancel!
    update!(
      status: :cancelled,
      cancelled_at: Time.current
    )
  end

  # 참석 확인
  def mark_attended!
    update!(
      status: :attended,
      attended_at: Time.current
    )
  end

  # 노쇼 처리
  def mark_no_show!
    update!(status: :no_show)
  end

  # 결제 완료
  def mark_as_paid!(method: "transfer")
    update!(
      payment_status: :paid,
      paid_at: Time.current,
      payment_method: method
    )
  end

  # 환불 처리
  def mark_as_refunded!
    update!(payment_status: :refunded)
  end

  # 결제 필요 여부
  def needs_payment?
    payment_required? && payment_status_unpaid?
  end

  # 상태 한글명
  def status_name
    case status
    when "pending" then "대기중"
    when "approved" then "승인됨"
    when "rejected" then "거절됨"
    when "cancelled" then "취소됨"
    when "attended" then "참석 완료"
    when "no_show" then "노쇼"
    else status
    end
  end

  # 결제 상태 한글명
  def payment_status_name
    case payment_status
    when "unpaid" then "미결제"
    when "paid" then "결제완료"
    when "refunded" then "환불됨"
    else payment_status
    end
  end

  # 포지션 한글명
  def position_name
    case position
    when "point_guard" then "포인트가드"
    when "shooting_guard" then "슈팅가드"
    when "small_forward" then "스몰포워드"
    when "power_forward" then "파워포워드"
    when "center" then "센터"
    else position
    end
  end

  private

  def cannot_apply_own_game
    if user_id == game&.organizer_id
      errors.add(:base, "본인이 개최한 경기에는 신청할 수 없습니다")
    end
  end

  def update_game_participants_count
    game.update_participants_count!
  end

  # 주최자에게 신청 알림
  def notify_organizer_of_application
    Notification.create_game_application_received!(game: game, applicant: user)
  rescue StandardError => e
    Rails.logger.error "Failed to create game application notification: #{e.message}"
  end

  # 신청자에게 상태 변경 알림
  def notify_applicant_of_status_change
    return if status_previously_was == status # 상태가 같으면 스킵

    case status
    when "approved"
      Notification.create_game_application_approved!(game: game, applicant: user)
    when "rejected"
      Notification.create_game_application_rejected!(game: game, applicant: user, reason: admin_note)
    end
  rescue StandardError => e
    Rails.logger.error "Failed to create game status notification: #{e.message}"
  end
end
