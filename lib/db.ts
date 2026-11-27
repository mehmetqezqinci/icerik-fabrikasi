import postgres from "postgres";

let client: ReturnType<typeof postgres> | undefined;

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL Vercel ortam değişkeninde tanımlı değil.");
  if (!client) client = postgres(url, { max: 5, idle_timeout: 20, connect_timeout: 15, prepare: false });
  return client;
}

export const ADMIN_USER_ID = "00000000-0000-4000-8000-000000000001";
