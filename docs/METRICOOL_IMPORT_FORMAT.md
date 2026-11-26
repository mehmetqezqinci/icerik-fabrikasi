# Metricool -> V6 içe aktarma biçimi

V6, Metricool'dan alınan içerik ve hesap ölçümlerini `POST /api/analytics/import` ile alır. İstek oturum açmış yönetici tarafından yapılmalıdır.

Örnek JSON:

```json
{
  "content": [
    {
      "externalId": "instagram-reel-shortcode",
      "type": "reel",
      "publishedAt": "2026-11-19T00:00:00+03:00",
      "caption": "İçerik açıklaması",
      "permalink": "https://www.instagram.com/reel/...",
      "reach": 3913,
      "views": 5373,
      "likes": 104,
      "comments": 19,
      "shares": 25,
      "saves": 4,
      "follows": null,
      "avgWatchSeconds": 9.765,
      "retentionPercent": 42.3,
      "skipRatePercent": null
    }
  ],
  "accountSnapshots": [
    {
      "date": "2026-11-25",
      "followers": 8722,
      "views": 1603,
      "reach": 683,
      "engagedAccounts": 65,
      "followersGained": 8,
      "followersLost": 4
    }
  ]
}
```

- Metricool connector'ından ChatGPT'ye erişen veri, kendi başına Vercel uygulamasına kimlik doğrulamalı API erişimi vermez.
- Otomatik senkronizasyon için ayrıca Metricool API erişim bilgisi ve izinleri gerekir. Bunlar mevcut değilse Metricool CSV/JSON dışa aktarımı veya Meta Graph API alternatifi kullanılmalıdır.
- Tekrarlanan aynı içerik ölçümü `snapshot_key` ile yinelenmeden saklanır.
- Eksik Metricool alanları `null` kalır; sıfır varsayılmaz.
- Ham Metricool verisi, tarih aralığı ve kaynak notu korunmalıdır.
