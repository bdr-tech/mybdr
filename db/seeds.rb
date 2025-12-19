# frozen_string_literal: true

# =============================================================================
# BDR Platform - Seed Data
# =============================================================================

puts "🏀 Starting BDR seed data creation..."

# =============================================================================
# Test Users (from BDR_SCHEMA_COMPACT.md)
# =============================================================================

test_users = [
  {
    email: "admin@bdr.com",
    password: "admin123",
    name: "관리자",
    nickname: "BDR_Admin",
    membership_type: :super_admin,
    is_admin: true,
    subscription_status: "active",
    subscription_started_at: 1.year.ago,
    subscription_expires_at: 10.years.from_now,
    position: "point_guard",
    height: 180,
    weight: 75,
    city: "서울특별시",
    district: "강남구"
  },
  {
    email: "tournament@bdr.com",
    password: "admin123",
    name: "대회관리자",
    nickname: "TournamentMaster",
    membership_type: :tournament_admin,
    subscription_status: "active",
    subscription_started_at: 1.month.ago,
    subscription_expires_at: 11.months.from_now,
    position: "shooting_guard",
    height: 185,
    weight: 80,
    city: "서울특별시",
    district: "송파구"
  },
  {
    email: "pickup@bdr.com",
    password: "admin123",
    name: "픽업개최자",
    nickname: "PickupKing",
    membership_type: :pickup_host,
    subscription_status: "active",
    subscription_started_at: 1.month.ago,
    subscription_expires_at: 11.months.from_now,
    position: "small_forward",
    height: 190,
    weight: 85,
    city: "부산광역시",
    district: "해운대구",
    bank_name: "카카오뱅크",
    account_number: "3333012345678",
    account_holder: "픽업개최자",
    toss_id: "pickupking"
  },
  {
    email: "pro@bdr.com",
    password: "password123",
    name: "유료회원",
    nickname: "ProBaller",
    membership_type: :pro,
    subscription_status: "active",
    subscription_started_at: 2.weeks.ago,
    subscription_expires_at: 11.months.from_now + 2.weeks,
    position: "power_forward",
    height: 195,
    weight: 90,
    city: "인천광역시",
    district: "남동구"
  },
  {
    email: "user@bdr.com",
    password: "password123",
    name: "일반회원",
    nickname: "FreeBaller",
    membership_type: :free,
    subscription_status: "inactive",
    position: "center",
    height: 200,
    weight: 95,
    city: "대전광역시",
    district: "유성구"
  }
]

test_users.each do |user_data|
  user = User.find_or_initialize_by(email: user_data[:email])

  if user.new_record?
    user.assign_attributes(user_data)
    user.save!
    puts "  ✅ Created #{user_data[:membership_type]} user: #{user_data[:email]}"
  else
    puts "  ⏭️  Skipped (exists): #{user_data[:email]}"
  end
end

# =============================================================================
# Additional Demo Users
# =============================================================================

if Rails.env.development?
  puts "\n📝 Creating additional demo users for development..."

  positions = %w[point_guard shooting_guard small_forward power_forward center]
  cities = ["서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시"]

  10.times do |i|
    email = "demo#{i + 1}@bdr.com"
    user = User.find_or_initialize_by(email: email)

    if user.new_record?
      user.assign_attributes(
        password: "password123",
        name: "데모유저#{i + 1}",
        nickname: "DemoUser#{i + 1}",
        membership_type: [:free, :pro].sample,
        subscription_status: ["active", "inactive"].sample,
        subscription_started_at: rand(1..30).days.ago,
        subscription_expires_at: rand(1..12).months.from_now,
        position: positions.sample,
        height: rand(165..205),
        weight: rand(60..100),
        city: cities.sample,
        district: "테스트구"
      )
      user.save!
      puts "  ✅ Created demo user: #{email}"
    end
  end
end

# =============================================================================
# Courts (경기장)
# =============================================================================

puts "\n🏟️ Creating courts..."

courts_data = [
  {
    name: "잠실종합운동장 농구코트",
    address: "서울 송파구 올림픽로 25",
    city: "서울특별시",
    district: "송파구",
    latitude: 37.5151,
    longitude: 127.0726,
    indoor: false,
    parking_available: true,
    rental_fee: 50000,
    facilities: { shower: true, locker: true, water: true },
    opening_hours: "06:00-22:00"
  },
  {
    name: "강남 스포츠센터",
    address: "서울 강남구 테헤란로 152",
    city: "서울특별시",
    district: "강남구",
    latitude: 37.5006,
    longitude: 127.0366,
    indoor: true,
    parking_available: true,
    rental_fee: 80000,
    facilities: { shower: true, locker: true, water: true, cafe: true },
    opening_hours: "09:00-23:00"
  },
  {
    name: "해운대 비치코트",
    address: "부산 해운대구 해운대해변로 264",
    city: "부산광역시",
    district: "해운대구",
    latitude: 35.1585,
    longitude: 129.1603,
    indoor: false,
    parking_available: true,
    rental_fee: 0,
    facilities: { shower: true, water: true },
    opening_hours: "일출-일몰"
  },
  {
    name: "판교 테크노밸리 체육관",
    address: "경기 성남시 분당구 판교로 255",
    city: "경기도",
    district: "성남시",
    latitude: 37.4020,
    longitude: 127.1083,
    indoor: true,
    parking_available: true,
    rental_fee: 60000,
    facilities: { shower: true, locker: true, water: true },
    opening_hours: "07:00-22:00"
  }
]

