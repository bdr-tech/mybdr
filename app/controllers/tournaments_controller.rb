# frozen_string_literal: true

class TournamentsController < ApplicationController
  before_action :require_login, except: [:index, :show, :bracket, :standings, :schedule]
  before_action :set_tournament, only: [:show, :edit, :update, :destroy, :bracket, :standings, :schedule,
                                         :open_registration, :close_registration, :start, :complete, :cancel]
  before_action :require_organizer, only: [:edit, :update, :destroy, :open_registration, :close_registration, :start, :complete, :cancel]
  before_action :require_tournament_admin, only: [:new, :create]

  def index
    tournaments = Tournament.includes(:organizer, :series, :venue)
                           .public_tournaments
                           .published
                           .order(start_date: :desc)

    # 필터링
    tournaments = tournaments.in_city(params[:city]) if params[:city].present?
    tournaments = tournaments.by_series(params[:series_id]) if params[:series_id].present?

    if params[:status].present?
      tournaments = tournaments.where(status: params[:status])
    end

    @pagy, @tournaments = pagy(tournaments, items: 12)
  end

  def show
    @tournament.increment!(:views_count)
    @teams = @tournament.tournament_teams.includes(team: :captain).approved.by_seed
    @upcoming_matches = @tournament.tournament_matches.upcoming.limit(5)
    @recent_matches = @tournament.tournament_matches.completed.order(ended_at: :desc).limit(5)
  end

  def new
    # 대회 관리 페이지로 리다이렉트
    redirect_to "/tournament_admin/tournaments", notice: "대회 관리 페이지에서 새 대회를 생성하세요."
  end

  def create
    @tournament = current_user.organized_tournaments.build(tournament_params)

    if @tournament.save
      redirect_to @tournament, notice: "대회가 생성되었습니다."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    # 대회 관리 페이지로 리다이렉트
    redirect_to edit_tournament_admin_tournament_path(@tournament)
  end

  def update
    if @tournament.update(tournament_params)
      redirect_to @tournament, notice: "대회가 수정되었습니다."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    if @tournament.tournament_teams.exists?
      redirect_to @tournament, alert: "참가팀이 있는 대회는 삭제할 수 없습니다."
    else
      series = @tournament.series
      @tournament.destroy
      redirect_to (series || tournaments_path), notice: "대회가 삭제되었습니다."
    end
  end

  # 대진표
  def bracket
    @matches = @tournament.tournament_matches.includes(:home_team, :away_team, :winner_team)
                         .order(round_number: :asc, match_number: :asc)
  end

  # 순위표
  def standings
    @teams = @tournament.tournament_teams.approved
                       .includes(:team)
                       .order(wins: :desc, point_difference: :desc, points_for: :desc)
  end

  # 일정
  def schedule
    @matches = @tournament.tournament_matches.includes(:home_team, :away_team, :venue)
                         .order(scheduled_at: :asc)
  end

  # 등록 시작
  def open_registration
    @tournament.open_registration!
    redirect_to @tournament, notice: "참가 등록이 시작되었습니다."
  end

  # 등록 마감
  def close_registration
    @tournament.close_registration!
    redirect_to @tournament, notice: "참가 등록이 마감되었습니다."
  end

  # 대회 시작
  def start
    @tournament.start!
    redirect_to @tournament, notice: "대회가 시작되었습니다."
  end

  # 대회 완료
  def complete
    champion = TournamentTeam.find(params[:champion_team_id]) if params[:champion_team_id].present?
    mvp = User.find(params[:mvp_player_id]) if params[:mvp_player_id].present?

    @tournament.complete!(champion: champion&.team, mvp: mvp)
    redirect_to @tournament, notice: "대회가 완료되었습니다."
  end

  # 대회 취소
  def cancel
    @tournament.cancel!
    redirect_to @tournament, notice: "대회가 취소되었습니다."
  end

  # 내 대회 목록
  def my_tournaments
    @pagy_organized, @organized = pagy(
      current_user.organized_tournaments.includes(:series).order(start_date: :desc),
      page_param: :page,
      items: 10
    )
  end

  private

  def set_tournament
    @tournament = Tournament.find(params[:id])
  end

  def require_organizer
    unless @tournament.organizer_id == current_user.id
      redirect_to tournaments_path, alert: "권한이 없습니다."
    end
  end

  def require_tournament_admin
    unless current_user.can_create_tournament?
      redirect_to tournaments_path, alert: "대회 관리자 권한이 필요합니다."
    end
  end

  def tournament_params
    params.require(:tournament).permit(
      :name, :series_id, :edition_number, :description, :logo_url, :banner_url,
      :registration_start_at, :registration_end_at, :start_date, :end_date,
      :format, :max_teams, :min_teams, :team_size, :roster_min, :roster_max,
      :entry_fee, :prize_info, :rules,
      :venue_id, :venue_name, :venue_address, :city, :district,
      :is_public, :auto_approve_teams
    )
  end
end
