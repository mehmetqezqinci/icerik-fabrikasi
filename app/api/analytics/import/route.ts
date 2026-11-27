import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db, ADMIN_USER_ID } from "@/lib/db";
export const runtime="nodejs";
type Item={externalId:string;type:"reel"|"post"|"carousel";publishedAt:string;caption?:string|null;contentTitle?:string|null;permalink?:string|null;source?:string;reach?:number|null;views?:number|null;likes?:number|null;comments?:number|null;shares?:number|null;saves?:number|null;follows?:number|null;avgWatchSeconds?:number|null;retentionPercent?:number|null;skipRatePercent?:number|null;durationSeconds?:number|null;metadata?:Record<string,unknown>};
type Incoming={content:Item[];accountSnapshots?:Array<{date:string;followers?:number|null;reach?:number|null;views?:number|null;engagedAccounts?:number|null;followersGained?:number|null;followersLost?:number|null}>};
const num=(v:unknown):number|null=>typeof v==="number"&&Number.isFinite(v)?v:null;
export async function POST(request:Request){
 try{
  await requireAdmin(); const body=await request.json() as Incoming;
  if(!Array.isArray(body.content)||body.content.length<1||body.content.length>500) return NextResponse.json({error:"content alanı 1–500 kayıt içeren bir dizi olmalı."},{status:400});
  const sql=db();
  const accountRows=await sql`insert into social_accounts(user_id,platform,provider,external_account_id,account_label,connection_status)
   values(${ADMIN_USER_ID},'instagram','metricool','dilaraceylandernegi','dilaraceylandernegi','connected')
   on conflict(user_id,platform,provider,external_account_id) do update set connection_status='connected' returning id`;
  const accountId=accountRows[0].id; let saved=0,skipped=0;
  for(const item of body.content){
   if(!item.externalId||!item.publishedAt||!["reel","post","carousel"].includes(item.type)||Number.isNaN(Date.parse(item.publishedAt))){skipped++;continue;}
   const source=item.source||"metricool_export";
   const metadata={...(item.metadata||{}),contentTitle:item.contentTitle||null,dataSource:source,durationSeconds:num(item.durationSeconds)};
   const contentRows=await sql`insert into content_items(user_id,social_account_id,external_content_id,platform,content_type,caption,permalink,published_at,metadata)
    values(${ADMIN_USER_ID},${accountId},${item.externalId},'instagram',${item.type},${item.caption||null},${item.permalink||null},${item.publishedAt},${sql.json(metadata)})
    on conflict(user_id,platform,external_content_id) do update set social_account_id=excluded.social_account_id,content_type=excluded.content_type,caption=excluded.caption,permalink=excluded.permalink,published_at=excluded.published_at,metadata=excluded.metadata returning id`;
   const metrics={reach:num(item.reach),views:num(item.views),likes:num(item.likes),comments:num(item.comments),shares:num(item.shares),saves:num(item.saves),follows:num(item.follows),avg_watch_seconds:num(item.avgWatchSeconds),retention_percent:num(item.retentionPercent),skip_rate_percent:num(item.skipRatePercent)};
   const snapshotKey=createHash("sha256").update(JSON.stringify({source,metrics})).digest("hex");
   await sql`insert into content_metric_snapshots(user_id,content_item_id,source,snapshot_key,reach,views,likes,comments,shares,saves,follows,avg_watch_seconds,retention_percent,skip_rate_percent,raw_metrics)
    values(${ADMIN_USER_ID},${contentRows[0].id},${source},${snapshotKey},${metrics.reach},${metrics.views},${metrics.likes},${metrics.comments},${metrics.shares},${metrics.saves},${metrics.follows},${metrics.avg_watch_seconds},${metrics.retention_percent},${metrics.skip_rate_percent},${sql.json(item)})
    on conflict(content_item_id,snapshot_key) where snapshot_key is not null do update set raw_metrics=excluded.raw_metrics`;
   saved++;
  }
  let accountSaved=0;
  for(const snap of body.accountSnapshots||[]){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(snap.date)) continue;
   await sql`insert into account_metric_snapshots(user_id,social_account_id,captured_on,followers,reach,views,engaged_accounts,followers_gained,followers_lost)
    values(${ADMIN_USER_ID},${accountId},${snap.date},${num(snap.followers)},${num(snap.reach)},${num(snap.views)},${num(snap.engagedAccounts)},${num(snap.followersGained)},${num(snap.followersLost)})
    on conflict(social_account_id,captured_on) do update set followers=excluded.followers,reach=excluded.reach,views=excluded.views,engaged_accounts=excluded.engaged_accounts,followers_gained=excluded.followers_gained,followers_lost=excluded.followers_lost`;
   accountSaved++;
  }
  await sql`insert into sync_runs(user_id,provider,status,records_seen,records_saved,completed_at) values(${ADMIN_USER_ID},'instagram_file_import','succeeded',${body.content.length},${saved},now())`;
  return NextResponse.json({status:"imported",contentReceived:body.content.length,contentSaved:saved,skipped,accountSnapshotsSaved:accountSaved,sources:[...new Set(body.content.map(i=>i.source||"metricool_export"))]});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Veri aktarımı başarısız."},{status:500});}
}
