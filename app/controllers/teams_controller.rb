# frozen_string_literal: true

class TeamsController < ApplicationController
  before_action :require_login, except: [:index, :show]
  before_action :set_team, only: [:show, :edit, :update, :destroy, :join, :leave]
  before_action :require_admin, only: [:edit, :update, :destroy]

  def index
    teams = Team.active.public_teams.includes(:captain).with_attached_logo.with_attached_banner

    # 검색
    teams = teams.search(params[:q]) if params[:q].present?

    # 지역 필터
    teams = teams.in_city(params[:city]) if params[:city].present?

    # 가입 가능 필터
    teams = teams.accepting if params[:accepting] == "1"

    @pagy, @teams = pagy(teams.order(created_at: :desc), items: 12)
  end

  def show
    @members = @team.team_members.includes(:user).active.order(joined_at: :asc)

    # 포지션 분포 계산
    @position_distribution = @team.team_members.active.group(:position).count

    # 참가 대회 정보
    @tournament_teams = @team.tournament_teams
                             .includes(tournament: :series)
                             .order("tournaments.start_date DESC")
                             .limit(5)

    # 경기 일정 & 결과
    @upcoming_matches = @team.upcoming_matches(limit: 5)
                             .includes(home_team: :team, away_team: :team, tournament: nil)
    @recent_matches = @team.recent_matches(limit: 5)
                           .includes(home_team: :team, away_team: :team, tournament: nil)

    if @team.admin?(current_user)
      # 관리자용 가입 신청 목록
      @pending_requests = @team.team_join_requests.pending.includes(:user).recent

      # 팀원 변경 이력 (최근 10건)
      @member_histories = @team.team_member_histories.includes(:user, :processed_by).recent.limit(10)
    end
  end

  def new
    @team = Team.new
  end

  def create
    @team = Team.new(team_params)
    @team.captain = current_user

    if @team.save
      redirect_to @team, notice: "팀이 생성되었습니다."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @team.update(team_params)
      redirect_to @team, notice: "팀 정보가 수정되었습니다."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    if @team.members_count > 1
      redirect_to @team, alert: "팀원이 있는 팀은 삭제할 수 없습니다."
    else
      @team.update!(status: :disbanded)
      redirect_to teams_path, notice: "팀이 해체되었습니다."
    end
  end

  # 팀 가입 신청
  def join
    if @team.can_join?(current_user)
      if @team.auto_accept_members?
        @team.add_member!(current_user)
        redirect_to @team, notice: "팀에 가입되었습니다."
      else
        @team.team_join_requests.create!(user: current_user)
        redirect_to @team, notice: "가입 신청이 완료되었습니다. 승인을 기다려주세요."
      end
    else
      redirect_to @team, alert: "팀에 가입할 수 없습니다."
    end
  end

  # 팀 탈퇴
  def leave
    if @team.captain?(current_user)
      redirect_to @team, alert: "팀장은 탈퇴할 수 없습니다. 팀장을 먼저 이전해주세요."
    elsif @team.member?(current_user)
      @team.remove_member!(current_user)
      redirect_to teams_path, notice: "팀에서 탈퇴하였습니다."
    else
      redirect_to @team, alert: "팀원이 아닙니다."
    end
  end

  private

  def set_team
    @team = Team.find_by!(uuid: params[:id])
  rescue ActiveRecord::RecordNotFound
    @team = Team.find_by!(slug: params[:id])
  rescue ActiveRecord::RecordNotFound
    @team = Team.find(params[:id])
  end

  def require_admin
    unless @team.admin?(current_user)
      redirect_to @team, alert: "권한이 없습니다."
    end
  end

  def team_params
    params.require(:team).permit(
      :name, :description, :city, :home_court,
      :logo_url, :banner_url, :logo, :banner,
      :is_public, :accepting_members, :auto_accept_members
    )
  end
end
