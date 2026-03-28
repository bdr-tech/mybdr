/**
 * POST /api/web/upload/court-photo — 코트 리뷰/제보 사진 업로드
 *
 * Supabase Storage의 court-photos 버킷에 업로드.
 * 경로: courts/{courtId}/{type}/{timestamp}_{filename}
 *   - type: "reviews" 또는 "reports"
 *
 * FormData 필드:
 *   - file: File (jpg/png/webp, 최대 5MB)
 *   - courtId: string (코트 ID)
 *   - type: "reviews" | "reports"
 */
import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { supabase } from "@/lib/supabase";

// 허용 이미지 타입
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
// 최대 파일 크기 (5MB)
const MAX_SIZE = 5 * 1024 * 1024;
// Supabase Storage 버킷명
const BUCKET = "court-photos";

export async function POST(req: NextRequest) {
  // 1) 인증 확인
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  // 2) Supabase 클라이언트 확인
  if (!supabase) {
    return apiError(
      "이미지 업로드가 설정되지 않았습니다",
      503,
      "STORAGE_NOT_CONFIGURED"
    );
  }

  // 3) FormData 파싱
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return apiError("FormData 형식으로 전송해주세요", 400, "BAD_REQUEST");
  }

  const file = formData.get("file") as File | null;
  const courtId = formData.get("courtId") as string | null;
  const type = formData.get("type") as string | null;

  // 4) 필수 필드 검증
  if (!file || !(file instanceof File)) {
    return apiError("파일을 선택해주세요", 400, "FILE_REQUIRED");
  }
  if (!courtId) {
    return apiError("코트 ID가 필요합니다", 400, "COURT_ID_REQUIRED");
  }
  if (!type || !["reviews", "reports"].includes(type)) {
    return apiError("type은 reviews 또는 reports여야 합니다", 400, "INVALID_TYPE");
  }

  // 5) 파일 타입 검증
  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError(
      "JPG, PNG, WebP 형식만 업로드 가능합니다",
      400,
      "INVALID_FILE_TYPE"
    );
  }

  // 6) 파일 크기 검증
  if (file.size > MAX_SIZE) {
    return apiError("파일 크기는 5MB 이하여야 합니다", 400, "FILE_TOO_LARGE");
  }

  // 7) Storage 경로 생성: courts/{courtId}/{type}/{timestamp}_{random}.{ext}
  const ext = file.name.split(".").pop() ?? "jpg";
  const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `courts/${courtId}/${type}/${uniqueName}`;

  // 8) Supabase Storage에 업로드
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[Court Photo Upload Error]", uploadError);
    return apiError(
      `업로드 실패: ${uploadError.message}`,
      500,
      "UPLOAD_FAILED"
    );
  }

  // 9) 공개 URL 반환
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return apiSuccess({ url: urlData.publicUrl });
}
