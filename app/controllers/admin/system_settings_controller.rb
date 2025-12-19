# frozen_string_literal: true

module Admin
  class SystemSettingsController < BaseController
    before_action :require_super_admin!, except: [:index, :show]
    before_action :set_setting, only: [:show, :edit, :update, :destroy]

    def index
      @settings = SystemSetting.all

      if params[:category].present?
        @settings = @settings.by_category(params[:category])
      end

      @settings = @settings.order(:category, :key)

      # 카테고리별 그룹화
      @settings_by_category = @settings.group_by(&:category)

      respond_to do |format|
        format.html
        format.json { render json: @settings }
      end
    end

    def show
      respond_to do |format|
        format.html
        format.json { render json: { key: @setting.key, value: @setting.typed_value } }
      end
    end

    def new
      @setting = SystemSetting.new
    end

    def create
      @setting = SystemSetting.new(setting_params)

      if @setting.save
        log_admin_action(
          action: "create",
          resource: @setting,
          changes: setting_params.to_h,
          description: "시스템 설정 생성: #{@setting.key}",
          severity: "warning"
        )
        admin_success("설정이 생성되었습니다.", admin_system_settings_path)
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit
      unless @setting.is_editable?
        admin_error("이 설정은 수정할 수 없습니다.")
        redirect_to admin_system_settings_path
      end
    end

    def update
      unless @setting.is_editable?
        admin_error("이 설정은 수정할 수 없습니다.")
        return
      end

      old_value = @setting.value

      if @setting.update(setting_params)
        AdminLog.log_settings_change(
          admin: current_user,
          key: @setting.key,
          old_value: old_value,
          new_value: @setting.value,
          request: request
        )
        admin_success("설정이 수정되었습니다.", admin_system_settings_path)
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      unless @setting.is_editable?
        admin_error("이 설정은 삭제할 수 없습니다.")
        return
      end

      log_admin_action(
        action: "delete",
        resource: @setting,
        description: "시스템 설정 삭제: #{@setting.key}",
        severity: "critical"
      )

      @setting.destroy
      admin_success("설정이 삭제되었습니다.")
    end

    # 설정값 빠른 업데이트 (AJAX)
    def quick_update
      key = params[:key]
      value = params[:value]

      setting = SystemSetting.find_by(key: key)

      unless setting
        render json: { success: false, error: "설정을 찾을 수 없습니다." }, status: :not_found
        return
      end

      unless setting.is_editable?
        render json: { success: false, error: "이 설정은 수정할 수 없습니다." }, status: :forbidden
        return
      end

      result = setting.update_value(value)

      if result[:success]
        AdminLog.log_settings_change(
          admin: current_user,
          key: key,
          old_value: result[:old_value],
          new_value: result[:new_value],
          request: request
        )
        render json: { success: true, value: setting.typed_value }
      else
        render json: { success: false, errors: result[:errors] }, status: :unprocessable_entity
      end
    end

    # 점검 모드 토글
    def toggle_maintenance
      setting = SystemSetting.find_by(key: "maintenance_mode")
      new_value = !SystemSetting.enabled?("maintenance_mode")

      if setting
        result = setting.update_value(new_value.to_s)

        if result[:success]
          AdminLog.log_settings_change(
            admin: current_user,
            key: "maintenance_mode",
            old_value: result[:old_value],
            new_value: result[:new_value],
            request: request
          )

          status_text = new_value ? "활성화" : "비활성화"
          admin_success("점검 모드가 #{status_text}되었습니다.")
        else
          admin_error("점검 모드 변경에 실패했습니다.")
        end
      else
        admin_error("점검 모드 설정을 찾을 수 없습니다.")
      end
    end

    # 캐시 클리어
    def clear_cache
      Rails.cache.clear
      SystemSetting.clear_cache
      DashboardStatsService.clear_cache

      log_admin_action(
        action: "settings_change",
        resource: "SystemSetting",
        description: "전체 캐시 클리어",
        severity: "warning"
      )

      admin_success("캐시가 클리어되었습니다.")
    end

    # 설정 내보내기
    def export
      settings = SystemSetting.editable.map do |s|
        {
          key: s.key,
          value: s.typed_value,
          value_type: s.value_type,
          category: s.category,
          description: s.description
        }
      end

      respond_to do |format|
        format.json do
          send_data settings.to_json,
                    filename: "system_settings_#{Date.current}.json",
                    type: "application/json"
        end
      end
    end

    # 설정 가져오기
    def import
      file = params[:file]

      unless file
        admin_error("파일을 선택해주세요.")
        return
      end

      begin
        settings_data = JSON.parse(file.read)
        imported_count = 0

        settings_data.each do |data|
          setting = SystemSetting.find_or_initialize_by(key: data["key"])
          next unless setting.is_editable? || setting.new_record?

          setting.assign_attributes(
            value: data["value"].to_s,
            value_type: data["value_type"],
            category: data["category"],
            description: data["description"]
          )

          if setting.save
            imported_count += 1
          end
        end

        log_admin_action(
          action: "settings_change",
          resource: "SystemSetting",
          description: "설정 가져오기: #{imported_count}개 항목",
          severity: "warning"
        )

        admin_success("#{imported_count}개의 설정이 가져오기되었습니다.")
      rescue JSON::ParserError
        admin_error("잘못된 JSON 파일입니다.")
      rescue StandardError => e
        admin_error("설정 가져오기에 실패했습니다: #{e.message}")
      end
    end

    private

    def set_setting
      @setting = SystemSetting.find(params[:id])
    end

    def setting_params
      params.require(:system_setting).permit(
        :key, :value, :value_type, :category,
        :description, :is_public, :is_editable
      )
    end
  end
end
