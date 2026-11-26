import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Incoming = {
  content: Array<{
    externalId: string; type: "reel" | "post"; publishedAt: string; caption?: string; permalink?: string;
    reach?: number|null; views?: number|null; likes?: number|null; comments?: number|null;
    shares?: number|null; saves?: number|null; follows?: number|null;
    avgWatchSeconds?: number|null; retentionPercent?: number|null; skipRatePercent?: number|null;
  }>;
  accountSnapshots?: Array<{
    date: string; followers?: number|null; reach?: number|null; views?: number|null;
    engagedAccounts?: number|null; followersGained?: number|null; followersLost?: number|null;
  }>;
};

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Önce yönetici girişi yapmalısınız." }, { status: 401 });
    const body = await request.json() as Incoming;
    if (!Array.isArray(body.content) || body.content.length > 500) return NextResponse.json({ error: "content alanı en fazla 500 kayıt içeren dizi olmalı." }, { status: 400 });

    const { data: account, error: accountError } = await supabase.from("social_accounts").upsert({
      user_id: user.id, platform: "instagram", provider: "metricool", external_account_id: "dilaraceylandernegi",
      account_label: "dilaraceylandernegi", connection_status: "connected"
    }, { onConflict: "user_id,platform,provider,external_account_id" }).select("id").single();
    if (accountError) throw accountError;

    let saved = 0;
    for (const item of body.content) {
      if (!item.externalId || !item.publishedAt || !["reel","post"].includes(item.type)) continue;
      const { data: content, error: contentError } = await supabase.from("content_items").upsert({
        user_id: user.id, social_account_id: account.id, external_content_id: item.externalId,
        platform: "instagram", content_type: item.type, caption: item.caption || null,
        permalink: item.permalink || null, published_at: item.publishedAt
      }, { onConflict: "user_id,platform,external_content_id" }).select("id").single();
      if (contentError) throw contentError;
      const metrics = {
        reach: item.reach ?? null, views: item.views ?? null, likes: item.likes ?? null,
        comments: item.comments ?? null, shares: item.shares ?? null, saves: item.saves ?? null,
        follows: item.follows ?? null, avg_watch_seconds: item.avgWatchSeconds ?? null,
        retention_percent: item.retentionPercent ?? null, skip_rate_percent: item.skipRatePercent ?? null
      };
      const snapshotKey = createHash("sha256").update(JSON.stringify(metrics)).digest("hex");
      const { error: metricError } = await supabase.from("content_metric_snapshots").upsert({
        user_id: user.id, content_item_id: content.id, source: "metricool",
        snapshot_key: snapshotKey, ...metrics
      }, { onConflict: "content_item_id,snapshot_key" });
      if (metricError) throw metricError;
      saved++;
    }

    let accountSaved = 0;
    for (const snap of body.accountSnapshots || []) {
      if (!snap.date) continue;
      const { error: snapshotError } = await supabase.from("account_metric_snapshots").upsert({
        user_id: user.id, social_account_id: account.id, captured_on: snap.date,
        followers: snap.followers ?? null, reach: snap.reach ?? null, views: snap.views ?? null,
        engaged_accounts: snap.engagedAccounts ?? null, followers_gained: snap.followersGained ?? null,
        followers_lost: snap.followersLost ?? null
      }, { onConflict: "social_account_id,captured_on" });
      if (snapshotError) throw snapshotError;
      accountSaved++;
    }

    return NextResponse.json({ status: "imported", contentReceived: body.content.length, contentSaved: saved, accountSnapshotsSaved: accountSaved });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Veri aktarımı başarısız." }, { status: 500 });
  }
}
