class CreateTournamentSeries < ActiveRecord::Migration[8.0]
  def change
    create_table :tournament_series do |t|
      t.string :uuid, null: false
      t.string :name, null: false
      t.string :slug, null: false
      t.text :description
      t.string :logo_url
      t.references :organizer, null: false, foreign_key: { to_table: :users }
      t.string :status, default: "active"
      t.boolean :is_public, default: true
      t.jsonb :settings, default: {}
      t.integer :tournaments_count, default: 0

      t.timestamps
    end

    add_index :tournament_series, :uuid, unique: true
    add_index :tournament_series, :slug, unique: true
    add_index :tournament_series, :status
    add_index :tournament_series, :is_public
  end
end
