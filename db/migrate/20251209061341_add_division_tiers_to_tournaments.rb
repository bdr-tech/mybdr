class AddDivisionTiersToTournaments < ActiveRecord::Migration[8.0]
  def change
    # 2단계: 조별/리그 선택 (1부, 2부, A조, B조 등)
    add_column :tournaments, :division_tiers, :jsonb, default: [], null: false
  end
end
