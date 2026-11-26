"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendLink() {
    setBusy(true); setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + "/dashboard" }
      });
      if (error) throw error;
      setMessage("Giriş bağlantısı e-posta adresinize gönderildi. Gelen kutunuzu kontrol edin.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Giriş bağlantısı gönderilemedi."); }
    finally { setBusy(false); }
  }

  return <main className="flex min-h-screen items-center justify-center px-5">
    <section className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-7">
      <div className="text-xs uppercase tracking-[.25em] text-[var(--gold)]">V6 yönetici girişi</div>
      <h1 className="mt-3 text-2xl font-semibold">Hoş geldin</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Yönetici e-posta adresine tek kullanımlık güvenli giriş bağlantısı gönderelim.</p>
      <label className="mt-6 block text-sm">E-posta adresi</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" className="mt-2 w-full rounded-xl border border-[var(--line)] bg-black/20 px-4 py-3 outline-none focus:border-[var(--gold)]" placeholder="ornek@eposta.com"/>
      <button onClick={sendLink} disabled={busy || !email.includes("@")} className="mt-4 w-full rounded-xl bg-[var(--gold)] px-4 py-3 font-semibold text-black disabled:opacity-50">{busy ? "Gönderiliyor..." : "Giriş bağlantısı gönder"}</button>
      {message && <p className="mt-4 text-sm text-[var(--muted)]">{message}</p>}
    </section>
  </main>;
}
