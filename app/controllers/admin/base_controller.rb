# frozen_string_literal: true

module Admin
  class BaseController < ApplicationController
    include Pagy::Backend

    layout "admin"

    before_action :require_login
    before_action :require_admin!
    before_action :check_maintenance_mode
    before_action :set_admin_context

    # =============================================================================
    # Authorization
    # =============================================================================

    private

    def require_admin!
      unless current_user&.admin?
        respond_to do |format|
          format.html do
            flash[:error] = "관리자 권한이 필요합니다."
            redirect_to root_path
          end
          format.json { render json: { error: "Unauthorized" }, status: :forbidden }
        end
      end
    end

    def require_super_admin!
      unless current_user&.membership_type_super_admin?
        respond_to do |format|
          format.html do
            flash[:error] = "슈퍼 관리자 권한이 필요합니다."
            redirect_to admin_root_path
          end
          format.json { render json: { error: "Unauthorized" }, status: :forbidden }
        end
      end
    end

    def check_maintenance_mode
      # 관리자는 점검 모드에서도 접근 가능
      return if current_user&.membership_type_super_admin?

      if SystemSetting.enabled?("maintenance_mode")
        respond_to do |format|
          format.html do
            flash[:warning] = SystemSetting.get("maintenance_message", "시스템 점검 중입니다.")
            redirect_to root_path
          end
          format.json { render json: { error: "Maintenance mode" }, status: :service_unavailable }
        end
      end
    end

    def set_admin_context
      @current_admin = current_user
      @unread_suggestions_count = begin
        Suggestion.pending_review.count
      rescue StandardError
        0
      end
      @pending_payments_count = begin
        Payment.pending_payments.count
      rescue StandardError
        0
      end
    end

    # =============================================================================
    # Logging Helpers
    # =============================================================================

    def log_admin_action(action:, resource:, changes: {}, previous: {}, description: nil, severity: "info")
      AdminLog.log_action(
        admin: current_user,
        action: action,
        resource: resource,
        changes: changes,
        previous: previous,
        description: description,
        severity: severity,
        request: request
      )
    end

    # =============================================================================
    # Response Helpers
    # =============================================================================

    def admin_success(message, redirect_path = nil)
      respond_to do |format|
        format.html do
          flash[:success] = message
          redirect_to redirect_path || request.referer || admin_root_path
        end
        format.json { render json: { success: true, message: message } }
      end
    end

    def admin_error(message, redirect_path = nil)
      respond_to do |format|
        format.html do
          flash[:error] = message
          redirect_to redirect_path || request.referer || admin_root_path
        end
        format.json { render json: { success: false, error: message }, status: :unprocessable_entity }
      end
    end

    # =============================================================================
    # Pagination
    # =============================================================================

    def page_params
      params[:page] || 1
    end

    def per_page_params
      [(params[:per_page] || 20).to_i, 100].min
    end

    # =============================================================================
    # Export Helpers
    # =============================================================================

    def export_csv(data, filename)
      send_data data.to_csv, filename: "#{filename}_#{Date.current}.csv", type: "text/csv"
    end

    def export_json(data, filename)
      send_data data.to_json, filename: "#{filename}_#{Date.current}.json", type: "application/json"
    end
  end
end
