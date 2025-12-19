# frozen_string_literal: true

module TournamentAdmin
  class TournamentsController < BaseController
    skip_before_action :set_current_tournament, only: [:index, :new, :create]
    before_action :set_current_tournament, only: [:show, :edit, :update, :destroy, :wizard, :wizard_update,
                                                   :wizard_template, :wizard_info, :wizard_url, :wizard_design, :wizard_preview,
                                                   :publish, :unpublish, :clone,
                                                   :open_registration, :close_registration, :start_tournament, :complete_tournament]

    def index
      @tournaments = current_user.administrated_tournaments
                                 .or(Tournament.where(organizer: current_user))
                                 .includes(:tournament_site, :series)
                                 .order(created_at: :desc)
    end

    def show
      @site = @tournament.tournament_site
      @stats = {
        teams_count: @tournament.teams_count,
        matches_count: @tournament.matches_count,
        views_count: @site&.views_count || 0
      }
    end

    def new
      @tournament = Tournament.new
      @templates = SiteTemplate.active.popular
    end

    def create
      @tournament = current_user.organized_tournaments.build(tournament_params)

      if @tournament.save
        # Add creator as owner
        @tournament.add_admin!(current_user, role: :owner)

        redirect_to wizard_tournament_admin_tournament_path(@tournament), notice: "대회가 생성되었습니다. 위자드를 계속 진행해주세요."
      else
        @templates = SiteTemplate.active.popular
        render :new, status: :unprocessable_entity
      end
    end

    def edit
    end

    def update
      if @tournament.update(tournament_params)
        redirect_to tournament_admin_tournament_path(@tournament), notice: "대회 정보가 업데이트되었습니다."
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      require_tournament_owner

      @tournament.destroy
      redirect_to tournament_admin_root_path, notice: "대회가 삭제되었습니다."
    end

    # =============================================================================
    # Wizard Actions
    # =============================================================================

    def wizard
      @step = params[:step]&.to_i || determine_wizard_step
      @templates = SiteTemplate.active.popular if @step == 1
    end

    def wizard_update
      @step = params[:step].to_i

      case @step
      when 1 # Template selection
        # Check if user actually selected a template (via Stimulus controller)
        unless params.key?(:template_id)
          flash.now[:alert] = "템플릿을 선택해주세요."
          @templates = SiteTemplate.active.popular
          render :wizard, status: :unprocessable_entity
          return
        end

        # Blank template (빈 템플릿) has empty value, which is valid
        if params[:template_id].present?
          template = SiteTemplate.find_by(id: params[:template_id])
          unless template
            flash.now[:alert] = "선택한 템플릿을 찾을 수 없습니다."
            @templates = SiteTemplate.active.popular
            render :wizard, status: :unprocessable_entity
            return
          end
          session[:wizard_template_id] = template.id
        else
          # Blank template selected
          session[:wizard_template_id] = nil
        end

        redirect_to wizard_tournament_admin_tournament_path(@tournament, step: 2)

      when 2 # Basic info
        if @tournament.update(tournament_params)
          redirect_to wizard_tournament_admin_tournament_path(@tournament, step: 3)
        else
          @templates = SiteTemplate.active.popular
          render :wizard, status: :unprocessable_entity
        end

      when 3 # URL setting
        subdomain = params[:subdomain]&.downcase&.strip

        if subdomain.blank?
          flash.now[:alert] = "서브도메인을 입력해주세요."
          render :wizard, status: :unprocessable_entity
          return
        end

        unless TournamentSite.subdomain_available?(subdomain)
          flash.now[:alert] = "이미 사용 중인 서브도메인입니다."
          render :wizard, status: :unprocessable_entity
          return
        end

        session[:wizard_subdomain] = subdomain
        redirect_to wizard_tournament_admin_tournament_path(@tournament, step: 4)

      when 4 # Design customization + Content presets
        session[:wizard_design] = {
          primary_color: params[:primary_color],
          secondary_color: params[:secondary_color],
          logo_url: params[:logo_url],
          hero_image_url: params[:hero_image_url]
        }
        # Store selected content preset IDs
        session[:wizard_preset_ids] = params[:preset_ids] || []
        redirect_to wizard_tournament_admin_tournament_path(@tournament, step: 5)

      when 5 # Preview & Publish
        create_tournament_site!
        redirect_to tournament_admin_tournament_path(@tournament), notice: "대회 사이트가 생성되었습니다!"
      end
    end

    # Wizard step views (for turbo frame updates)
    def wizard_template
      @templates = SiteTemplate.active.popular
      render partial: "tournament_admin/tournaments/wizard/template"
    end

    def wizard_info
      render partial: "tournament_admin/tournaments/wizard/info"
    end

    def wizard_url
      render partial: "tournament_admin/tournaments/wizard/url"
    end

    def wizard_design
      render partial: "tournament_admin/tournaments/wizard/design"
    end

    def wizard_preview
      render partial: "tournament_admin/tournaments/wizard/preview"
    end

    # =============================================================================
    # Publishing Actions
    # =============================================================================

    def publish
      site = @tournament.tournament_site
      unless site
        redirect_to tournament_admin_tournament_path(@tournament), alert: "먼저 사이트를 생성해주세요."
        return
      end

      site.publish!
      redirect_to tournament_admin_tournament_path(@tournament), notice: "사이트가 발행되었습니다!"
    end

    def unpublish
      @tournament.tournament_site&.unpublish!
      redirect_to tournament_admin_tournament_path(@tournament), notice: "사이트가 비공개 처리되었습니다."
    end

    def clone
      # Clone tournament and site
      new_tournament = @tournament.dup
      new_tournament.name = "#{@tournament.name} (복사본)"
      new_tournament.status = :draft
      new_tournament.teams_count = 0
      new_tournament.matches_count = 0
      new_tournament.views_count = 0
      # 시리즈 연결 해제 (edition_number 유니크 제약 조건 방지)
      new_tournament.series_id = nil
      new_tournament.edition_number = nil

      if new_tournament.save
        new_tournament.add_admin!(current_user, role: :owner)
        @tournament.tournament_site&.clone_to(new_tournament)

        redirect_to wizard_tournament_admin_tournament_path(new_tournament, step: 2),
                    notice: "대회가 복제되었습니다. 기본 정보를 확인해주세요."
      else
        redirect_to tournament_admin_tournament_path(@tournament), alert: "복제에 실패했습니다."
      end
    end

    # =============================================================================
    # Status Change Actions
    # =============================================================================

    def open_registration
      @tournament.open_registration!
      redirect_to tournament_admin_tournament_path(@tournament), notice: "참가 등록이 시작되었습니다."
    rescue => e
      redirect_to tournament_admin_tournament_path(@tournament), alert: "상태 변경 실패: #{e.message}"
    end

    def close_registration
      @tournament.close_registration!
      redirect_to tournament_admin_tournament_path(@tournament), notice: "참가 등록이 마감되었습니다."
    rescue => e
      redirect_to tournament_admin_tournament_path(@tournament), alert: "상태 변경 실패: #{e.message}"
    end

    def start_tournament
      @tournament.start!
      redirect_to tournament_admin_tournament_path(@tournament), notice: "대회가 시작되었습니다."
    rescue => e
      redirect_to tournament_admin_tournament_path(@tournament), alert: "상태 변경 실패: #{e.message}"
    end

    def complete_tournament
      @tournament.update!(status: :completed)
      redirect_to tournament_admin_tournament_path(@tournament), notice: "대회가 완료되었습니다."
    rescue => e
      redirect_to tournament_admin_tournament_path(@tournament), alert: "상태 변경 실패: #{e.message}"
    end

    private

    def tournament_params
      params.require(:tournament).permit(
        :name, :description, :start_date, :end_date,
        :registration_start_at, :registration_end_at,
        :max_teams, :min_teams, :team_size, :entry_fee,
        :format, :city, :district, :venue_name,
        :is_public, :series_id, :edition_number,
        :bank_name, :bank_account, :bank_holder,
        :logo, :banner, :logo_url, :banner_url,
        divisions: [], division_tiers: []
      )
    end

    def determine_wizard_step
      return 1 unless @tournament.persisted?
      return 2 unless @tournament.name.present?
      return 3 unless @tournament.tournament_site.present?
      return 4 unless @tournament.tournament_site.primary_color.present?
      5
    end

    def create_tournament_site!
      template = SiteTemplate.find_by(id: session[:wizard_template_id])
      subdomain = session[:wizard_subdomain]
      design = session[:wizard_design] || {}

      @tournament.create_site!(subdomain: subdomain, template: template)

      site = @tournament.tournament_site
      site.update!(
        primary_color: design[:primary_color] || template&.theme&.dig("primary_color") || "#E53E3E",
        secondary_color: design[:secondary_color] || template&.theme&.dig("secondary_color") || "#ED8936",
        logo_url: design[:logo_url],
        hero_image_url: design[:hero_image_url]
      )

      template&.increment_usage!

      # Apply selected content presets
      apply_content_presets!(site)

      # Clear session
      session.delete(:wizard_template_id)
      session.delete(:wizard_subdomain)
      session.delete(:wizard_design)
      session.delete(:wizard_preset_ids)
    end

    def apply_content_presets!(site)
      preset_ids = session[:wizard_preset_ids] || []
      return if preset_ids.empty?

      # Find or create notice page
      notice_page = site.site_pages.find_by(page_type: "notice") ||
                    site.site_pages.find_by(slug: "notice")

      unless notice_page
        notice_page = site.site_pages.create!(
          title: "공지사항",
          slug: "notice",
          page_type: "notice",
          position: site.site_pages.maximum(:position).to_i + 1
        )
      end

      # Apply each preset as a new section
      ContentPreset.where(id: preset_ids).ordered.each do |preset|
        section = preset.build_section(notice_page)
        section.save!
        preset.increment_usage!
      end
    end
  end
end
