# frozen_string_literal: true

class CreateContentPresets < ActiveRecord::Migration[8.0]
  def change
    create_table :content_presets, id: :uuid do |t|
      # Basic Info
      t.string :name, null: false
      t.string :slug, null: false
      t.text :description

      # Classification
      t.string :category, null: false, default: "general"
      t.string :target_section_type, default: "text"
      t.string :target_page_types, array: true, default: []

      # Content (matches SiteSection.content JSONB structure)
      t.jsonb :content, null: false, default: {}
      t.jsonb :default_settings, default: {}

      # Styling defaults
      t.string :background_color
      t.string :text_color

      # Status & Ordering
      t.boolean :is_active, default: true
      t.boolean :is_featured, default: false
      t.integer :position, default: 0
      t.integer :usage_count, default: 0

      t.timestamps
    end

    add_index :content_presets, :slug, unique: true
    add_index :content_presets, :category
    add_index :content_presets, :target_section_type
    add_index :content_presets, [:is_active, :category]
    add_index :content_presets, [:is_active, :is_featured]
  end
end