courts_data.each do |court_data|
  court = Court.find_or_initialize_by(name: court_data[:name])
  if court.new_record?
    court.assign_attributes(court_data)
    court.save!
    puts "  ✅ Created court: #{court_data[:name]}"
  else
    puts "  ⏭️  Skipped (exists): #{court_data[:name]}"
  end
end

# =============================================================================
# Games (경기)
# =============================================================================

puts "\n🏀 Creating sample games..."

if Rails.env.development?
  pickup_host = User.find_by(email: "pickup@bdr.com")
  tournament_admin = User.find_by(email: "tournament@bdr.com")
  gangnam_court = Court.find_by(name: "강남 스포츠센터")
  jamsil_court = Court.find_by(name: "잠실종합운동장 농구코트")

  games_data = [
    {
      organizer: pickup_host,
      court: gangnam_court,
      title: "강남 픽업게임 - 초급/중급",
      game_type: :pickup,
      city: "서울특별시",
      district: "강남구",
      venue_name: "강남 스포츠센터",
      venue_address: "서울 강남구 테헤란로 152",
      scheduled_at: 3.days.from_now.change(hour: 19, min: 0),
      duration_hours: 2,
      max_participants: 10,
      min_participants: 6,
      fee_per_person: 10000,
      skill_level: "beginner_intermediate",
      status: :published,
      description: "매주 수요일 저녁 픽업게임입니다. 초급~중급 레벨로 진행됩니다.",
      uniform_home_color: "#FFFFFF",
      uniform_away_color: "#000000"
    },
    {
      organizer: pickup_host,
      court: jamsil_court,
      title: "잠실 주말 픽업 - 중상급",
      game_type: :pickup,
      city: "서울특별시",
      district: "송파구",
      venue_name: "잠실종합운동장 농구코트",
      venue_address: "서울 송파구 올림픽로 25",
      scheduled_at: 5.days.from_now.change(hour: 14, min: 0),
      duration_hours: 3,
      max_participants: 15,
      min_participants: 8,
      fee_per_person: 8000,
      skill_level: "intermediate_advanced",
      status: :published,
      description: "주말 오후 야외 픽업게임! 중상급 레벨 추천.",
      is_recurring: true,
      recurrence_rule: "weekly"
    },
    {
      organizer: tournament_admin,
      court: gangnam_court,
      title: "용병 모집 - 3대3 리그",
      game_type: :guest_recruit,
      city: "서울특별시",
      district: "강남구",
      venue_name: "강남 스포츠센터",
      venue_address: "서울 강남구 테헤란로 152",
      scheduled_at: 7.days.from_now.change(hour: 18, min: 30),
      duration_hours: 2,
      max_participants: 3,
      min_participants: 2,
      fee_per_person: 15000,
      skill_level: "advanced",
      status: :published,
      description: "3대3 리그전 용병 모집합니다. 가드/포워드 포지션 우대.",
      requirements: "- 최소 3년 이상 농구 경험\n- 주 1회 이상 농구 가능한 분"
    },
    {
      organizer: pickup_host,
      title: "팀전 - A팀 vs B팀",
      game_type: :team_vs_team,
      city: "서울특별시",
      district: "마포구",
      venue_name: "마포 체육관",
      venue_address: "서울 마포구 월드컵로 240",
      scheduled_at: 10.days.from_now.change(hour: 20, min: 0),
      duration_hours: 2,
      max_participants: 12,
      min_participants: 10,
      fee_per_person: 12000,
      skill_level: "intermediate",
      status: :draft,
      description: "팀 단위 매칭 경기입니다. 5인 팀으로 신청해주세요."
    }
  ]

  games_data.each do |game_data|
    existing_game = Game.find_by(title: game_data[:title])
    if existing_game.nil?
      game = Game.new(game_data)
      game.save!
      puts "  ✅ Created game: #{game_data[:title]}"
    else
      puts "  ⏭️  Skipped (exists): #{game_data[:title]}"
    end
  end

  # Sample Applications
  puts "\n📝 Creating sample game applications..."

  first_game = Game.published.first
  if first_game
    demo_users = User.where("email LIKE ?", "demo%").limit(3)
    demo_users.each do |user|
      application = first_game.game_applications.find_or_initialize_by(user: user)
      if application.new_record?
        application.assign_attributes(
          status: [:pending, :approved].sample,
          message: "참가 신청합니다!",
          position: %w[point_guard shooting_guard small_forward].sample
        )
        application.save!
        puts "  ✅ Created application: #{user.nickname} → #{first_game.title}"
      end
    end
  end
