# frozen_string_literal: true

module Admin
  class UsersController < BaseController
    before_action :set_user, only: [:show, :edit, :update, :suspend, :activate, :make_admin, :remove_admin, :change_membership]

    def index
      @users = User.all

      # 필터링
      @users = @users.where(status: params[:status]) if params[:status].present?
      @users = @users.where(membership_type: params[:membership]) if params[:membership].present?
      @users = @users.where(is_admin: true) if params[:admins_only] == "true"

      # 검색
      if params[:q].present?
        query = "%#{params[:q]}%"
        @users = @users.where("email ILIKE ? OR nickname ILIKE ? OR name ILIKE ? OR phone ILIKE ?", query, query, query, query)
      end

      # 정렬
      @users = case params[:sort]
               when "newest" then @users.order(created_at: :desc)
               when "oldest" then @users.order(created_at: :asc)
               when "email" then @users.order(email: :asc)
               else @users.order(created_at: :desc)
               end

      @pagy, @users = pagy(@users, items: per_page_params)

      respond_to do |format|
        format.html
        format.json { render json: @users }
        format.csv { export_users_csv }
      end
    end

    def show
      @payments = @user.payments.recent.limit(10)
      @notifications = @user.notifications.recent.limit(10)
      @admin_logs = AdminLog.by_resource("User").where(resource_id: @user.id).recent.limit(20)
    end

    def edit
    end

    def update
      previous_values = @user.attributes.slice(*user_params.keys.map(&:to_s))

      if @user.update(user_params)
        log_admin_action(
          action: "update",
          resource: @user,
          changes: user_params.to_h,
          previous: previous_values,
          description: "사용자 정보 수정: #{@user.email}"
        )
        admin_success("사용자 정보가 수정되었습니다.", admin_user_path(@user))
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def suspend
      reason = params[:reason] || "관리자에 의해 정지됨"

      if @user.suspend!(reason)
        log_admin_action(
          action: "suspend",
          resource: @user,
          description: "사용자 정지: #{@user.email}, 사유: #{reason}",
          severity: "warning"
        )
        admin_success("#{@user.display_name}님이 정지되었습니다.")
      else
        admin_error("사용자 정지에 실패했습니다.")
      end
    end

    def activate
      if @user.activate!
        log_admin_action(
          action: "activate",
          resource: @user,
          description: "사용자 활성화: #{@user.email}"
        )
        admin_success("#{@user.display_name}님이 활성화되었습니다.")
      else
        admin_error("사용자 활성화에 실패했습니다.")
      end
    end

    def make_admin
      if @user.update(is_admin: true)
        log_admin_action(
          action: "update",
          resource: @user,
          changes: { is_admin: true },
          previous: { is_admin: false },
          description: "관리자 권한 부여: #{@user.email}",
          severity: "warning"
        )
        admin_success("#{@user.display_name}님에게 관리자 권한이 부여되었습니다.")
      else
        admin_error("관리자 권한 부여에 실패했습니다.")
      end
    end

    def remove_admin
      if @user == current_user
        admin_error("자신의 관리자 권한은 제거할 수 없습니다.")
        return
      end

      if @user.update(is_admin: false)
        log_admin_action(
          action: "update",
          resource: @user,
          changes: { is_admin: false },
          previous: { is_admin: true },
          description: "관리자 권한 제거: #{@user.email}",
          severity: "warning"
        )
        admin_success("#{@user.display_name}님의 관리자 권한이 제거되었습니다.")
      else
        admin_error("관리자 권한 제거에 실패했습니다.")
      end
    end

    def change_membership
      new_membership = params[:membership_type]

      unless User.membership_types.keys.include?(new_membership)
        admin_error("유효하지 않은 멤버십 타입입니다.")
        return
      end

      previous_membership = @user.membership_type

      if @user.update(membership_type: new_membership)
        log_admin_action(
          action: "update",
          resource: @user,
          changes: { membership_type: new_membership },
          previous: { membership_type: previous_membership },
          description: "멤버십 변경: #{@user.email} (#{previous_membership} → #{new_membership})",
          severity: "warning"
        )
        admin_success("#{@user.display_name}님의 멤버십이 #{new_membership}로 변경되었습니다.")
      else
        admin_error("멤버십 변경에 실패했습니다.")
      end
    end

    # 일괄 처리
    def bulk_action
      action = params[:bulk_action]
      user_ids = params[:user_ids] || []

      if user_ids.empty?
        admin_error("선택된 사용자가 없습니다.")
        return
      end

      users = User.where(id: user_ids)
      count = 0

      case action
      when "suspend"
        users.find_each do |user|
          next if user == current_user
          if user.suspend!
            count += 1
          end
        end
        message = "#{count}명의 사용자가 정지되었습니다."
      when "activate"
        users.find_each do |user|
          if user.activate!
            count += 1
          end
        end
        message = "#{count}명의 사용자가 활성화되었습니다."
      else
        admin_error("유효하지 않은 작업입니다.")
        return
      end

      log_admin_action(
        action: "bulk_action",
        resource: "User",
        description: "일괄 처리: #{action} (#{count}명)",
        severity: "warning"
      )

      admin_success(message)
    end

    private

    def set_user
      @user = User.find_by_public_id!(params[:id])
    end

    def user_params
      params.require(:user).permit(
        :email, :nickname, :name, :phone,
        :height, :weight, :position,
        :city, :district,
        :status, :membership_type
      )
    end

    def export_users_csv
      csv_data = CSV.generate(headers: true) do |csv|
        csv << ["ID", "이메일", "닉네임", "이름", "전화번호", "멤버십", "상태", "가입일"]

        @users.find_each do |user|
          csv << [
            user.id,
            user.email,
            user.nickname,
            user.name,
            user.phone,
            user.membership_type,
            user.status,
            user.created_at.strftime("%Y-%m-%d")
          ]
        end
      end

      send_data csv_data, filename: "users_#{Date.current}.csv", type: "text/csv"
    end
  end
end
