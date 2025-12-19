# frozen_string_literal: true

class TournamentTeamsController < ApplicationController
  before_action :require_login, except: [:index, :show]
  before_action :set_tournament
  before_action :set_tournament_team, only: [:show, :approve, :reject, :withdraw]
  before_action :require_organizer, only: [:approve, :reject]

  def index
    @tournament_teams = @tournament.tournament_teams
                                   .includes(:team)
                                   .order(created_at: :asc)

    @approved_teams = @tournament_teams.approved
    @pending_teams = @tournament_teams.pending
  end

  def show
    @team = @tournament_team.team
    @players = @tournament_team.tournament_players.includes(:user)
  end

  # POST /tournaments/:tournament_id/tournament_teams
  def create
    team = current_user.captain_teams.find(params[:team_id])

    if @tournament.tournament_teams.exists?(team: team)
      redirect_to @tournament, alert: "이미 참가 신청된 팀입니다."
      return
    end

    @tournament_team = @tournament.tournament_teams.build(
      team: team,
      status: @tournament.auto_approve_teams? ? :approved : :pending
    )

    if @tournament_team.save
      redirect_to @tournament, notice: "대회 참가 신청이 완료되었습니다."
    else
      redirect_to @tournament, alert: @tournament_team.errors.full_messages.join(", ")
    end
  end

  # POST /tournaments/:tournament_id/tournament_teams/:id/approve
  def approve
    if @tournament_team.update(status: :approved)
      redirect_to tournament_tournament_teams_path(@tournament), notice: "팀이 승인되었습니다."
    else
      redirect_to tournament_tournament_teams_path(@tournament), alert: "승인에 실패했습니다."
    end
  end

  # POST /tournaments/:tournament_id/tournament_teams/:id/reject
  def reject
    if @tournament_team.update(status: :rejected, rejection_reason: params[:reason])
      redirect_to tournament_tournament_teams_path(@tournament), notice: "팀이 거절되었습니다."
    else
      redirect_to tournament_tournament_teams_path(@tournament), alert: "거절에 실패했습니다."
    end
  end

  # POST /tournaments/:tournament_id/tournament_teams/:id/withdraw
  def withdraw
    if @tournament_team.team.captain?(current_user)
      @tournament_team.update!(status: :withdrawn)
      redirect_to @tournament, notice: "대회 참가가 취소되었습니다."
    else
      redirect_to @tournament, alert: "권한이 없습니다."
    end
  end

  # DELETE /tournaments/:tournament_id/tournament_teams/:id
  def destroy
    if @tournament_team.team.captain?(current_user) || @tournament.organizer?(current_user)
      @tournament_team.destroy
      redirect_to tournament_tournament_teams_path(@tournament), notice: "참가 신청이 삭제되었습니다."
    else
      redirect_to @tournament, alert: "권한이 없습니다."
    end
  end

  private

  def set_tournament
    @tournament = Tournament.find(params[:tournament_id])
  end

  def set_tournament_team
    @tournament_team = @tournament.tournament_teams.find(params[:id])
  end

  def require_organizer
    unless @tournament.organizer?(current_user)
      redirect_to @tournament, alert: "권한이 없습니다."
    end
  end
end
