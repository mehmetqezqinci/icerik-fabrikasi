# Dilara Ceylan Yardım Derneği — İçerik Fabrikası V6

V6, eski V5 içerik fabrikasını koruyarak gerçek sosyal medya performans verilerini AI analiz motoruna bağlamak için geliştirilmektedir.

## Geliştirme dalı
`v6-foundation`

## Teknoloji
- Next.js + TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- OpenAI Responses API (varsayılan model: `gpt-6.2-sol`)
- Metricool API (Instagram posts/reels)
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
- `METRICOOL_API_TOKEN`
- `METRICOOL_USER_ID`
- `METRICOOL_BLOG_ID`

Gerçek anahtarları GitHub'a koymayın. Yalnızca Vercel Environment Variables veya yerel `.env.local` kullanın.

## V5 verisini koruma
1. V5 uygulamasını verilerin bulunduğu aynı tarayıcıda açın.
2. **Dernek Hafızası & Veri** bölümündeki **V5 yedeği indir** düğmesine basın.
3. İndirilen JSON dosyasını V6'da `/dashboard` sayfasından içe aktarın.
4. V6 önce yedeğin tamamını SHA-256 özetiyle `legacy_imports` tablosunda saklar. Aynı dosya ikinci kez çoğaltılmaz.
5. Profil ve haftalık brifing `brand_memory` tablosuna aktarılır. Diğer V5 koleksiyonları özgün JSON içinde eksiksiz korunur.

V5 tarayıcı verileri bu çalışma alanından doğrudan okunamaz; bu nedenle V5 arayüzünden JSON dışa aktarımı gerekir. V5 localStorage verisi silinmemelidir.

## Metricool
- Metricool API, Advanced ve Custom planlarında kullanılabilir. Free ve Starter planlarında API erişimi yoktur.
- Token, Metricool > Account Settings > API bölümünden alınır.
- Her istek `X-Mc-Auth` başlığında token, sorguda `userId` ve `blogId` kullanır.
- V6 `/api/metricool/sync` endpoint'i resmi `/v2/analytics/posts/instagram` ve `/v2/analytics/reels/instagram` uçlarını çağırır.
- Dashboard'da tarih aralığı seçip **Metricool API ile doğrudan senkronize et** düğmesini kullanın.
- Erişim planı API içermiyorsa, V6 JSON içe aktarma yolu da kullanılabilir.

## AI analiz akışı
Metricool -> `content_items` + `content_metric_snapshots` -> `/api/ai/analyze` -> OpenAI Responses API -> `ai_analyses`.

AI'ya yalnızca onaylanmış dernek profil alanları ve performans/caption verileri gönderilir. V5'in ham yedek payload'ı doğrudan AI'ya gönderilmez. Eksik metrikler sıfır varsayılmaz.

## API uçları
- `POST /api/migrate/v5` — V5 JSON yedeğini korur ve temel hafızayı aktarır.
- `POST /api/metricool/sync` — Metricool API'den seçilen tarih aralığındaki Instagram gönderi ve Reels kayıtlarını çeker.
- `POST /api/analytics/import` — normalize Metricool JSON içe aktarımı.
- `POST /api/ai/analyze` — saklanan performans verileri üzerinden AI analizi.

## Durum ve sınırlar
Bu dalda uygulama temeli, ilk Supabase şeması, V5 backup preservation/import, Metricool sync endpoint'i ve OpenAI analiz endpoint'i oluşturuldu. Henüz Supabase projesi, Vercel ortam değişkenleri veya Metricool API token'ı yapılandırılmadı; bu nedenle uçtan uca canlı senkronizasyon ve üretim derlemesi doğrulanmış değildir.
