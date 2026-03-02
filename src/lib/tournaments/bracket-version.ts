import { prisma } from "@/lib/db/prisma";

export const MAX_BRACKET_VERSIONS_FREE = 3;

export interface BracketVersionStatus {
  canCreate: boolean;
  needsApproval: boolean;
  currentVersion: number;
  activeVersion: number | null;
}

export async function getBracketVersionStatus(
  tournamentId: string,
): Promise<BracketVersionStatus> {
  const versions = await prisma.tournament_bracket_versions.findMany({
    where: { tournament_id: tournamentId },
    orderBy: { version_number: "asc" },
    select: { version_number: true, is_active: true },
  });

  const count = versions.length;
  const active = versions.find((v) => v.is_active);

  return {
    canCreate: true,
    needsApproval: count >= MAX_BRACKET_VERSIONS_FREE,
    currentVersion: count,
    activeVersion: active?.version_number ?? null,
  };
}

export async function createBracketVersion(
  tournamentId: string,
  createdBy: bigint,
): Promise<bigint> {
  const count = await prisma.tournament_bracket_versions.count({
    where: { tournament_id: tournamentId },
  });

  const version = await prisma.tournament_bracket_versions.create({
    data: {
      tournament_id: tournamentId,
      version_number: count + 1,
      created_by: createdBy,
      is_active: false,
    },
  });

  return version.id;
}

export async function activateBracketVersion(
  tournamentId: string,
  versionId: bigint,
): Promise<void> {
  await prisma.$transaction([
    // 기존 active 해제
    prisma.tournament_bracket_versions.updateMany({
      where: { tournament_id: tournamentId, is_active: true },
      data: { is_active: false },
    }),
    // 새 버전 active
    prisma.tournament_bracket_versions.update({
      where: { id: versionId },
      data: { is_active: true },
    }),
  ]);
}
