# frozen_string_literal: true

class CreateTournamentSites < ActiveRecord::Migration[8.0]
  def change
    create_table :tournament_sites do |t|
      t.references :tournament, null: false, foreign_key: true
      t.references :site_template, foreign_key: true
      t.string :subdomain, null: false
      t.string :custom_domain
      t.string :site_name

      # Theme settings
      t.jsonb :theme_settings, default: {}
      t.string :primary_color, default: '#E53E3E'
      t.string :secondary_color, default: '#ED8936'
      t.string :logo_url
      t.string :hero_image_url
      t.string :favicon_url

      # Publishing
      t.boolean :is_published, default: false
      t.datetime :published_at
      t.boolean :is_active, default: true

      # Analytics
      t.integer :views_count, default: 0
      t.integer :unique_visitors, default: 0

      # SEO
      t.string :meta_title
      t.text :meta_description
      t.string :og_image_url

      t.timestamps

      t.index :subdomain, unique: true
      t.index :custom_domain, unique: true
      t.index :is_published
    end
  end
end
