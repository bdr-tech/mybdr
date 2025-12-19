# frozen_string_literal: true

module Admin
  class DashboardController < BaseController
    def index
      @stats = DashboardStatsService.overview_stats
      @alerts = DashboardStatsService.alerts
      @recent_activities = DashboardStatsService.recent_activities
      @recent_suggestions = DashboardStatsService.recent_suggestions
    end

    def refresh_stats
      DashboardStatsService.clear_cache
      @stats = DashboardStatsService.overview_stats
      @alerts = DashboardStatsService.alerts

      respond_to do |format|
        format.html { redirect_to admin_root_path }
        format.json { render json: { stats: @stats, alerts: @alerts } }
        format.turbo_stream
      end
    end

    # 차트 데이터 API
    def chart_data
      chart_type = params[:type] || "revenue"
      days = (params[:days] || 30).to_i

      data = case chart_type
             when "revenue"
               DashboardStatsService.revenue_chart_data(days: days)
             when "users"
               DashboardStatsService.user_growth_chart_data(days: days)
             when "games"
               DashboardStatsService.game_activity_chart_data(days: days)
             else
               []
             end

      render json: { data: data, type: chart_type, days: days }
    end

    # 빠른 액션
    def quick_actions
      render json: {
        actions: [
          { label: "새 공지사항", url: new_admin_announcement_path, icon: "megaphone" },
          { label: "사용자 검색", url: admin_users_path, icon: "search" },
          { label: "결제 관리", url: admin_payments_path, icon: "credit-card" },
          { label: "건의사항 검토", url: admin_suggestions_path(status: "pending"), icon: "message-square" },
          { label: "시스템 설정", url: admin_system_settings_path, icon: "settings" }
        ]
      }
    end
  end
end
