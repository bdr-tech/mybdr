# frozen_string_literal: true

class MemoryMarketingService
  # 마일스톤 임계값
  POINTS_MILESTONES = [100, 250, 500, 1000, 2500, 5000, 10000].freeze
  THREE_POINT_MILESTONES = [50, 100, 200, 500, 1000].freeze

  class << self
    # =============================================================================
    # 일일 추억 마케팅 실행 (Cron Job)
    # =============================================================================

    # 매일 실행되는 추억 마케팅 메인 작업
    def run_daily_marketing
      Rails.logger.info("[MemoryMarketing] Starting daily marketing job at #{Time.current}")

      process_anniversaries
      process_season_summaries

      Rails.logger.info("[MemoryMarketing] Daily marketing job completed")
    end

    # =============================================================================
    # N년 전 오늘 처리
    # =============================================================================

    def process_anniversaries
      Rails.logger.info("[MemoryMarketing] Processing anniversaries")

      # 1년 전부터 10년 전까지 검색
      (1..10).each do |years_ago|
        target_date = Date.current - years_ago.years

        # 해당 날짜에 경기한 사용자 찾기
        find_games_on_date(target_date).each do |game|
          game.participating_users.each do |user|
            create_anniversary_notification_and_card(
              user: user,
              game: game,
              years_ago: years_ago
            )
          end
        end
      end
    end

    # =============================================================================
    # 경기 후 마일스톤 체크
    # =============================================================================

    # 경기 결과 저장 후 호출
    def check_milestones_after_game(user:, game:, stats:)
      Rails.logger.info("[MemoryMarketing] Checking milestones for user #{user.id} after game #{game.id}")

      # 더블더블/트리플더블 체크
      check_double_triple(user: user, game: game, stats: stats)

      # 경기 최고 기록 체크
      check_game_high(user: user, game: game, stats: stats)

      # 커리어 하이 체크
      check_career_high(user: user, game: game, stats: stats)

      # 누적 마일스톤 체크
      check_cumulative_milestones(user: user, game: game)
    end

    # =============================================================================
    # 더블더블/트리플더블 체크
    # =============================================================================

    def check_double_triple(user:, game:, stats:)
      double_digit_categories = count_double_digit_categories(stats)

      if double_digit_categories >= 3
        # 트리플더블
        create_milestone(
          user: user,
          game: game,
          milestone_type: "triple_double",
          value: format_triple_double_stats(stats)
        )
      elsif double_digit_categories >= 2
        # 더블더블
        create_milestone(
          user: user,
          game: game,
          milestone_type: "double_double",
          value: format_double_double_stats(stats)
        )
      end
    end

    # =============================================================================
    # 경기 최고 기록 체크
    # =============================================================================

    def check_game_high(user:, game:, stats:)
      # 해당 경기의 모든 선수 스탯 중 최고인지 확인
      game_stats = game.player_game_stats

      categories = [:points, :rebounds, :assists, :steals, :blocks]

      categories.each do |category|
        user_value = stats[category].to_i
        next if user_value <= 0

        max_value = game_stats.maximum(category).to_i

        if user_value == max_value && user_value >= minimum_for_game_high(category)
          create_milestone(
            user: user,
            game: game,
            milestone_type: "game_high",
            value: { category: category, value: user_value }
          )
          break # 하나만 인정
        end
      end
    end

    # =============================================================================
    # 커리어 하이 체크
    # =============================================================================

    def check_career_high(user:, game:, stats:)
      # 사용자의 역대 최고 기록과 비교
      career_highs = user.career_high_stats

      [:points, :rebounds, :assists].each do |category|
        current_value = stats[category].to_i
        career_high = career_highs[category].to_i

        if current_value > career_high && current_value >= minimum_for_career_high(category)
          create_milestone(
            user: user,
            game: game,
            milestone_type: "career_high",
            value: { category: category, value: current_value, previous: career_high }
          )
        end
      end
    end

    # =============================================================================
    # 누적 마일스톤 체크
    # =============================================================================

    def check_cumulative_milestones(user:, game:)
      # 통산 득점 마일스톤
      total_points = user.total_career_points
      crossed_points_milestone = find_crossed_milestone(POINTS_MILESTONES, total_points, user.previous_total_points)

      if crossed_points_milestone
        create_milestone(
          user: user,
          game: game,
          milestone_type: "milestone_points",
          value: crossed_points_milestone
        )
      end

      # 통산 3점슛 마일스톤
      total_3pt = user.total_career_three_pointers
      crossed_3pt_milestone = find_crossed_milestone(THREE_POINT_MILESTONES, total_3pt, user.previous_total_three_pointers)

      if crossed_3pt_milestone
        create_milestone(
          user: user,
          game: game,
          milestone_type: "milestone_3pt",
          value: crossed_3pt_milestone
        )
      end
    end

    # =============================================================================
    # 시즌 서머리 처리
    # =============================================================================

    def process_season_summaries
      # 시즌 종료 시점 (예: 12월)에 실행
      return unless Date.current.month == 12 && Date.current.day == 31

      season = Date.current.year.to_s

      User.with_games_in_season(season).find_each do |user|
        stats = calculate_season_stats(user, season)
        next if stats[:games_played] < 3 # 최소 3경기 이상

        create_season_summary(user: user, season: season, stats: stats)
      end
    end

    # 특정 사용자의 시즌 서머리 생성 (수동 호출용)
    def create_season_summary_for_user(user:, season:)
      stats = calculate_season_stats(user, season)

      return nil if stats[:games_played] < 1

      create_season_summary(user: user, season: season, stats: stats)
    end

    private

    # =============================================================================
    # Helper Methods
    # =============================================================================

    def find_games_on_date(date)
      Game.where(game_date: date.all_day).includes(:tournament)
    end

    def create_anniversary_notification_and_card(user:, game:, years_ago:)
      # 이미 생성된 알림이 있는지 확인
      existing = user.notifications.find_by(
        notification_type: "anniversary",
        notifiable: game,
        "metadata->>'years_ago'" => years_ago.to_s
      )

      return if existing

      # 알림 생성
      NotificationService.notify_anniversary(
        user: user,
        game: game,
        years_ago: years_ago
      )

      # 추억 카드 생성
      MemoryCard.create_anniversary_card!(
        user: user,
        game: game,
        years_ago: years_ago
      )

      Rails.logger.info("[MemoryMarketing] Created anniversary for user #{user.id}, game #{game.id}, #{years_ago} years ago")
    end

    def create_milestone(user:, game:, milestone_type:, value:)
      # 알림 생성
      NotificationService.notify_milestone(
        user: user,
        milestone_type: milestone_type,
        value: value,
        game: game
      )

      # 마일스톤 카드 생성
      MemoryCard.create_milestone_card!(
        user: user,
        milestone_type: milestone_type,
        value: value,
        game: game
      )

      Rails.logger.info("[MemoryMarketing] Created #{milestone_type} milestone for user #{user.id}")
    end

    def create_season_summary(user:, season:, stats:)
      # 알림 생성
      NotificationService.notify_season_summary(
        user: user,
        season: season,
        stats: stats
      )

      # 시즌 서머리 카드 생성
      MemoryCard.create_season_summary_card!(
        user: user,
        season: season,
        stats: stats
      )

      Rails.logger.info("[MemoryMarketing] Created season summary for user #{user.id}, season #{season}")
    end

    def count_double_digit_categories(stats)
      categories = [:points, :rebounds, :assists, :steals, :blocks]
      categories.count { |cat| stats[cat].to_i >= 10 }
    end

    def format_double_double_stats(stats)
      result = []
      result << "#{stats[:points]}득점" if stats[:points].to_i >= 10
      result << "#{stats[:rebounds]}리바운드" if stats[:rebounds].to_i >= 10
      result << "#{stats[:assists]}어시스트" if stats[:assists].to_i >= 10
      result << "#{stats[:steals]}스틸" if stats[:steals].to_i >= 10
      result << "#{stats[:blocks]}블록" if stats[:blocks].to_i >= 10
      result.first(2).join(" ")
    end

    def format_triple_double_stats(stats)
      result = []
      result << "#{stats[:points]}득점" if stats[:points].to_i >= 10
      result << "#{stats[:rebounds]}리바운드" if stats[:rebounds].to_i >= 10
      result << "#{stats[:assists]}어시스트" if stats[:assists].to_i >= 10
      result << "#{stats[:steals]}스틸" if stats[:steals].to_i >= 10
      result << "#{stats[:blocks]}블록" if stats[:blocks].to_i >= 10
      result.first(3).join(" ")
    end

    def find_crossed_milestone(milestones, current_value, previous_value)
      milestones.find { |m| current_value >= m && previous_value < m }
    end

    def minimum_for_game_high(category)
      case category
      when :points then 15
      when :rebounds then 8
      when :assists then 6
      when :steals then 3
      when :blocks then 2
      else 0
      end
    end

    def minimum_for_career_high(category)
      case category
      when :points then 20
      when :rebounds then 10
      when :assists then 8
      else 5
      end
    end

    def calculate_season_stats(user, season)
      year = season.to_i
      start_date = Date.new(year, 1, 1)
      end_date = Date.new(year, 12, 31)

      player_stats = user.player_game_stats
                         .joins(:game)
                         .where(games: { game_date: start_date..end_date })

      games_played = player_stats.count
      return { games_played: 0 } if games_played.zero?

      total_points = player_stats.sum(:points)
      total_rebounds = player_stats.sum(:rebounds)
      total_assists = player_stats.sum(:assists)
      three_pointers_made = player_stats.sum(:three_pointers_made)

      best_game = player_stats.order(points: :desc).first

      {
        games_played: games_played,
        total_points: total_points,
        total_rebounds: total_rebounds,
        total_assists: total_assists,
        avg_points: (total_points.to_f / games_played).round(1),
        avg_rebounds: (total_rebounds.to_f / games_played).round(1),
        avg_assists: (total_assists.to_f / games_played).round(1),
        three_pointers_made: three_pointers_made,
        best_game: {
          game_id: best_game&.game_id,
          points: best_game&.points,
          date: best_game&.game&.game_date
        },
        achievements: collect_season_achievements(user, season, player_stats)
      }
    end

    def collect_season_achievements(user, season, player_stats)
      achievements = []

      # 더블더블 횟수
      double_doubles = player_stats.count do |stat|
        count_double_digit_categories(stat.attributes.symbolize_keys) >= 2
      end
      achievements << "더블더블 #{double_doubles}회" if double_doubles > 0

      # 트리플더블 횟수
      triple_doubles = player_stats.count do |stat|
        count_double_digit_categories(stat.attributes.symbolize_keys) >= 3
      end
      achievements << "트리플더블 #{triple_doubles}회" if triple_doubles > 0

      # 20점 이상 경기
      high_scoring = player_stats.where("points >= 20").count
      achievements << "20점+ 경기 #{high_scoring}회" if high_scoring > 0

      achievements
    end
  end
end
