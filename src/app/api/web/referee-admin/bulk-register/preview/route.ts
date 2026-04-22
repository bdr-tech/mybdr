import { apiSuccess, apiError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  hasPermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
// 공용 ExcelRow 타입 — xlsx sheet_to_json 결과의 행 타입 (any 제거)
import type { ExcelRow } from "@/lib/types/excel-row";
import * as XLSX from "xlsx";

/**
 * /api/web/referee-admin/bulk-register/preview
 *
 * Excel로 심판/경기원 명단을 일괄 사전 등록하기 전 미리보기.
 *
 * 이유:
 *   - 관리자가 실수로 수백 건을 잘못 올리지 않도록 "먼저 보고 확정"하는 2단계 UX 필요
 *   - 자동 매칭 대상(기존 유저)이 누구인지 미리 보여주면 관리자가 판단하기 쉬움
 *
 * 로직:
 *   1) multipart/form-data로 Excel 파일 + role_type 수신
 *   2) xlsx 파싱, 헤더 검증 (이름/전화번호/생년월일/주민등록번호/자격증번호/급수/구분)
 *   3) 행별로 Zod 검증 → 매칭/중복/오류 판정
 *   4) DB 조회는 한 번에 처리 (N+1 방지)
 *   5) rows + 통계 반환
 */

export const dynamic = "force-dynamic";

// 5MB / 500행 제한 — 기존 bulk-verify와 동일
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 500;

// 필수 헤더 — role_type은 body로 받되, "구분" 컬럼으로 행별 override 가능
const REQUIRED_HEADERS = ["이름", "전화번호"];
const OPTIONAL_HEADERS = [
  "생년월일",
  "주민등록번호",
  "자격증번호",
  "급수",
  "구분",
];

// 허용 레벨 (스키마 검증용)
const ALLOWED_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "international",
];

// 급수 라벨 → 코드 매핑 (엑셀에서 "2급" 같은 한글로 올 때 변환)
const LEVEL_LABEL_MAP: Record<string, string> = {
  입문: "beginner",
  초급: "beginner",
  "3급": "beginner",
  "2급": "intermediate",
  중급: "intermediate",
  "1급": "advanced",
  고급: "advanced",
  국제: "international",
  international: "international",
  advanced: "advanced",
  intermediate: "intermediate",
  beginner: "beginner",
};

// 구분 라벨 → role_type 매핑
const ROLE_LABEL_MAP: Record<string, "referee" | "scorer" | "timer"> = {
  referee: "referee",
  scorer: "scorer",
  timer: "timer",
  심판: "referee",
  기록: "scorer",
  기록원: "scorer",
  계시: "timer",
  계시원: "timer",
  경기원: "scorer", // 경기원 → 기본 scorer로 매핑 (게임팀 전용)
  game_official: "scorer",
};

type MatchStatus = "matched" | "unmatched" | "duplicated" | "invalid";

type PreviewRow = {
  row_number: number;
  name: string;
  phone: string;
  birth_date: string | null;
  resident_id_last4: string | null; // 뒷 4자리만 응답에 포함 (보안)
  license_number: string | null;
  level: string | null; // 정규화된 코드
  level_raw: string | null; // 원본 입력값 (디버깅용)
  role_type: "referee" | "scorer" | "timer";
  match_status: MatchStatus;
  match_user_id: string | null; // bigint → string (JSON 직렬화)
  match_user_name: string | null;
  error: string | null;
  // 내부 필드: confirm으로 그대로 넘길 resident_id 평문 (프론트→API로 흘려보냄)
  // 주의: 여기서는 평문을 절대 담지 않음. confirm은 원본 Excel을 다시 보내거나
  //       preview 응답을 그대로 넘기는 구조가 아니라 "행 데이터" 재전송이다.
  //       → resident_id는 프론트 상태에서만 보관 (preview 응답에 포함)
  resident_id: string | null;
};

