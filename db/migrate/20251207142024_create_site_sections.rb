# frozen_string_literal: true

class CreateSiteSections < ActiveRecord::Migration[8.0]
  def change
    create_table :site_sections do |t|
      t.references :site_page, null: false, foreign_key: true
      t.string :section_type, null: false
      # Section types:
      # hero, text, schedule, teams, results, gallery, sponsors,
      # youtube, instagram, countdown, cta, faq, contact,
      # series_nav, boxscore, player_card

      t.integer :position, default: 0
      t.boolean :is_visible, default: true

      # Section content and settings stored as JSON
      t.jsonb :content, default: {}
      t.jsonb :settings, default: {}

      # Style overrides
      t.string :background_color
      t.string :text_color
      t.string :padding_top, default: 'normal'    # none, small, normal, large
      t.string :padding_bottom, default: 'normal'

      t.timestamps

      t.index [:site_page_id, :position]
      t.index :section_type
    end
  end
end
