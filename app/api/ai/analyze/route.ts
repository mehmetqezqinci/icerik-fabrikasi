import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildPerformanceAnalysisPrompt, type PerformanceRow } from "@/lib/ai/performance-prompt";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Önce yönetici girişi yapmalısınız." }, { status: 401 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY sunucu ortamında tanımlı değil." }, { status: 503 });

    const { data: metricRows, error } = await supabase.from("content_metric_snapshots")
      .select("reach,views,likes,comments,shares,saves,follows,avg_watch_seconds,retention_percent,skip_rate_percent,captured_at,content_items!inner(caption,permalink,content_type,published_at,user_id)")
      .eq("user_id", user.id).order("captured_at", { ascending: false }).limit(100);
    if (error) throw error;
    if (!metricRows?.length) return NextResponse.json({ error: "Analiz için henüz performans verisi yok. Önce Metricool verilerini içe aktarın." }, { status: 409 });

    const rows: PerformanceRow[] = metricRows.map((r: any) => ({
      ...r, published_at: r.content_items?.published_at, caption: r.content_items?.caption,
      permalink: r.content_items?.permalink, content_type: r.content_items?.content_type
    }));
    const { data: memories } = await supabase.from("brand_memory").select("memory_key,memory_value").eq("user_id", user.id);
    const profile = Object.fromEntries((memories || []).map((m: any) => [m.memory_key, m.memory_value]));
    const prompt = buildPerformanceAnalysisPrompt(rows, profile);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: process.env.OPENAI_ANALYSIS_MODEL || "gpt-6",
      input: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user }
      ]
    });
    const result = response.output_text;
    const { data: saved, error: saveError } = await supabase.from("ai_analyses").insert({
      user_id: user.id, analysis_type: "instagram_performance", model: process.env.OPENAI_ANALYSIS_MODEL || "gpt-6",
      prompt_version: "v1", input_window: { rows: rows.length }, result: { text: result }
    }).select("id").single();
    if (saveError) throw saveError;
    return NextResponse.json({ analysisId: saved.id, model: process.env.OPENAI_ANALYSIS_MODEL || "gpt-6", rowsAnalyzed: rows.length, analysis: result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI analizi başarısız." }, { status: 500 });
  }
}
