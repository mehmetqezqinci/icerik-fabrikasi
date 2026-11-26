# V5 İncelemesi — V6'ya geçiş notları

Kaynak: Library dosyaları `Dilara_Ceylan_Content_Factory_V5.html`, `README_Content_Factory_V5.md`, `Dilara_Ceylan_Content_Factory_V5_AUDIT.md`.

## V5'in belgelenmiş özellikleri
- Tek HTML dosyası içinde uygulama.
- V4'ten devralınan 9 istasyon ve 143 başlangıç fikir çekirdeği.
- Dernek Hafızası ve Haftalık Saha Brifingi.
- Doğrulanmış sayı anahtarı; açıkça doğrulanmayan sayısal iddiaların üretimini engelleme.
- İstasyon, hedef, ton, platform ve haftalık faaliyetleri birleştiren kural/şablon tabanlı fikir motoru; 3 alternatif üretim.
- Fikir imzaları ve yerel tekrar azaltma hafızası.
- Haftalık saha brifingini kullanan Trend Radar uyarlaması.
- Harici LLM'ye taşınmak üzere prompt bridge.
- Profil, brifing, geçmiş, arşiv, analitik, takvim, büyüme ve rotasyon verileri için JSON yedekleme/geri yükleme.
- V4 localStorage anahtarlarıyla geriye dönük uyumluluk hedefi.

## Belgelenmiş teknik sınırlar
- Gerçek LLM API entegrasyonu yok.
- Canlı trend kaynağı/API entegrasyonu yok.
- Instagram/TikTok/YouTube Insights bağlantısı ve otomatik yayınlama yok.
- Veriler tarayıcı localStorage alanında; cihaz/tarayıcı bağımlı.
- Tek dosyalı monolitik HTML/CSS/JS mimarisi.
- Semantik tekrar tespiti sınırlı.
- E2E, erişilebilirlik, gerçek tarayıcı kalıcılığı ve üretim güvenliği testleri genişletilmeli.

## Belgelenmiş test durumu
V5 denetim notu; DOM/JSON doğrulaması, gömülü veri parse kontrolü, JavaScript syntax kontrolü ve Playwright ile bazı temel akışların test edildiğini bildiriyor. Aynı rapor, gerçek tarayıcı localStorage kalıcılığının bu ortamda tam doğrulanmadığını belirtiyor. Bu nedenle tüm üretim davranışı bağımsız olarak yeniden test edilmelidir.

## V6 geçiş kuralları
1. V5 kaynak dosyası değiştirilmeyecek; arşiv/legacy sürüm olarak saklanacak.
2. V5 JSON export/import formatı incelenip V6 için migration/önizleme aracı yazılacak.
3. V5'teki 9 istasyon, dernek hafızası, saha brifingi, etik kurallar ve içerik iş akışları kaybolmayacak.
4. V5 localStorage verisi otomatik silinmeyecek veya sessizce dönüştürülmeyecek.
5. Gerçek kişisel/sensitif aile ve çocuk verileri taşınmayacak; anonimleştirme zorunlu olacak.
6. Her yeni modül testlerle ve aşamalı dağıtımla eklenecek.
