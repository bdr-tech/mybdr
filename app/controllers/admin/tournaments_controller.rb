# frozen_string_literal: true

module Admin
  class TournamentsController < BaseController
    before_action :set_tournament, only: [:show, :edit, :update, :approve, :reject, :activate, :complete, :cancel]

    def index
      @tournaments = Tournament.includes(:organizer, :series).all

      # 필터링
      @tournaments = @tournaments.where(status: params[:status]) if params[:status].present?
      @tournaments = @tournaments.where(tournament_type: params[:type]) if params[:type].present?

      # 검색
      if params[:q].present?
        query = "%#{params[:q]}%"
        @tournaments = @tournaments.where("name ILIKE ? OR description ILIKE ?", query, query)
      end

      # 정렬
      @tournaments = case params[:sort]
                     when "name" then @tournaments.order(name: :asc)
                     when "start_date" then @tournaments.order(start_date: :desc)
                     when "oldest" then @tournaments.order(created_at: :asc)
                     else @tournaments.order(created_at: :desc)
                     end

      @pagy, @tournaments = pagy(@tournaments, items: per_page_params)

      # 통계
      @stats = {
        total: Tournament.count,
        draft: Tournament.where(status: "draft").count,
        registration_open: Tournament.where(status: "registration_open").count,
        in_progress: Tournament.where(status: "in_progress").count,
        completed: Tournament.where(status: "completed").count
      }

      respond_to do |format|
        format.html
        format.json { render json: @tournaments }
      end
    end

    def show
      @teams_pagy, @teams = pagy(@tournament.tournament_teams.includes(:team), page_param: :teams_page, items: 20)
      @matches = @tournament.tournament_matches.includes(:home_team, :away_team).order(scheduled_at: :asc).limit(50)
      @admin_logs = AdminLog.by_resource("Tournament").where(resource_id: @tournament.id).recent.limit(20)
    end

    def edit
    end

    def update
      previous_values = @tournament.attributes.slice(*tournament_params.keys.map(&:to_s))

      if @tournament.update(tournament_params)
        log_admin_action(
          action: "update",
          resource: @tournament,
          changes: tournament_params.to_h,
          previous: previous_values,
          description: "대회 정보 수정: #{@tournament.name}"
        )
        admin_success("대회 정보가 수정되었습니다.", admin_tournament_path(@tournament))
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def approve
      if @tournament.update(status: "active", approved_at: Time.current, approved_by_id: current_user.id)
        log_admin_action(
          action: "approve",
          resource: @tournament,
          description: "대회 승인: #{@tournament.name}"
        )

        # 주최자에게 알림
        @tournament.organizer.notifications.create!(
          notification_type: "tournament_registration_opened",
          title: "대회 승인됨",
          content: "'#{@tournament.name}' 대회가 승인되었습니다.",
          notifiable: @tournament,
          action_url: "/tournaments/#{@tournament.id}",
          action_type: "view"
        )

        admin_success("대회가 승인되었습니다.")
      else
        admin_error("대회 승인에 실패했습니다.")
      end
    end

    def reject
      reason = params[:reason] || "관리자에 의해 거절됨"

      if @tournament.update(status: "rejected", rejected_at: Time.current, rejection_reason: reason)
        log_admin_action(
          action: "reject",
          resource: @tournament,
          changes: { reason: reason },
          description: "대회 거절: #{@tournament.name}, 사유: #{reason}",
          severity: "warning"
        )

        # 주최자에게 알림
        @tournament.organizer.notifications.create!(
          notification_type: "system_announcement",
          title: "대회 거절됨",
          content: "'#{@tournament.name}' 대회가 거절되었습니다. 사유: #{reason}",
          notifiable: @tournament,
          action_url: "/tournaments/#{@tournament.id}",
          action_type: "view"
        )

        admin_success("대회가 거절되었습니다.")
      else
        admin_error("대회 거절에 실패했습니다.")
      end
    end

    def activate
      if @tournament.update(status: "active")
        log_admin_action(
          action: "activate",
          resource: @tournament,
          description: "대회 활성화: #{@tournament.name}"
        )
        admin_success("대회가 활성화되었습니다.")
      else
        admin_error("대회 활성화에 실패했습니다.")
      end
    end

    def complete
      if @tournament.update(status: "completed", ended_at: Time.current)
        log_admin_action(
          action: "update",
          resource: @tournament,
          changes: { status: "completed" },
          description: "대회 종료 처리: #{@tournament.name}"
        )
        admin_success("대회가 종료되었습니다.")
      else
        admin_error("대회 종료에 실패했습니다.")
      end
    end

    def cancel
      reason = params[:reason] || "관리자에 의해 취소됨"

      if @tournament.update(status: "cancelled", cancelled_at: Time.current, cancellation_reason: reason)
        log_admin_action(
          action: "cancel",
          resource: @tournament,
          changes: { reason: reason },
          description: "대회 취소: #{@tournament.name}, 사유: #{reason}",
          severity: "warning"
        )

        # 참가 팀들에게 알림
        @tournament.tournament_teams.includes(:team).find_each do |tt|
          tt.team.members.each do |member|
            member.user.notifications.create!(
              notification_type: "tournament_schedule_updated",
              title: "대회 취소",
              content: "'#{@tournament.name}' 대회가 취소되었습니다. 사유: #{reason}",
              notifiable: @tournament,
              action_url: "/tournaments/#{@tournament.id}"
            )
          end
        end

        admin_success("대회가 취소되었습니다.")
      else
        admin_error("대회 취소에 실패했습니다.")
      end
    end

    # 팀 관리
    def teams
      @tournament = Tournament.find(params[:id])
      @pagy, @teams = pagy(@tournament.tournament_teams.includes(:team, :payments), items: per_page_params)

      respond_to do |format|
        format.html
        format.json { render json: @teams }
      end
    end

    # 팀 승인
    def approve_team
      @tournament = Tournament.find(params[:id])
      @tournament_team = @tournament.tournament_teams.find(params[:team_id])

      if @tournament_team.update(status: "approved", approved_at: Time.current)
        log_admin_action(
          action: "approve",
          resource: @tournament_team,
          description: "대회 참가팀 승인: #{@tournament_team.team.name}"
        )
        admin_success("팀이 승인되었습니다.")
      else
        admin_error("팀 승인에 실패했습니다.")
      end
    end

    # 팀 거절
    def reject_team
      @tournament = Tournament.find(params[:id])
      @tournament_team = @tournament.tournament_teams.find(params[:team_id])
      reason = params[:reason]

      if @tournament_team.update(status: "rejected", rejected_at: Time.current, rejection_reason: reason)
        log_admin_action(
          action: "reject",
          resource: @tournament_team,
          changes: { reason: reason },
          description: "대회 참가팀 거절: #{@tournament_team.team.name}"
        )
        admin_success("팀이 거절되었습니다.")
      else
        admin_error("팀 거절에 실패했습니다.")
      end
    end

    private

    def set_tournament
      @tournament = Tournament.find(params[:id])
    end

    def tournament_params
      params.require(:tournament).permit(
        :name, :description, :format, :status,
        :start_date, :end_date, :registration_start_at, :registration_end_at,
        :venue_name, :venue_address, :city, :district,
        :entry_fee, :max_teams, :min_teams, :team_size,
        :roster_min, :roster_max, :auto_approve_teams,
        :bank_name, :bank_account, :bank_holder,
        :rules, :prize_info, :is_public,
        divisions: [], division_tiers: []
      )
    end
  end
end
