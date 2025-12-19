# frozen_string_literal: true

class CreateSuggestions < ActiveRecord::Migration[8.0]
  def change
    create_table :suggestions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :assigned_to, foreign_key: { to_table: :users }

      # Content
      t.string :title, null: false
      t.text :content, null: false
      t.string :category, null: false, default: "general"

      # Status
      t.string :status, null: false, default: "pending"
      t.integer :priority, default: 0

      # Response
      t.text :admin_response
      t.datetime :responded_at
      t.references :responded_by, foreign_key: { to_table: :users }

      # Metadata
      t.jsonb :metadata, default: {}
      t.string :device_info
      t.string :app_version

      t.timestamps
    end

    add_index :suggestions, :category
    add_index :suggestions, :status
    add_index :suggestions, :priority
    add_index :suggestions, [:status, :priority]
    add_index :suggestions, :created_at
  end
end
