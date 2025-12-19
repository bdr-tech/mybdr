# frozen_string_literal: true

class RenameTournamentAdminToTournamentAdminMember < ActiveRecord::Migration[8.0]
  def change
    rename_table :tournament_admins, :tournament_admin_members
  end
end
