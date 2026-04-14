function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function convertKeysToSnakeCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(convertKeysToSnakeCase);
  if (typeof obj !== "object") return obj;

  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
      toSnakeCase(key),
      convertKeysToSnakeCase(value),
    ])
  );
}

// snake_case 문자열을 camelCase로 변환 (예: "team_name" → "teamName")
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// API 응답(snake_case)을 클라이언트 컴포넌트(camelCase)에 맞게 변환
export function convertKeysToCamelCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToCamelCase);
  if (typeof obj !== "object") return obj;

  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
      toCamelCase(key),
      convertKeysToCamelCase(value),
    ])
  );
}
