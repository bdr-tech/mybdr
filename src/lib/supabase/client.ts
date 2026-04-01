import { createClient } from "@supabase/supabase-js";

/**
 * 브라우저용 Supabase 클라이언트 (싱글톤)
 * - Realtime 구독에 사용
 * - NEXT_PUBLIC_ 환경변수만 사용 (브라우저 노출 OK)
 */
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
    );
  }

  supabaseClient = createClient(url, key, {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  });

  return supabaseClient;
}
