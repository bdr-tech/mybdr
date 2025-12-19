# frozen_string_literal: true

namespace :import do
  desc "Parse raw game text and create Game records"
  task :games, [:file_path] => :environment do |_t, args|
    file_path = args[:file_path] || Rails.root.join("tmp/games_raw.txt")

    unless File.exist?(file_path)
      puts "파일을 찾을 수 없습니다: #{file_path}"
      puts "tmp/games_raw.txt 파일에 데이터를 넣어주세요."
      exit
    end

    content = File.read(file_path)
    parser = GameTextParser.new(content)
    games_data = parser.parse_all

    puts "총 #{games_data.length}개의 경기 데이터를 발견했습니다."
    puts "-" * 50

    # 기본 주최자 (없으면 첫 번째 admin)
    default_organizer = User.find_by(is_admin: true) || User.first

    games_data.each_with_index do |data, index|
      puts "\n[#{index + 1}] #{data[:home_team_name]} - #{data[:scheduled_at]}"

      begin
        game = Game.create!(
          organizer: default_organizer,
          title: "#{data[:home_team_name]} #{data[:game_type_label]} 게스트 모집",
          game_type: data[:game_type],
          scheduled_at: data[:scheduled_at],
          ended_at: data[:ended_at],
          duration_hours: data[:duration_hours],
          city: data[:city],
          district: data[:district],
          venue_name: data[:venue_name],
          venue_address: data[:venue_address],
          max_participants: data[:max_participants],
          min_participants: [data[:max_participants], 1].max,
          fee_per_person: data[:fee_per_person],
          skill_level: data[:skill_level] || "all",
          uniform_home_color: data[:uniform_home_color] || "#FFFFFF",
          uniform_away_color: data[:uniform_away_color] || "#000000",
          requirements: data[:requirements],
          notes: data[:notes],
          allow_guests: true,
          status: data[:scheduled_at] > Time.current ? :published : :completed
        )
        puts "  ✅ 생성 완료: #{game.game_id}"
      rescue => e
        puts "  ❌ 오류: #{e.message}"
      end
    end

    puts "\n" + "=" * 50
    puts "Import 완료!"
  end
end

