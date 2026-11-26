# V6 — Dilara Ceylan Yardım Derneği İçerik ve Büyüme Sistemi

## Ürün kararı
V6 iki katmanlı çalışır:
1. Bağımsız web uygulaması: veri toplama, kalıcı hafıza, analiz, içerik üretimi ve iş akışı.
2. ChatGPT strateji katmanı: V6 raporlarını yorumlama, strateji geliştirme ve içerik kararlarını birlikte değerlendirme.

## Mimari
- Web: Next.js App Router + TypeScript
- UI: Tailwind CSS
- Hosting/API: Vercel
- Database/Auth: Supabase (PostgreSQL + Auth + Row Level Security)
- AI: OpenAI Responses API, sunucu tarafı; yapılandırılmış JSON çıktıları
- Analytics source: Metricool API erişimi doğrulanacak; alternatif Meta Graph API
- Source control: GitHub

## Veri akışı
Metricool/Meta -> Vercel ingestion endpoint -> validation/normalization -> Supabase
Supabase -> analytics service -> AI analysis/content generation -> dashboard
V6 reports -> ChatGPT strategy workflow (later: authenticated MCP/API bridge)

## Ana modüller
1. Dashboard
2. İçerik Performans Laboratuvarı
3. AI İçerik Fabrikası
4. Reels Analiz Merkezi
5. Yayın Planlayıcı
6. Dernek Hafızası ve saha brifingi
7. Deney ve Öğrenme Merkezi
8. ChatGPT Strateji Köprüsü

## Veri modeli (ilk taslak)
- profiles
- social_accounts
- content_items
- content_metric_snapshots
- account_metric_snapshots
- field_activities
- content_ideas
- content_scripts
- experiments
- ai_analyses
- brand_memory
- sync_runs

## Güvenlik ilkeleri
- API anahtarları yalnızca sunucu ortam değişkenlerinde tutulur.
- Supabase RLS varsayılan olarak kapalı erişim değil, açıkça izinli erişim sağlayacak.
- Instagram/Metricool tokenları tarayıcıya gönderilmez.
- Çocuklar ve yardım alan ailelerin isim, adres, okul, telefon, sağlık/hukuk bilgileri AI'ya aktarılmaz.
- Saha sayıları yalnızca doğrulanmış durumuyla yayın metinlerine dahil edilir.
- İçerik yayınlama insan onayı olmadan otomatik yapılmaz.

## İlkeler
- Görüntülenme tek başarı ölçütü değildir. Erişim, izlenme kalitesi, paylaşım, kaydetme, içerikten gelen takip, profil ziyareti ve uygun olduğunda bağışçı/gönüllü dönüşümü birlikte izlenir.
- Küçük veri örneklerinde kesin nedensellik veya izlenme tahmini iddia edilmez.
- Kaynak verinin kapsama tarihleri ve eksikleri her raporda görünür olur.

## Aşamalar
- V6.1: mevcut V5 kodunun korunması, Next.js iskeleti, kalite kontrolleri
- V6.2: Supabase şeması, Auth ve RLS
- V6.3: Metricool/Meta veri senkronizasyonu
- V6.4: dashboard ve içerik analizi
- V6.5: OpenAI AI motoru
- V6.6: ChatGPT strateji köprüsü
- V6.7: deneyler, öğrenme ve iyileştirme

## Durum
Bu dosya mimari başlangıç sözleşmesidir. Entegrasyonlar doğrulanmadan çalışıyor kabul edilmez.
