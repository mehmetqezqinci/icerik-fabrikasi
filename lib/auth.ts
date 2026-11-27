import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ADMIN_USER_ID } from "@/lib/db";

const COOKIE = "v6_admin_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.V6_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("V6_SESSION_SECRET en az 32 karakter olmalı.");
  return value;
}
function signature(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}
export function createSessionToken() {
  const issued = Math.floor(Date.now() / 1000).toString();
  return issued + "." + signature(issued);
}
export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [issued, supplied] = token.split(".");
  if (!issued || !supplied || !/^\d+$/.test(issued)) return false;
  const age = Math.floor(Date.now() / 1000) - Number(issued);
  if (age < 0 || age > MAX_AGE) return false;
  const expected = signature(issued);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function requireAdmin() {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(COOKIE)?.value)) throw new Error("Oturum bulunamadı veya süresi doldu. Yeniden giriş yapın.");
  return { id: ADMIN_USER_ID };
}
export const sessionCookie = COOKIE;
export const sessionMaxAge = MAX_AGE;
