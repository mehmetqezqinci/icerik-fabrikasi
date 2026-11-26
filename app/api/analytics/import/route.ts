import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseRequestClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type IncomingItem = {
  externalId: string;
  type: "reel" | "post" | "carousel";
  publishedAt: string;
  caption?: string | null;
  contentTitle?: string | null;
  permalink?: string | null;
  source?: string;
  reach?: number | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  saves?: number | null;
  follows?: number | null;
  avgWatchSeconds?: number | null;
  retentionPercent?: number | null;
  skipRatePercent?: number | null;
  durationSeconds?: number | null;
  metadata?: Record<string, unknown>;
};
type Incoming = {
  schemaVersion?: number;
  content: IncomingItem[];
  accountSnapshots?: Array<{
    date: string; followers?: number | null; reach?: number | null; views?: number | null;
    engagedAccounts?: number | null; followersGained?: number | null; followersLost?: number | null;
  }>;
};

const numericOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export async function POST(request: Request) {
  try {
    const { supabase, user } = await createSupabaseRequestClient(request);
    const body = await request.json() as Incoming;
    if (!Array.isArray(body.content) || body.content.length < 1 || body.content.length > 500) {
      return NextResponse.json({ error: "content alanı 1–500 kayıt içeren bir dizi olmalı." }, { status: 400 });
    }

    const { data: account, error: accountError } = await supabase.from("social_accounts").upsert({
      user_id: user.id, platform: "instagram", provider: "metricool",
      external_account_id: "dilaraceylandernegi", account_label: "dilaraceylandernegi",
      connection_status: "connected"
    }, { onConflict: "user_id,platform,provider,external_account_id" }).select("id").single();
    if (accountError) throw accountError;

    let saved = 0;
    let skipped = 0;
    for (const item of body.content) {
      if (!item.externalId || !item.publishedAt || !["reel", "post", "carousel"].includes(item.type) || Number.isNaN(Date.parse(item.publishedAt))) {
        skipped++;
        continue;
      }
      const source = item.source || "metricool_export";
      const metadata = {
        ...(item.metadata || {}),
        contentTitle: item.contentTitle || null,
        dataSource: source,
        durationSeconds: numericOrNull(item.durationSeconds)
      };
      const { data: content, error: contentError } = await supabase.from("content_items").upsert({
        user_id: user.id, social_account_id: account.id, external_content_id: item.externalId,
        platform: "instagram", content_type: item.type, caption: item.caption || null,
        permalink: item.permalink || null, published_at: item.publishedAt,
        metadata
      }, { onConflict: "user_id,platform,external_content_id" }).select("id").single();
      if (contentError) throw contentError;

      const metrics = {
        reach: numericOrNull(item.reach), views: numericOrNull(item.views),
        likes: numericOrNull(item.likes), comments: numericOrNull(item.comments),
        shares: numericOrNull(item.shares), saves: numericOrNull(item.saves),
        follows: numericOrNull(item.follows), avg_watch_seconds: numericOrNull(item.avgWatchSeconds),
        retention_percent: numericOrNull(item.retentionPercent), skip_rate_percent: numericOrNull(item.skipRatePercent)
      };
      const snapshotKey = createHash("sha256").update(JSON.stringify({ source, metrics })).digest("hex");
      const { error: metricError } = await supabase.from("content_metric_snapshots").upsert({
        user_id: user.id, content_item_id: content.id, source,
        snapshot_key: snapshotKey, ...metrics, raw_metrics: item
      }, { onConflict: "content_item_id,snapshot_key" });
      if (metricError) throw metricError;
      saved++;
    }

    let accountSaved = 0;
    for (const snap of body.accountSnapshots || []) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(snap.date)) continue;
      const { error: snapshotError } = await supabase.from("account_metric_snapshots").upsert({
        user_id: user.id, social_account_id: account.id, captured_on: snap.date,
        followers: numericOrNull(snap.followers), reach: numericOrNull(snap.reach),
        views: numericOrNull(snap.views), engaged_accounts: numericOrNull(snap.engagedAccounts),
        followers_gained: numericOrNull(snap.followersGained), followers_lost: numericOrNull(snap.followersLost)
      }, { onConflict: "social_account_id,captured_on" });
      if (snapshotError) throw snapshotError;
      accountSaved++;
    }

    await supabase.from("sync_runs").insert({
      user_id: user.id, provider: "instagram_file_import", status: "succeeded",
      records_seen: body.content.length, records_saved: saved, completed_at: new Date().toISOString()
    });
    return NextResponse.json({
      status: "imported", contentReceived: body.content.length,
      contentSaved: saved, skipped, accountSnapshotsSaved: accountSaved,
      sources: [...new Set(body.content.map((item) => item.source || "metricool_export"))]
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Veri aktarımı başarısız." }, { status: 500 });
  }
}
