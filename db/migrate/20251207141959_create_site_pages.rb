# frozen_string_literal: true

class CreateSitePages < ActiveRecord::Migration[8.0]
  def change
    create_table :site_pages do |t|
      t.references :tournament_site, null: false, foreign_key: true
      t.string :title, null: false
      t.string :slug, null: false
      t.string :page_type, null: false, default: 'custom'
      # Page types: home, schedule, teams, results, gallery, notice, registration, custom

      t.integer :position, default: 0
      t.boolean :is_visible, default: true
      t.boolean :show_in_nav, default: true

      # Custom page content (for type: custom)
      t.text :content

      # SEO
      t.string :meta_title
      t.text :meta_description

      t.timestamps

      t.index [:tournament_site_id, :slug], unique: true
      t.index [:tournament_site_id, :position]
      t.index :page_type
    end
  end
end
