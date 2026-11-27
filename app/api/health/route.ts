import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime="nodejs";
export async function GET(){
 try{const sql=db();const rows=await sql`select current_database() as database, now() as server_time`;return NextResponse.json({database:"connected",name:rows[0].database,serverTime:rows[0].server_time});}
 catch(error){return NextResponse.json({database:"disconnected",error:error instanceof Error?error.message:"Neon bağlantısı başarısız."},{status:503});}
}