end

# =============================================================================
# Tournament System Data
# =============================================================================

puts "\n🏆 Creating tournament data..."

if Rails.env.development?
  tournament_admin = User.find_by(email: "tournament@bdr.com")
  gangnam_court = Court.find_by(name: "강남 스포츠센터")
  jamsil_court = Court.find_by(name: "잠실종합운동장 농구코트")

  # Tournament Series
  bdr_cup = TournamentSeries.find_or_create_by!(name: "BDR 챔피언십") do |series|
    series.organizer = tournament_admin
    series.description = "BDR 공식 농구 챔피언십 시리즈입니다. 매년 시즌별로 진행됩니다."
    series.logo_url = nil
  end
  puts "  ✅ Created series: #{bdr_cup.name}"

  weekend_league = TournamentSeries.find_or_create_by!(name: "주말 농구 리그") do |series|
    series.organizer = tournament_admin
    series.description = "직장인을 위한 주말 농구 리그입니다."
  end
  puts "  ✅ Created series: #{weekend_league.name}"

  # Teams (for tournaments)
  teams_data = [
    { name: "서울 버커스", city: "서울특별시", district: "강남구", description: "서울 강남 기반 농구팀" },
    { name: "부산 웨이브", city: "부산광역시", district: "해운대구", description: "부산 대표 농구팀" },
    { name: "인천 나이츠", city: "인천광역시", district: "남동구", description: "인천 기반 강팀" },
    { name: "대전 썬더스", city: "대전광역시", district: "유성구", description: "대전 No.1 농구팀" },
    { name: "광주 피닉스", city: "광주광역시", district: "서구", description: "광주 최강 농구팀" },
    { name: "대구 파이어즈", city: "대구광역시", district: "수성구", description: "대구 대표팀" },
    { name: "수원 호크스", city: "경기도", district: "수원시", description: "경기 남부 대표팀" },
    { name: "성남 유나이티드", city: "경기도", district: "성남시", description: "판교 IT 기업 연합팀" }
  ]

  created_teams = []
  teams_data.each do |team_data|
    captain = User.where("email LIKE ?", "demo%").sample || tournament_admin
    team = Team.find_or_create_by!(name: team_data[:name]) do |t|
      t.captain = captain
      t.city = team_data[:city]
      t.district = team_data[:district]
      t.description = team_data[:description]
      t.founded_year = Date.current.year - rand(1..5)
    end
    created_teams << team
    puts "  ✅ Created team: #{team.name}"
  end

  # Add members to teams
  demo_users = User.where("email LIKE ?", "demo%").to_a + [
    User.find_by(email: "pro@bdr.com"),
    User.find_by(email: "user@bdr.com")
  ].compact

  created_teams.each_with_index do |team, idx|
    # Add 5 members per team
    5.times do |i|
      user = demo_users[(idx * 5 + i) % demo_users.size]
      next unless user

      member = TeamMember.find_or_initialize_by(team: team, user: user)
      if member.new_record?
        # Generate unique jersey number for this team
        used_numbers = team.team_members.pluck(:jersey_number).compact
        jersey = (i + 1) * 10
        jersey += 1 while used_numbers.include?(jersey)

        member.assign_attributes(
          jersey_number: jersey,
          role: i == 0 ? :captain : :member,
          position: %w[point_guard shooting_guard small_forward power_forward center][i % 5],
          joined_at: rand(1..365).days.ago,
          status: :active
        )
        member.save!
      end
    end
  end

  # Tournament (BDR 챔피언십 1회)
  tournament1 = Tournament.find_or_create_by!(name: "BDR 챔피언십 1회") do |t|
    t.series = bdr_cup
    t.organizer = tournament_admin
    t.edition_number = 1
    t.status = :completed
    t.format = :single_elimination
    t.start_date = 2.months.ago
    t.end_date = 1.month.ago
    t.registration_start_at = 3.months.ago
    t.registration_end_at = 2.months.ago - 1.week
    t.max_teams = 8
    t.min_teams = 4
    t.team_size = 5
    t.roster_min = 5
    t.roster_max = 12
    t.entry_fee = 100000
    t.prize_info = "우승: 상금 100만원 + 트로피\n준우승: 상금 50만원"
    t.rules = "5대5 풀코트 경기\n쿼터당 10분\n연장전 3분"
    t.venue = gangnam_court
    t.venue_name = "강남 스포츠센터"
    t.venue_address = "서울 강남구 테헤란로 152"
    t.city = "서울특별시"
    t.district = "강남구"
    t.champion_team = created_teams.first
    t.description = "BDR 플랫폼 첫 공식 챔피언십 대회"
    t.is_public = true
  end
  puts "  ✅ Created tournament: #{tournament1.name}"

  # Register 8 teams
  created_teams.first(8).each_with_index do |team, idx|
    tt = TournamentTeam.find_or_create_by!(tournament: tournament1, team: team) do |t|
      t.status = :approved
      t.seed_number = idx + 1
      t.payment_status = :paid
      t.approved_at = 2.months.ago - 3.days
      t.paid_at = 2.months.ago - 5.days
      t.wins = rand(0..3)
      t.losses = rand(0..3)
      t.points_for = rand(200..400)
      t.points_against = rand(200..400)
    end
  end

  # Tournament (BDR 챔피언십 2회 - 진행중)
  tournament2 = Tournament.find_or_create_by!(name: "BDR 챔피언십 2회") do |t|
    t.series = bdr_cup
    t.organizer = tournament_admin
    t.edition_number = 2
    t.status = :in_progress
    t.format = :single_elimination
    t.start_date = 1.week.ago
    t.end_date = 3.weeks.from_now
    t.registration_start_at = 1.month.ago
    t.registration_end_at = 2.weeks.ago
    t.max_teams = 8
    t.min_teams = 4
    t.team_size = 5
    t.roster_min = 5
    t.roster_max = 12
    t.entry_fee = 120000
    t.prize_info = "우승: 상금 150만원 + 트로피\n준우승: 상금 70만원\n3위: 상금 30만원"
    t.rules = "5대5 풀코트 경기\n쿼터당 10분\n연장전 3분"
    t.venue = jamsil_court
    t.venue_name = "잠실종합운동장 농구코트"
    t.city = "서울특별시"
    t.district = "송파구"
    t.description = "BDR 챔피언십 시즌 2! 더 치열한 경쟁이 펼쳐집니다."
    t.is_public = true
  end
  puts "  ✅ Created tournament: #{tournament2.name}"

  # Register teams for tournament2
  created_teams.first(8).each_with_index do |team, idx|
    TournamentTeam.find_or_create_by!(tournament: tournament2, team: team) do |t|
      t.status = :approved
      t.seed_number = idx + 1
      t.payment_status = :paid
      t.approved_at = 2.weeks.ago - 3.days
      t.paid_at = 2.weeks.ago - 5.days
    end
  end

  # Create matches for tournament2
  t2_teams = tournament2.tournament_teams.by_seed.to_a

  # Quarter finals (4 matches)
  qf_matches = []
  [[0, 7], [3, 4], [2, 5], [1, 6]].each_with_index do |pair, idx|
    match = TournamentMatch.find_or_create_by!(
      tournament: tournament2,
      round_number: 1,
      match_number: idx + 1
    ) do |m|
      m.home_team = t2_teams[pair[0]]
      m.away_team = t2_teams[pair[1]]
      m.round_name = "8강"
      m.scheduled_at = 5.days.ago + (idx * 2).hours
      m.status = :completed
      m.started_at = 5.days.ago + (idx * 2).hours
      m.ended_at = 5.days.ago + (idx * 2 + 2).hours
      m.home_score = rand(60..90)
      m.away_score = rand(55..85)
      m.winner_team = m.home_score > m.away_score ? m.home_team : m.away_team
      m.quarter_scores = {
        "home" => { "1" => rand(15..25), "2" => rand(15..25), "3" => rand(15..25), "4" => rand(15..25) },
        "away" => { "1" => rand(12..22), "2" => rand(12..22), "3" => rand(12..22), "4" => rand(12..22) }
      }
    end
    qf_matches << match
    puts "    ✅ Created match: 8강 #{idx + 1} - #{match.matchup_display}"
  end

  # Semi finals (2 matches)
  sf_matches = []
  2.times do |idx|
    match = TournamentMatch.find_or_create_by!(
      tournament: tournament2,
      round_number: 2,
      match_number: idx + 1
    ) do |m|
      m.home_team = qf_matches[idx * 2].winner_team
      m.away_team = qf_matches[idx * 2 + 1].winner_team
      m.round_name = "준결승"
      m.scheduled_at = 2.days.ago + (idx * 3).hours
      m.status = :completed
      m.started_at = 2.days.ago + (idx * 3).hours
      m.ended_at = 2.days.ago + (idx * 3 + 2).hours
      m.home_score = rand(70..95)
      m.away_score = rand(65..90)
      m.winner_team = m.home_score > m.away_score ? m.home_team : m.away_team
      m.quarter_scores = {
        "home" => { "1" => rand(18..28), "2" => rand(18..28), "3" => rand(18..28), "4" => rand(18..28) },
        "away" => { "1" => rand(15..25), "2" => rand(15..25), "3" => rand(15..25), "4" => rand(15..25) }
      }
    end
    sf_matches << match
    puts "    ✅ Created match: 준결승 #{idx + 1} - #{match.matchup_display}"
  end

  # Final (scheduled)
  final_match = TournamentMatch.find_or_create_by!(
    tournament: tournament2,
    round_number: 3,
    match_number: 1
  ) do |m|
    m.home_team = sf_matches[0].winner_team
    m.away_team = sf_matches[1].winner_team
    m.round_name = "결승"
    m.scheduled_at = 1.week.from_now
    m.status = :scheduled
    m.quarter_scores = { "home" => {}, "away" => {} }
  end
  puts "    ✅ Created match: 결승 - #{final_match.matchup_display}"

  # Upcoming tournament (registration open)
  tournament3 = Tournament.find_or_create_by!(name: "주말 리그 2024 시즌1") do |t|
    t.series = weekend_league
    t.organizer = tournament_admin
    t.edition_number = 1
    t.status = :registration_open
    t.format = :round_robin
    t.start_date = 1.month.from_now
    t.end_date = 3.months.from_now
    t.registration_start_at = 1.week.ago
    t.registration_end_at = 3.weeks.from_now
    t.max_teams = 6
    t.min_teams = 4
    t.team_size = 5
    t.roster_min = 5
    t.roster_max = 10
    t.entry_fee = 80000
    t.prize_info = "우승팀에게 다음 시즌 참가비 면제!"
    t.rules = "5대5 풀코트 경기\n매 주말 1경기씩 진행\n총 5라운드 리그전"
    t.venue_name = "강남 스포츠센터"
    t.city = "서울특별시"
    t.district = "강남구"
    t.description = "직장인을 위한 주말 농구 리그! 편하게 참가하세요."
    t.is_public = true
  end
  puts "  ✅ Created tournament: #{tournament3.name}"

  # Register some teams
  created_teams.first(3).each_with_index do |team, idx|
    TournamentTeam.find_or_create_by!(tournament: tournament3, team: team) do |t|
      t.status = :approved
      t.seed_number = idx + 1
      t.payment_status = :paid
    end
  end
