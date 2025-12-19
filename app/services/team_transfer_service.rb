# frozen_string_literal: true

class TeamTransferService
  attr_reader :user, :from_team, :to_team, :processed_by, :errors

  def initialize(user:, from_team:, to_team:, processed_by: nil)
    @user = user
    @from_team = from_team
    @to_team = to_team
    @processed_by = processed_by
    @errors = []
  end

  def execute
    return failure("사용자를 찾을 수 없습니다.") unless user
    return failure("현재 팀을 찾을 수 없습니다.") unless from_team
    return failure("이동할 팀을 찾을 수 없습니다.") unless to_team
    return failure("같은 팀으로 이동할 수 없습니다.") if from_team.id == to_team.id

    from_member = from_team.team_members.status_active.find_by(user: user)
    return failure("현재 팀의 멤버가 아닙니다.") unless from_member
    return failure("주장은 이적 전에 주장직을 다른 멤버에게 이양해야 합니다.") if from_member.role_captain?

    return failure("이동할 팀에 이미 가입되어 있습니다.") if to_team.team_members.exists?(user: user)
    return failure("이동할 팀이 멤버를 받지 않고 있습니다.") unless to_team.accepting_members?

    ActiveRecord::Base.transaction do
      # Leave from current team
      from_member.update!(
        status: :left,
        left_at: Time.current
      )

      # Join new team
      to_team.team_members.create!(
        user: user,
        role: :member,
        position: from_member.position,
        jersey_number: nil, # Reset jersey number for new team
        joined_at: Time.current,
        status: :active
      )

      # Record transfer history
      TeamMemberHistory.record_transfer(
        user: user,
        from_team: from_team,
        to_team: to_team,
        role: "member",
        processed_by: processed_by
      )

      # Update member counts
      from_team.update_members_count!
      to_team.update_members_count!

      success
    end
  rescue ActiveRecord::RecordInvalid => e
    failure(e.record.errors.full_messages.join(", "))
  rescue StandardError => e
    failure(e.message)
  end

  def success?
    @errors.empty?
  end

  private

  def failure(message)
    @errors << message
    OpenStruct.new(success?: false, errors: @errors)
  end

  def success
    OpenStruct.new(success?: true, errors: [])
  end
end
