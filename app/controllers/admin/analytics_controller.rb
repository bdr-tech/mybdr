# frozen_string_literal: true

module Admin
  class AnalyticsController < BaseController
    def index
      @period = params[:period] || "month"
      @date_range = calculate_date_range(@period)

      @user_analytics = user_analytics(@date_range)
      @revenue_analytics = revenue_analytics(@date_range)
      @game_analytics = game_analytics(@date_range)
      @engagement_analytics = engagement_analytics(@date_range)
    end

    # 매출 분석
    def revenue
      @period = params[:period] || "month"
      @date_range = calculate_date_range(@period)

      @revenue_data = {
        total: Payment.completed.where(paid_at: @date_range).sum(:final_amount),
        by_day: Payment.completed.where(paid_at: @date_range)
                       .group("DATE(paid_at)").sum(:final_amount),
        by_method: Payment.completed.where(paid_at: @date_range)
                          .group(:payment_method).sum(:final_amount),
        by_type: Payment.completed.where(paid_at: @date_range)
                        .group(:payable_type).sum(:final_amount),
        average_transaction: Payment.completed.where(paid_at: @date_range)
                                    .average(:final_amount)&.round(0) || 0,
        transaction_count: Payment.completed.where(paid_at: @date_range).count
      }

      respond_to do |format|
        format.html
        format.json { render json: @revenue_data }
      end
    end

    # 사용자 분석
    def users
      @period = params[:period] || "month"
      @date_range = calculate_date_range(@period)

      @user_data = {
        new_users: User.where(created_at: @date_range).count,
        active_users: User.active.count,
        by_membership: User.group(:membership_type).count,
        by_day: User.where(created_at: @date_range)
                    .group("DATE(created_at)").count,
        retention_rate: calculate_retention_rate(@date_range),
        churn_rate: calculate_churn_rate(@date_range)
      }

      respond_to do |format|
        format.html
        format.json { render json: @user_data }
      end
    end

    # 대회 분석
    def tournaments
      @period = params[:period] || "month"
      @date_range = calculate_date_range(@period)

      @tournament_data = {
        total: tournament_count_in_range(@date_range),
        by_status: tournament_by_status(@date_range),
        average_teams: average_teams_per_tournament(@date_range),
        popular_types: popular_tournament_types(@date_range),
        completion_rate: tournament_completion_rate(@date_range)
      }

      respond_to do |format|
        format.html
        format.json { render json: @tournament_data }
      end
    end

    # 차트 데이터 API
    def chart_data
      chart_type = params[:type]
      days = (params[:days] || 30).to_i

      data = case chart_type
             when "revenue"
               DashboardStatsService.revenue_chart_data(days: days)
             when "users"
               DashboardStatsService.user_growth_chart_data(days: days)
             when "games"
               DashboardStatsService.game_activity_chart_data(days: days)
             when "membership"
               membership_distribution_data
             when "revenue_by_method"
               revenue_by_method_data(days)
             else
               []
             end

      render json: { data: data, type: chart_type }
    end

    private

    def calculate_date_range(period)
      case period
      when "today"
        Date.current.all_day
      when "week"
        1.week.ago..Time.current
      when "month"
        1.month.ago..Time.current
      when "quarter"
        3.months.ago..Time.current
      when "year"
        1.year.ago..Time.current
      else
        1.month.ago..Time.current
      end
    end

    def user_analytics(date_range)
      {
        new_users: User.where(created_at: date_range).count,
        active_users: User.active.count,
        suspended_users: User.where(status: "suspended").count,
        pro_conversions: User.where(membership_type: :pro, created_at: date_range).count
      }
    end

    def revenue_analytics(date_range)
      completed = Payment.completed.where(paid_at: date_range)
      {
        total: completed.sum(:final_amount),
        average: completed.average(:final_amount)&.round(0) || 0,
        count: completed.count,
        refunded: Payment.where(status: :refunded, refunded_at: date_range).sum(:refund_amount)
      }
    end

    def game_analytics(date_range)
      {
        total: game_count_in_range(date_range),
        completed: completed_games_in_range(date_range),
        average_per_day: average_games_per_day(date_range)
      }
    end

    def engagement_analytics(date_range)
      {
        suggestions: Suggestion.where(created_at: date_range).count,
        resolved_suggestions: Suggestion.status_resolved.where(responded_at: date_range).count,
        average_response_time: average_suggestion_response_time(date_range)
      }
    end

    def calculate_retention_rate(date_range)
      # 간단한 리텐션 계산: 해당 기간에 가입한 유저 중 활성 상태인 비율
      new_users = User.where(created_at: date_range)
      return 0 if new_users.count.zero?

      active_new_users = new_users.where(status: "active").count
      ((active_new_users.to_f / new_users.count) * 100).round(1)
    end

    def calculate_churn_rate(date_range)
      # 해당 기간에 정지된 유저 비율
      total_active_at_start = User.where("created_at < ?", date_range.first).active.count
      return 0 if total_active_at_start.zero?

      suspended_during = User.where(suspended_at: date_range).count
      ((suspended_during.to_f / total_active_at_start) * 100).round(1)
    end

    def average_suggestion_response_time(date_range)
      resolved = Suggestion.status_resolved.where(responded_at: date_range)
      return 0 if resolved.count.zero?

      total_hours = resolved.sum { |s| s.response_time_hours || 0 }
      (total_hours / resolved.count).round(1)
    end

    def membership_distribution_data
      User.group(:membership_type).count.map do |type, count|
        { name: type, value: count }
      end
    end

    def revenue_by_method_data(days)
      Payment.completed
             .where("paid_at >= ?", days.days.ago)
             .group(:payment_method)
             .sum(:final_amount)
             .map { |method, amount| { name: method || "기타", value: amount } }
    end

    # Helper methods with fallback
    def game_count_in_range(date_range)
      return 0 unless defined?(Game)
      Game.where(game_date: date_range).count
    rescue StandardError
      0
    end

    def completed_games_in_range(date_range)
      return 0 unless defined?(Game)
      Game.where(status: "completed", game_date: date_range).count
    rescue StandardError
      0
    end

    def average_games_per_day(date_range)
      return 0 unless defined?(Game)
      days = ((date_range.last - date_range.first) / 1.day).to_i
      days = 1 if days.zero?
      (Game.where(game_date: date_range).count.to_f / days).round(1)
    rescue StandardError
      0
    end

    def tournament_count_in_range(date_range)
      return 0 unless defined?(Tournament)
      Tournament.where(created_at: date_range).count
    rescue StandardError
      0
    end

    def tournament_by_status(date_range)
      return {} unless defined?(Tournament)
      Tournament.where(created_at: date_range).group(:status).count
    rescue StandardError
      {}
    end

    def average_teams_per_tournament(date_range)
      return 0 unless defined?(Tournament) && defined?(TournamentTeam)
      tournaments = Tournament.where(created_at: date_range)
      return 0 if tournaments.count.zero?
      (TournamentTeam.where(tournament: tournaments).count.to_f / tournaments.count).round(1)
    rescue StandardError
      0
    end

    def popular_tournament_types(date_range)
      return {} unless defined?(Tournament)
      Tournament.where(created_at: date_range).group(:tournament_type).count
    rescue StandardError
      {}
    end

    def tournament_completion_rate(date_range)
      return 0 unless defined?(Tournament)
      total = Tournament.where(created_at: date_range).count
      return 0 if total.zero?
      completed = Tournament.where(created_at: date_range, status: "completed").count
      ((completed.to_f / total) * 100).round(1)
    rescue StandardError
      0
    end
  end
end
