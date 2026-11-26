# Dilara Ceylan Yardım Derneği — İçerik Fabrikası V6

V6, V5 verisini kaybetmeden korumak ve gerçek Instagram performans verilerini kaynak bilgisiyle AI analiz motoruna bağlamak için geliştirilmektedir.

## Geliştirme dalı
`v6-foundation`

## Teknoloji
- Next.js + TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- OpenAI Responses API (varsayılan model: `gpt-6.2-sol`)
- Metricool dışa aktarımı / JSON veri paketi (ücretli Metricool API erişimi gerekmez)
- Vercel

## Yerel kurulum
1. Node.js 20.9+ kurun.
2. `npm install`
3. `.env.example` dosyasını `.env.local` olarak kopyalayın ve değerleri doldurun.
4. Supabase SQL Editor'de `supabase/migrations/0001_initial_schema.sql` dosyasını çalıştırın.
5. `npm run dev`

## Zorunlu sunucu ortam değişkenleri
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `V6_ADMIN_EMAIL` — tek yönetici hesabının e-posta adresi
- `OPENAI_API_KEY`
- `OPENAI_ANALYSIS_MODEL` — varsayılan `gpt-6.2-sol`

Gerçek anahtarları GitHub'a koymayın. Yalnızca Vercel Environment Variables veya yerel `.env.local` kullanın. ChatGPT aboneliği OpenAI API kullanım ücretini kapsamaz; API anahtarı ve faturalandırma ayrıca yapılandırılır.

## V5 verisini koruma
1. V5 uygulamasını verilerin bulunduğu aynı tarayıcıda açın.
2. **Dernek Hafızası & Veri** bölümündeki **V5 yedeği indir** düğmesine basın.
3. İndirilen JSON dosyasını V6'da `/dashboard` sayfasından içe aktarın.
4. V6 önce yedeğin tamamını SHA-256 özetiyle `legacy_imports` tablosunda saklar. Aynı dosya ikinci kez çoğaltılmaz.
5. Profil ve haftalık brifing `brand_memory` tablosuna aktarılır. Diğer V5 koleksiyonları özgün JSON içinde eksiksiz korunur.

V5 tarayıcı verileri bu çalışma alanından doğrudan okunamaz; bu nedenle V5 arayüzünden JSON dışa aktarımı gerekir. V5 localStorage verisi silinmemelidir.

## Instagram performans verisi
- Metricool API veya ücretli Metricool paketi zorunlu değildir.
- `/dashboard` sayfasına normalize edilmiş JSON performans paketi yüklenir.
- Her kayıt `source` alanıyla etiketlenir. Metricool dışa aktarımı `metricool_export`, kullanıcının Excel tablosu `instagram_manual_excel` kaynağıyla saklanır.
- Bilinmeyen değerler `null` kalır; sıfır olarak yorumlanmaz.
- Kaynaklar arasında olası aynı paylaşım varsa, bağlantı veya kesin eşleşme olmadan otomatik birleştirme yapılmaz. AI analizinde kaynak farkı ve olası mükerrerlik açıkça belirtilir.
- Bu geliştirme turunda Story ve haftalık dağıtım verileri kapsam dışıdır. Analiz yalnızca Reels ve kalıcı gönderileri kapsar.

## Mevcut veri paketi
Hazırlanan ilk paket: 36 Excel kaydı + 19 Metricool kaydı + 6 günlük hesap ölçümü. Excel aralığı 1 Ağustos–25 Kasım 2026; Metricool dönemi 1 Eylül–26 Kasım 2026. Kaynak dosyalar otomatik eşleştirilmemiştir. Paket içindeki notlar veri kalitesi ve kapsam sınırlamalarını açıklar.

## AI analiz akışı
Instagram JSON -> `content_items` + `content_metric_snapshots` -> `/api/ai/analyze` -> OpenAI Responses API -> `ai_analyses`.

AI'ya yalnızca onaylanmış dernek profil alanları ve performans/caption verileri gönderilir. V5'in ham yedek payload'ı doğrudan AI'ya gönderilmez. Çocukların ve yardım alan kişilerin kimliğini açığa çıkaracak içerik önerileri engellenir.

## API uçları
- `POST /api/migrate/v5` — V5 JSON yedeğini korur ve temel hafızayı aktarır.
- `POST /api/analytics/import` — Metricool + manuel Excel normalize JSON paketini içe aktarır.
- `POST /api/ai/analyze` — saklanan performans verileri üzerinden kaynak farkını koruyarak AI analizi yapar.

## Durum ve sınırlar
V6 temel arayüzü, Supabase şeması, V5 yedek koruma/aktarma, kaynak etiketli performans aktarımı ve AI analiz akışı kodlandı. Supabase projesi, Vercel ortam değişkenleri ve OpenAI API anahtarı henüz yapılandırılmadığı için canlı kullanım ve uçtan uca test tamamlanmış değildir.
