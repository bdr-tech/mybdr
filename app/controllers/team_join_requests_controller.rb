# frozen_string_literal: true

class TeamJoinRequestsController < ApplicationController
  before_action :require_login
  before_action :set_team
  before_action :set_join_request
  before_action :require_team_admin

  def approve
    if @join_request.approve!(current_user)
      redirect_to @team, notice: "#{@join_request.user.display_name}님의 가입 신청이 승인되었습니다."
    else
      redirect_to @team, alert: "가입 승인에 실패했습니다: #{@join_request.errors.full_messages.join(', ')}"
    end
  end

  def reject
    reason = params[:rejection_reason]
    if @join_request.reject!(current_user, reason: reason)
      redirect_to @team, notice: "#{@join_request.user.display_name}님의 가입 신청이 거절되었습니다."
    else
      redirect_to @team, alert: "가입 거절에 실패했습니다."
    end
  end

  private

  def set_team
    @team = Team.find_by!(uuid: params[:team_id])
  rescue ActiveRecord::RecordNotFound
    @team = Team.find_by!(slug: params[:team_id])
  rescue ActiveRecord::RecordNotFound
    @team = Team.find(params[:team_id])
  end

  def set_join_request
    @join_request = @team.team_join_requests.find(params[:id])
  end

  def require_team_admin
    unless @team.admin?(current_user)
      redirect_to @team, alert: "권한이 없습니다."
    end
  end
end
