import { apiSuccess, apiError } from "@/lib/api/response";
import { getAssociationAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
// 공용 ExcelRow 타입 — xlsx sheet_to_json 결과의 행 타입 (any 제거)
import type { ExcelRow } from "@/lib/types/excel-row";
import * as XLSX from "xlsx";

/**
 * /api/web/admin/bulk-verify/preview
 *
 * Excel 파일을 업로드하여 자격증 일괄 검증 미리보기.
 * - POST: multipart/form-data로 xlsx 파일 수신
 * - 5MB / 500행 제한
 * - 필수 헤더: 이름, 생년월일, 전화번호, 자격증종류, 자격등급
 * - 행별 매칭: 협회 소속 확인 → User 매칭 → Referee 매칭 → Certificate 매칭
 * - 결과: rows 배열 + summary 통계
 */

export const dynamic = "force-dynamic";

// 5MB 제한
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// 500행 제한 (헤더 제외)
const MAX_ROWS = 500;

// 필수 헤더 정의
const REQUIRED_HEADERS = ["이름", "생년월일", "전화번호", "자격증종류", "자격등급"];

type PreviewRow = {
  row_number: number;
  name: string;
  birth_date: string;
  phone: string;
  cert_type: string;
  cert_grade: string;
  status: "matched" | "partial" | "no_match" | "already_verified";
  message: string;
  certificate_id: number | null;
};

export async function POST(req: Request) {
  try {
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // formData에서 파일 추출
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return apiError("파일 업로드 형식이 올바르지 않습니다.", 400);
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return apiError("파일이 필요합니다.", 400, "NO_FILE");
    }

    // 파일 크기 제한
    if (file.size > MAX_FILE_SIZE) {
      return apiError("파일 크기는 5MB 이하여야 합니다.", 400, "FILE_TOO_LARGE");
    }

    // xlsx 파싱
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return apiError("시트를 찾을 수 없습니다.", 400, "NO_SHEET");
    }

    const sheet = workbook.Sheets[sheetName];
    // 공용 ExcelRow 타입 — 동적 키 + 원시타입 허용 (any 제거)
    const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: "" });

    // 헤더 검증
    if (jsonData.length === 0) {
      return apiError("데이터가 없습니다.", 400, "EMPTY_DATA");
    }
    const headers = Object.keys(jsonData[0]);
    const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return apiError(
        `필수 헤더가 누락되었습니다: ${missingHeaders.join(", ")}`,
        400,
        "MISSING_HEADERS"
      );
    }

    // 행 수 제한
    if (jsonData.length > MAX_ROWS) {
      return apiError(`최대 ${MAX_ROWS}행까지 처리 가능합니다.`, 400, "TOO_MANY_ROWS");
    }

    // 소속 협회의 심판 + 자격증 미리 조회 (N+1 방지)
    const referees = await prisma.referee.findMany({
      where: { association_id: admin.associationId },
      include: {
        certificates: true,
      },
    });

    // User 정보 별도 조회
    // v3: user_id가 null인 사전 등록 심판 제외
    const userIds = referees
      .map((r) => r.user_id)
      .filter((id): id is bigint => id !== null);
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, birth_date: true, phone: true },
        })
      : [];

    // User를 id 기준 Map으로
    const userMap = new Map(users.map((u) => [u.id.toString(), u]));

    // 심판을 User 기준으로 매칭하기 위한 구조
    // key: "이름|생년월일|전화번호" → Referee + certificates
    type RefereeWithCerts = (typeof referees)[number];
    const refereeByUserKey = new Map<string, RefereeWithCerts>();

    for (const referee of referees) {
      // v3: 매칭된 심판은 User 정보로 키 생성, 사전 등록 심판은 registered_ 필드로 키 생성
      let name = "";
      let birthDate = "";
      let phone = "";

      if (referee.user_id) {
        const user = userMap.get(referee.user_id.toString());
        if (!user) continue;
        name = (user.name ?? "").trim();
        birthDate = user.birth_date
          ? user.birth_date.toISOString().split("T")[0]
          : "";
        phone = (user.phone ?? "").replace(/\D/g, "");
      } else {
        // 사전 등록 심판: registered_ 필드 사용
        name = (referee.registered_name ?? "").trim();
        birthDate = referee.registered_birth_date
          ? referee.registered_birth_date.toISOString().split("T")[0]
          : "";
        phone = (referee.registered_phone ?? "").replace(/\D/g, "");
      }

      const key = `${name}|${birthDate}|${phone}`;
      refereeByUserKey.set(key, referee);
    }

    // 행별 매칭 처리
    const rows: PreviewRow[] = [];
    let matched = 0;
    let partial = 0;
    let noMatch = 0;
    let alreadyVerified = 0;

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNum = i + 2; // 1-based + 헤더행 = 2부터 시작

      const name = String(row["이름"] ?? "").trim();
      const birthDateRaw = String(row["생년월일"] ?? "").trim();
      const phoneRaw = String(row["전화번호"] ?? "").trim();
      const certType = String(row["자격증종류"] ?? "").trim();
      const certGrade = String(row["자격등급"] ?? "").trim();

      // 생년월일 정규화: 여러 포맷 지원
      const birthDate = normalizeBirthDate(birthDateRaw);
      const phone = phoneRaw.replace(/\D/g, "");

      // 매칭 키 생성
      const key = `${name}|${birthDate}|${phone}`;
      const referee = refereeByUserKey.get(key);

      if (!referee) {
        // User 매칭 실패 — 이름만 매치되는 경우 partial로 표시
        const nameOnly = [...refereeByUserKey.entries()].find(
          ([k]) => k.startsWith(name + "|")
        );

        if (nameOnly) {
          rows.push({
            row_number: rowNum,
            name,
            birth_date: birthDate,
            phone: phoneRaw,
            cert_type: certType,
            cert_grade: certGrade,
            status: "partial",
            message: "이름은 일치하나 생년월일/전화번호가 다릅니다.",
            certificate_id: null,
          });
          partial++;
        } else {
          rows.push({
            row_number: rowNum,
            name,
            birth_date: birthDate,
            phone: phoneRaw,
            cert_type: certType,
            cert_grade: certGrade,
            status: "no_match",
            message: "매칭되는 심판을 찾을 수 없습니다.",
            certificate_id: null,
          });
          noMatch++;
        }
        continue;
      }

      // 심판 매칭됨 → 자격증 매칭
      const matchedCert = referee.certificates.find(
        (c) => c.cert_type === certType && c.cert_grade === certGrade
      );

      if (!matchedCert) {
        rows.push({
          row_number: rowNum,
          name,
          birth_date: birthDate,
          phone: phoneRaw,
          cert_type: certType,
          cert_grade: certGrade,
          status: "partial",
          message: "심판은 매칭되었으나 해당 자격증이 없습니다.",
          certificate_id: null,
        });
        partial++;
        continue;
      }

      // 이미 검증됨
      if (matchedCert.verified) {
        rows.push({
          row_number: rowNum,
          name,
          birth_date: birthDate,
          phone: phoneRaw,
          cert_type: certType,
          cert_grade: certGrade,
          status: "already_verified",
          message: "이미 검증된 자격증입니다.",
          certificate_id: Number(matchedCert.id),
        });
        alreadyVerified++;
        continue;
      }

      // 매칭 성공 — 검증 대상
      rows.push({
        row_number: rowNum,
        name,
        birth_date: birthDate,
        phone: phoneRaw,
        cert_type: certType,
        cert_grade: certGrade,
        status: "matched",
        message: "검증 대상",
        certificate_id: Number(matchedCert.id),
      });
      matched++;
    }

    return apiSuccess({
      rows,
      summary: {
        total: jsonData.length,
        matched,
        partial,
        no_match: noMatch,
        already_verified: alreadyVerified,
      },
    });
  } catch {
    return apiError("파일 처리 중 오류가 발생했습니다.", 500);
  }
}

/**
 * 생년월일 문자열을 YYYY-MM-DD 형식으로 정규화.
 * 지원 포맷: "1990-01-15", "19900115", "1990.01.15", "1990/01/15"
 * Excel 날짜 숫자(예: 32874)도 처리
 */
function normalizeBirthDate(raw: string): string {
  // 숫자만인 경우 (Excel 날짜 또는 YYYYMMDD)
  const digitsOnly = raw.replace(/\D/g, "");
  if (digitsOnly.length === 8) {
    // YYYYMMDD 형식
    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6, 8)}`;
  }

  // Excel 날짜 숫자 (5자리 이하)
  const asNum = Number(raw);
  if (!isNaN(asNum) && asNum > 0 && asNum < 100000 && digitsOnly.length < 8) {
    // Excel serial date to JS date
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + asNum * 86400000);
    return date.toISOString().split("T")[0];
  }

  // 구분자가 있는 형식 (-, ., /)
  const parts = raw.split(/[-./]/);
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return raw;
}
