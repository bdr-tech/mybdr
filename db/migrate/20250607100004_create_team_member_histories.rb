# frozen_string_literal: true

class CreateTeamMemberHistories < ActiveRecord::Migration[8.0]
  def change
    create_table :team_member_histories do |t|
      t.references :user, null: false, foreign_key: true
      t.references :team, null: false, foreign_key: true
      t.string :action, null: false
      t.string :role
      t.integer :jersey_number
      t.references :from_team, foreign_key: { to_table: :teams }
      t.references :to_team, foreign_key: { to_table: :teams }
      t.references :processed_by, foreign_key: { to_table: :users }
      t.text :note

      t.timestamps
    end

    add_index :team_member_histories, [:user_id, :created_at]
    add_index :team_member_histories, [:team_id, :action]
    add_index :team_member_histories, :action
  end
end
