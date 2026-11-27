"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  const router=useRouter();
  async function signIn() {
    setBusy(true); setMessage("");
    try {
      const response=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"Giriş yapılamadı.");
      router.replace("/dashboard"); router.refresh();
    } catch(e) { setMessage(e instanceof Error?e.message:"Giriş yapılamadı."); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center px-5"><section className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-7">
    <div className="text-xs uppercase tracking-[.25em] text-[var(--gold)]">V6 yönetici girişi</div><h1 className="mt-3 text-2xl font-semibold">Hoş geldin</h1>
    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Yönetici parolanla güvenli şekilde giriş yap.</p>
    <label className="mt-6 block text-sm">Yönetici parolası</label><input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" onKeyDown={e=>e.key==="Enter"&&signIn()} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-black/20 px-4 py-3 outline-none focus:border-[var(--gold)]" placeholder="Yönetici parolası"/>
    <button onClick={signIn} disabled={busy||!password} className="mt-4 w-full rounded-xl bg-[var(--gold)] px-4 py-3 font-semibold text-black disabled:opacity-50">{busy?"Kontrol ediliyor...":"Giriş yap"}</button>
    {message&&<p className="mt-4 text-sm text-rose-300">{message}</p>}
  </section></main>;
}
