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
};

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Önce yönetici girişi yapmalısınız." }, { status: 401 });
    const body = await request.json() as Incoming;
    if (!Array.isArray(body.content) || body.content.length > 500) return NextResponse.json({ error: "content alanı en fazla 500 kayıt içeren dizi olmalı." }, { status: 400 });

    const { data: account, error: accountError } = await supabase.from("social_accounts").upsert({
      user_id: user.id, platform: "instagram", provider: "metricool", account_label: "dilaraceylandernegi",
      connection_status: "connected"
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
      const { error: metricError } = await supabase.from("content_metric_snapshots").insert({
        user_id: user.id, content_item_id: content.id, source: "metricool",
        reach: item.reach ?? null, views: item.views ?? null, likes: item.likes ?? null,
        comments: item.comments ?? null, shares: item.shares ?? null, saves: item.saves ?? null,
        follows: item.follows ?? null, avg_watch_seconds: item.avgWatchSeconds ?? null,
        retention_percent: item.retentionPercent ?? null, skip_rate_percent: item.skipRatePercent ?? null
      });
      if (metricError) throw metricError;
      saved++;
    }
    return NextResponse.json({ status: "imported", received: body.content.length, saved });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Veri aktarımı başarısız." }, { status: 500 });
  }
}
