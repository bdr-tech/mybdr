/**
 * POST /api/web/upload
 * Supabase Storage 이미지 업로드 API
 *
 * - FormData: file(File), bucket(string), path(string)
 * - 인증: 쿠키 JWT (로그인 필수)
 * - 파일 검증: image/* 타입만, 최대 5MB
 * - 성공 시 공개 URL 반환
 */
import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError, unauthorized } from "@/lib/api/response";
import { supabase } from "@/lib/supabase";

// 허용할 이미지 MIME 타입 목록
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

// 최대 파일 크기 (5MB)
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  // 1) 인증 확인 — 로그인하지 않으면 업로드 불가
  const session = await getWebSession();
  if (!session) return unauthorized("로그인이 필요합니다.");

  // 2) Supabase 클라이언트 확인 — Service Role Key 없으면 사용 불가
  if (!supabase) {
    return apiError(
      "이미지 업로드가 설정되지 않았습니다. Supabase Service Role Key를 .env에 추가하세요.",
      503,
      "STORAGE_NOT_CONFIGURED"
    );
  }

  // 3) FormData 파싱
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return apiError("잘못된 요청 형식입니다. FormData를 전송하세요.", 400);
  }

  const file = formData.get("file") as File | null;
  const bucket = (formData.get("bucket") as string) ?? "tournament-images";
  const pathPrefix = (formData.get("path") as string) ?? "";

  // 4) 파일 존재 확인
  if (!file || !(file instanceof File)) {
    return apiError("파일을 선택하세요.", 400);
  }

  // 5) 파일 타입 검증 — 이미지만 허용
  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError(
      `허용되지 않는 파일 형식입니다. (${ALLOWED_TYPES.join(", ")})`,
      400
    );
  }

  // 6) 파일 크기 검증 — 5MB 초과 불가
  if (file.size > MAX_SIZE) {
    return apiError(
      `파일 크기가 너무 큽니다. 최대 ${MAX_SIZE / 1024 / 1024}MB까지 업로드 가능합니다.`,
      400
    );
  }

  // 7) 고유한 파일명 생성 — 충돌 방지를 위해 타임스탬프 + 랜덤 문자 추가
  const ext = file.name.split(".").pop() ?? "jpg";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = pathPrefix ? `${pathPrefix}/${uniqueName}` : uniqueName;

  // 8) 파일을 ArrayBuffer로 변환 후 Supabase에 업로드
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false, // 같은 이름 덮어쓰기 방지
    });

  if (uploadError) {
    console.error("[Upload Error]", uploadError);
    return apiError(
      `업로드에 실패했습니다: ${uploadError.message}`,
      500
    );
  }

  // 9) 공개 URL 생성
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  return apiSuccess({ url: urlData.publicUrl });
}
