# V6 Instagram veri paketi — kaynak ve kalite notları

Paket tarihi: 26 Kasım 2026

## İçerik kapsamı
- 36 manuel Excel kaydı: 26 Reels, 10 kalıcı gönderi; 1 Ağustos–25 Kasım 2026.
- 19 Metricool kaydı: 13 Reels, 6 gönderi; 1 Eylül–26 Kasım 2026.
- 6 günlük hesap ölçümü.
- Story ve haftalık saha dağıtım sekmesi kullanıcı talebiyle bu sürümden çıkarıldı.

## Veri kalitesi kararları
- Excel'de erişim ve takipçi kazanımı sütunları bütün satırlarda 0 olarak girilmiş. Bu alanlar gerçek sıfır sayılmayıp null/unknown olarak normalize edildi.
- Statik gönderilerde video süresi ve ortalama izlenme süresi 0 ise uygulanamaz/bilinmiyor olarak null'a dönüştürüldü.
- Excel'deki gerçek etkileşim sayıları (beğeni, yorum, paylaşım, kaydetme) aynen korundu.
- Metricool kayıtları kendi kaynak değerleriyle korundu.
- Kaynaklar arası olası mükerrer içerikler otomatik eşleştirilmedi; bazı tarih ve başlıklar uyuşmadığı için AI'ya bu sınırlama bildiriliyor.
- Story metrikleri bu veri paketinde ve bu analiz sürümünde yoktur.

## Analiz ilkeleri
1. Metricool verisi varsa erişim, görüntülenme ve izlenme kalitesi için öncelikli kaynak kabul edilir.
2. Manuel Excel, etkileşim metrikleri ve içerik bağlamı için ek kaynak olarak kullanılır.
3. Kaynak uyuşmazlığı varsa sessizce uzlaştırma yapılmaz.
4. Null değerler sıfır değildir.
5. Küçük örneklemden nedensellik veya kesin gelecek performansı çıkarılmaz.
6. Çocuk ve yardım alan kişilerin kimliğini açığa çıkaracak çıkarım/öneri üretilmez.
