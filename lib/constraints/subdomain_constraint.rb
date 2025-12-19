# frozen_string_literal: true

module Constraints
  class SubdomainConstraint
    # Reserved subdomains that should not route to tournament sites
    RESERVED_SUBDOMAINS = %w[
      www admin api mail ftp smtp pop imap
      app dashboard help support blog
      static assets cdn images files
      signup login register auth oauth
      tournament tournaments game games
      team teams user users profile
      settings admin-panel super-admin
    ].freeze

    def matches?(request)
      subdomain = extract_subdomain(request.host)
      return false if subdomain.blank?
      return false if reserved?(subdomain)

      # Check if a tournament site exists for this subdomain
      TournamentSite.published.exists?(subdomain: subdomain)
    end

    private

    def extract_subdomain(host)
      return nil if host.blank?

      # Handle localhost for development
      if host.include?('localhost')
        parts = host.split('.')
        return parts[0] if parts.length > 1 && parts[0] != 'localhost'
        return nil
      end

      # Handle production domains (subdomain.mybdr.kr)
      parts = host.split('.')

      # For mybdr.kr or www.mybdr.kr
      return nil if parts.length < 3
      return nil if parts[0] == 'www'

      parts[0]
    end

    def reserved?(subdomain)
      RESERVED_SUBDOMAINS.include?(subdomain.downcase)
    end
  end
end