end

# =============================================================================
# Site Templates (THE PROCESS, Classic, Minimal styles)
# =============================================================================

puts "\n🎨 Creating site templates..."

site_templates_data = [
  {
    name: "THE PROCESS",
    description: "트러스트 더 프로세스! 76ers 스타일의 대담하고 현대적인 디자인. 강렬한 색상과 역동적인 레이아웃.",
    category: "general",
    is_premium: true,
    preview_url: "/templates/the-process/preview.png",
    default_theme: {
      colors: {
        primary: "#006BB6",
        secondary: "#ED174C",
        accent: "#FFFFFF",
        background: "#0a0a0a",
        text: "#FFFFFF"
      },
      fonts: {
        heading: "Oswald, sans-serif",
        body: "Roboto, sans-serif"
      },
      layout: {
        header_style: "fixed_transparent",
        hero_style: "full_screen_video",
        navigation_style: "hamburger_menu"
      },
      features: ["dark_mode", "animations", "video_backgrounds", "live_scores"]
    },
    default_pages: [
      { slug: "home", title: "홈", page_type: "home", position: 1 },
      { slug: "bracket", title: "대진표", page_type: "bracket", position: 2 },
      { slug: "teams", title: "참가팀", page_type: "teams", position: 3 },
      { slug: "schedule", title: "일정", page_type: "schedule", position: 4 }
    ]
  },
  {
    name: "Classic Tournament",
    description: "전통적이고 신뢰감 있는 대회 웹사이트 디자인. 깔끔한 정보 전달과 쉬운 네비게이션.",
    category: "general",
    is_premium: false,
    preview_url: "/templates/classic/preview.png",
    default_theme: {
      colors: {
        primary: "#1a365d",
        secondary: "#e53e3e",
        accent: "#f6ad55",
        background: "#ffffff",
        text: "#1a202c"
      },
      fonts: {
        heading: "Georgia, serif",
        body: "Open Sans, sans-serif"
      },
      layout: {
        header_style: "sticky_solid",
        hero_style: "banner_image",
        navigation_style: "horizontal_menu"
      },
      features: ["print_friendly", "accessibility"]
    },
    default_pages: [
      { slug: "home", title: "홈", page_type: "home", position: 1 },
      { slug: "info", title: "대회안내", page_type: "info", position: 2 },
      { slug: "bracket", title: "대진표", page_type: "bracket", position: 3 },
      { slug: "teams", title: "팀목록", page_type: "teams", position: 4 },
      { slug: "rules", title: "규정", page_type: "rules", position: 5 }
    ]
  },
  {
    name: "Minimal White",
    description: "미니멀리즘의 정수. 깔끔한 화이트 배경에 콘텐츠 중심의 심플한 디자인.",
    category: "community",
    is_premium: false,
    preview_url: "/templates/minimal/preview.png",
    default_theme: {
      colors: {
        primary: "#000000",
        secondary: "#333333",
        accent: "#0066ff",
        background: "#ffffff",
        text: "#111111"
      },
      fonts: {
        heading: "Inter, sans-serif",
        body: "Inter, sans-serif"
      },
      layout: {
        header_style: "minimal_centered",
        hero_style: "text_only",
        navigation_style: "text_links"
      },
      features: ["fast_loading", "mobile_first", "seo_optimized"]
    },
    default_pages: [
      { slug: "home", title: "홈", page_type: "home", position: 1 },
      { slug: "bracket", title: "대진표", page_type: "bracket", position: 2 },
      { slug: "teams", title: "팀", page_type: "teams", position: 3 }
    ]
  },
  {
    name: "Street Ball",
    description: "스트릿 농구 감성! 그래피티 스타일과 도시적 감각의 역동적 디자인.",
    category: "community",
    is_premium: true,
    preview_url: "/templates/street/preview.png",
    default_theme: {
      colors: {
        primary: "#ff6b00",
        secondary: "#00d4ff",
        accent: "#ffff00",
        background: "#1a1a1a",
        text: "#ffffff"
      },
      fonts: {
        heading: "Bebas Neue, sans-serif",
        body: "Montserrat, sans-serif"
      },
      layout: {
        header_style: "transparent_overlay",
        hero_style: "split_content",
        navigation_style: "side_drawer"
      },
      features: ["dark_mode", "animations", "music_integration", "social_feed"]
    },
    default_pages: [
      { slug: "home", title: "메인", page_type: "home", position: 1 },
      { slug: "crews", title: "크루", page_type: "teams", position: 2 },
      { slug: "bracket", title: "대진", page_type: "bracket", position: 3 },
      { slug: "gallery", title: "갤러리", page_type: "gallery", position: 4 }
    ]
  },
  {
    name: "Corporate League",
    description: "기업 대회 및 사내 리그를 위한 프로페셔널 디자인. 브랜딩 커스터마이징 용이.",
    category: "corporate",
    is_premium: true,
    preview_url: "/templates/corporate/preview.png",
    default_theme: {
      colors: {
        primary: "#2c5282",
        secondary: "#4a5568",
        accent: "#38a169",
        background: "#f7fafc",
        text: "#1a202c"
      },
      fonts: {
        heading: "Poppins, sans-serif",
        body: "Source Sans Pro, sans-serif"
      },
      layout: {
        header_style: "corporate_branded",
        hero_style: "brand_banner",
        navigation_style: "mega_menu"
      },
      features: ["custom_branding", "detailed_stats", "export_reports"]
    },
    default_pages: [
      { slug: "home", title: "홈", page_type: "home", position: 1 },
      { slug: "about", title: "대회소개", page_type: "info", position: 2 },
      { slug: "standings", title: "순위표", page_type: "standings", position: 3 },
      { slug: "schedule", title: "일정", page_type: "schedule", position: 4 },
      { slug: "teams", title: "참가팀", page_type: "teams", position: 5 },
      { slug: "sponsors", title: "협찬사", page_type: "sponsors", position: 6 }
    ]
  }
]

