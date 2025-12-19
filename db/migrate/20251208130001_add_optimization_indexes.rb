# frozen_string_literal: true

class AddOptimizationIndexes < ActiveRecord::Migration[8.0]
  def change
    # =============================================================================
    # Additional Foreign Key Indexes
    # =============================================================================

    # Users - admin status for quick filtering
    unless index_exists?(:users, :is_admin)
      add_index :users, :is_admin, where: "is_admin = true", name: "index_users_on_is_admin_partial"
    end

    # Users - created_at for recent users queries
    unless index_exists?(:users, :created_at)
      add_index :users, :created_at
    end

    # =============================================================================
    # Composite Indexes for Common Query Patterns
    # =============================================================================

    # Games - status + scheduled_at (upcoming games query)
    unless index_exists?(:games, [:status, :scheduled_at])
      add_index :games, [:status, :scheduled_at], name: "index_games_on_status_and_scheduled_at"
    end

    # Games - organizer + status (my games query)
    unless index_exists?(:games, [:organizer_id, :status])
      add_index :games, [:organizer_id, :status], name: "index_games_on_organizer_and_status"
    end

    # Tournaments - status + start_date (active tournaments)
    unless index_exists?(:tournaments, [:status, :start_date])
      add_index :tournaments, [:status, :start_date], name: "index_tournaments_on_status_and_start_date"
    end

    # Tournaments - organizer + status (my tournaments)
    unless index_exists?(:tournaments, [:organizer_id, :status])
      add_index :tournaments, [:organizer_id, :status], name: "index_tournaments_on_organizer_and_status"
    end

    # Teams - status + city (active teams by city)
    unless index_exists?(:teams, [:status, :city])
      add_index :teams, [:status, :city], name: "index_teams_on_status_and_city"
    end

    # Tournament matches - status + scheduled_at (upcoming matches)
    unless index_exists?(:tournament_matches, [:status, :scheduled_at])
      add_index :tournament_matches, [:status, :scheduled_at], name: "index_tournament_matches_on_status_and_scheduled_at"
    end

    # Marketplace items - category + status + created_at (listing query)
    unless index_exists?(:marketplace_items, [:category, :status, :created_at])
      add_index :marketplace_items, [:category, :status, :created_at], name: "index_marketplace_items_on_category_status_created"
    end

    # =============================================================================
    # Performance Indexes for Leaderboards and Statistics
    # =============================================================================

    # Match player stats - composite for efficiency calculation
    unless index_exists?(:match_player_stats, [:tournament_team_player_id, :points])
      add_index :match_player_stats, [:tournament_team_player_id, :points], name: "index_match_player_stats_on_player_points"
    end

    # Tournament teams - group_name for group standings
    unless index_exists?(:tournament_teams, [:tournament_id, :group_name])
      add_index :tournament_teams, [:tournament_id, :group_name], name: "index_tournament_teams_on_tournament_and_group"
    end

    # =============================================================================
    # Soft Delete / Status Filtering Indexes
    # =============================================================================

    # Posts - status with published_at for feed queries
    unless index_exists?(:posts, [:status, :published_at])
      add_index :posts, [:status, :published_at], name: "index_posts_on_status_and_published_at"
    end

    # Comments - status for active comments
    unless index_exists?(:comments, [:commentable_type, :commentable_id, :status])
      add_index :comments, [:commentable_type, :commentable_id, :status], name: "index_comments_on_commentable_and_status"
    end

    # =============================================================================
    # Search Optimization Indexes
    # =============================================================================

    # Games - city + game_type for filtered search
    unless index_exists?(:games, [:city, :game_type])
      add_index :games, [:city, :game_type], name: "index_games_on_city_and_game_type"
    end

    # Court infos - court_type + is_free for filtered search
    unless index_exists?(:court_infos, [:court_type, :is_free])
      add_index :court_infos, [:court_type, :is_free], name: "index_court_infos_on_type_and_free"
    end

    # =============================================================================
    # Admin Dashboard Indexes
    # =============================================================================

    # Payments - created_at for revenue reports
    unless index_exists?(:payments, :created_at)
      add_index :payments, :created_at
    end

    # Payments - status + created_at for pending payments
    unless index_exists?(:payments, [:status, :created_at])
      add_index :payments, [:status, :created_at], name: "index_payments_on_status_and_created_at"
    end

    # Notifications - user + read_at for unread count
    unless index_exists?(:notifications, [:user_id, :read_at])
      add_index :notifications, [:user_id, :read_at], name: "index_notifications_on_user_and_read"
    end

    # =============================================================================
    # Tournament Site Indexes
    # =============================================================================

    # Tournament sites - tournament + is_published
    unless index_exists?(:tournament_sites, [:tournament_id, :is_published])
      add_index :tournament_sites, [:tournament_id, :is_published], name: "index_tournament_sites_on_tournament_and_published"
    end

    # Site templates - is_active + is_premium for template selection
    unless index_exists?(:site_templates, [:is_active, :is_premium])
      add_index :site_templates, [:is_active, :is_premium], name: "index_site_templates_on_active_and_premium"
    end
  end
end
