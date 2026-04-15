import { prisma } from "@/lib/db/prisma";

/**
 * 심판 매칭 서비스 (v3)
 *
 * 협회가 사전 등록한 심판(user_id=null)과 실제 유저를 연결하는 로직.
 * 매칭 키: 이름 + 전화번호 (숫자만 비교)
 *
 * 흐름:
 *   1) 관리자가 심판 사전 등록 (registered_name, registered_phone)
 *   2) 유저가 가입/로그인 시 findUnmatchedReferee()로 매칭 대상 탐색
 *   3) 매칭 대상 발견 시 executeMatch()로 user_id 연결 + match_status 변경
 */

// ── 전화번호 정규화: 숫자만 추출 ──
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * User 테이블에서 이름 + 전화번호로 유저를 검색한다.
 * 사전 등록된 심판에 매칭할 유저 후보를 찾을 때 사용.
 *
 * @returns 매칭된 User (없으면 null)
 */
export async function findMatchingUser(
  name: string,
  phone: string
) {
  // 전화번호 정규화 — DB에는 다양한 형식으로 저장돼 있을 수 있음
  const normalizedPhone = normalizePhone(phone);

  // 이름 정확히 일치 + 전화번호 포함 검색 (하이픈/공백 차이 대응)
  const users = await prisma.user.findMany({
    where: {
      name: name.trim(),
      phone: { not: null },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      birth_date: true,
    },
  });

  // 전화번호 숫자만 비교하여 정확히 일치하는 유저 찾기
  const matched = users.find(
    (u) => u.phone && normalizePhone(u.phone) === normalizedPhone
  );

  return matched ?? null;
}

/**
 * 이름 + 전화번호로 매칭 안 된 심판(unmatched)을 찾는다.
 * 유저가 로그인할 때 자동 매칭 시도에 사용.
 *
 * @returns 매칭 대기 중인 Referee (없으면 null)
 */
export async function findUnmatchedReferee(
  name: string,
  phone: string
) {
  const normalizedPhone = normalizePhone(phone);

  // match_status가 "unmatched"인 심판 중 이름 일치 검색
  const candidates = await prisma.referee.findMany({
    where: {
      match_status: "unmatched",
      registered_name: name.trim(),
      registered_phone: { not: null },
    },
    select: {
      id: true,
      registered_name: true,
      registered_phone: true,
      registered_birth_date: true,
      association_id: true,
    },
  });

  // 전화번호 숫자만 비교
  const matched = candidates.find(
    (r) =>
      r.registered_phone &&
      normalizePhone(r.registered_phone) === normalizedPhone
  );

  return matched ?? null;
}

/**
 * 심판-유저 매칭 실행.
 * $transaction으로 원자적 처리 — 중간에 실패하면 전부 롤백.
 *
 * 수행 내용:
 *   1) Referee.user_id = userId (연결)
 *   2) Referee.match_status = "matched"
 *   3) Referee.matched_at = now()
 *   4) 교차검증 스냅샷 갱신 (verified_name, verified_phone, verified_birth_date)
 *
 * @throws 이미 매칭된 심판이면 에러
 */
export async function executeMatch(
  refereeId: bigint,
  userId: bigint
) {
  return prisma.$transaction(async (tx) => {
    // 1) 심판 현재 상태 확인 — 이미 매칭됐으면 중복 방지
    const referee = await tx.referee.findUnique({
      where: { id: refereeId },
      select: { match_status: true, user_id: true },
    });

    if (!referee) {
      throw new Error("심판을 찾을 수 없습니다.");
    }
    if (referee.match_status === "matched" || referee.user_id !== null) {
      throw new Error("이미 매칭된 심판입니다.");
    }

    // 2) 해당 유저가 이미 다른 Referee에 연결돼 있는지 확인
    const existingReferee = await tx.referee.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });
    if (existingReferee) {
      throw new Error("이 유저는 이미 다른 심판으로 등록되어 있습니다.");
    }

    // 3) 유저 정보 조회 (교차검증 스냅샷용)
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true, birth_date: true },
    });
    if (!user) {
      throw new Error("유저를 찾을 수 없습니다.");
    }

    // 4) 매칭 실행 — user_id 연결 + 상태 변경 + 스냅샷 갱신
    const updated = await tx.referee.update({
      where: { id: refereeId },
      data: {
        user_id: userId,
        match_status: "matched",
        matched_at: new Date(),
        // 교차검증 스냅샷: 매칭 시점의 유저 정보 저장
        verified_name: user.name,
        verified_phone: user.phone,
        verified_birth_date: user.birth_date,
      },
    });

    return updated;
  });
}