site_templates_data.each do |template_data|
  template = SiteTemplate.find_or_initialize_by(name: template_data[:name])
  if template.new_record?
    template.assign_attributes(
      description: template_data[:description],
      category: template_data[:category],
      is_premium: template_data[:is_premium],
      preview_url: template_data[:preview_url],
      default_theme: template_data[:default_theme],
      default_pages: template_data[:default_pages],
      is_active: true
    )
    template.save!
    puts "  ✅ Created template: #{template_data[:name]} (#{template_data[:category]})"
  else
    puts "  ⏭️  Skipped (exists): #{template_data[:name]}"
  end
end

# =============================================================================
# Sample Suggestions (건의사항)
# =============================================================================

puts "\n💬 Creating sample suggestions..."

if Rails.env.development?
  free_user = User.find_by(email: "user@bdr.com")
  pro_user = User.find_by(email: "pro@bdr.com")

  suggestions_data = [
    {
      user: free_user,
      title: "모바일 앱 출시 요청",
      content: "웹사이트도 좋지만 모바일 앱이 있으면 더 편할 것 같습니다. iOS와 Android 앱 출시 계획이 있으신가요?",
      category: "feature_request",
      priority: 2,
      status: "in_progress"
    },
    {
      user: pro_user,
      title: "대회 검색 필터 개선",
      content: "대회 검색 시 지역, 날짜, 참가비 범위로 필터링할 수 있으면 좋겠습니다.",
      category: "improvement",
      priority: 1,
      status: "pending"
    },
    {
      user: free_user,
      title: "결제 오류 신고",
      content: "결제 시도 중 503 에러가 발생했습니다. 확인 부탁드립니다.",
      category: "bug_report",
      priority: 3,
      status: "resolved",
      admin_response: "해당 이슈는 결제 게이트웨이 일시적 장애로 인한 것이었습니다. 현재 정상화되었습니다."
    }
  ]

  suggestions_data.each do |suggestion_data|
    suggestion = Suggestion.find_or_initialize_by(
      user: suggestion_data[:user],
      title: suggestion_data[:title]
    )
    if suggestion.new_record?
      suggestion.assign_attributes(suggestion_data)
      suggestion.save!
      puts "  ✅ Created suggestion: #{suggestion_data[:title]}"
    else
      puts "  ⏭️  Skipped (exists): #{suggestion_data[:title]}"
    end
  end
