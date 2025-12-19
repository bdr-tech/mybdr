# frozen_string_literal: true

class Payment < ApplicationRecord
  # =============================================================================
  # Associations
  # =============================================================================
  belongs_to :user
  belongs_to :payable, polymorphic: true

  # =============================================================================
  # Constants
  # =============================================================================
  PAYMENT_METHODS = %w[card virtual_account transfer].freeze

  # =============================================================================
  # Enums
  # =============================================================================
  enum :status, {
    pending: "pending",
    ready: "ready",
    in_progress: "in_progress",
    done: "done",
    cancelled: "cancelled",
    partial_cancelled: "partial_cancelled",
    aborted: "aborted",
    expired: "expired",
    refunded: "refunded"
  }, prefix: true

  # =============================================================================
  # Validations
  # =============================================================================
  validates :payment_code, presence: true, uniqueness: true
  validates :order_id, presence: true, uniqueness: true
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :final_amount, presence: true, numericality: { greater_than_or_equal_to: 0 }

  # =============================================================================
  # Scopes
  # =============================================================================
  scope :completed, -> { where(status: :done) }
  scope :pending_payments, -> { where(status: [:pending, :ready, :in_progress]) }
  scope :recent, -> { order(created_at: :desc) }
  scope :this_month, -> { where("created_at >= ?", Date.current.beginning_of_month) }
  scope :by_method, ->(method) { where(payment_method: method) if method.present? }

  # =============================================================================
  # Callbacks
  # =============================================================================
  before_validation :generate_codes, on: :create
  before_validation :calculate_final_amount, on: :create
  after_save :update_payable_payment_status, if: :saved_change_to_status?
  after_save :create_payment_notification, if: :saved_change_to_status?

  # =============================================================================
  # Class Methods
  # =============================================================================

  def self.generate_order_id
    "BDR-#{Date.current.strftime('%Y%m%d')}-#{SecureRandom.alphanumeric(8).upcase}"
  end

  # =============================================================================
  # Instance Methods
  # =============================================================================

  # TossPayments 결제 준비
  def prepare_for_toss
    {
      orderId: order_id,
      amount: final_amount.to_i,
      orderName: description || payable_description,
      customerName: user.name || user.nickname,
      customerEmail: user.email
    }
  end

  # TossPayments 결제 승인
  def confirm_toss_payment!(payment_key:, response:)
    transaction do
      update!(
        toss_payment_key: payment_key,
        toss_response: response,
        payment_method: response["method"],
        card_company: response.dig("card", "company"),
        card_number: response.dig("card", "number"),
        installment_months: response.dig("card", "installmentPlanMonths") || 0,
        receipt_url: response["receipt"]&.dig("url"),
        status: :done,
        paid_at: Time.current
      )

      after_payment_success
    end
    true
  rescue ActiveRecord::RecordInvalid => e
    errors.add(:base, e.message)
    false
  end

  # 결제 실패 처리
  def fail_payment!(code:, message:)
    update!(
      status: :aborted,
      failure_code: code,
      failure_reason: message
    )
  end

  # 결제 취소 처리
  def cancel!(reason: nil)
    return false unless can_cancel?

    transaction do
      update!(
        status: :cancelled,
        cancelled_at: Time.current,
        refund_reason: reason
      )

      after_payment_cancelled
    end
    true
  rescue ActiveRecord::RecordInvalid
    false
  end

  # 환불 처리
  def refund!(amount: nil, reason: nil)
    return false unless can_refund?

    refund_amt = amount || final_amount

    transaction do
      if refund_amt >= final_amount
        update!(
          status: :refunded,
          refunded_at: Time.current,
          refund_amount: refund_amt,
          refund_reason: reason,
          refund_status: "done"
        )
      else
        update!(
          status: :partial_cancelled,
          refund_amount: (self.refund_amount || 0) + refund_amt,
          refund_reason: reason,
          refund_status: "partial"
        )
      end

      after_payment_refunded
    end
    true
  rescue ActiveRecord::RecordInvalid
    false
  end

  def can_cancel?
    status_pending? || status_ready?
  end

  def can_refund?
    status_done? || status_partial_cancelled?
  end

  def completed?
    status_done?
  end

  def payable_description
    case payable_type
    when "Tournament" then "#{payable.name} 참가비"
    when "TournamentTeam" then "#{payable.tournament.name} 팀 참가비"
    when "Game" then "#{payable.title} 참가비"
    when "Subscription" then "BDR 구독 결제"
    else "BDR 결제"
    end
  end

  def status_label
    {
      "pending" => "대기중",
      "ready" => "결제 준비",
      "in_progress" => "진행중",
      "done" => "완료",
      "cancelled" => "취소",
      "partial_cancelled" => "부분취소",
      "aborted" => "중단",
      "expired" => "만료됨",
      "refunded" => "환불됨"
    }[status] || status
  end

  def payment_method_label
    {
      "card" => "카드",
      "virtual_account" => "가상계좌",
      "transfer" => "계좌이체"
    }[payment_method] || payment_method
  end

  private

  def generate_codes
    self.payment_code ||= "PAY-#{Date.current.strftime('%Y%m%d')}-#{SecureRandom.alphanumeric(8).upcase}"
    self.order_id ||= self.class.generate_order_id
  end

  def calculate_final_amount
    self.final_amount ||= amount.to_i - discount_amount.to_i
  end

  def update_payable_payment_status
    return unless payable.respond_to?(:update_payment_status!)
    payable.update_payment_status!(self)
  end

  def create_payment_notification
    return unless status_done? || status_refunded? || status_cancelled?

    notification_type = case status
                        when "done" then "payment_completed"
                        when "refunded" then "payment_refunded"
                        when "cancelled" then "payment_cancelled"
                        end

    return unless notification_type

    Notification.create!(
      user: user,
      notification_type: notification_type,
      title: notification_title,
      content: notification_content,
      notifiable: self,
      metadata: { amount: final_amount, status: status }
    )
  end

  def notification_title
    case status
    when "done" then "결제가 완료되었습니다"
    when "refunded" then "환불이 완료되었습니다"
    when "cancelled" then "결제가 취소되었습니다"
    end
  end

  def notification_content
    case status
    when "done" then "#{payable_description} 결제가 완료되었습니다. (#{final_amount.to_i.to_fs(:delimited)}원)"
    when "refunded" then "#{refund_amount.to_i.to_fs(:delimited)}원이 환불되었습니다."
    when "cancelled" then "결제가 취소되었습니다."
    end
  end

  def after_payment_success
    # Override in subclasses or add callbacks
  end

  def after_payment_cancelled
    # Override in subclasses or add callbacks
  end

  def after_payment_refunded
    # Override in subclasses or add callbacks
  end
end
