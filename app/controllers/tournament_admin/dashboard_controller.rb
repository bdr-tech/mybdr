# frozen_string_literal: true

module TournamentAdmin
  class DashboardController < BaseController
    skip_before_action :set_current_tournament

    def index
      @tournaments = current_user.administrated_tournaments
                                 .or(Tournament.where(organizer: current_user))
                                 .includes(:tournament_site, :series)
                                 .order(created_at: :desc)

      @series = current_user.organized_series
                            .includes(:tournaments)
                            .order(created_at: :desc)

      @stats = calculate_stats
    end

    private

    def calculate_stats
      {
        total_tournaments: @tournaments.count,
        active_tournaments: @tournaments.active.count,
        total_visitors: @tournaments.joins(:tournament_site).sum("tournament_sites.views_count"),
        total_teams: @tournaments.sum(:teams_count)
      }
    end
  end
end
