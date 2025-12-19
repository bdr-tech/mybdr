# frozen_string_literal: true

module Admin
  class SuggestionsController < BaseController
    before_action :set_suggestion, only: [:show, :assign, :start_progress, :resolve, :reject, :close, :reopen]

    def index
      @suggestions = Suggestion.includes(:user, :assigned_to).all

      # 필터링
      @suggestions = @suggestions.where(status: params[:status]) if params[:status].present?
      @suggestions = @suggestions.where(category: params[:category]) if params[:category].present?
      @suggestions = @suggestions.where(priority: params[:priority]) if params[:priority].present?
      @suggestions = @suggestions.unassigned if params[:unassigned] == "true"

      # 검색
      if params[:q].present?
        query = "%#{params[:q]}%"
        @suggestions = @suggestions.where("title ILIKE ? OR content ILIKE ?", query, query)
      end

      # 정렬
      @suggestions = case params[:sort]
                     when "priority" then @suggestions.order(priority: :desc, created_at: :desc)
                     when "oldest" then @suggestions.order(created_at: :asc)
                     else @suggestions.order(created_at: :desc)
                     end

      @pagy, @suggestions = pagy(@suggestions, items: per_page_params)

      # 통계
      @stats = {
        total: Suggestion.count,
        pending: Suggestion.status_pending.count,
        in_review: Suggestion.status_in_review.count,
        in_progress: Suggestion.status_in_progress.count,
        resolved: Suggestion.status_resolved.count,
        high_priority: Suggestion.high_priority.pending_review.count
      }

      respond_to do |format|
        format.html
        format.json { render json: @suggestions }
      end
    end

    def show
      @admin_logs = AdminLog.by_resource("Suggestion").where(resource_id: @suggestion.id).recent.limit(20)
    end

    def assign
      admin = User.find(params[:admin_id])

      unless admin.admin?
        admin_error("관리자만 담당자로 지정할 수 있습니다.")
        return
      end

      @suggestion.assign_to!(admin)

      log_admin_action(
        action: "assign",
        resource: @suggestion,
        changes: { assigned_to_id: admin.id },
        description: "건의사항 담당자 지정: #{admin.display_name}"
      )

      admin_success("담당자가 지정되었습니다.")
    end

    def start_progress
      @suggestion.start_progress!

      log_admin_action(
        action: "update",
        resource: @suggestion,
        changes: { status: "in_progress" },
        description: "건의사항 처리 시작: #{@suggestion.title}"
      )

      admin_success("처리를 시작합니다.")
    end

    def resolve
      response = params[:response]

      if response.blank?
        admin_error("답변 내용을 입력해주세요.")
        return
      end

      @suggestion.resolve!(admin: current_user, response: response)

      log_admin_action(
        action: "update",
        resource: @suggestion,
        changes: { status: "resolved", response: response },
        description: "건의사항 해결: #{@suggestion.title}"
      )

      admin_success("건의사항이 해결 처리되었습니다.")
    end

    def reject
      response = params[:response]

      if response.blank?
        admin_error("반려 사유를 입력해주세요.")
        return
      end

      @suggestion.reject!(admin: current_user, response: response)

      log_admin_action(
        action: "reject",
        resource: @suggestion,
        changes: { status: "rejected", response: response },
        description: "건의사항 반려: #{@suggestion.title}",
        severity: "warning"
      )

      admin_success("건의사항이 반려되었습니다.")
    end

    def close
      @suggestion.close!

      log_admin_action(
        action: "update",
        resource: @suggestion,
        changes: { status: "closed" },
        description: "건의사항 종료: #{@suggestion.title}"
      )

      admin_success("건의사항이 종료되었습니다.")
    end

    def reopen
      @suggestion.reopen!

      log_admin_action(
        action: "update",
        resource: @suggestion,
        changes: { status: "pending" },
        description: "건의사항 재오픈: #{@suggestion.title}"
      )

      admin_success("건의사항이 다시 열렸습니다.")
    end

    # 일괄 처리
    def bulk_action
      action = params[:bulk_action]
      suggestion_ids = params[:suggestion_ids] || []

      if suggestion_ids.empty?
        admin_error("선택된 건의사항이 없습니다.")
        return
      end

      suggestions = Suggestion.where(id: suggestion_ids)
      count = 0

      case action
      when "assign"
        admin = User.find(params[:admin_id])
        suggestions.find_each do |suggestion|
          suggestion.assign_to!(admin)
          count += 1
        end
        message = "#{count}건의 건의사항에 담당자가 지정되었습니다."
      when "close"
        suggestions.find_each do |suggestion|
          suggestion.close!
          count += 1
        end
        message = "#{count}건의 건의사항이 종료되었습니다."
      else
        admin_error("유효하지 않은 작업입니다.")
        return
      end

      log_admin_action(
        action: "bulk_action",
        resource: "Suggestion",
        description: "건의사항 일괄 처리: #{action} (#{count}건)"
      )

      admin_success(message)
    end

    private

    def set_suggestion
      @suggestion = if params[:id].to_s.match?(/\A\d+\z/)
                      Suggestion.find(params[:id])
                    else
                      Suggestion.find_by_uuid!(params[:id])
                    end
    end
  end
end
