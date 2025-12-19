# frozen_string_literal: true

module Admin
  class PaymentsController < BaseController
    before_action :set_payment, only: [:show, :refund, :cancel, :update_status]

    def index
      @payments = Payment.includes(:user, :payable).all

      # 필터링
      @payments = @payments.where(status: params[:status]) if params[:status].present?
      @payments = @payments.where(payment_method: params[:method]) if params[:method].present?
      @payments = @payments.where(refund_status: params[:refund_status]) if params[:refund_status].present?

      # 날짜 필터
      if params[:date_from].present?
        @payments = @payments.where("created_at >= ?", Date.parse(params[:date_from]).beginning_of_day)
      end
      if params[:date_to].present?
        @payments = @payments.where("created_at <= ?", Date.parse(params[:date_to]).end_of_day)
      end

      # 검색
      if params[:q].present?
        query = "%#{params[:q]}%"
        @payments = @payments.joins(:user)
                             .where("payments.payment_code ILIKE ? OR payments.order_id ILIKE ? OR users.email ILIKE ?", query, query, query)
      end

      # 정렬
      @payments = case params[:sort]
                  when "amount_desc" then @payments.order(final_amount: :desc)
                  when "amount_asc" then @payments.order(final_amount: :asc)
                  when "oldest" then @payments.order(created_at: :asc)
                  else @payments.order(created_at: :desc)
                  end

      @pagy, @payments = pagy(@payments, items: per_page_params)

      # 통계
      @stats = {
        total_count: Payment.count,
        total_amount: Payment.completed.sum(:final_amount),
        today_amount: Payment.completed.where(paid_at: Date.current.all_day).sum(:final_amount),
        pending_count: Payment.pending_payments.count,
        refunded_amount: Payment.where(status: :refunded).sum(:refund_amount)
      }

      respond_to do |format|
        format.html
        format.json { render json: @payments }
        format.csv { export_payments_csv }
      end
    end

    def show
      @admin_logs = AdminLog.by_resource("Payment").where(resource_id: @payment.id).recent.limit(20)
    end

    def refund
      amount = params[:amount].present? ? params[:amount].to_i : nil
      reason = params[:reason] || "관리자에 의한 환불"

      unless @payment.can_refund?
        admin_error("환불할 수 없는 상태입니다.")
        return
      end

      # TossPayments API 호출 (실제 구현 필요)
      # toss_result = TossPaymentsService.refund(@payment, amount: amount, reason: reason)

      if @payment.refund!(amount: amount, reason: reason)
        log_admin_action(
          action: "refund",
          resource: @payment,
          changes: { refund_amount: amount || @payment.final_amount, reason: reason },
          description: "결제 환불: #{@payment.payment_code} (#{amount || @payment.final_amount}원)",
          severity: "warning"
        )
        admin_success("환불이 처리되었습니다.")
      else
        admin_error("환불 처리에 실패했습니다.")
      end
    end

    def cancel
      reason = params[:reason] || "관리자에 의한 취소"

      unless @payment.can_cancel?
        admin_error("취소할 수 없는 상태입니다.")
        return
      end

      if @payment.cancel!(reason: reason)
        log_admin_action(
          action: "cancel",
          resource: @payment,
          changes: { reason: reason },
          description: "결제 취소: #{@payment.payment_code}",
          severity: "warning"
        )
        admin_success("결제가 취소되었습니다.")
      else
        admin_error("결제 취소에 실패했습니다.")
      end
    end

    def update_status
      new_status = params[:status]

      unless Payment.statuses.keys.include?("status_#{new_status}")
        admin_error("유효하지 않은 상태입니다.")
        return
      end

      previous_status = @payment.status

      if @payment.update(status: new_status)
        log_admin_action(
          action: "update",
          resource: @payment,
          changes: { status: new_status },
          previous: { status: previous_status },
          description: "결제 상태 변경: #{@payment.payment_code} (#{previous_status} → #{new_status})",
          severity: "warning"
        )
        admin_success("결제 상태가 변경되었습니다.")
      else
        admin_error("상태 변경에 실패했습니다.")
      end
    end

    # 결제 통계 요약
    def summary
      date_range = case params[:period]
                   when "today" then Date.current.all_day
                   when "week" then 1.week.ago..Time.current
                   when "month" then 1.month.ago..Time.current
                   when "year" then 1.year.ago..Time.current
                   else 1.month.ago..Time.current
                   end

      @summary = {
        total_revenue: Payment.completed.where(paid_at: date_range).sum(:final_amount),
        transaction_count: Payment.completed.where(paid_at: date_range).count,
        average_amount: Payment.completed.where(paid_at: date_range).average(:final_amount)&.round(0) || 0,
        refund_count: Payment.where(status: :refunded).where(refunded_at: date_range).count,
        refund_amount: Payment.where(status: :refunded).where(refunded_at: date_range).sum(:refund_amount),
        by_method: Payment.completed.where(paid_at: date_range).group(:payment_method).sum(:final_amount),
        by_status: Payment.where(created_at: date_range).group(:status).count
      }

      respond_to do |format|
        format.html
        format.json { render json: @summary }
      end
    end

    private

    def set_payment
      @payment = Payment.find(params[:id])
    end

    def export_payments_csv
      csv_data = CSV.generate(headers: true) do |csv|
        csv << ["결제코드", "주문ID", "사용자", "금액", "결제방법", "상태", "결제일"]

        @payments.find_each do |payment|
          csv << [
            payment.payment_code,
            payment.order_id,
            payment.user.email,
            payment.final_amount,
            payment.payment_method_label,
            payment.status_label,
            payment.paid_at&.strftime("%Y-%m-%d %H:%M")
          ]
        end
      end

      send_data csv_data, filename: "payments_#{Date.current}.csv", type: "text/csv"
    end
  end
end