# 텍스트 파싱 클래스
class GameTextParser
  YEAR = Time.current.year  # 현재 연도 사용

  def initialize(raw_text)
    @raw_text = raw_text
  end

  # 여러 경기 데이터 분리 (번호 1.로 시작하는 패턴으로 분리)
  def parse_all
    # "1. HOME" 또는 "1.HOME" 패턴으로 분리
    blocks = @raw_text.split(/(?=1\.\s*HOME\s*팀명)/)
    blocks.reject(&:blank?).map { |block| parse_single(block) }
  end

  def parse_single(text)
    data = {}

    # 1. HOME 팀명
    if text =~ /1\.\s*HOME\s*팀명\s*[:\uff1a]\s*(.+?)(?:\n|2\.)/m
      data[:home_team_name] = $1.strip
    end

    # 2. 일시
    if text =~ /2\.\s*일시\s*[:\uff1a]\s*(.+?)(?:\n|3\.)/m
      datetime_str = $1.strip
      parsed = parse_datetime(datetime_str)
      data[:scheduled_at] = parsed[:start]
      data[:ended_at] = parsed[:end]
      data[:duration_hours] = parsed[:duration]
    end

    # 3. 장소
    if text =~ /3\.\s*장소\s*[:\uff1a]\s*(.+?)(?:\n|4\.)/m
      location = $1.strip
      parsed_location = parse_location(location)
      data.merge!(parsed_location)
    end

    # 4. 운영방식
    if text =~ /4\.\s*운영방식\s*[:\uff1a]\s*(.+?)(?:\n|5\.)/m
      operation = $1.strip
      data[:game_type_label] = extract_game_type_label(operation)
      data[:game_type] = :guest_recruit
      data[:operation_info] = operation
    end

    # 5. 게스트 모집 인원
    if text =~ /5\.\s*게스트\s*모집\s*인원\s*[:\uff1a]\s*(.+?)(?:\n|6\.)/m
      participants_str = $1.strip
      data[:max_participants] = extract_number(participants_str) || 5
    end

    # 6. 게스트 비용
    if text =~ /6\.\s*게스트\s*비용\s*[:\uff1a]\s*(.+?)(?:\n|7\.)/m
      fee_str = $1.strip
      data[:fee_per_person] = parse_fee(fee_str)
    end

    # 7. 연락처
    if text =~ /7\.\s*연락처\s*[:\uff1a]\s*(.+?)(?:\n|8\.)/m
      data[:contact_phone] = normalize_phone($1.strip)
    end

    # 8. 게스트 신청 시 필수 정보
    if text =~ /8\.\s*게스트\s*신청\s*시\s*필수\s*정보\s*[:\uff1a]\s*(.+?)(?:\n|9\.)/m
      data[:requirements] = $1.strip.gsub(/[()]/, "")
    end

    # 9. 기타 참고 사항
    if text =~ /9\.\s*기타\s*참고\s*사항\s*[:\uff1a]?\s*(.+)/m
      notes_raw = $1.strip
      parsed_notes = parse_notes(notes_raw, data)
      data.merge!(parsed_notes)
    end

    # notes 조합
    data[:notes] = build_notes(data)

    data
  end

  private

  # 날짜/시간 파싱
  def parse_datetime(str)
    # "12월 8일(월) 19시 ~ 21시40분" 또는 "12월 8일 18시50분 ~ 20시55분"
    result = { start: nil, end: nil, duration: 2 }

    # 월/일 추출
    if str =~ /(\d{1,2})월\s*(\d{1,2})일/
      month = $1.to_i
      day = $2.to_i

      # 시작 시간
      if str =~ /(\d{1,2})시(\d{1,2})?분?\s*[~\-]/
        start_hour = $1.to_i
        start_min = ($2 || "0").to_i
        result[:start] = Time.zone.local(YEAR, month, day, start_hour, start_min)
      end

      # 종료 시간
      if str =~ /[~\-]\s*(\d{1,2})시(\d{1,2})?분?/
        end_hour = $1.to_i
        end_min = ($2 || "0").to_i
        result[:end] = Time.zone.local(YEAR, month, day, end_hour, end_min)
      end

      # duration 계산
      if result[:start] && result[:end]
        result[:duration] = ((result[:end] - result[:start]) / 3600).round
      end
    end

    result
  end

  # 장소 파싱
  def parse_location(str)
    result = { city: nil, district: nil, venue_name: nil, venue_address: str }

    # 시/도 추출
    if str =~ /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/
      result[:city] = $1
      remaining = str.sub($1, "").strip

      # 구/시/군 추출
      if remaining =~ /^([가-힣]+[시구군])/
        result[:district] = $1
      end
    end

    # 장소명 추출 (학교, 체육관 등)
    if str =~ /([\w가-힣]+(?:학교|체육관|센터|경기장|아레나|관))/
      result[:venue_name] = $1
    else
      result[:venue_name] = str.split.last(2).join(" ")
    end

    result
  end

  # 운영방식에서 타입 라벨 추출
  def extract_game_type_label(str)
    if str.include?("자체전")
      "자체전"
    elsif str.include?("교류전")
      "교류전"
    else
      "게스트전"
    end
  end

  # 숫자 추출
  def extract_number(str)
    if str =~ /(\d+)/
      $1.to_i
    end
  end

  # 비용 파싱
  def parse_fee(str)
    str = str.gsub(/\s/, "")

    if str =~ /(\d+)만\s*원?/ || str =~ /만\s*원/
      amount = $1 ? $1.to_i : 1
      amount * 10000
    elsif str =~ /(\d+)천\s*원?/
      $1.to_i * 1000
    elsif str =~ /(\d+)원/
      $1.to_i
    elsif str =~ /(\d+)/
      num = $1.to_i
      num < 100 ? num * 1000 : num  # 5 -> 5000, 5000 -> 5000
    else
      0
    end
  end

  # 전화번호 정규화
  def normalize_phone(str)
    digits = str.gsub(/\D/, "")
    if digits.length == 11
      "#{digits[0..2]}-#{digits[3..6]}-#{digits[7..10]}"
    elsif digits.length == 10
      "#{digits[0..2]}-#{digits[3..5]}-#{digits[6..9]}"
    else
      str
    end
  end

  # 기타 참고사항 파싱
  def parse_notes(str, data)
    result = {}

    # 유니폼 색상 추출
    if str =~ /유니폼\s*([\w가-힣]+)/
      colors = $1
      if colors.include?("흰") || colors.include?("화이트") || colors.include?("백")
        result[:uniform_home_color] = "#FFFFFF"
      end
      if colors.include?("검") || colors.include?("블랙") || colors.include?("흑")
        result[:uniform_away_color] = "#000000"
      end
    end

    # 시설 정보
    result[:facilities] = []
    result[:facilities] << "주차" if str =~ /주차\s*(가능|O|o|ㅇ|○)/
    result[:facilities] << "샤워" if str =~ /샤워\s*(가능|O|o|ㅇ|○)/
    result[:facilities] << "냉난방" if str =~ /냉난방\s*(가능|O|o|ㅇ|○)/
    result[:facilities] << "정수기" if str =~ /정수기/

    result[:notes_raw] = str
    result
  end

  # 최종 notes 조합
  def build_notes(data)
    lines = []
    lines << "[홈팀] #{data[:home_team_name]}" if data[:home_team_name]
    lines << "[운영] #{data[:operation_info]}" if data[:operation_info]
    lines << "[시설] #{data[:facilities].join(', ')}" if data[:facilities]&.any?
    lines << "[연락처] #{data[:contact_phone]}" if data[:contact_phone]
    lines << "[기타] #{data[:notes_raw]}" if data[:notes_raw]
    lines.join("\n")
  end
end
