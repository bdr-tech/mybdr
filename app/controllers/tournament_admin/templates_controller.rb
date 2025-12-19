# frozen_string_literal: true

module TournamentAdmin
  class TemplatesController < BaseController
    skip_before_action :set_current_tournament

    def index
      @templates = SiteTemplate.active.includes(:tournament_sites)

      @templates = @templates.by_category(params[:category]) if params[:category].present?
      @templates = @templates.popular.limit(20)
    end

    def show
      @template = SiteTemplate.active.find(params[:id])
    end

    def preview
      @template = SiteTemplate.active.find(params[:id])
      render layout: "tournament_site_preview"
    end
  end
end
