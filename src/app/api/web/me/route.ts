import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import {
  getAssociationAdmin,
  isExecutive,
  PERMISSIONS,
  type Permission,
} from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

// 세션 확인 + 프로필 이미지 + 심판 매칭 + 관리자 정보 엔드포인트
// 이유: referee-shell에서 메뉴를 역할별로 필터링하려면 admin_info가 필요.
//      별도 호출 대신 기존 /api/web/me 응답에 합쳐서 네트워크 라운드트립을 줄인다.
export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  // 유저 정보 + 심판 매칭 여부 + 관리자 매핑을 병렬로 조회 (waterfall 방지)
  const [user, referee, admin] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        profile_image: true,
        profile_image_url: true,
        // 맞춤 보기 토글 상태를 DB에서 직접 읽어옴 (디비전 존재 여부가 아닌 실제 저장값)
        prefer_filter_enabled: true,
        // 숨긴 메뉴 slug 배열 — 사이드/슬라이드 메뉴 필터링에 사용
        hidden_menus: true,
      },
    }).catch(() => null),
    // Referee 테이블에서 현재 유저의 매칭 여부 확인 (SELECT id만 — 최소 비용)
    prisma.referee.findFirst({
      where: { user_id: ctx.userId },
      select: { id: true },
    }).catch(() => null),
    // 협회 관리자 매핑 조회 (없으면 null — 비관리자)
    // getAssociationAdmin은 내부적으로 세션 + User.admin_role + AssociationAdmin을 모두 체크
    getAssociationAdmin().catch(() => null),
  ]);

  // 관리자인 경우, 현재 role이 속한 모든 permission 키를 추출
  // 이유: 클라이언트가 각 메뉴 항목의 requires 값과 비교하여 가시성을 결정
  let adminInfo:
    | {
        is_admin: true;
        association_id: number;
        role: string;
        is_executive: boolean;
        permissions: Permission[];
      }
    | null = null;

  if (admin) {
    // PERMISSIONS 매트릭스를 역순으로 순회 — 이 role이 속한 키만 뽑아냄
    const permissionKeys = (Object.keys(PERMISSIONS) as Permission[]).filter(
      (key) => PERMISSIONS[key].includes(admin.role)
    );

    adminInfo = {
      is_admin: true,
      // bigint는 JSON 직렬화 불가 → Number로 변환 (협회 id는 안전 범위 내)
      association_id: Number(admin.associationId),
      role: admin.role,
      is_executive: isExecutive(admin.role),
      permissions: permissionKeys,
    };
  }

  return apiSuccess({
    id: ctx.session.sub,
    email: ctx.session.email,
    name: ctx.session.name,
    role: ctx.session.role,
    profileImage: user?.profile_image_url || user?.profile_image || null,
    // DB에 저장된 실제 토글 상태값을 반환 (false면 OFF, true면 ON)
    prefer_filter_enabled: user?.prefer_filter_enabled ?? false,
    // 숨긴 메뉴 slug 배열 (빈 배열이면 모든 메뉴 표시)
    hidden_menus: (user?.hidden_menus as string[]) ?? [],
    // 심판 플랫폼 바로가기 표시 여부 — Referee 레코드가 user_id로 매칭되어 있으면 true
    is_referee: !!referee,
    // 관리자 정보 — 비관리자는 null. referee-shell에서 admin 메뉴 필터링에 사용
    admin_info: adminInfo,
  });
});
