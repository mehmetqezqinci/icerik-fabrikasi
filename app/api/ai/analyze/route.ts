import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db, ADMIN_USER_ID } from "@/lib/db";
import { buildPerformanceAnalysisPrompt, type PerformanceRow } from "@/lib/ai/performance-prompt";
export const runtime="nodejs";
export async function POST(){
 try{
  await requireAdmin();
  if(!process.env.OPENAI_API_KEY) return NextResponse.json({error:"OPENAI_API_KEY Vercel ortam değişkeninde tanımlı değil."},{status:503});
  const sql=db();
  const metricRows=await sql`select m.source,m.reach,m.views,m.likes,m.comments,m.shares,m.saves,m.follows,m.avg_watch_seconds,m.retention_percent,m.skip_rate_percent,m.captured_at,
   c.caption,c.permalink,c.content_type,c.published_at,c.metadata
   from content_metric_snapshots m join content_items c on c.id=m.content_item_id
   where m.user_id=${ADMIN_USER_ID} and c.user_id=${ADMIN_USER_ID} order by m.captured_at desc limit 150`;
  if(!metricRows.length) return NextResponse.json({error:"Analiz için henüz performans verisi yok. Önce Instagram veri paketini içe aktarın."},{status:409});
  const rows:PerformanceRow[]=metricRows.map((r:any)=>({source:r.source,reach:r.reach,views:r.views,likes:r.likes,comments:r.comments,shares:r.shares,saves:r.saves,follows:r.follows,avg_watch_seconds:r.avg_watch_seconds,retention_percent:r.retention_percent,skip_rate_percent:r.skip_rate_percent,published_at:r.published_at,caption:r.caption,permalink:r.permalink,content_type:r.content_type,content_title:r.metadata?.contentTitle||null,duration_seconds:r.metadata?.durationSeconds||null}));
  const memories=await sql`select memory_value from brand_memory where user_id=${ADMIN_USER_ID} and memory_key='org_profile' limit 1`;
  const raw=(memories[0]?.memory_value||{}) as Record<string,unknown>;
  const safeKeys=["orgName","location","mission","beneficiaries","services","audience","tone","differentiators","platforms","topContent","currentFollowers","targetFollowers","teamCapacity","equipment","weeklyOutput","rules","umut"];
  const profile=Object.fromEntries(safeKeys.filter(k=>typeof raw[k]==="string").map(k=>[k,raw[k]]));
  const prompt=buildPerformanceAnalysisPrompt(rows,profile);
  const model=process.env.OPENAI_ANALYSIS_MODEL||"gpt-6.2-sol";
  const response=await new OpenAI({apiKey:process.env.OPENAI_API_KEY}).responses.create({model,input:[{role:"system",content:prompt.system},{role:"user",content:prompt.user}]});
  const result=response.output_text;
  const sourceCounts=rows.reduce<Record<string,number>>((a,r)=>{const k=r.source||"unknown";a[k]=(a[k]||0)+1;return a;},{});
  const saved=await sql`insert into ai_analyses(user_id,analysis_type,model,prompt_version,input_window,result)
   values(${ADMIN_USER_ID},'instagram_performance',${model},'v2-source-aware',${sql.json({rows:rows.length,sourceCounts})},${sql.json({text:result})}) returning id`;
  return NextResponse.json({analysisId:saved[0].id,model,rowsAnalyzed:rows.length,sourceCounts,analysis:result});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"AI analizi başarısız."},{status:500});}
}
