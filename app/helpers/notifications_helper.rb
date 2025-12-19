# frozen_string_literal: true

module NotificationsHelper
  # 알림 유형별 배경색 클래스
  def notification_icon_bg_class(notification)
    case notification.notification_type
    when *Notification::TEAM_NOTIFICATIONS
      "bg-blue-100"
    when *Notification::GAME_NOTIFICATIONS
      "bg-green-100"
    when *Notification::PAYMENT_NOTIFICATIONS
      "bg-yellow-100"
    when *Notification::TOURNAMENT_NOTIFICATIONS
      "bg-purple-100"
    when *Notification::MARKETPLACE_NOTIFICATIONS
      "bg-orange-100"
    when *Notification::MEMORY_NOTIFICATIONS
      "bg-pink-100"
    when *Notification::SYSTEM_NOTIFICATIONS
      "bg-gray-100"
    else
      "bg-gray-100"
    end
  end

  # 알림 유형별 뱃지 클래스
  def notification_badge_class(notification)
    case notification.notification_type
    when *Notification::TEAM_NOTIFICATIONS
      "bg-blue-100 text-blue-800"
    when *Notification::GAME_NOTIFICATIONS
      "bg-green-100 text-green-800"
    when *Notification::PAYMENT_NOTIFICATIONS
      "bg-yellow-100 text-yellow-800"
    when *Notification::TOURNAMENT_NOTIFICATIONS
      "bg-purple-100 text-purple-800"
    when *Notification::MARKETPLACE_NOTIFICATIONS
      "bg-orange-100 text-orange-800"
    when *Notification::MEMORY_NOTIFICATIONS
      "bg-pink-100 text-pink-800"
    when *Notification::SYSTEM_NOTIFICATIONS
      "bg-gray-100 text-gray-800"
    else
      "bg-gray-100 text-gray-800"
    end
  end

  # 알림 아이콘 렌더링
  def render_notification_icon(notification, size: "normal")
    icon_class = case size
                 when "small" then "w-4 h-4"
                 when "large" then "w-6 h-6"
                 else "w-5 h-5"
                 end

    color_class = case notification.notification_type
                  when *Notification::TEAM_NOTIFICATIONS then "text-blue-600"
                  when *Notification::GAME_NOTIFICATIONS then "text-green-600"
                  when *Notification::PAYMENT_NOTIFICATIONS then "text-yellow-600"
                  when *Notification::TOURNAMENT_NOTIFICATIONS then "text-purple-600"
                  when *Notification::MARKETPLACE_NOTIFICATIONS then "text-orange-600"
                  when *Notification::MEMORY_NOTIFICATIONS then "text-pink-600"
                  when *Notification::SYSTEM_NOTIFICATIONS then "text-gray-600"
                  else "text-gray-600"
                  end

    icon_svg = case notification.icon_name
               when "users"
                 '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />'
               when "credit-card"
                 '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />'
               when "shopping-bag"
                 '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />'
               when "calendar"
                 '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />'
               when "trophy"
                 '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />'
               when "star"
                 '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />'
               else
                 '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />'
               end

    content_tag(:svg, icon_svg.html_safe, class: "#{icon_class} #{color_class}", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24")
  end

  # 메타데이터 키 라벨
  def notification_metadata_label(key)
    {
      "applicant_name" => "신청자",
      "applicant_id" => "신청자 ID",
      "game_title" => "경기",
      "game_date" => "경기 일시",
      "reason" => "사유",
      "requester_name" => "요청자",
      "requester_id" => "요청자 ID",
      "item_title" => "상품",
      "phone" => "연락처",
      "old_price" => "기존 가격",
      "new_price" => "변경 가격",
      "discount_percent" => "할인율",
      "years_ago" => "N년 전",
      "milestone_type" => "마일스톤",
      "value" => "값",
      "hours_before" => "알림 시간",
      "season" => "시즌",
      "games_played" => "참여 경기",
      "total_points" => "총 득점",
      "avg_points" => "평균 득점"
    }[key.to_s] || key.to_s.humanize
  end

  # 액션 버튼 라벨
  def action_button_label(notification)
    case notification.action_type
    when "review"
      "검토하기"
    when "view"
      "확인하기"
    when "contact"
      "연락처 확인"
    when "memory_card"
      "추억 카드 보기"
    else
      "바로가기"
    end
  end
end
