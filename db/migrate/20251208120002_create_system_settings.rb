# frozen_string_literal: true

class CreateSystemSettings < ActiveRecord::Migration[8.0]
  def change
    create_table :system_settings do |t|
      t.string :key, null: false
      t.text :value
      t.string :value_type, default: "string"
      t.string :category, default: "general"
      t.text :description
      t.boolean :is_public, default: false
      t.boolean :is_editable, default: true

      t.timestamps
    end

    add_index :system_settings, :key, unique: true
    add_index :system_settings, :category
    add_index :system_settings, :is_public

    # Insert default settings
    reversible do |dir|
      dir.up do
        execute <<-SQL
          INSERT INTO system_settings (key, value, value_type, category, description, is_public, created_at, updated_at) VALUES
          ('site_name', 'BDR - Basketball Data Records', 'string', 'general', '사이트 이름', true, NOW(), NOW()),
          ('site_description', '농구 데이터 기록 및 관리 플랫폼', 'string', 'general', '사이트 설명', true, NOW(), NOW()),
          ('maintenance_mode', 'false', 'boolean', 'system', '점검 모드 활성화', false, NOW(), NOW()),
          ('maintenance_message', '시스템 점검 중입니다. 잠시 후 다시 시도해주세요.', 'string', 'system', '점검 모드 메시지', false, NOW(), NOW()),
          ('max_team_members', '15', 'integer', 'team', '팀 최대 인원', true, NOW(), NOW()),
          ('min_team_members', '5', 'integer', 'team', '팀 최소 인원', true, NOW(), NOW()),
          ('tournament_registration_fee', '50000', 'integer', 'payment', '대회 기본 참가비', false, NOW(), NOW()),
          ('free_result_view_days', '14', 'integer', 'membership', '무료 회원 결과 조회 기간(일)', false, NOW(), NOW()),
          ('pro_monthly_price', '9900', 'integer', 'membership', 'Pro 월간 구독료', true, NOW(), NOW()),
          ('enable_notifications', 'true', 'boolean', 'notification', '알림 기능 활성화', false, NOW(), NOW()),
          ('enable_memory_marketing', 'true', 'boolean', 'marketing', '추억 마케팅 기능 활성화', false, NOW(), NOW()),
          ('contact_email', 'support@mybdr.kr', 'string', 'general', '문의 이메일', true, NOW(), NOW()),
          ('terms_version', '1.0', 'string', 'legal', '이용약관 버전', true, NOW(), NOW()),
          ('privacy_version', '1.0', 'string', 'legal', '개인정보처리방침 버전', true, NOW(), NOW())
        SQL
      end
    end
  end
end
