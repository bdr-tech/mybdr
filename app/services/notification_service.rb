# frozen_string_literal: true

class NotificationService
  class << self
    # =============================================================================
    # 팀 관련 알림
    # =============================================================================

    # 팀 가입 신청 알림
    def notify_team_join_request(team:, requester:)
      Notification.create_team_join_request!(team: team, requester: requester)
      push_notification(
        user: team.captain,
        title: "팀 가입 신청",
        body: "#{requester.display_name}님이 #{team.name} 팀에 가입을 신청했습니다."
      )
    end

    # 팀 가입 승인 알림
    def notify_team_join_approved(team:, member:)
      Notification.create_team_join_approved!(team: team, member: member)
      push_notification(
        user: member,
        title: "팀 가입 승인",
        body: "#{team.name} 팀 가입이 승인되었습니다!"
      )
    end

    # 팀 가입 거절 알림
    def notify_team_join_rejected(team:, user:, reason: nil)
      Notification.create_team_join_rejected!(team: team, user: user, reason: reason)
      push_notification(
        user: user,
        title: "팀 가입 거절",
        body: "#{team.name} 팀 가입이 거절되었습니다."
      )
    end

    # =============================================================================
    # 마켓플레이스 관련 알림
    # =============================================================================

    # 전화번호 요청 알림
    def notify_phone_request(item:, requester:)
      Notification.create_phone_request!(item: item, requester: requester)
      push_notification(
        user: item.user,
        title: "연락처 요청",
        body: "#{requester.display_name}님이 '#{item.title}' 상품의 연락처를 요청했습니다."
      )
    end

    # 전화번호 요청 승인 알림
    def notify_phone_request_approved(item:, requester:)
      Notification.create_phone_request_approved!(item: item, requester: requester)
      push_notification(
        user: requester,
        title: "연락처 요청 승인",
        body: "'#{item.title}' 판매자가 연락처 공개를 승인했습니다."
      )
    end

    # 전화번호 요청 거절 알림
    def notify_phone_request_rejected(item:, requester:)
      Notification.create_phone_request_rejected!(item: item, requester: requester)
      push_notification(
        user: requester,
        title: "연락처 요청 거절",
        body: "'#{item.title}' 판매자가 연락처 공개를 거절했습니다."
      )
    end

    # 찜 상품 가격 인하 알림
    def notify_price_drop(item:, old_price:, new_price:)
      # 이 상품을 찜한 모든 사용자에게 알림
      item.favorited_by_users.find_each do |user|
        Notification.create_price_drop!(
          item: item,
          user: user,
          old_price: old_price,
          new_price: new_price
        )

        discount_percent = ((old_price - new_price) / old_price.to_f * 100).round
        push_notification(
          user: user,
          title: "찜 상품 가격 인하",
          body: "'#{item.title}' 가격이 #{discount_percent}% 인하되었습니다!"
        )
      end
    end

    # =============================================================================
    # 결제 관련 알림
    # =============================================================================

    # 결제 완료 알림
    def notify_payment_completed(payment:)
      push_notification(
        user: payment.user,
        title: "결제 완료",
        body: "#{payment.payable_description} 결제가 완료되었습니다. (#{payment.final_amount.to_i.to_fs(:delimited)}원)"
      )
    end

    # 환불 완료 알림
    def notify_payment_refunded(payment:)
      push_notification(
        user: payment.user,
        title: "환불 완료",
        body: "#{payment.refund_amount.to_i.to_fs(:delimited)}원이 환불되었습니다."
      )
    end

    # =============================================================================
    # 대회 관련 알림
    # =============================================================================

    # 경기 리마인더 알림
    def notify_game_reminder(game:, hours_before: 24)
      game.participating_users.find_each do |user|
        user.notifications.create!(
          notification_type: "game_reminder",
          title: "경기 알림",
          content: "#{hours_before}시간 후 경기가 있습니다. #{game.venue || '장소 확인 필요'}",
          notifiable: game,
          action_url: "/games/#{game.id}",
          action_type: "view",
          metadata: { hours_before: hours_before }
        )

        push_notification(
          user: user,
          title: "경기 알림",
          body: "#{hours_before}시간 후 경기가 있습니다."
        )
      end
    end

    # 대회 결과 등록 알림
    def notify_tournament_result(game:)
      game.participating_users.find_each do |user|
        user.notifications.create!(
          notification_type: "tournament_result_posted",
          title: "경기 결과 등록",
          content: "경기 결과가 등록되었습니다. 확인해보세요!",
          notifiable: game,
          action_url: "/games/#{game.id}",
          action_type: "view"
        )
      end
    end

    # =============================================================================
    # 추억 마케팅 알림
    # =============================================================================

    # N년 전 오늘 알림
    def notify_anniversary(user:, game:, years_ago:)
      Notification.create_anniversary!(user: user, game: game, years_ago: years_ago)
      push_notification(
        user: user,
        title: "#{years_ago}년 전 오늘",
        body: "#{years_ago}년 전 오늘의 경기를 기억하시나요?"
      )
    end

    # 마일스톤 알림
    def notify_milestone(user:, milestone_type:, value:, game: nil)
      Notification.create_milestone!(
        user: user,
        milestone_type: milestone_type,
        value: value,
        game: game
      )

      titles = {
        "milestone_points" => "통산 #{value}득점 달성!",
        "milestone_3pt" => "통산 #{value}개 3점슛!",
        "double_double" => "더블더블 달성!",
        "triple_double" => "트리플더블 달성!",
        "game_high" => "경기 최고 기록!",
        "career_high" => "커리어 하이!"
      }

      push_notification(
        user: user,
        title: titles[milestone_type] || "마일스톤 달성!",
        body: "축하합니다! 새로운 기록을 세웠습니다."
      )
    end

    # 시즌 서머리 알림
    def notify_season_summary(user:, season:, stats:)
      Notification.create_season_summary!(user: user, season: season, stats: stats)
      push_notification(
        user: user,
        title: "#{season} 시즌 리포트",
        body: "이번 시즌의 활약상을 확인해보세요!"
      )
    end

    # =============================================================================
    # 시스템 알림
    # =============================================================================

    # 공지사항 알림 (전체 또는 특정 사용자)
    def notify_announcement(title:, content:, users: nil)
      target_users = users || User.active

      target_users.find_each do |user|
        user.notifications.create!(
          notification_type: "system_announcement",
          title: title,
          content: content,
          action_type: "view"
        )
      end
    end

    # 환영 알림 (신규 가입)
    def notify_welcome(user:)
      user.notifications.create!(
        notification_type: "welcome",
        title: "BDR에 오신 것을 환영합니다!",
        content: "프로필을 완성하고 팀에 가입해보세요.",
        action_url: "/profile/edit",
        action_type: "setup"
      )
    end

    # =============================================================================
    # 알림 관리
    # =============================================================================

    # 사용자의 모든 알림 읽음 처리
    def mark_all_as_read(user:)
      user.notifications.unread.update_all(
        status: "read",
        read_at: Time.current
      )
    end

    # 특정 타입 알림 읽음 처리
    def mark_type_as_read(user:, notification_type:)
      user.notifications.unread.by_type(notification_type).update_all(
        status: "read",
        read_at: Time.current
      )
    end

    # 알림 요약 조회
    def notification_summary(user:)
      {
        total_unread: user.notifications.unread.count,
        by_category: {
          team: user.notifications.unread.team_related.count,
          payment: user.notifications.unread.payment_related.count,
          marketplace: user.notifications.unread.marketplace_related.count,
          tournament: user.notifications.unread.tournament_related.count,
          memory: user.notifications.unread.memory_related.count,
          system: user.notifications.unread.system_related.count
        }
      }
    end

    private

    # 푸시 알림 전송 (FCM/APNs 연동)
    def push_notification(user:, title:, body:, data: {})
      return unless user.push_enabled?

      # FCM 또는 APNs를 통한 푸시 알림 전송
      # 추후 구현 예정
      # PushNotificationJob.perform_later(
      #   user_id: user.id,
      #   title: title,
      #   body: body,
      #   data: data
      # )

      Rails.logger.info("[Push] User #{user.id}: #{title} - #{body}")
    end
  end
end
