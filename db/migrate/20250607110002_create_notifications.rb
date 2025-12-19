# frozen_string_literal: true

class CreateNotifications < ActiveRecord::Migration[8.0]
  def change
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true
      t.references :notifiable, polymorphic: true

      # Notification type and status
      t.string :notification_type, null: false
      t.string :status, null: false, default: "unread"

      # Content
      t.string :title, null: false
      t.text :content
      t.string :action_url
      t.string :action_type

      # Metadata
      t.jsonb :metadata, default: {}

      # Timestamps
      t.datetime :read_at
      t.datetime :sent_at
      t.datetime :expired_at

      t.timestamps
    end

    add_index :notifications, :notification_type
    add_index :notifications, :status
    add_index :notifications, [:user_id, :status]
    add_index :notifications, [:user_id, :notification_type]
    add_index :notifications, [:notifiable_type, :notifiable_id]
    add_index :notifications, :read_at
    add_index :notifications, :created_at
  end
end
