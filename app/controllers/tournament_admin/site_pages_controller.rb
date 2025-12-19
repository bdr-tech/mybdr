# frozen_string_literal: true

module TournamentAdmin
  class SitePagesController < BaseController
    before_action :set_current_tournament
    before_action :set_site
    before_action :set_page, only: [:show, :edit, :update, :destroy]

    def index
      @pages = @site.site_pages.ordered
    end

    def show
      @sections = @page.site_sections.ordered
    end

    def new
      @page = @site.site_pages.build(page_type: "custom")
    end

    def create
      @page = @site.site_pages.build(page_params)

      if @page.save
        respond_to do |format|
          format.html { redirect_to tournament_admin_tournament_site_page_path(@tournament, @page), notice: "페이지가 생성되었습니다." }
          format.turbo_stream
        end
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit
    end

    def update
      if @page.update(page_params)
        respond_to do |format|
          format.html { redirect_to tournament_admin_tournament_site_page_path(@tournament, @page), notice: "페이지가 업데이트되었습니다." }
          format.turbo_stream
        end
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      if @page.system_page?
        redirect_to tournament_admin_tournament_site_pages_path(@tournament), alert: "시스템 페이지는 삭제할 수 없습니다."
        return
      end

      @page.destroy

      respond_to do |format|
        format.html { redirect_to tournament_admin_tournament_site_pages_path(@tournament), notice: "페이지가 삭제되었습니다." }
        format.turbo_stream
      end
    end

    # Drag & drop reordering
    def reorder
      page_ids = params[:page_ids]

      page_ids.each_with_index do |page_id, index|
        @site.site_pages.find(page_id).update_column(:position, index)
      end

      head :ok
    end

    private

    def set_site
      @site = @tournament.tournament_site
      redirect_to tournament_admin_tournament_path(@tournament), alert: "먼저 사이트를 생성해주세요." unless @site
    end

    def set_page
      @page = @site.site_pages.find(params[:id])
    end

    def page_params
      params.require(:site_page).permit(
        :title, :slug, :page_type, :position,
        :is_visible, :show_in_nav, :content,
        :meta_title, :meta_description
      )
    end
  end
end
