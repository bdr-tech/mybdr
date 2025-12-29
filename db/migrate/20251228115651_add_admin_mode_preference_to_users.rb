class AddAdminModePreferenceToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :prefer_admin_mode, :boolean, default: false
  end
end
