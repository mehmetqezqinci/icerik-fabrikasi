"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ImportPack = { content: Array<Record<string, unknown>>; accountSnapshots?: Array<Record<string, unknown>>; notes?: string[] };

export default function DashboardPage() {
  const [v5File, setV5File] = useState<File | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState("");

  async function authHeaders() {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Oturum bulunamadı. Önce yönetici girişi yapın.");
    return { Authorization: "Bearer " + data.session.access_token };
  }

  async function importV5() {
    if (!v5File) return;
    setBusy("v5"); setMessage("");
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/migrate/v5", { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: await v5File.text() });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "V5 aktarımı başarısız.");
      setMessage("V5 yedeği korundu ve aktarıldı: " + JSON.stringify(result.summary || {}));
    } catch (e) { setMessage(e instanceof Error ? e.message : "V5 aktarımı başarısız."); }
    finally { setBusy(""); }
  }

  async function importPerformancePack() {
    if (!dataFile) return;
    setBusy("data"); setMessage("");
    try {
      const parsed = JSON.parse(await dataFile.text()) as ImportPack;
      if (!Array.isArray(parsed.content)) throw new Error("Dosyada content veri listesi bulunamadı.");
      const headers = await authHeaders();
      const response = await fetch("/api/analytics/import", {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Instagram verileri aktarılamadı.");
      setMessage(result.contentSaved + " içerik kaydı aktarıldı · " + result.accountSnapshotsSaved + " hesap ölçümü · " + result.skipped + " geçersiz kayıt atlandı. Kaynaklar: " + (result.sources || []).join(", "));
    } catch (e) { setMessage(e instanceof Error ? e.message : "Veri aktarımı başarısız."); }
    finally { setBusy(""); }
  }

  async function runAnalysis() {
    setBusy("ai"); setMessage(""); setAnalysis("");
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/ai/analyze", { method: "POST", headers });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "AI analizi başarısız.");
      setAnalysis(result.analysis || "");
      setMessage(result.rowsAnalyzed + " performans kaydı analiz edildi. Kaynaklar: " + JSON.stringify(result.sourceCounts || {}) + " · Model: " + result.model);
    } catch (e) { setMessage(e instanceof Error ? e.message : "AI analizi başarısız."); }
    finally { setBusy(""); }
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return <main className="min-h-screen px-5 py-8 md:px-10">
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-6">
        <div><div className="text-xs uppercase tracking-[.25em] text-[var(--gold)]">V6 veri merkezi</div><h1 className="mt-2 text-3xl font-semibold">Veri aktarımı ve AI laboratuvarı</h1></div>
        <div className="flex gap-3 text-sm"><Link href="/" className="text-[var(--muted)]">Ana panel</Link><button onClick={signOut} className="text-[var(--gold)]">Çıkış</button></div>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6">
          <div className="text-xs tracking-widest text-[var(--gold)]">01 · V5 KURTARMA</div>
          <h2 className="mt-3 text-xl font-semibold">V5 yedeğini koru ve aktar</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">V5 uygulamasından indirdiğin JSON yedeğini yükle. Orijinal yedek değişmeden arşivlenir; dernek profili ve haftalık brifing V6 hafızasına alınır. Aynı yedek ikinci kez çoğaltılmaz.</p>
          <input type="file" accept=".json,application/json" onChange={(e) => setV5File(e.target.files?.[0] || null)} className="mt-5 block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--panel-soft)] file:px-3 file:py-2 file:text-[var(--text)]"/>
          <button onClick={importV5} disabled={!v5File || !!busy} className="mt-4 rounded-xl bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-black disabled:opacity-40">{busy === "v5" ? "Aktarılıyor..." : "V5 yedeğini aktar"}</button>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6">
          <div className="text-xs tracking-widest text-[var(--gold)]">02 · GERÇEK INSTAGRAM VERİLERİ</div>
          <h2 className="mt-3 text-xl font-semibold">Performans veri paketini içe aktar</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Metricool dışa aktarımı ve doldurduğun Excel'deki Reels/gönderi verileri tek pakette tutulur. Kaynaklar ayrı etiketlenir; aynı paylaşım olabilecek kayıtlar otomatik birleştirilmez. API paketi veya ücretli Metricool API erişimi gerekmez.</p>
          <input type="file" accept=".json,application/json" onChange={(e) => setDataFile(e.target.files?.[0] || null)} className="mt-5 block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--panel-soft)] file:px-3 file:py-2 file:text-[var(--text)]"/>
          <button onClick={importPerformancePack} disabled={!dataFile || !!busy} className="mt-4 rounded-xl bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-black disabled:opacity-40">{busy === "data" ? "Veriler aktarılıyor..." : "Instagram veri paketini aktar"}</button>
          <p className="mt-3 text-xs text-[var(--muted)]">Bu sürümde Story ve haftalık dağıtım kayıtları bilerek analiz dışında bırakılmıştır.</p>
        </article>
      </section>

      <section className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6">
        <div className="text-xs tracking-widest text-[var(--gold)]">03 · YAPAY ZEKÂ</div>
        <h2 className="mt-3 text-xl font-semibold">Performans analizini çalıştır</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">V6, içe aktarılan gerçek Reels ve gönderi metriklerini kaynak bilgisiyle analiz eder. İçerik örüntülerini, paylaşım/kaydetme sinyallerini, yorumları, izlenme kalitesini ve sonraki test önerilerini raporlar.</p>
        <button onClick={runAnalysis} disabled={!!busy} className="mt-4 rounded-xl border border-[var(--gold)] px-4 py-3 text-sm font-semibold text-[var(--gold)] disabled:opacity-40">{busy === "ai" ? "Analiz ediliyor..." : "AI performans analizini başlat"}</button>
        {message && <p className="mt-4 whitespace-pre-wrap text-sm text-[var(--muted)]">{message}</p>}
        {analysis && <pre className="mt-5 max-h-[700px] overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-4 text-sm leading-6">{analysis}</pre>}
      </section>
      <p className="mt-6 text-xs leading-5 text-[var(--muted)]">Güvenlik: API anahtarlarını bu ekrana veya GitHub koduna yazma. Supabase ve OpenAI anahtarları yalnızca Vercel sunucu ortam değişkenlerinde tutulmalıdır.</p>
    </div>
  </main>;
}
