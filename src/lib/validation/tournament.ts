import { z } from "zod";

export const subdomainCheckSchema = z.object({
  name: z
    .string()
    .min(3, "최소 3자 이상")
    .max(30, "최대 30자")
    .regex(/^[a-z0-9-]+$/, "영문 소문자, 숫자, 하이픈만 사용 가능"),
});

export type SubdomainCheckInput = z.infer<typeof subdomainCheckSchema>;
