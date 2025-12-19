# frozen_string_literal: true

module TournamentAdmin
  class BaseController < ApplicationController
    before_action :require_tournament_admin
    before_action :set_current_tournament, only: [:show, :edit, :update, :destroy]

    layout "tournament_admin"

    private

    def require_tournament_admin
      unless current_user&.can_create_tournament?
        redirect_to root_path, alert: "대회관리자 권한이 필요합니다."
      end
    end

    def set_current_tournament
      @tournament = current_user.administrated_tournaments
                                .or(Tournament.where(organizer: current_user))
                                .find_by(id: params[:tournament_id] || params[:id])

      unless @tournament
        redirect_to tournament_admin_root_path, alert: "대회를 찾을 수 없습니다."
      end
    end

    def require_tournament_owner
      unless @tournament.owner?(current_user)
        redirect_to tournament_admin_tournament_path(@tournament), alert: "소유자 권한이 필요합니다."
      end
    end

    def require_edit_permission
      unless @tournament.admin?(current_user)
        redirect_to tournament_admin_tournament_path(@tournament), alert: "편집 권한이 필요합니다."
      end
    end
  end
end
