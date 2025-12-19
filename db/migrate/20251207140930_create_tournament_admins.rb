# frozen_string_literal: true

class CreateTournamentAdmins < ActiveRecord::Migration[8.0]
  def change
    create_table :tournament_admins do |t|
      t.references :user, null: false, foreign_key: true
      t.references :tournament, null: false, foreign_key: true
      t.string :role, null: false, default: 'admin'  # owner, admin, editor, viewer
      t.jsonb :permissions, default: {}
      t.boolean :is_active, default: true

      t.timestamps

      t.index [:user_id, :tournament_id], unique: true
      t.index [:tournament_id, :role]
    end
  end
end