end

# =============================================================================
# Content Presets (대회 사이트 콘텐츠 프리셋)
# =============================================================================

puts "\n📝 Creating content presets..."

content_presets_data = [
  {
    name: "대회 규정",
    slug: "tournament-rules",
    description: "대회 진행 방식 및 기본 규정",
    category: "rules",
    target_section_type: "text",
    target_page_types: ["notice", "home"],
    is_featured: true,
    position: 0,
    content: {
      "title" => "대회 규정",
      "body" => <<~MARKDOWN
## 1. 경기 방식
- 5대5 풀코트 경기
- 쿼터당 10분 (러닝타임)
- 하프타임 5분

## 2. 승부 결정
- 정규 시간 종료 후 동점일 경우 3분 연장전 진행
- 연장전에서도 동점일 경우 승부차기(3점슛 대결)

## 3. 파울 규정
- 개인 파울 5개 퇴장
- 팀 파울 5개부터 자유투 2개

## 4. 기타
- 운동화 착용 필수 (농구화 권장)
- 심판 판정에 이의 제기 시 테크니컬 파울
      MARKDOWN
    }
  },
  {
    name: "경기 방식",
    slug: "game-format",
    description: "토너먼트 진행 형식 설명",
    category: "rules",
    target_section_type: "text",
    target_page_types: ["notice"],
    position: 1,
    content: {
      "title" => "경기 방식",
      "body" => <<~MARKDOWN
## 예선 라운드
- 조별 리그 방식 (4팀씩 2개조)
- 각 조 상위 2팀 본선 진출

## 본선 토너먼트
- 단판 승부 토너먼트
- 8강 → 4강 → 결승

## 시드 배정
- 예선 순위에 따른 시드 배정
- 같은 조 팀은 결승까지 만나지 않음
      MARKDOWN
    }
  },
  {
    name: "참가 자격",
    slug: "participation-eligibility",
    description: "대회 참가 조건 및 자격 요건",
    category: "info",
    target_section_type: "text",
    target_page_types: ["notice", "registration"],
    is_featured: true,
    position: 0,
    content: {
      "title" => "참가 자격",
      "body" => <<~MARKDOWN
## 참가 조건

### 팀 구성
- 최소 5인 ~ 최대 12인
- 팀 대표자 1인 필수 지정

### 참가 자격
- 만 18세 이상 성인
- 대한농구협회 등록 선수 참가 불가
- 타 대회 동시 출전 제한 없음

### 필수 서류
- 팀 등록서 (대표자 연락처 포함)
- 선수 명단 (등번호, 포지션 기재)
- 참가비 입금 확인증
      MARKDOWN
    }
  },
  {
    name: "일정 안내",
    slug: "schedule-info",
    description: "대회 일정 및 시간표",
    category: "schedule",
    target_section_type: "text",
    target_page_types: ["notice", "schedule"],
    position: 0,
    content: {
      "title" => "대회 일정",
      "body" => <<~MARKDOWN
## 주요 일정

| 일정 | 날짜 | 비고 |
|------|------|------|
| 참가 신청 | 12/1 ~ 12/15 | 선착순 마감 |
| 참가비 납부 | 신청 후 3일 이내 | 미납 시 자동 취소 |
| 조 추첨 | 12/18 | 온라인 생중계 |
| 예선 라운드 | 12/21 ~ 12/22 | 1일 2경기 |
| 본선 토너먼트 | 12/28 | 당일 결승 |

## 경기 시간
- 오전 조: 10:00 ~ 12:00
- 오후 조: 14:00 ~ 18:00
- 저녁 조: 19:00 ~ 21:00
      MARKDOWN
    }
  },
  {
    name: "상금 안내",
    slug: "prize-info",
    description: "시상 내역 및 상금 정보",
    category: "prize",
    target_section_type: "text",
    target_page_types: ["notice", "home"],
    is_featured: true,
    position: 0,
    content: {
      "title" => "시상 내역",
      "body" => <<~MARKDOWN
## 상금

| 순위 | 상금 | 부상 |
|------|------|------|
| 우승 | 100만원 | 트로피 + 메달 |
| 준우승 | 50만원 | 트로피 |
| 3위 | 30만원 | - |
| 4위 | 20만원 | - |

## 개인상
- **MVP**: 상금 10만원 + 트로피
- **득점왕**: 기념품
- **어시스트왕**: 기념품
      MARKDOWN
    }
  },
  {
    name: "참가 신청 안내",
    slug: "registration-guide",
    description: "참가 신청 절차 및 방법",
    category: "registration",
    target_section_type: "text",
    target_page_types: ["registration", "notice"],
    is_featured: true,
    position: 0,
    content: {
      "title" => "참가 신청 방법",
      "body" => <<~MARKDOWN
## 신청 절차

### 1단계: 팀 등록
BDR 플랫폼에서 팀을 먼저 등록해주세요.

### 2단계: 대회 신청
대회 페이지에서 '참가 신청' 버튼을 클릭하세요.

### 3단계: 참가비 납부
- 계좌: 카카오뱅크 3333-XX-XXXXXX (홍길동)
- 참가비: 100,000원
- 입금자명: 팀명으로 입금

### 4단계: 선수 명단 제출
대회 시작 3일 전까지 선수 명단을 확정해주세요.
      MARKDOWN
    }
  },
  {
    name: "자주 묻는 질문",
    slug: "faq-general",
    description: "대회 관련 자주 묻는 질문",
    category: "faq",
    target_section_type: "text",
    target_page_types: ["notice"],
    position: 0,
    content: {
      "title" => "자주 묻는 질문 (FAQ)",
      "body" => <<~MARKDOWN
### Q. 참가비 환불이 가능한가요?
대회 시작 7일 전까지 100% 환불 가능합니다. 이후에는 50%만 환불됩니다.

### Q. 용병 영입이 가능한가요?
아니요, 등록된 선수만 출전 가능합니다. 대회 시작 3일 전까지 선수 추가가 가능합니다.

### Q. 유니폼은 어떻게 준비하나요?
홈/어웨이 구분을 위해 2가지 색상의 상의를 준비해주세요. 조끼 대여 가능합니다.

### Q. 주차는 가능한가요?
대회장 주변 유료 주차장 이용 가능합니다. 대중교통 이용을 권장합니다.
      MARKDOWN
    }
  },
  {
    name: "문의처 안내",
    slug: "contact-info",
    description: "대회 문의 연락처",
    category: "contact",
    target_section_type: "text",
    target_page_types: ["notice"],
    position: 0,
    content: {
      "title" => "문의처",
      "body" => <<~MARKDOWN
## 대회 운영 문의

- **전화**: 010-1234-5678
- **이메일**: contact@mybdr.kr
- **카카오톡**: @BDR농구

## 운영 시간
- 평일: 10:00 ~ 18:00
- 주말/공휴일: 휴무

※ 대회 당일에는 현장 운영진에게 문의해주세요.
      MARKDOWN
    }
  }
]

content_presets_data.each do |preset_data|
  preset = ContentPreset.find_or_initialize_by(slug: preset_data[:slug])
  if preset.new_record?
    preset.assign_attributes(preset_data)
    preset.save!
    puts "  ✅ Created preset: #{preset_data[:name]} (#{preset_data[:category]})"
  else
    puts "  ⏭️  Skipped (exists): #{preset_data[:name]}"
  end
end

puts "\n🎉 Seed data creation completed!"
puts "=" * 50
puts "Test accounts:"
puts "  - Super Admin: admin@bdr.com / admin123"
puts "  - Tournament Admin: tournament@bdr.com / admin123"
puts "  - Pickup Host: pickup@bdr.com / admin123"
puts "  - Pro User: pro@bdr.com / password123"
puts "  - Free User: user@bdr.com / password123"
puts "=" * 50
puts "\nSite Templates: #{SiteTemplate.count} templates available"
puts "Content Presets: #{ContentPreset.count} presets available"
puts "System Settings: #{SystemSetting.count} settings configured"
puts "=" * 50
