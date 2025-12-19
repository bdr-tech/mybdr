# frozen_string_literal: true

class AddTeamCodeToTeams < ActiveRecord::Migration[8.0]
  def change
    add_column :teams, :team_code, :string
    add_index :teams, :team_code, unique: true

    # Set team_code for existing teams
    reversible do |dir|
      dir.up do
        Team.find_each do |team|
          team.update_column(:team_code, "TEAM-#{SecureRandom.alphanumeric(6).upcase}")
        end
      end
    end
  end
end
