# frozen_string_literal: true

class TournamentSeriesController < ApplicationController
  before_action :require_login, except: [:index, :show]
  before_action :set_series, only: [:show, :edit, :update, :destroy, :create_next_edition]
  before_action :require_organizer, only: [:edit, :update, :destroy, :create_next_edition]
  before_action :require_tournament_admin, only: [:new, :create]

  def index
    series = TournamentSeries.includes(:organizer, :tournaments)
                             .public_series
                             .active
                             .order(created_at: :desc)

    @pagy, @series = pagy(series, items: 12)
  end

  def show
    @tournaments = @series.all_editions.includes(:venue)
    @latest_tournament = @series.latest_tournament
  end

  def new
    @series = current_user.organized_series.build
  end

  def create
    @series = current_user.organized_series.build(series_params)

    if @series.save
      redirect_to @series, notice: "시리즈가 생성되었습니다."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit; end

  def update
    if @series.update(series_params)
      redirect_to @series, notice: "시리즈가 수정되었습니다."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    if @series.tournaments.exists?
      redirect_to @series, alert: "대회가 있는 시리즈는 삭제할 수 없습니다."
    else
      @series.destroy
      redirect_to tournament_series_index_path, notice: "시리즈가 삭제되었습니다."
    end
  end

  # 다음 회차 1클릭 생성
  def create_next_edition
    @tournament = @series.create_next_edition!(
      start_date: params[:start_date].present? ? Time.zone.parse(params[:start_date]) : nil
    )
    redirect_to edit_tournament_path(@tournament), notice: "#{@series.name} #{@tournament.edition_number}회 대회가 생성되었습니다."
  rescue ActiveRecord::RecordInvalid => e
    redirect_to @series, alert: e.message
  end

  # 내 시리즈 목록
  def my_series
    @pagy, @series = pagy(
      current_user.organized_series.includes(:tournaments).order(created_at: :desc),
      items: 12
    )
  end

  private

  def set_series
    @series = TournamentSeries.find_by!(uuid: params[:id])
  rescue ActiveRecord::RecordNotFound
    @series = TournamentSeries.find(params[:id])
  end

  def require_organizer
    unless @series.organizer_id == current_user.id
      redirect_to tournament_series_index_path, alert: "권한이 없습니다."
    end
  end

  def require_tournament_admin
    unless current_user.can_create_tournament?
      redirect_to tournament_series_index_path, alert: "대회 관리자 권한이 필요합니다."
    end
  end

  def series_params
    params.require(:tournament_series).permit(
      :name, :description, :logo_url, :status, :is_public
    )
  end
end
