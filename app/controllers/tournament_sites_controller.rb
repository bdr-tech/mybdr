# frozen_string_literal: true

require "ostruct"

class TournamentSitesController < ApplicationController
  before_action :set_tournament_site, only: [:show, :preview]
  before_action :set_tournament_site_by_subdomain, only: [:local_preview]
  before_action :require_published_site, only: :show

  layout "tournament_site"

  def show
    @page = find_page
    return render_404 unless @page

    @sections = @page.visible_sections

    @tournament_site.increment_view!

    render "tournament_sites/pages/#{@page.page_type}", locals: { page: @page, sections: @sections }
  rescue ActionView::MissingTemplate
    render "tournament_sites/pages/custom", locals: { page: @page, sections: @sections }
  end

  def preview
    return render_404 unless can_preview?

    @page = find_page || @tournament_site.home_page
    @sections = @page&.visible_sections || []

    render "tournament_sites/pages/#{@page&.page_type || 'home'}", locals: { page: @page, sections: @sections }
  rescue ActionView::MissingTemplate
    render "tournament_sites/pages/custom", locals: { page: @page, sections: @sections }
  end

  # Local development preview - access via /sites/:subdomain
  def local_preview
    return render_404 unless @tournament_site

    @page = find_page || @tournament_site.home_page
    return render_404 unless @page

    @sections = @page.visible_sections
    @local_preview_mode = true
    @site_base_path = "/sites/#{params[:subdomain]}"

    render "tournament_sites/pages/#{@page.page_type}", locals: { page: @page, sections: @sections }
  rescue ActionView::MissingTemplate
    render "tournament_sites/pages/custom", locals: { page: @page, sections: @sections }
  end

  private

  def set_tournament_site
    @tournament_site = TournamentSite.find_by_host(request.host)
    render_404 unless @tournament_site
  end

  def set_tournament_site_by_subdomain
    @tournament_site = TournamentSite.find_by(subdomain: params[:subdomain])
  end

  def require_published_site
    return if @tournament_site.is_published?
    return if can_preview?

    render_404
  end

  def can_preview?
    return false unless current_user
    @tournament_site.tournament.admin?(current_user) || current_user.membership_type_super_admin?
  end

  def find_page
    path = params[:path]

    if path.blank? || path == "/"
      @tournament_site.home_page
    else
      slug = path.split("/").first
      page = @tournament_site.site_pages.find_by(slug: slug)

      # Handle virtual pages (templates that exist without database records)
      if page.nil? && virtual_page?(slug)
        page = build_virtual_page(slug)
      end

      page
    end
  end

  # Virtual pages are template-based pages that don't require database records
  def virtual_page?(slug)
    %w[registration].include?(slug)
  end

  def build_virtual_page(slug)
    # Create an OpenStruct to mimic a page object for virtual pages
    OpenStruct.new(
      page_type: slug,
      title: virtual_page_title(slug),
      slug: slug,
      visible_sections: []
    )
  end

  def virtual_page_title(slug)
    case slug
    when "registration" then "참가 신청"
    else slug.titleize
    end
  end

  def render_404
    render file: Rails.root.join("public/404.html"), status: :not_found, layout: false
  end
end
