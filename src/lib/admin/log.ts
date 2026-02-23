import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";

export async function adminLog(
  action: string,
  resourceType: string,
  options?: {
    resourceId?: bigint | string | number;
    targetType?: string;
    targetId?: bigint | string | number;
    description?: string;
    changesMade?: Record<string, unknown>;
    previousValues?: Record<string, unknown>;
    severity?: "info" | "warning" | "error";
  }
) {
  try {
    const session = await getWebSession();
    if (!session) return;

    const now = new Date();
    await prisma.admin_logs.create({
      data: {
        admin_id: BigInt(session.sub),
        action,
        resource_type: resourceType,
        resource_id: options?.resourceId != null ? BigInt(options.resourceId) : null,
        target_type: options?.targetType ?? null,
        target_id: options?.targetId != null ? BigInt(options.targetId) : null,
        description: options?.description ?? null,
        changes_made: (options?.changesMade ?? {}) as Prisma.InputJsonValue,
        previous_values: (options?.previousValues ?? {}) as Prisma.InputJsonValue,
        severity: options?.severity ?? "info",
        created_at: now,
        updated_at: now,
      },
    });
  } catch {
    // 로깅 실패는 메인 플로우에 영향을 주지 않음
  }
}
