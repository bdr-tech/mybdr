# frozen_string_literal: true

module TournamentAdmin
  class SitesController < BaseController
    before_action :set_current_tournament, except: [:check_subdomain]
    before_action :set_site, except: [:create, :check_subdomain]

    def show
      @pages = @site.site_pages.ordered
    end

    def create
      if @tournament.has_site?
        redirect_to tournament_admin_tournament_site_path(@tournament), alert: "이미 사이트가 존재합니다."
        return
      end

      subdomain = params[:subdomain]&.downcase&.strip
      template = SiteTemplate.find_by(id: params[:template_id])

      unless TournamentSite.subdomain_available?(subdomain)
        redirect_to tournament_admin_tournament_path(@tournament), alert: "사용할 수 없는 서브도메인입니다."
        return
      end

      @tournament.create_site!(subdomain: subdomain, template: template)
      redirect_to tournament_admin_tournament_site_path(@tournament), notice: "사이트가 생성되었습니다."
    end

    def edit_design
    end

    def update_design
      if @site.update(design_params)
        redirect_to tournament_admin_tournament_site_path(@tournament), notice: "디자인이 저장되었습니다."
      else
        render :edit_design, status: :unprocessable_entity
      end
    end

    def publish
      @site.publish!
      redirect_to tournament_admin_tournament_site_path(@tournament), notice: "사이트가 발행되었습니다!"
    end

    def unpublish
      @site.unpublish!
      redirect_to tournament_admin_tournament_site_path(@tournament), notice: "사이트가 비공개 처리되었습니다."
    end

    # AJAX subdomain availability check
    def check_subdomain
      subdomain = params[:subdomain]&.downcase&.strip
      available = subdomain.present? && TournamentSite.subdomain_available?(subdomain)

      render json: {
        available: available,
        message: available ? "사용 가능한 주소입니다!" : "이미 사용 중인 주소입니다."
      }
    end

    private

    def set_site
      @site = @tournament.tournament_site

      unless @site
        redirect_to tournament_admin_tournament_path(@tournament), alert: "먼저 사이트를 생성해주세요."
      end
    end

    def design_params
      params.require(:tournament_site).permit(
        :primary_color, :secondary_color,
        :logo_url, :hero_image_url, :favicon_url,
        :meta_title, :meta_description, :og_image_url,
        theme_settings: {}
      )
    end
  end
end
