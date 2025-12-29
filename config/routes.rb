# frozen_string_literal: true

Rails.application.routes.draw do
  # =============================================================================
  # Health Check
  # =============================================================================
  get "up" => "rails/health#show", as: :rails_health_check

  # =============================================================================
  # Subdomain Routes (Tournament Sites)
  # =============================================================================
  constraints Constraints::SubdomainConstraint.new do
    root to: "tournament_sites#show", as: :tournament_site_root
    get "preview", to: "tournament_sites#preview"
    get "*path", to: "tournament_sites#show"
  end

  # =============================================================================
  # Local Preview Routes (Development)
  # =============================================================================
  get "sites/:subdomain", to: "tournament_sites#local_preview", as: :local_site_preview
  get "sites/:subdomain/*path", to: "tournament_sites#local_preview"

  # =============================================================================
  # Root
  # =============================================================================
  root "home#index"

  # =============================================================================
  # Onboarding
  # =============================================================================
  get "onboarding", to: "onboarding#index"
  post "onboarding/complete", to: "onboarding#complete"

  # =============================================================================
  # Page Tips (페이지별 온보딩 팁)
  # =============================================================================
  post "tips/complete", to: "tips#complete"

  # =============================================================================
  # Authentication Routes
  # =============================================================================
  get    "login",  to: "sessions#new"
  post   "login",  to: "sessions#create"
  delete "logout", to: "sessions#destroy"

  # Dev Login (Development Only)
  if Rails.env.development? || Rails.env.test?
    get "dev_login/:id", to: "sessions#dev_login", as: :dev_login
  end

  get  "signup", to: "users#new"
  post "signup", to: "users#create"

  # OAuth Callbacks
  get  "auth/:provider/callback", to: "omniauth_callbacks#google_oauth2", constraints: { provider: /google_oauth2/ }
  get  "auth/:provider/callback", to: "omniauth_callbacks#kakao", constraints: { provider: /kakao/ }
  get  "auth/failure", to: "omniauth_callbacks#failure"

  # =============================================================================
  # Profile Routes
  # =============================================================================
  get   "profile",      to: "users#show"
  get   "profile/edit", to: "users#edit"
  patch "profile",      to: "users#update"
  post  "profile/admin_mode", to: "users#update_admin_mode"

  # =============================================================================
  # Board Favorites (즐겨찾기 게시판)
  # =============================================================================
  resources :board_favorites, only: [:create], param: :category
  delete "board_favorites/:category", to: "board_favorites#destroy", as: :board_favorite

  # =============================================================================
  # User Resources
  # =============================================================================
  resources :users, only: [:show]

  # =============================================================================
  # Notifications
  # =============================================================================
  resources :notifications, only: [:index, :show] do
    collection do
      get :dropdown
      post :mark_all_as_read
    end
    member do
      post :mark_as_read
      get :visit
    end
  end

  # =============================================================================
  # Games
  # =============================================================================
  resources :games do
    resources :game_applications, only: [:create, :show] do
      member do
        post :approve
        post :reject
        post :cancel
        get :cancel, action: :cancel_redirect  # GET 요청을 POST 폼으로 리다이렉트
        post :mark_paid
        post :mark_attended
      end
    end

    member do
      post :clone
      post :publish
      post :cancel
      post :save_as_template
    end

    collection do
      get :my_games
    end
  end

  # =============================================================================
  # Game Templates
  # =============================================================================
  resources :game_templates do
    member do
      get :use
    end
  end

  # =============================================================================
  # Courts
  # =============================================================================
  resources :courts, only: [:index, :show]

  # =============================================================================
  # Teams
  # =============================================================================
  resources :teams do
    resources :team_members, only: [:create, :destroy]
    resources :team_join_requests, only: [] do
      member do
        post :approve
        post :reject
      end
    end
    member do
      post :join
      delete :leave
    end
  end

  # =============================================================================
  # Tournament Series (시리즈/브랜드)
  # =============================================================================
  resources :tournament_series do
    member do
      post :create_next_edition
    end
    collection do
      get :my_series
    end
  end

  # =============================================================================
  # Tournaments (대회)
  # =============================================================================
  resources :tournaments do
    # 대회 경기
    resources :tournament_matches do
      member do
        get :box_score
        post :start
        post :finish
        patch :update_score
      end
    end

    # 참가팀
    resources :tournament_teams, only: [:index, :show, :create, :destroy] do
      member do
        post :approve
        post :reject
        post :withdraw
      end
    end

    member do
      get :bracket
      get :standings
      get :schedule
      post :open_registration
      post :close_registration
      post :start
      post :complete
      post :cancel
    end

    collection do
      get :my_tournaments
    end
  end

  # =============================================================================
  # Tournament Admin Console (대회관리자 콘솔)
  # =============================================================================
  namespace :tournament_admin do
    root to: "dashboard#index"

    # Dashboard
    get "dashboard", to: "dashboard#index"

    # Tournament creation wizard
    resources :tournaments do
      member do
        get :wizard
        patch :wizard_update

        # Wizard steps
        get "wizard/template", to: "tournaments#wizard_template"
        get "wizard/info", to: "tournaments#wizard_info"
        get "wizard/url", to: "tournaments#wizard_url"
        get "wizard/design", to: "tournaments#wizard_design"
        get "wizard/preview", to: "tournaments#wizard_preview"

        post :publish
        post :unpublish
        post :clone
        post :open_registration
        post :close_registration
        post :start_tournament
        post :complete_tournament
      end

      # Site management
      resource :site, controller: "sites" do
        member do
          get :edit_design
          patch :update_design
          post :publish
          post :unpublish
        end

        # Pages management
        resources :pages, controller: "site_pages" do
          collection do
            post :reorder
          end

          # Sections management (drag & drop editor)
          resources :sections, controller: "site_sections" do
            collection do
              post :reorder
            end
            member do
              patch :toggle_visibility
            end
          end
        end
      end

      # Tournament admins management
      resources :admins, controller: "tournament_admins", only: [:index, :create, :destroy] do
        member do
          patch :update_role
        end
      end
    end

    # Series management
    resources :series, controller: "series" do
      member do
        post :create_next_edition
      end
      collection do
        get :my_series
      end
    end

    # Site templates
    resources :templates, controller: "templates", only: [:index, :show] do
      member do
        get :preview
      end
    end

    # Subdomain availability check
    get "check_subdomain", to: "sites#check_subdomain"
  end

  # =============================================================================
  # Site Templates API (Public)
  # =============================================================================
  namespace :api do
    namespace :v1 do
      resources :site_templates, only: [:index, :show]
      get "subdomain/check", to: "subdomains#check"
    end
  end

  # =============================================================================
  # Admin Dashboard (Super Admin)
  # =============================================================================
  namespace :admin do
    root to: "dashboard#index"

    # Dashboard
    get "dashboard/refresh_stats", to: "dashboard#refresh_stats"
    get "dashboard/chart_data", to: "dashboard#chart_data"
    post "dashboard/quick_action", to: "dashboard#quick_action"

    # Users Management
    resources :users do
      member do
        post :suspend
        post :activate
        post :make_admin
        post :remove_admin
        post :change_membership
      end
      collection do
        post :bulk_action
        get :export
      end
    end

    # Tournaments Management
    resources :tournaments do
      member do
        post :approve
        post :reject
        post :activate
        post :complete
        post :cancel
      end
      resources :teams, only: [:index, :show, :destroy], controller: "tournament_teams" do
        member do
          post :approve
          post :reject
        end
      end
    end

    # Payments Management
    resources :payments, only: [:index, :show] do
      member do
        post :refund
        post :cancel
        patch :update_status
      end
      collection do
        get :summary
        get :export
      end
    end

    # Suggestions Management
    resources :suggestions do
      member do
        post :assign
        post :start_progress
        post :resolve
        post :reject
        post :close
        post :reopen
      end
      collection do
        get :export
      end
    end

    # Analytics & Reports
    get "analytics", to: "analytics#index"
    get "analytics/revenue", to: "analytics#revenue"
    get "analytics/users", to: "analytics#users"
    get "analytics/tournaments", to: "analytics#tournaments"
    get "analytics/chart_data", to: "analytics#chart_data"

    # System Settings
    resources :system_settings do
      collection do
        post :quick_update
        post :toggle_maintenance
        post :clear_cache
        get :export
        post :import
      end
    end

    # Admin Logs (Activity Logs)
    resources :admin_logs, only: [:index, :show]
  end

  # =============================================================================
  # Community
  # =============================================================================
  get "community", to: "community#index", as: :community
  post "community", to: "community#create"
  get "community/new", to: "community#new", as: :new_community_post
  get "community/:id", to: "community#show", as: :community_post
  get "community/:id/edit", to: "community#edit", as: :edit_community_post
  patch "community/:id", to: "community#update"
  delete "community/:id", to: "community#destroy"

  # Community Comments
  resources :community_posts, only: [] do
    resources :comments, controller: "community_comments", only: [:create, :destroy]
  end
end
