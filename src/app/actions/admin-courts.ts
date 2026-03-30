"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { adminLog } from "@/lib/admin/log";

// 슈퍼관리자 권한 확인
async function requireSuperAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") throw new Error("권한이 없습니다.");
  return session;
}

// 코트 유형 허용 값
const VALID_COURT_TYPES = ["indoor", "outdoor"];

// 코트 등록 Server Action
export async function createCourtAction(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();

  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const district = (formData.get("district") as string)?.trim() || null;
  const courtType = formData.get("court_type") as string;

  // 필수 필드 검증
  if (!name || !address || !city || !VALID_COURT_TYPES.includes(courtType)) return;

  await prisma.court_infos.create({
    data: {
      name,
      address,
      city,
      district,
      court_type: courtType,
      // 위경도 기본값 (서울 시청 좌표) - 추후 지도 연동 시 변경
      latitude: 37.5665,
      longitude: 126.978,
      user_id: BigInt(session.sub),
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  await adminLog("court.create", "Court", {
    description: `코트 등록: ${name}`,
    changesMade: { name, address, city, court_type: courtType },
  });

  revalidatePath("/admin/courts");
}

// 코트 수정 Server Action
export async function updateCourtAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const courtId = formData.get("court_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const district = (formData.get("district") as string)?.trim() || null;
  const courtType = formData.get("court_type") as string;

  if (!courtId || !name || !address || !city || !VALID_COURT_TYPES.includes(courtType)) return;

  // 이전 데이터 조회 (로그 기록용)
  const prev = await prisma.court_infos.findUnique({
    where: { id: BigInt(courtId) },
    select: { name: true, address: true, city: true, court_type: true },
  });

  await prisma.court_infos.update({
    where: { id: BigInt(courtId) },
    data: {
      name,
      address,
      city,
      district,
      court_type: courtType,
      updated_at: new Date(),
    },
  });

  await adminLog("court.update", "Court", {
    resourceId: courtId,
    description: `코트 수정: ${prev?.name} → ${name}`,
    previousValues: { name: prev?.name, address: prev?.address },
    changesMade: { name, address, city, court_type: courtType },
  });

  revalidatePath("/admin/courts");
}

// 코트 삭제 Server Action
export async function deleteCourtAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const courtId = formData.get("court_id") as string;
  if (!courtId) return;

  // 삭제 전 이름 조회 (로그 기록용)
  const court = await prisma.court_infos.findUnique({
    where: { id: BigInt(courtId) },
    select: { name: true },
  });

  // 실제 삭제 대신 상태를 inactive로 변경 (소프트 삭제)
  await prisma.court_infos.update({
    where: { id: BigInt(courtId) },
    data: { status: "inactive", updated_at: new Date() },
  });

  await adminLog("court.delete", "Court", {
    resourceId: courtId,
    description: `코트 비활성화(삭제): ${court?.name}`,
    severity: "warning",
  });

  revalidatePath("/admin/courts");
}
