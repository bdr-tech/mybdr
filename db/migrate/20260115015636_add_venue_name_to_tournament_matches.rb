class AddVenueNameToTournamentMatches < ActiveRecord::Migration[8.0]
  def change
    add_column :tournament_matches, :venue_name, :string
  end
end
