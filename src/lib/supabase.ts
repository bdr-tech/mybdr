/**
 * Supabase 클라이언트 (서버사이드 전용)
 * - Storage 이미지 업로드에 사용
 * - Service Role Key가 없으면 null 반환 (graceful 처리)
 * - DB는 Prisma를 사용하므로, 여기서는 Storage만 담당
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// URL과 키가 모두 있을 때만 클라이언트 생성
// 키가 없으면 null — 업로드 API에서 "키 미설정" 에러를 반환
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;
