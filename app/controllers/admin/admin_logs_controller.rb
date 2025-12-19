# frozen_string_literal: true

module Admin
  class AdminLogsController < BaseController
    def index
      @logs = AdminLog.includes(:admin).all

      # 필터링
      @logs = @logs.by_admin(params[:admin_id]) if params[:admin_id].present?
      @logs = @logs.by_action(params[:action_type]) if params[:action_type].present?
      @logs = @logs.by_resource(params[:resource_type]) if params[:resource_type].present?
      @logs = @logs.by_severity(params[:severity]) if params[:severity].present?

      # 날짜 필터
      if params[:date_from].present?
        @logs = @logs.where("created_at >= ?", Date.parse(params[:date_from]).beginning_of_day)
      end
      if params[:date_to].present?
        @logs = @logs.where("created_at <= ?", Date.parse(params[:date_to]).end_of_day)
      end

      # 검색
      if params[:q].present?
        query = "%#{params[:q]}%"
        @logs = @logs.where("description ILIKE ?", query)
      end

      @pagy, @logs = pagy(@logs.recent, items: per_page_params)

      # 통계
      @stats = {
        total_today: AdminLog.today.count,
        total_week: AdminLog.this_week.count,
        errors_today: AdminLog.today.critical_and_errors.count,
        by_action: AdminLog.this_week.group(:action).count
      }

      respond_to do |format|
        format.html
        format.json { render json: @logs }
        format.csv { export_logs_csv }
      end
    end

    def show
      @log = AdminLog.find(params[:id])
    end

    private

    def export_logs_csv
      csv_data = CSV.generate(headers: true) do |csv|
        csv << ["ID", "관리자", "액션", "리소스", "리소스ID", "설명", "심각도", "IP", "생성일"]

        @logs.find_each do |log|
          csv << [
            log.id,
            log.admin.display_name,
            log.action_label,
            log.resource_label,
            log.resource_id,
            log.description,
            log.severity_label,
            log.ip_address,
            log.created_at.strftime("%Y-%m-%d %H:%M:%S")
          ]
        end
      end

      send_data csv_data, filename: "admin_logs_#{Date.current}.csv", type: "text/csv"
    end
  end
end
