// 프로필 완성 판정 로직 — 필수 필드 기준
// 변경 시 이 파일과 DB profile_completed 컬럼을 함께 동기화

export interface ProfileCompletionFields {
  name: string | null;
  nickname: string | null;
  phone: string | null;
  position: string | null;
  city: string | null;
  district: string | null;
}

export function checkProfileCompletion(
  fields: ProfileCompletionFields
): boolean {
  return (
    !!fields.name?.trim() &&
    !!fields.nickname?.trim() &&
    !!fields.phone?.trim() &&
    !!fields.position?.trim() &&
    !!fields.city?.trim() &&
    !!fields.district?.trim()
  );
}

export function getMissingFields(fields: ProfileCompletionFields): string[] {
  const missing: string[] = [];
  if (!fields.name?.trim()) missing.push("이름");
  if (!fields.nickname?.trim()) missing.push("닉네임");
  if (!fields.phone?.trim()) missing.push("전화번호");
  if (!fields.position?.trim()) missing.push("포지션");
  if (!fields.city?.trim()) missing.push("시/도");
  if (!fields.district?.trim()) missing.push("구/동");
  return missing;
}
