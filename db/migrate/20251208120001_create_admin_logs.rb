# frozen_string_literal: true

class CreateAdminLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :admin_logs do |t|
      t.references :admin, null: false, foreign_key: { to_table: :users }
      t.references :target, polymorphic: true

      # Action details
      t.string :action, null: false
      t.string :resource_type, null: false
      t.bigint :resource_id

      # Changes tracking
      t.jsonb :changes_made, default: {}
      t.jsonb :previous_values, default: {}
      t.text :description

      # Request info
      t.string :ip_address
      t.string :user_agent
      t.string :request_id

      # Severity
      t.string :severity, default: "info"

      t.timestamps
    end

    add_index :admin_logs, :action
    add_index :admin_logs, :resource_type
    add_index :admin_logs, [:resource_type, :resource_id]
    add_index :admin_logs, :severity
    add_index :admin_logs, :created_at
    add_index :admin_logs, [:admin_id, :created_at]
  end
end
