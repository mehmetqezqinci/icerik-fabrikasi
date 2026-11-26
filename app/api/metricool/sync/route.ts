import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseRequestClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type MetricoolItem = Record<string, any>;
function getRows(payload: any): MetricoolItem[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}
function publishedAt(value: any): string | null {
  const raw = typeof value === "string" ? value : value?.dateTime;
  if (!raw || Number.isNaN(Date.parse(raw))) return null;
  return new Date(raw).toISOString();
}
function numeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}
async function fetchMetricool(path: string, params: URLSearchParams, token: string) {
  const url = new URL("https://app.metricool.com/api" + path);
  params.forEach((value, key) => url.searchParams.set(key, value));
  const response = await fetch(url, { headers: { "X-Mc-Auth": token, Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error("Metricool API " + response.status + ": " + detail);
  }
  return response.json();
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await createSupabaseRequestClient(request);
    const token = process.env.METRICOOL_API_TOKEN;
    const userId = process.env.METRICOOL_USER_ID;
    const blogId = process.env.METRICOOL_BLOG_ID;
    if (!token || !userId || !blogId) return NextResponse.json({ error: "Metricool API değişkenleri eksik. Token, userId ve blogId değerlerini Vercel ortam değişkenlerine ekleyin." }, { status: 503 });

    const body = await request.json().catch(() => ({})) as { from?: string; to?: string };
    const from = body.from || new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    const to = body.to || new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
      return NextResponse.json({ error: "Tarih aralığı YYYY-MM-DD biçiminde olmalı." }, { status: 400 });
    }

    const params = new URLSearchParams({ from: from + "T00:00:00+03:00", to: to + "T23:59:59+03:00", timezone: "Europe/Istanbul", userId, blogId });
    const [postResponse, reelResponse] = await Promise.all([
      fetchMetricool("/v2/analytics/posts/instagram", params, token),
      fetchMetricool("/v2/analytics/reels/instagram", params, token)
    ]);
    const posts = getRows(postResponse);
    const reels = getRows(reelResponse);
    const { data: account, error: accountError } = await supabase.from("social_accounts").upsert({
      user_id: user.id, platform: "instagram", provider: "metricool", external_account_id: blogId,
      account_label: "dilaraceylandernegi", connection_status: "connected", last_synced_at: new Date().toISOString()
    }, { onConflict: "user_id,platform,provider,external_account_id" }).select("id").single();
    if (accountError) throw accountError;

    let saved = 0;
    const combined = [
      ...posts.map((item) => ({ item, contentType: "post" as const, externalId: item.postId })),
      ...reels.map((item) => ({ item, contentType: "reel" as const, externalId: item.reelId }))
    ];
    for (const entry of combined) {
      const item = entry.item;
      const date = publishedAt(item.publishedAt);
      if (!entry.externalId || !date) continue;
      const { data: content, error: contentError } = await supabase.from("content_items").upsert({
        user_id: user.id, social_account_id: account.id, external_content_id: String(entry.externalId),
        platform: "instagram", content_type: entry.contentType, caption: item.content || null,
        permalink: item.url || null, published_at: date
      }, { onConflict: "user_id,platform,external_content_id" }).select("id").single();
      if (contentError) throw contentError;

      const avgWatch = numeric(item.averageWatchTime);
      const duration = numeric(item.durationSeconds);
      const retention = avgWatch !== null && duration && duration > 0 ? Math.min(100, (avgWatch / duration) * 100) : null;
      const metrics = {
        reach: numeric(item.reach), views: numeric(item.views ?? item.videoViews),
        likes: numeric(item.likes), comments: numeric(item.comments), shares: numeric(item.shares),
        saves: numeric(item.saved), follows: numeric(item.follows), avg_watch_seconds: avgWatch,
        retention_percent: retention, skip_rate_percent: numeric(item.reelsSkipRate)
      };
      const snapshotKey = createHash("sha256").update(JSON.stringify(metrics)).digest("hex");
      const { error: metricError } = await supabase.from("content_metric_snapshots").upsert({
        user_id: user.id, content_item_id: content.id, source: "metricool_api",
        snapshot_key: snapshotKey, ...metrics, raw_metrics: item
      }, { onConflict: "content_item_id,snapshot_key" });
      if (metricError) throw metricError;
      saved++;
    }

    await supabase.from("sync_runs").insert({
      user_id: user.id, provider: "metricool", status: "succeeded",
      records_seen: combined.length, records_saved: saved, completed_at: new Date().toISOString()
    });
    return NextResponse.json({ status: "synced", from, to, posts: posts.length, reels: reels.length, saved });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Metricool senkronizasyonu başarısız." }, { status: 500 });
  }
}
