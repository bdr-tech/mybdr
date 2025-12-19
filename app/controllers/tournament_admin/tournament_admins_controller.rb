# frozen_string_literal: true

module TournamentAdmin
  class TournamentAdminsController < BaseController
    before_action :set_current_tournament
    before_action :require_manage_admins_permission
    before_action :set_tournament_admin, only: [:destroy, :update_role]

    def index
      @admins = @tournament.tournament_admin_members.includes(:user).order(created_at: :asc)
    end

    def create
      email = params[:email]&.strip&.downcase
      user = User.find_by(email: email)

      unless user
        redirect_to tournament_admin_tournament_admins_path(@tournament), alert: "해당 이메일의 사용자를 찾을 수 없습니다."
        return
      end

      if @tournament.tournament_admin_members.exists?(user: user)
        redirect_to tournament_admin_tournament_admins_path(@tournament), alert: "이미 등록된 관리자입니다."
        return
      end

      role = params[:role].presence || "editor"
      @tournament.add_admin!(user, role: role)

      redirect_to tournament_admin_tournament_admins_path(@tournament), notice: "관리자가 추가되었습니다."
    end

    def destroy
      if @admin.owner? && @tournament.tournament_admin_members.owners.count == 1
        redirect_to tournament_admin_tournament_admins_path(@tournament), alert: "최소 한 명의 소유자가 있어야 합니다."
        return
      end

      @admin.destroy
      redirect_to tournament_admin_tournament_admins_path(@tournament), notice: "관리자가 삭제되었습니다."
    end

    def update_role
      role = params[:role]

      unless TournamentAdminMember.roles.keys.include?(role)
        redirect_to tournament_admin_tournament_admins_path(@tournament), alert: "올바르지 않은 역할입니다."
        return
      end

      # Prevent demoting the last owner
      if @admin.owner? && role != "owner" && @tournament.tournament_admin_members.owners.count == 1
        redirect_to tournament_admin_tournament_admins_path(@tournament), alert: "최소 한 명의 소유자가 있어야 합니다."
        return
      end

      @admin.update!(role: role)
      redirect_to tournament_admin_tournament_admins_path(@tournament), notice: "역할이 변경되었습니다."
    end

    private

    def require_manage_admins_permission
      unless @tournament.owner?(current_user) || @tournament.tournament_admin_members.find_by(user: current_user)&.can_manage_admins?
        redirect_to tournament_admin_tournament_path(@tournament), alert: "관리자 관리 권한이 필요합니다."
      end
    end

    def set_tournament_admin
      @admin = @tournament.tournament_admin_members.find(params[:id])
    end
  end
end
