# frozen_string_literal: true

class UsersController < ApplicationController
  before_action :redirect_if_logged_in, only: [:new, :create]
  before_action :require_login, only: [:show, :edit, :update, :update_admin_mode]
  before_action :set_user, only: [:show, :edit, :update]
  before_action :authorize_user, only: [:edit, :update]

  # GET /signup
  def new
    @user = User.new
  end

  # POST /signup
  def create
    @user = User.new(user_params)

    if @user.save
      log_in(@user)
      flash[:success] = I18n.t("auth.signup_success")
      redirect_to root_path
    else
      render :new, status: :unprocessable_entity
    end
  end

  # GET /profile or /users/:id
  def show
    load_profile_data
  end

  # GET /profile/edit or /users/:id/edit
  def edit
  end

  # PATCH /profile or /users/:id
  def update
    if @user.update(user_update_params)
      flash[:success] = I18n.t("messages.updated")
      redirect_to profile_path
    else
      render :edit, status: :unprocessable_entity
    end
  end

  # POST /profile/admin_mode
  def update_admin_mode
    unless current_user.show_admin_mode?
      return respond_to do |format|
        format.json { render json: { success: false, error: "권한이 없습니다" }, status: :forbidden }
        format.html { redirect_to root_path, alert: "권한이 없습니다" }
      end
    end

    # Handle both JSON boolean (true/false) and string ("true"/"false") values
    admin_mode_value = ActiveModel::Type::Boolean.new.cast(params[:admin_mode])
    if current_user.update(prefer_admin_mode: admin_mode_value)
      respond_to do |format|
        format.turbo_stream
        format.json { render json: { success: true, admin_mode: current_user.prefer_admin_mode } }
        format.html { redirect_to root_path }
      end
    else
      respond_to do |format|
        format.json { render json: { success: false, error: "업데이트 실패" }, status: :unprocessable_entity }
        format.html { redirect_to root_path, alert: "업데이트 실패" }
      end
    end
  end

  private

  def set_user
    @user = if params[:id]
              User.find(params[:id])
            else
              current_user
            end
  end

  def authorize_user
    unless @user == current_user || current_user.admin?
      flash[:error] = I18n.t("messages.unauthorized")
      redirect_to root_path
    end
  end

  def redirect_if_logged_in
    redirect_to root_path if logged_in?
  end

  def user_params
    params.require(:user).permit(
      :email,
      :password,
      :password_confirmation,
      :name,
      :nickname,
      :phone
    )
  end

  def user_update_params
    params.require(:user).permit(
      :name,
      :nickname,
      :phone,
      :avatar,
      :position,
      :height,
      :weight,
      :birth_date,
      :city,
      :district,
      :bio,
      :bank_name,
      :bank_code,
      :account_number,
      :account_holder,
      :toss_id
    )
  end

  def load_profile_data
    # 픽업 경기 기록 (신청한 게임들)
    @game_applications = @user.game_applications
      .includes(game: [:court, :organizer])
      .order(created_at: :desc)
      .limit(20)

    # 대회 참가 기록 (TournamentTeamPlayer를 통해)
    @tournament_participations = @user.tournament_team_players
      .includes(tournament_team: [:team, { tournament: :venue }])
      .joins(tournament_team: :tournament)
      .order("tournaments.start_date DESC")

    # 소속 팀 목록
    @team_memberships = @user.team_memberships
      .includes(:team)
      .order(created_at: :desc)

    # 통계 계산
    @user_stats = calculate_user_stats
  end

  def calculate_user_stats
    # 대회 통계 집계
    tournament_stats = @user.tournament_team_players.inject({
      total_games: 0,
      total_points: 0,
      total_rebounds: 0,
      total_assists: 0,
      total_steals: 0,
      total_blocks: 0
    }) do |acc, ttp|
      acc[:total_games] += ttp.games_played.to_i
      acc[:total_points] += ttp.total_points.to_i
      acc[:total_rebounds] += ttp.total_rebounds.to_i
      acc[:total_assists] += ttp.total_assists.to_i
      acc[:total_steals] += ttp.total_steals.to_i
      acc[:total_blocks] += ttp.total_blocks.to_i
      acc
    end

    # 평균 계산
    games = tournament_stats[:total_games]
    if games > 0
      tournament_stats[:avg_points] = (tournament_stats[:total_points].to_f / games).round(1)
      tournament_stats[:avg_rebounds] = (tournament_stats[:total_rebounds].to_f / games).round(1)
      tournament_stats[:avg_assists] = (tournament_stats[:total_assists].to_f / games).round(1)
    else
      tournament_stats[:avg_points] = 0.0
      tournament_stats[:avg_rebounds] = 0.0
      tournament_stats[:avg_assists] = 0.0
    end

    # 픽업 게임 통계
    pickup_stats = {
      total_applications: @user.game_applications.count,
      approved_games: @user.game_applications.where(status: "approved").count,
      hosted_games: @user.organized_games.count
    }

    # 대회 참가 수
    tournament_count = @user.tournament_team_players
      .joins(tournament_team: :tournament)
      .where(tournaments: { status: "completed" })
      .select("DISTINCT tournaments.id")
      .count

    {
      tournament: tournament_stats,
      pickup: pickup_stats,
      tournaments_participated: tournament_count,
      teams_count: @user.team_memberships.count
    }
  end
end
