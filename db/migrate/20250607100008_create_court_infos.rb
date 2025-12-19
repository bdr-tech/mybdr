# frozen_string_literal: true

class CreateCourtInfos < ActiveRecord::Migration[8.0]
  def change
    create_table :court_infos do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.string :address, null: false
      t.string :city, null: false
      t.string :district
      t.decimal :latitude, precision: 10, scale: 7, null: false
      t.decimal :longitude, precision: 10, scale: 7, null: false
      t.string :court_type, null: false, default: "outdoor"
      t.integer :hoops_count, default: 2
      t.string :surface_type
      t.boolean :is_free, default: true, null: false
      t.decimal :fee, precision: 10, scale: 0
      t.jsonb :operating_hours, default: {}
      t.jsonb :facilities, default: []
      t.string :status, null: false, default: "active"
      t.integer :reviews_count, default: 0, null: false
      t.decimal :average_rating, precision: 3, scale: 2, default: 0.0
      t.integer :checkins_count, default: 0, null: false
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :court_infos, [:latitude, :longitude]
    add_index :court_infos, :city
    add_index :court_infos, [:city, :district]
    add_index :court_infos, :court_type
    add_index :court_infos, :status
    add_index :court_infos, :is_free
    add_index :court_infos, :average_rating
  end
end
