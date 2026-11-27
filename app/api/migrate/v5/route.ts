import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db, ADMIN_USER_ID } from "@/lib/db";
import { extractV5Memory, validateV5Backup } from "@/lib/v5-import";
export const runtime="nodejs";

export async function POST(request:Request) {
  try {
    await requireAdmin();
    const raw=await request.text();
    if(raw.length>12_000_000) return NextResponse.json({error:"Yedek dosyası 12 MB sınırını aşıyor."},{status:413});
    let parsed:unknown; try{parsed=JSON.parse(raw);}catch{return NextResponse.json({error:"Geçerli bir JSON yedeği yükleyin."},{status:400});}
    const checked=validateV5Backup(parsed); if(!checked.ok) return NextResponse.json({error:checked.error},{status:400});
    const payload=checked.payload, hash=createHash("sha256").update(raw).digest("hex"), sql=db();
    const existing=await sql`select id from legacy_imports where user_id=${ADMIN_USER_ID} and payload_sha256=${hash} limit 1`;
    if(existing.length) return NextResponse.json({status:"already_imported",importId:existing[0].id,summary:checked.summary});
    const memory=extractV5Memory(payload);
    const rows=await sql`insert into legacy_imports(user_id,source_app,source_version,exported_at,payload_sha256,payload,import_summary)
      values(${ADMIN_USER_ID},${String(payload.app||"Dilara Ceylan Content Factory V5")},${Number(payload.version||5)},${typeof payload.exportedAt==="string"?payload.exportedAt:null},${hash},${sql.json(payload as any)},${sql.json(checked.summary as any)}) returning id`;
    const importId=rows[0].id;
    const memories=[
      ["org_profile",memory.orgProfile],["weekly_brief",memory.weeklyBrief],
      ["v5_backup_metadata",{importId,sourceVersion:payload.version||5,summary:checked.summary,exportedAt:payload.exportedAt||null}]
    ];
    for(const [key,value] of memories) await sql`insert into brand_memory(user_id,memory_key,memory_value) values(${ADMIN_USER_ID},${key},${sql.json(value as any)}) on conflict(user_id,memory_key) do update set memory_value=excluded.memory_value,updated_at=now()`;
    return NextResponse.json({status:"backup_preserved_and_memory_migrated",importId,summary:checked.summary});
  } catch(error) { return NextResponse.json({error:error instanceof Error?error.message:"Beklenmeyen sunucu hatası."},{status:500}); }
}
