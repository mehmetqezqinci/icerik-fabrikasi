const modules=[
 ["01","Akıllı Dashboard","Hesap ve içerik performansının tek görünümü","Hazırlanıyor"],
 ["02","Performans Laboratuvarı","Reels ve gönderileri gerçek sonuçlarıyla karşılaştır","Veri aktarımı bekleniyor"],
 ["03","AI İçerik Fabrikası","Performanstan öğrenen fikir, kanca ve senaryo üretimi","AI motoru sırada"],
 ["04","Reels Analiz Merkezi","İzlenme süresi, tutma, paylaşım ve takip kazanımı","Veri aktarımı bekleniyor"],
 ["05","Yayın Planlayıcı","Fikirden yayına içerik iş akışı","Hazırlanıyor"],
 ["06","Dernek Hafızası","Saha brifingi, doğrulanmış faaliyet ve marka kuralları","V5 aktarımı sırada"],
 ["07","Deney ve Öğrenme","İçerik testleri ve sonuçlardan öğrenme","Hazırlanıyor"],
 ["08","ChatGPT Strateji Köprüsü","Raporları ChatGPT ile derinlemesine değerlendirme","Hazırlanıyor"]
];
export default function Home(){return <main className="min-h-screen px-5 py-8 md:px-10 md:py-12"><div className="mx-auto max-w-7xl">
<header className="flex flex-col gap-6 border-b border-[var(--line)] pb-8 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 text-xs font-semibold uppercase tracking-[.28em] text-[var(--gold)]">Dilara Ceylan Yardım Derneği</div><h1 className="text-4xl font-semibold tracking-tight md:text-6xl">İçerik & Büyüme <span className="text-[var(--gold)]">V6</span></h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Veriye dayalı içerik stratejisi, yapay zekâ destekli üretim ve sürdürülebilir sosyal medya büyümesi.</p></div><a href="/login" className="rounded-xl bg-[var(--gold)] px-5 py-3 text-center text-sm font-semibold text-black">Yönetici girişi</a></header>
<section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">{[["01","Gerçek veri","Metricool / Instagram"],["02","Kalıcı hafıza","Neon PostgreSQL"],["03","AI motoru","OpenAI API"],["04","Strateji","ChatGPT + V6"]].map(([n,t,s])=><div key={n} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"><div className="text-xs tracking-widest text-[var(--gold)]">{n}</div><div className="mt-3 text-lg font-semibold">{t}</div><div className="mt-1 text-sm text-[var(--muted)]">{s}</div></div>)}</section>
<section className="mb-4"><div className="text-xs uppercase tracking-[.22em] text-[var(--gold)]">Çalışma alanı</div><h2 className="mt-2 text-2xl font-semibold">V6 Modülleri</h2></section>
<section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{modules.map(([n,t,d,s])=><article key={n} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"><div className="flex items-center justify-between"><span className="text-xs text-[var(--gold)]">{n}</span><span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] text-[var(--muted)]">{s}</span></div><h3 className="mt-5 text-lg font-semibold">{t}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-[var(--muted)]">{d}</p></article>)}</section>
<footer className="mt-10 border-t border-[var(--line)] pt-5 text-xs text-[var(--muted)]">V6 · Neon PostgreSQL + Vercel · Aşamalı geliştirme sürümü.</footer></div></main>}
