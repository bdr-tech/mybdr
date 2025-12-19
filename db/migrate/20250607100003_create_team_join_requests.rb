# frozen_string_literal: true

class CreateTeamJoinRequests < ActiveRecord::Migration[8.0]
  def change
    create_table :team_join_requests do |t|
      t.references :team, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :processed_by, foreign_key: { to_table: :users }
      t.string :status, null: false, default: "pending"
      t.text :message
      t.text :rejection_reason
      t.string :preferred_position
      t.integer :preferred_jersey_number
      t.datetime :processed_at

      t.timestamps
    end

    add_index :team_join_requests, [:team_id, :user_id, :status]
    add_index :team_join_requests, :status
  end
end
