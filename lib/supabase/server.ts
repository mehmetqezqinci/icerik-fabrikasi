import { createClient } from "@supabase/supabase-js";

export async function createSupabaseRequestClient(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!url || !anonKey) throw new Error("Supabase ortam değişkenleri yapılandırılmamış.");
  if (!token) throw new Error("Oturum doğrulama anahtarı bulunamadı.");
  const client = createClient(url, anonKey, { global: { headers: { Authorization: "Bearer " + token } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) throw new Error("Oturum geçersiz veya süresi dolmuş.");
  return { supabase: client, user };
}
