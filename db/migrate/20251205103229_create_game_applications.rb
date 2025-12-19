# frozen_string_literal: true

class CreateGameApplications < ActiveRecord::Migration[8.0]
  def change
    create_table :game_applications do |t|
      t.references :game, foreign_key: true, null: false
      t.references :user, foreign_key: true, null: false

      # 신청 상태
      t.integer :status, default: 0, null: false  # pending, approved, rejected, cancelled, attended, no_show

      # 신청 정보
      t.text :message  # 신청 메시지
      t.string :position  # 희망 포지션
      t.boolean :is_guest, default: false  # 게스트 여부

      # 결제 정보
      t.boolean :payment_required, default: false
      t.integer :payment_status, default: 0  # unpaid, paid, refunded
      t.datetime :paid_at
      t.string :payment_method  # transfer, toss, cash

      # 호스트 메모
      t.text :admin_note

      # 참석 확인
      t.datetime :approved_at
      t.datetime :rejected_at
      t.datetime :cancelled_at
      t.datetime :attended_at

      t.timestamps
    end

    add_index :game_applications, [:game_id, :user_id], unique: true
    add_index :game_applications, :status
    add_index :game_applications, :payment_status
  end
end
