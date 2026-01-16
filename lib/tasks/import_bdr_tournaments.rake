# frozen_string_literal: true

namespace :tournaments do
  desc "Import tournaments from BDR Join V1 site"
  task import_bdr: :environment do
    puts "=" * 60
    puts "BDR 대회 데이터 임포트 시작"
    puts "=" * 60

    # Find or create organizer (admin user)
    organizer = User.find_by(email: "admin@bdr.com")

    unless organizer
      puts "❌ admin@bdr.com 사용자를 찾을 수 없습니다."
      puts "   먼저 db:seed를 실행하여 관리자 계정을 생성하세요."
      exit 1
    end

    puts "✅ 주최자: #{organizer.email}"

    tournaments_data = [
      {
        name: "2026년 1차 BDR 스타터스리그 - 비등록비선출",
        description: <<~DESC,
          대회 방식: 3팀 2개조 / 조별 1위간 결승전
          경기 시간: 7분 4Q / 1~3쿼터 1분, 4Q 2분 데드
          경기구: 몰텐 BG4500

          참가혜택
          - 전경기 유투브 라이브
          - 경기 MVP 스티즈 스포츠삭스

          ※BDR 스타터스리그는 대회 경험이 전무 혹은 최하위 디비전 대회에 나가서도 승리해본적이 없는 팀,
          BDR D6 대회(뉴비리그)에서 예선 2패 혹은 20~30점차 대패를 당하는 팀,
          성인농구교실 초급반 수준의 진정한 초보 분들에게 대회 경험을 만들어드리기 위한 취지로 진행되는 대회입니다.

          Sponsored By: STIZ, MOLTEN
        DESC
        venue_name: "남양주 스포라운드",
        city: "경기",
        district: "남양주",
        registration_start_at: Time.zone.parse("2026-01-08"),
        registration_end_at: Time.zone.parse("2026-01-22 23:59:59"),
        start_date: Time.zone.parse("2026-02-01"),
        end_date: Time.zone.parse("2026-02-01"),
        max_teams: 6,
        min_teams: 4,
        team_size: 5,
        entry_fee: 320_000,
        format: "group_stage",
        status: "registration_open",
        divisions: ["일반부"],
        division_tiers: ["D7"],
        is_public: true
      },
      {
        name: "2026년 인천 BDR동남 농구대회 고등부",
        description: <<~DESC,
          인천 BDR동남 농구대회 고등부

          상세 요강: https://cafe.daum.net/dongarry/IYXo/23
        DESC
        venue_name: "동남스포피아",
        city: "인천",
        district: "동남",
        registration_start_at: Time.zone.parse("2026-01-06"),
        registration_end_at: Time.zone.parse("2026-01-31 23:59:59"),
        start_date: Time.zone.parse("2026-02-07"),
        end_date: Time.zone.parse("2026-02-07"),
        max_teams: 6,
        min_teams: 4,
        team_size: 5,
        entry_fee: 300_000,
        format: "single_elimination",
        status: "registration_open",
        divisions: ["유소년부"],
        division_tiers: ["i2"],
        is_public: true
      },
      {
        name: "2026 인천BDR 농구대회 40대부",
        description: <<~DESC,
          2026 인천BDR 농구대회 40대부

          상세 요강: https://cafe.daum.net/dongarry/Dnbw/6466
        DESC
        venue_name: "동남스포피아체육관",
        city: "인천",
        district: "동남",
        registration_start_at: Time.zone.parse("2026-01-09"),
        registration_end_at: Time.zone.parse("2026-02-07 23:59:59"),
        start_date: Time.zone.parse("2026-02-14"),
        end_date: Time.zone.parse("2026-02-14"),
        max_teams: 12,
        min_teams: 4,
        team_size: 5,
        entry_fee: 320_000,
        format: "single_elimination",
        status: "registration_open",
        divisions: ["일반부"],
        division_tiers: [],
        is_public: true,
        settings: { age_restriction: "40+" }
      },
      {
        name: "BDR 윈터컵",
        description: <<~DESC,
          대회 방식: 3팀 3개조 / 조별 2위까지 6강 토너먼트
          경기 시간: 7분 4Q / 올데드
          경기구: BG4500

          참가자격
          1. BDR랭킹 D3 해당팀(전국 31위 이상)
          2. 대한농구협회 등록팀 소속 인원
          3. 선출 2명 출전 가능(등록 인원수는 제한없음)

          시상내역
          우승 트로피 / 상금 50만원
          준우승 트로피 / 상금 30만원
          MVP: 트로피 / 부상

          참가혜택
          - 전경기 유투브 라이브
          - 전경기 팀, 개인 세부 스탯 제공
          - 경기 MVP 스티즈 스포츠삭스

          조추첨: 카카오톡 사다리게임으로 진행
          부상선수 발생시 주최측에서 일체 책임지지 않음
          스포츠안전재단(1899-0547)
          기타 문의: BDR 오픈카톡(https://open.kakao.com/o/swzkAzlh)

          Sponsored By: 스티즈, 몰텐
        DESC
        venue_name: "스포라운드",
        city: "경기",
        district: "남양주",
        registration_start_at: Time.zone.parse("2026-01-08"),
        registration_end_at: Time.zone.parse("2026-01-23 23:59:59"),
        start_date: Time.zone.parse("2026-02-21"),
        end_date: Time.zone.parse("2026-02-22"),
        max_teams: 9,
        min_teams: 6,
        team_size: 5,
        entry_fee: 450_000,
        format: "group_stage",
        status: "registration_open",
        divisions: ["일반부"],
        division_tiers: ["D3"],
        is_public: true,
        prize_info: "우승: 트로피 + 50만원\n준우승: 트로피 + 30만원\nMVP: 트로피 + 부상"
      },
      {
        name: "2026년 1차 BDR 뉴비리그 - 비등록비선출",
        description: <<~DESC,
          대회 방식: 3팀 2개조 / 조별 1위간 결승전
          경기구: 몰텐 BG4500

          Sponsored By: 스티즈, 몰텐
        DESC
        venue_name: "스포라운드",
        city: "경기",
        district: "남양주",
        registration_start_at: Time.zone.parse("2026-01-10"),
        registration_end_at: Time.zone.parse("2026-02-18 23:59:59"),
        start_date: Time.zone.parse("2026-02-28"),
        end_date: Time.zone.parse("2026-02-28"),
        max_teams: 6,
        min_teams: 4,
        team_size: 5,
        entry_fee: 320_000,
        format: "group_stage",
        status: "registration_open",
        divisions: ["일반부"],
        division_tiers: ["D6"],
        is_public: true
      }
    ]

    created_count = 0
    skipped_count = 0

    tournaments_data.each do |data|
      # Check if tournament already exists
      if Tournament.exists?(name: data[:name])
        puts "⏭️  스킵: #{data[:name]} (이미 존재)"
        skipped_count += 1
        next
      end

      tournament = Tournament.new(data.merge(organizer: organizer))

      if tournament.save
        puts "✅ 생성: #{tournament.name}"
        created_count += 1
      else
        puts "❌ 실패: #{data[:name]}"
        puts "   에러: #{tournament.errors.full_messages.join(', ')}"
      end
    end

    puts ""
    puts "=" * 60
    puts "임포트 완료!"
    puts "  생성: #{created_count}개"
    puts "  스킵: #{skipped_count}개"
    puts "=" * 60
  end
end
