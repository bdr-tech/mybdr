# frozen_string_literal: true

class DashboardStatsService
  CACHE_EXPIRY = 5.minutes

  class << self
    # =============================================================================
    # Main Dashboard Stats
    # =============================================================================

    def overview_stats
      Rails.cache.fetch("admin:dashboard:overview", expires_in: CACHE_EXPIRY) do
        {
          users: user_stats,
          games: game_stats,
          tournaments: tournament_stats,
          payments: payment_stats,
          teams: team_stats,
          marketplace: marketplace_stats
        }
      end
    end

    def alerts
      Rails.cache.fetch("admin:dashboard:alerts", expires_in: 1.minute) do
        collect_alerts
      end
    end

    def recent_activities
      Rails.cache.fetch("admin:dashboard:activities", expires_in: 1.minute) do
        AdminLog.recent.limit(20).includes(:admin).map do |log|
          {
            id: log.id,
            action: log.action_label,
            resource: log.resource_label,
            resource_id: log.resource_id,
            admin_name: log.admin.display_name,
            severity: log.severity,
            created_at: log.created_at
          }
        end
      end
    end

    def recent_suggestions
      Suggestion.pending_review.recent.limit(5).includes(:user).map do |suggestion|
        {
          id: suggestion.uuid,
          title: suggestion.title,
          category: suggestion.category_label,
          priority: suggestion.priority_label,
          user_name: suggestion.user.display_name,
          created_at: suggestion.created_at
        }
      end
    end

    # =============================================================================
    # Individual Stats
    # =============================================================================

    def user_stats
      {
        total: User.count,
        active: User.active.count,
        new_today: User.where("created_at >= ?", Date.current.beginning_of_day).count,
        new_this_week: User.where("created_at >= ?", 1.week.ago).count,
        new_this_month: User.where("created_at >= ?", 1.month.ago).count,
        by_membership: {
          free: User.membership_type_free.count,
          pro: User.membership_type_pro.count,
          pickup_host: User.membership_type_pickup_host.count,
          tournament_admin: User.membership_type_tournament_admin.count,
          super_admin: User.membership_type_super_admin.count
        },
        suspended: User.where(status: "suspended").count
      }
    end

    def game_stats
      {
        total: game_count,
        today: games_today_count,
        this_week: games_this_week_count,
        this_month: games_this_month_count,
        upcoming: upcoming_games_count,
        completed: completed_games_count
      }
    end

    def tournament_stats
      {
        total: tournament_count,
        active: active_tournaments_count,
        upcoming: upcoming_tournaments_count,
        completed: completed_tournaments_count,
        registrations_pending: pending_registrations_count
      }
    end

    def payment_stats
      {
        total_revenue: total_revenue,
        today_revenue: today_revenue,
        this_week_revenue: this_week_revenue,
        this_month_revenue: this_month_revenue,
        pending_count: Payment.pending_payments.count,
        completed_count: Payment.completed.count,
        refunded_count: Payment.where(status: :refunded).count,
        failed_count: Payment.where(status: :aborted).count
      }
    end

    def team_stats
      {
        total: team_count,
        active: active_teams_count,
        new_this_month: new_teams_this_month_count,
        pending_requests: pending_join_requests_count
      }
    end

    def marketplace_stats
      {
        total_items: marketplace_items_count,
        active_items: active_marketplace_items_count,
        sold_items: sold_marketplace_items_count,
        pending_requests: pending_phone_requests_count
      }
    end

    # =============================================================================
    # Chart Data
    # =============================================================================

    def revenue_chart_data(days: 30)
      Rails.cache.fetch("admin:chart:revenue:#{days}", expires_in: CACHE_EXPIRY) do
        start_date = days.days.ago.to_date
        end_date = Date.current

        daily_revenue = Payment.completed
                               .where(paid_at: start_date..end_date)
                               .group("DATE(paid_at)")
                               .sum(:final_amount)

        (start_date..end_date).map do |date|
          {
            date: date.strftime("%Y-%m-%d"),
            revenue: daily_revenue[date] || 0
          }
        end
      end
    end

    def user_growth_chart_data(days: 30)
      Rails.cache.fetch("admin:chart:user_growth:#{days}", expires_in: CACHE_EXPIRY) do
        start_date = days.days.ago.to_date
        end_date = Date.current

        daily_signups = User.where(created_at: start_date.beginning_of_day..end_date.end_of_day)
                            .group("DATE(created_at)")
                            .count

        (start_date..end_date).map do |date|
          {
            date: date.strftime("%Y-%m-%d"),
            count: daily_signups[date] || 0
          }
        end
      end
    end

    def game_activity_chart_data(days: 30)
      Rails.cache.fetch("admin:chart:game_activity:#{days}", expires_in: CACHE_EXPIRY) do
        start_date = days.days.ago.to_date
        end_date = Date.current

        daily_games = game_daily_count(start_date, end_date)

        (start_date..end_date).map do |date|
          {
            date: date.strftime("%Y-%m-%d"),
            count: daily_games[date] || 0
          }
        end
      end
    end

    # =============================================================================
    # Clear Cache
    # =============================================================================

    def clear_cache
      Rails.cache.delete_matched("admin:dashboard:*")
      Rails.cache.delete_matched("admin:chart:*")
    end

    private

    # =============================================================================
    # Alert Collection
    # =============================================================================

    def collect_alerts
      alerts = []

      # 결제 실패 알림
      failed_payments = Payment.where(status: :aborted).where("created_at >= ?", 24.hours.ago).count
      if failed_payments > 0
        alerts << {
          type: "error",
          title: "결제 실패",
          message: "지난 24시간 동안 #{failed_payments}건의 결제가 실패했습니다.",
          action_url: "/admin/payments?status=aborted",
          count: failed_payments
        }
      end

      # 대기중인 건의사항
      pending_suggestions = Suggestion.pending_review.count
      if pending_suggestions > 5
        alerts << {
          type: "warning",
          title: "대기 중인 건의사항",
          message: "#{pending_suggestions}건의 건의사항이 검토를 기다리고 있습니다.",
          action_url: "/admin/suggestions?status=pending",
          count: pending_suggestions
        }
      end

      # 환불 대기
      pending_refunds = Payment.where(status: :done, refund_status: "requested").count
      if pending_refunds > 0
        alerts << {
          type: "warning",
          title: "환불 대기",
          message: "#{pending_refunds}건의 환불 요청이 대기 중입니다.",
          action_url: "/admin/payments?refund_status=requested",
          count: pending_refunds
        }
      end

      # 긴급 건의사항
      urgent_suggestions = Suggestion.where(priority: 3).pending_review.count
      if urgent_suggestions > 0
        alerts << {
          type: "error",
          title: "긴급 건의사항",
          message: "#{urgent_suggestions}건의 긴급 건의사항이 있습니다.",
          action_url: "/admin/suggestions?priority=3",
          count: urgent_suggestions
        }
      end

      # 정지된 사용자
      suspended_users = User.where(status: "suspended").where("suspended_at >= ?", 7.days.ago).count
      if suspended_users > 0
        alerts << {
          type: "info",
          title: "최근 정지된 사용자",
          message: "지난 7일 동안 #{suspended_users}명의 사용자가 정지되었습니다.",
          action_url: "/admin/users?status=suspended",
          count: suspended_users
        }
      end

      alerts
    end

    # =============================================================================
    # Helper Methods (with fallback for missing models)
    # =============================================================================

    def game_count
      return 0 unless defined?(Game)
      Game.count
    rescue StandardError
      0
    end

    def games_today_count
      return 0 unless defined?(Game)
      Game.where(game_date: Date.current.all_day).count
    rescue StandardError
      0
    end

    def games_this_week_count
      return 0 unless defined?(Game)
      Game.where("game_date >= ?", 1.week.ago).count
    rescue StandardError
      0
    end

    def games_this_month_count
      return 0 unless defined?(Game)
      Game.where("game_date >= ?", 1.month.ago).count
    rescue StandardError
      0
    end

    def upcoming_games_count
      return 0 unless defined?(Game)
      Game.where("game_date > ?", Time.current).count
    rescue StandardError
      0
    end

    def completed_games_count
      return 0 unless defined?(Game)
      Game.where(status: "completed").count
    rescue StandardError
      0
    end

    def game_daily_count(start_date, end_date)
      return {} unless defined?(Game)
      Game.where(game_date: start_date..end_date).group("DATE(game_date)").count
    rescue StandardError
      {}
    end

    def tournament_count
      return 0 unless defined?(Tournament)
      Tournament.count
    rescue StandardError
      0
    end

    def active_tournaments_count
      return 0 unless defined?(Tournament)
      Tournament.where(status: "active").count
    rescue StandardError
      0
    end

    def upcoming_tournaments_count
      return 0 unless defined?(Tournament)
      Tournament.where("start_date > ?", Date.current).count
    rescue StandardError
      0
    end

    def completed_tournaments_count
      return 0 unless defined?(Tournament)
      Tournament.where(status: "completed").count
    rescue StandardError
      0
    end

    def pending_registrations_count
      return 0 unless defined?(TournamentTeam)
      TournamentTeam.where(status: "pending").count
    rescue StandardError
      0
    end

    def total_revenue
      Payment.completed.sum(:final_amount)
    rescue StandardError
      0
    end

    def today_revenue
      Payment.completed.where(paid_at: Date.current.all_day).sum(:final_amount)
    rescue StandardError
      0
    end

    def this_week_revenue
      Payment.completed.where("paid_at >= ?", 1.week.ago).sum(:final_amount)
    rescue StandardError
      0
    end

    def this_month_revenue
      Payment.completed.where("paid_at >= ?", Date.current.beginning_of_month).sum(:final_amount)
    rescue StandardError
      0
    end

    def team_count
      return 0 unless defined?(Team)
      Team.count
    rescue StandardError
      0
    end

    def active_teams_count
      return 0 unless defined?(Team)
      Team.where(status: "active").count
    rescue StandardError
      0
    end

    def new_teams_this_month_count
      return 0 unless defined?(Team)
      Team.where("created_at >= ?", Date.current.beginning_of_month).count
    rescue StandardError
      0
    end

    def pending_join_requests_count
      return 0 unless defined?(TeamJoinRequest)
      TeamJoinRequest.where(status: "pending").count
    rescue StandardError
      0
    end

    def marketplace_items_count
      return 0 unless defined?(MarketplaceItem)
      MarketplaceItem.count
    rescue StandardError
      0
    end

    def active_marketplace_items_count
      return 0 unless defined?(MarketplaceItem)
      MarketplaceItem.where(status: "active").count
    rescue StandardError
      0
    end

    def sold_marketplace_items_count
      return 0 unless defined?(MarketplaceItem)
      MarketplaceItem.where(status: "sold").count
    rescue StandardError
      0
    end

    def pending_phone_requests_count
      return 0 unless defined?(MarketplaceItem)
      # 구현 필요시 추가
      0
    rescue StandardError
      0
    end
  end
end
