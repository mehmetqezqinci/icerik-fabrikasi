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
      .select("source,reach,views,likes,comments,shares,saves,follows,avg_watch_seconds,retention_percent,skip_rate_percent,captured_at,content_items!inner(caption,permalink,content_type,published_at,user_id,metadata)")
      .eq("user_id", user.id).order("captured_at", { ascending: false }).limit(150);
    if (error) throw error;
    if (!metricRows?.length) return NextResponse.json({ error: "Analiz için henüz performans verisi yok. Önce Instagram veri paketini içe aktarın." }, { status: 409 });

    const rows: PerformanceRow[] = metricRows.map((r: any) => ({
      source: r.source, reach: r.reach, views: r.views, likes: r.likes,
      comments: r.comments, shares: r.shares, saves: r.saves, follows: r.follows,
      avg_watch_seconds: r.avg_watch_seconds, retention_percent: r.retention_percent,
      skip_rate_percent: r.skip_rate_percent, published_at: r.content_items?.published_at,
      caption: r.content_items?.caption, permalink: r.content_items?.permalink,
      content_type: r.content_items?.content_type,
      content_title: r.content_items?.metadata?.contentTitle || null,
      duration_seconds: r.content_items?.metadata?.durationSeconds || null
    }));
    const { data: profileMemory } = await supabase.from("brand_memory").select("memory_value")
      .eq("user_id", user.id).eq("memory_key", "org_profile").maybeSingle();
    const rawProfile = (profileMemory?.memory_value || {}) as Record<string, unknown>;
    const safeKeys = ["orgName","location","mission","beneficiaries","services","audience","tone","differentiators","platforms","topContent","currentFollowers","targetFollowers","teamCapacity","equipment","weeklyOutput","rules","umut"];
    const profile = Object.fromEntries(safeKeys.filter((key) => typeof rawProfile[key] === "string").map((key) => [key, rawProfile[key]]));
    const prompt = buildPerformanceAnalysisPrompt(rows, profile);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_ANALYSIS_MODEL || "gpt-6.2-sol";
    const response = await openai.responses.create({
      model,
      input: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user }
      ]
    });
    const result = response.output_text;
    const sourceCounts = rows.reduce<Record<string, number>>((acc, row) => {
      const key = row.source || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const { data: saved, error: saveError } = await supabase.from("ai_analyses").insert({
      user_id: user.id, analysis_type: "instagram_performance", model,
      prompt_version: "v2-source-aware", input_window: { rows: rows.length, sourceCounts }, result: { text: result }
    }).select("id").single();
    if (saveError) throw saveError;
    return NextResponse.json({ analysisId: saved.id, model, rowsAnalyzed: rows.length, sourceCounts, analysis: result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI analizi başarısız." }, { status: 500 });
  }
}
