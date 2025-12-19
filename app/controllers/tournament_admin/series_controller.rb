# frozen_string_literal: true

module TournamentAdmin
  class SeriesController < BaseController
    skip_before_action :set_current_tournament
    before_action :set_series, only: [:show, :edit, :update, :destroy, :create_next_edition]

    def index
      @series = current_user.organized_series
                            .includes(:tournaments)
                            .order(created_at: :desc)
    end

    def my_series
      @series = current_user.organized_series
                            .includes(:tournaments)
                            .order(created_at: :desc)
      render :index
    end

    def show
      @tournaments = @series.tournaments.order(edition_number: :desc)
    end

    def new
      @series = TournamentSeries.new
    end

    def create
      @series = current_user.organized_series.build(series_params)

      if @series.save
        redirect_to tournament_admin_series_path(@series), notice: "시리즈가 생성되었습니다."
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit
    end

    def update
      if @series.update(series_params)
        redirect_to tournament_admin_series_path(@series), notice: "시리즈가 업데이트되었습니다."
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @series.destroy
      redirect_to tournament_admin_series_index_path, notice: "시리즈가 삭제되었습니다."
    end

    def create_next_edition
      new_tournament = @series.create_next_edition!

      if new_tournament.persisted?
        new_tournament.add_admin!(current_user, role: :owner)

        # Clone site from previous edition
        previous = @series.tournaments.where.not(id: new_tournament.id).order(edition_number: :desc).first
        previous&.tournament_site&.clone_to(new_tournament)

        redirect_to wizard_tournament_admin_tournament_path(new_tournament, step: 3),
                    notice: "다음 회차가 생성되었습니다. URL을 설정해주세요."
      else
        redirect_to tournament_admin_series_path(@series), alert: "회차 생성에 실패했습니다."
      end
    end

    private

    def set_series
      @series = current_user.organized_series.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      redirect_to tournament_admin_series_index_path, alert: "시리즈를 찾을 수 없습니다."
    end

    def series_params
      params.require(:tournament_series).permit(
        :name, :description, :logo_url, :is_public, :status
      )
    end
  end
end
