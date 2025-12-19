# frozen_string_literal: true

class AddBdrFeaturestoTournaments < ActiveRecord::Migration[8.0]
  def change
    # Division system: stores selected divisions as JSON array
    # Example: ["일반부", "대학부", "여성부"]
    add_column :tournaments, :divisions, :jsonb, default: [], null: false

    # Bank account info for entry fee payment
    add_column :tournaments, :bank_name, :string
    add_column :tournaments, :bank_account, :string
    add_column :tournaments, :bank_holder, :string

    # Add index for divisions to enable faster JSON queries
    add_index :tournaments, :divisions, using: :gin
  end
end
