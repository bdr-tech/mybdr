# frozen_string_literal: true

class TeamMembersController < ApplicationController
  before_action :require_login
  before_action :set_team
  before_action :require_team_admin

  # POST /teams/:team_id/team_members
  def create
    user = User.find(params[:user_id])

    if @team.member?(user)
      redirect_to @team, alert: "이미 팀원입니다."
    else
      @team.add_member!(user, role: params[:role] || :member)
      redirect_to @team, notice: "#{user.display_name}님이 팀에 추가되었습니다."
    end
  end

  # DELETE /teams/:team_id/team_members/:id
  def destroy
    @member = @team.team_members.find(params[:id])

    if @member.user == @team.captain
      redirect_to @team, alert: "팀장은 제외할 수 없습니다."
    else
      @team.remove_member!(@member.user)
      redirect_to @team, notice: "#{@member.user.display_name}님이 팀에서 제외되었습니다."
    end
  end

  private

  def set_team
    @team = Team.find_by!(uuid: params[:team_id])
  rescue ActiveRecord::RecordNotFound
    @team = Team.find(params[:team_id])
  end

  def require_team_admin
    unless @team.admin?(current_user)
      redirect_to @team, alert: "권한이 없습니다."
    end
  end
end
