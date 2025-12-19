# frozen_string_literal: true

module TournamentAdmin
  class SiteSectionsController < BaseController
    before_action :set_current_tournament
    before_action :set_site
    before_action :set_page
    before_action :set_section, only: [:show, :edit, :update, :destroy, :toggle_visibility]

    def index
      @sections = @page.site_sections.ordered
    end

    def show
    end

    def new
      @section = @page.site_sections.build(section_type: params[:section_type] || "text")
    end

    def create
      @section = @page.site_sections.build(section_params)

      if @section.save
        respond_to do |format|
          format.html do
            redirect_to tournament_admin_tournament_site_page_path(@tournament, @page),
                        notice: "섹션이 추가되었습니다."
          end
          format.turbo_stream
        end
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit
    end

    def update
      if @section.update(section_params)
        respond_to do |format|
          format.html do
            redirect_to tournament_admin_tournament_site_page_path(@tournament, @page),
                        notice: "섹션이 업데이트되었습니다."
          end
          format.turbo_stream
        end
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @section.destroy

      respond_to do |format|
        format.html do
          redirect_to tournament_admin_tournament_site_page_path(@tournament, @page),
                      notice: "섹션이 삭제되었습니다."
        end
        format.turbo_stream
      end
    end

    # Drag & drop reordering
    def reorder
      section_ids = params[:section_ids]

      section_ids.each_with_index do |section_id, index|
        @page.site_sections.find(section_id).update_column(:position, index)
      end

      head :ok
    end

    # Toggle visibility
    def toggle_visibility
      @section.update!(is_visible: !@section.is_visible)

      respond_to do |format|
        format.html do
          redirect_to tournament_admin_tournament_site_page_path(@tournament, @page)
        end
        format.turbo_stream
      end
    end

    private

    def set_site
      @site = @tournament.tournament_site
      redirect_to tournament_admin_tournament_path(@tournament), alert: "먼저 사이트를 생성해주세요." unless @site
    end

    def set_page
      @page = @site.site_pages.find(params[:page_id])
    end

    def set_section
      @section = @page.site_sections.find(params[:id])
    end

    def section_params
      params.require(:site_section).permit(
        :section_type, :position, :is_visible,
        :background_color, :text_color,
        :padding_top, :padding_bottom,
        content: {},
        settings: {}
      )
    end
  end
end
