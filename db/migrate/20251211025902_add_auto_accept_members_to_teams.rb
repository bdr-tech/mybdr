class AddAutoAcceptMembersToTeams < ActiveRecord::Migration[8.0]
  def change
    add_column :teams, :auto_accept_members, :boolean, default: false, null: false
  end
end
