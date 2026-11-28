import { NextResponse } from "next/server";
export const runtime="nodejs";
export async function POST(){
 return NextResponse.json({error:"Bu bağımsız V6 sürümünde sunucu/veritabanı aktarımı devre dışıdır. Haftalık verileri ana ekrandaki Excel Hafızası bölümünden yükleyin."},{status:410});
}
