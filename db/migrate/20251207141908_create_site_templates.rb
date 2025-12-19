# frozen_string_literal: true

class CreateSiteTemplates < ActiveRecord::Migration[8.0]
  def change
    create_table :site_templates do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.text :description
      t.string :thumbnail_url
      t.string :preview_url
      t.string :category, default: 'general'  # general, university, corporate, community
      t.jsonb :default_theme, default: {}
      t.jsonb :default_pages, default: []
      t.boolean :is_premium, default: false
      t.boolean :is_active, default: true
      t.integer :usage_count, default: 0

      t.timestamps

      t.index :slug, unique: true
      t.index :category
      t.index :is_active
    end
  end
end
