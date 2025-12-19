# frozen_string_literal: true

module TournamentSitesHelper
  # Generate context-aware site path for tournament site pages
  # Works correctly in both production (subdomain) and local preview modes
  def site_path(url)
    if @local_preview_mode && @site_base_path
      url == "/" ? @site_base_path : "#{@site_base_path}#{url}"
    else
      url
    end
  end

  # Shorthand for home path
  def site_home_path
    site_path("/")
  end
end
