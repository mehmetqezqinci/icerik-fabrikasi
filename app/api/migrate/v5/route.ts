import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateV5Backup } from "@/lib/v5-import";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Bu işlem için giriş yapmalısınız." }, { status: 401 });

    const raw = await request.text();
    if (raw.length > 12_000_000) return NextResponse.json({ error: "Yedek dosyası 12 MB sınırını aşıyor." }, { status: 413 });
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return NextResponse.json({ error: "Geçerli bir JSON yedeği yükleyin." }, { status: 400 }); }

    const checked = validateV5Backup(parsed);
    if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
    const payload = checked.payload;
    const hash = createHash("sha256").update(raw).digest("hex");

    const { data: existing } = await supabase.from("legacy_imports").select("id").eq("user_id", user.id).eq("payload_sha256", hash).maybeSingle();
    if (existing) return NextResponse.json({ status: "already_imported", importId: existing.id, summary: checked.summary });

    const { data, error } = await supabase.from("legacy_imports").insert({
      user_id: user.id,
      source_app: String(payload.app || "Dilara Ceylan Content Factory V5"),
      source_version: Number(payload.version || 5),
      exported_at: typeof payload.exportedAt === "string" ? payload.exportedAt : null,
      payload_sha256: hash,
      payload,
      import_summary: checked.summary
    }).select("id").single();

    if (error) throw error;
    return NextResponse.json({ status: "backup_preserved", importId: data.id, summary: checked.summary, message: "Orijinal yedek değişmeden saklandı. Normalleştirilmiş aktarım ayrı aşamada yapılacak." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Beklenmeyen sunucu hatası." }, { status: 500 });
  }
}
