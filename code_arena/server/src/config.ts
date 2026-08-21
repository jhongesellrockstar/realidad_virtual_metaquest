import { z } from "zod";

const configSchema = z.object({
  CORS_ORIGIN: z.string().url().default("http://localhost:3000"),
  FIREBASE_PROJECT_ID: z.string().min(1).default("code-arena-daf7b"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
});

export type ServerConfig = z.infer<typeof configSchema>;

export function getConfig(environment: NodeJS.ProcessEnv = process.env): ServerConfig {
  return configSchema.parse(environment);
}