// 전화번호 정규화 (숫자만 추출)
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// 생년월일 정규화 — bulk-verify와 동일한 규칙
function normalizeBirthDate(raw: string): string | null {
  if (!raw) return null;
  const digitsOnly = raw.replace(/\D/g, "");
  if (digitsOnly.length === 8) {
    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6, 8)}`;
  }
  const asNum = Number(raw);
  if (!isNaN(asNum) && asNum > 0 && asNum < 100000 && digitsOnly.length < 8) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + asNum * 86400000);
    return date.toISOString().split("T")[0];
  }
  const parts = raw.split(/[-./]/);
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

// 주민번호 뒷 4자리 추출 (오류 시 null)
function safeExtractLast4(residentId: string | null): string | null {
  if (!residentId) return null;
  const digits = residentId.replace(/-/g, "");
  if (digits.length !== 13) return null;
  return digits.slice(-4);
}

export async function POST(req: Request) {
  try {
    // 1) 관리자 인증
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 2) 권한 체크 — referee_manage 또는 game_manage 둘 중 하나면 통과
    //    (일괄 등록은 role_type에 따라 referee/경기원이 섞일 수 있으므로 두 권한 OR)
    if (
      !hasPermission(admin.role, "referee_manage") &&
      !hasPermission(admin.role, "game_manage")
    ) {
      return apiError("이 기능에 대한 접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 3) formData 파싱
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return apiError("파일 업로드 형식이 올바르지 않습니다.", 400);
    }

    const file = formData.get("file");
    const defaultRoleTypeRaw = String(formData.get("role_type") ?? "referee");

    if (!file || !(file instanceof File)) {
      return apiError("파일이 필요합니다.", 400, "NO_FILE");
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError("파일 크기는 5MB 이하여야 합니다.", 400, "FILE_TOO_LARGE");
    }

    // 기본 role_type: body의 값 (referee 또는 game_official → scorer)
    // 엑셀 "구분" 컬럼이 있으면 그 값이 우선
    const defaultRoleType: "referee" | "scorer" | "timer" =
      ROLE_LABEL_MAP[defaultRoleTypeRaw.toLowerCase()] ?? "referee";

    // 4) xlsx 파싱
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return apiError("시트를 찾을 수 없습니다.", 400, "NO_SHEET");
    }

    const sheet = workbook.Sheets[sheetName];
    // 공용 ExcelRow 타입 — 동적 키 + 원시타입 허용 (any 제거)
    const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: "" });

    if (jsonData.length === 0) {
      return apiError("데이터가 없습니다.", 400, "EMPTY_DATA");
    }
    if (jsonData.length > MAX_ROWS) {
      return apiError(`최대 ${MAX_ROWS}행까지 처리 가능합니다.`, 400, "TOO_MANY_ROWS");
    }

    // 헤더 검증 — 필수 헤더만
    const headers = Object.keys(jsonData[0]);
    const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return apiError(
        `필수 헤더가 누락되었습니다: ${missingHeaders.join(", ")}`,
        400,
        "MISSING_HEADERS"
      );
    }
    void OPTIONAL_HEADERS; // 선택 헤더는 있으면 읽고 없으면 무시 (린트 무시용)

    // 5) 행별 1차 파싱 → parsedRows
    type ParsedRow = {
      row_number: number;
      name: string;
      phone: string; // 원본 (표시용)
      phone_norm: string; // 정규화된 (매칭용)
      birth_date: string | null;
      license_number: string | null;
      level: string | null;
      level_raw: string | null;
      role_type: "referee" | "scorer" | "timer";
      resident_id: string | null;
      error: string | null;
    };

    const parsedRows: ParsedRow[] = jsonData.map((row, i) => {
      const rowNum = i + 2; // 헤더 포함 1-based

      const name = String(row["이름"] ?? "").trim();
      const phoneRaw = String(row["전화번호"] ?? "").trim();
      const birthRaw = String(row["생년월일"] ?? "").trim();
      const residentRaw = String(row["주민등록번호"] ?? "").trim();
      const licenseRaw = String(row["자격증번호"] ?? "").trim();
      const levelRaw = String(row["급수"] ?? "").trim();
      const roleRaw = String(row["구분"] ?? "").trim();

      // 필수 검증: 이름/전화번호
      if (!name) {
        return {
          row_number: rowNum,
          name: "",
          phone: phoneRaw,
          phone_norm: "",
          birth_date: null,
          license_number: null,
          level: null,
          level_raw: levelRaw || null,
          role_type: defaultRoleType,
          resident_id: null,
          error: "이름이 비어있습니다.",
        };
      }
      if (!phoneRaw) {
        return {
          row_number: rowNum,
          name,
          phone: "",
          phone_norm: "",
          birth_date: null,
          license_number: null,
          level: null,
          level_raw: levelRaw || null,
          role_type: defaultRoleType,
          resident_id: null,
          error: "전화번호가 비어있습니다.",
        };
      }

      const phoneNorm = normalizePhone(phoneRaw);
      if (phoneNorm.length < 9) {
        return {
          row_number: rowNum,
          name,
          phone: phoneRaw,
          phone_norm: phoneNorm,
          birth_date: null,
          license_number: null,
          level: null,
          level_raw: levelRaw || null,
          role_type: defaultRoleType,
          resident_id: null,
          error: "전화번호 형식이 올바르지 않습니다.",
        };
      }

      // 주민번호 형식 검증 (있을 때만)
      let residentId: string | null = null;
      if (residentRaw) {
        const digits = residentRaw.replace(/-/g, "");
        if (digits.length !== 13 || !/^\d{13}$/.test(digits)) {
          return {
            row_number: rowNum,
            name,
            phone: phoneRaw,
            phone_norm: phoneNorm,
            birth_date: null,
            license_number: null,
            level: null,
            level_raw: levelRaw || null,
            role_type: defaultRoleType,
            resident_id: null,
            error: "주민등록번호 형식이 올바르지 않습니다. (13자리)",
          };
        }
        // 항상 "XXXXXX-XXXXXXX" 형식으로 통일
        residentId = `${digits.slice(0, 6)}-${digits.slice(6)}`;
      }

      // level 정규화
      let level: string | null = null;
      if (levelRaw) {
        const mapped = LEVEL_LABEL_MAP[levelRaw.toLowerCase()] ?? LEVEL_LABEL_MAP[levelRaw];
        if (mapped && ALLOWED_LEVELS.includes(mapped)) {
          level = mapped;
        }
        // 매핑 실패해도 등록은 진행 (level=null 허용)
      }

      // role_type 결정: "구분" 컬럼이 있으면 우선, 없으면 body default
      const rowRole = roleRaw
        ? ROLE_LABEL_MAP[roleRaw.toLowerCase()] ?? ROLE_LABEL_MAP[roleRaw]
        : undefined;
      const roleType = rowRole ?? defaultRoleType;

      return {
        row_number: rowNum,
        name,
        phone: phoneRaw,
        phone_norm: phoneNorm,
        birth_date: normalizeBirthDate(birthRaw),
        license_number: licenseRaw || null,
        level,
        level_raw: levelRaw || null,
        role_type: roleType,
        resident_id: residentId,
        error: null,
      };
    });

    // 6) DB 일괄 조회 (N+1 방지)
    //    - 매칭용 User: 이름이 어떤 행에라도 포함되는 유저 전부 로드
    //    - 중복 체크용 Referee: 같은 협회의 사전등록 심판 중 parsedRows에 있는 이름 포함분 로드
    const validRows = parsedRows.filter((r) => !r.error);
    const uniqueNames = Array.from(new Set(validRows.map((r) => r.name)));

    // 유저 후보 (이름 일치 + 전화번호 not null)
    const userCandidates =
      uniqueNames.length > 0
        ? await prisma.user.findMany({
            where: {
              name: { in: uniqueNames },
              phone: { not: null },
            },
            select: { id: true, name: true, phone: true },
          })
        : [];

    // 기존 사전 등록 심판 후보 (같은 협회)
    const refereeCandidates =
      uniqueNames.length > 0
        ? await prisma.referee.findMany({
            where: {
              association_id: admin.associationId,
              registered_name: { in: uniqueNames },
              registered_phone: { not: null },
            },
            select: {
              id: true,
              registered_name: true,
              registered_phone: true,
            },
          })
        : [];

    // 매칭 키: "이름|phoneNorm" → userId
    const userKeyMap = new Map<string, { id: bigint; name: string }>();
    for (const u of userCandidates) {
      if (!u.phone) continue;
      const key = `${u.name}|${normalizePhone(u.phone)}`;
      userKeyMap.set(key, { id: u.id, name: u.name ?? "" });
    }

    // 중복 키: "이름|phoneNorm" → true
    const duplicateKeySet = new Set<string>();
    for (const r of refereeCandidates) {
      if (!r.registered_phone) continue;
      const key = `${r.registered_name}|${normalizePhone(r.registered_phone)}`;
      duplicateKeySet.add(key);
    }

    // 같은 파일 내 중복 탐지 (같은 이름+전화번호 2번 이상 등장)
    const inFileCount = new Map<string, number>();
    for (const r of validRows) {
      const key = `${r.name}|${r.phone_norm}`;
      inFileCount.set(key, (inFileCount.get(key) ?? 0) + 1);
    }

    // 7) 행별 최종 판정
    const rows: PreviewRow[] = [];
    let matched = 0;
    let unmatched = 0;
    let duplicated = 0;
    let invalid = 0;
    const seenInFile = new Set<string>(); // 파일 내 중복 2번째 이후는 invalid 처리

    for (const p of parsedRows) {
      // 오류 있는 행
      if (p.error) {
        rows.push({
          row_number: p.row_number,
          name: p.name,
          phone: p.phone,
          birth_date: p.birth_date,
          resident_id_last4: safeExtractLast4(p.resident_id),
          license_number: p.license_number,
          level: p.level,
          level_raw: p.level_raw,
          role_type: p.role_type,
          match_status: "invalid",
          match_user_id: null,
          match_user_name: null,
          error: p.error,
          resident_id: p.resident_id,
        });
        invalid++;
        continue;
      }

      const key = `${p.name}|${p.phone_norm}`;

      // DB 중복
      if (duplicateKeySet.has(key)) {
        rows.push({
          row_number: p.row_number,
          name: p.name,
          phone: p.phone,
          birth_date: p.birth_date,
          resident_id_last4: safeExtractLast4(p.resident_id),
          license_number: p.license_number,
          level: p.level,
          level_raw: p.level_raw,
          role_type: p.role_type,
          match_status: "duplicated",
          match_user_id: null,
          match_user_name: null,
          error: "이미 등록된 심판/경기원입니다.",
          resident_id: p.resident_id,
        });
        duplicated++;
        continue;
      }

      // 파일 내 중복 — 첫 번째만 허용, 이후는 invalid
      if (seenInFile.has(key)) {
        rows.push({
          row_number: p.row_number,
          name: p.name,
          phone: p.phone,
          birth_date: p.birth_date,
          resident_id_last4: safeExtractLast4(p.resident_id),
          license_number: p.license_number,
          level: p.level,
          level_raw: p.level_raw,
          role_type: p.role_type,
          match_status: "invalid",
          match_user_id: null,
          match_user_name: null,
          error: "파일 내 중복된 행입니다.",
          resident_id: p.resident_id,
        });
        invalid++;
        continue;
      }
      seenInFile.add(key);

      // 매칭 여부
      const matchedUser = userKeyMap.get(key);
      if (matchedUser) {
        rows.push({
          row_number: p.row_number,
          name: p.name,
          phone: p.phone,
          birth_date: p.birth_date,
          resident_id_last4: safeExtractLast4(p.resident_id),
          license_number: p.license_number,
          level: p.level,
          level_raw: p.level_raw,
          role_type: p.role_type,
          match_status: "matched",
          match_user_id: matchedUser.id.toString(),
          match_user_name: matchedUser.name,
          error: null,
          resident_id: p.resident_id,
        });
        matched++;
      } else {
        rows.push({
          row_number: p.row_number,
          name: p.name,
          phone: p.phone,
          birth_date: p.birth_date,
          resident_id_last4: safeExtractLast4(p.resident_id),
          license_number: p.license_number,
          level: p.level,
          level_raw: p.level_raw,
          role_type: p.role_type,
          match_status: "unmatched",
          match_user_id: null,
          match_user_name: null,
          error: null,
          resident_id: p.resident_id,
        });
        unmatched++;
      }
    }

    return apiSuccess({
      total: parsedRows.length,
      matched,
      unmatched,
      duplicated,
      invalid,
      rows,
    });
  } catch {
    return apiError("파일 처리 중 오류가 발생했습니다.", 500);
  }
}
