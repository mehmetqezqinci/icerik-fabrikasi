import { NextResponse } from "next/server";
import { createSessionToken, sessionCookie, sessionMaxAge } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json() as { password?: string };
    const expected = process.env.V6_ADMIN_PASSWORD;
    if (!expected || expected.length < 12) {
      return NextResponse.json({ error: "V6_ADMIN_PASSWORD Vercel ortam değişkeninde (en az 12 karakter) tanımlanmalı." }, { status: 503 });
    }
    if (typeof password !== "string" || password.length !== expected.length || !Buffer.from(password).equals(Buffer.from(expected))) {
      return NextResponse.json({ error: "Yönetici parolası hatalı." }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookie, createSessionToken(), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      path: "/", maxAge: sessionMaxAge
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Giriş isteği işlenemedi." }, { status: 400 });
  }
}
