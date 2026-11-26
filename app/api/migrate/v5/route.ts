import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { extractV5Memory, validateV5Backup } from "@/lib/v5-import";

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

    // Preserve the complete original export first. Normalization never replaces this immutable backup.
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

    const memory = extractV5Memory(payload);
    const memories = [
      { user_id: user.id, memory_key: "org_profile", memory_value: memory.orgProfile },
      { user_id: user.id, memory_key: "weekly_brief", memory_value: memory.weeklyBrief },
      { user_id: user.id, memory_key: "v5_backup_metadata", memory_value: { importId: data.id, sourceVersion: payload.version || 5, summary: checked.summary, exportedAt: payload.exportedAt || null } }
    ];
    const { error: memoryError } = await supabase.from("brand_memory").upsert(memories, { onConflict: "user_id,memory_key" });
    if (memoryError) {
      return NextResponse.json({ status: "backup_preserved_normalization_pending", importId: data.id, summary: checked.summary, warning: memoryError.message });
    }
    return NextResponse.json({ status: "backup_preserved_and_memory_migrated", importId: data.id, summary: checked.summary });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Beklenmeyen sunucu hatası." }, { status: 500 });
  }
}
