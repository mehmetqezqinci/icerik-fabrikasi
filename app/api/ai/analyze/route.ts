import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createSupabaseRequestClient } from "@/lib/supabase/server";
import { buildPerformanceAnalysisPrompt, type PerformanceRow } from "@/lib/ai/performance-prompt";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await createSupabaseRequestClient(request);
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY sunucu ortamında tanımlı değil." }, { status: 503 });

    const { data: metricRows, error } = await supabase.from("content_metric_snapshots")
      .select("reach,views,likes,comments,shares,saves,follows,avg_watch_seconds,retention_percent,skip_rate_percent,captured_at,content_items!inner(caption,permalink,content_type,published_at,user_id)")
      .eq("content_metric_snapshots.user_id", user.id).order("captured_at", { ascending: false }).limit(100);
    if (error) throw error;
    if (!metricRows?.length) return NextResponse.json({ error: "Analiz için henüz performans verisi yok. Önce Metricool verilerini içe aktarın." }, { status: 409 });

    const rows: PerformanceRow[] = metricRows.map((r: any) => ({
      ...r, published_at: r.content_items?.published_at, caption: r.content_items?.caption,
      permalink: r.content_items?.permalink, content_type: r.content_items?.content_type
    }));
    const { data: profileMemory } = await supabase.from("brand_memory").select("memory_value").eq("user_id", user.id).eq("memory_key", "org_profile").maybeSingle();
    const rawProfile = (profileMemory?.memory_value || {}) as Record<string, unknown>;
    const safeKeys = ["orgName","location","mission","beneficiaries","services","audience","tone","differentiators","platforms","topContent","currentFollowers","targetFollowers","teamCapacity","equipment","weeklyOutput","rules","umut"];
    const profile = Object.fromEntries(safeKeys.filter((key) => typeof rawProfile[key] === "string").map((key) => [key, rawProfile[key]]));
    const prompt = buildPerformanceAnalysisPrompt(rows, profile);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: process.env.OPENAI_ANALYSIS_MODEL || "gpt-6.2-sol",
      input: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user }
      ]
    });
    const result = response.output_text;
    const { data: saved, error: saveError } = await supabase.from("ai_analyses").insert({
      user_id: user.id, analysis_type: "instagram_performance", model: process.env.OPENAI_ANALYSIS_MODEL || "gpt-6.2-sol",
      prompt_version: "v1", input_window: { rows: rows.length }, result: { text: result }
    }).select("id").single();
    if (saveError) throw saveError;
    return NextResponse.json({ analysisId: saved.id, model: process.env.OPENAI_ANALYSIS_MODEL || "gpt-6.2-sol", rowsAnalyzed: rows.length, analysis: result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI analizi başarısız." }, { status: 500 });
  }
}
