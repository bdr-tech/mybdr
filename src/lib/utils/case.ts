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
