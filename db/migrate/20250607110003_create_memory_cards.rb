# frozen_string_literal: true

class CreateMemoryCards < ActiveRecord::Migration[8.0]
  def change
    create_table :memory_cards do |t|
      t.references :user, null: false, foreign_key: true
      t.references :cardable, polymorphic: true

      # Card type and content
      t.string :card_type, null: false
      t.string :title, null: false
      t.text :description
      t.string :template, default: "default"

      # Stats snapshot
      t.jsonb :stats_data, default: {}
      t.jsonb :highlights, default: []

      # Image generation
      t.string :image_url
      t.string :thumbnail_url
      t.string :share_url
      t.string :status, null: false, default: "pending"

      # Sharing
      t.integer :share_count, default: 0, null: false
      t.integer :view_count, default: 0, null: false
      t.boolean :is_public, default: true, null: false

      # Social sharing tracking
      t.jsonb :share_platforms, default: {}
      t.datetime :last_shared_at

      # Metadata
      t.jsonb :metadata, default: {}
      t.date :reference_date

      t.timestamps
    end

    add_index :memory_cards, :card_type
    add_index :memory_cards, :status
    add_index :memory_cards, [:user_id, :card_type]
    add_index :memory_cards, [:cardable_type, :cardable_id]
    add_index :memory_cards, :is_public
    add_index :memory_cards, :reference_date
    add_index :memory_cards, :created_at
  end
end
