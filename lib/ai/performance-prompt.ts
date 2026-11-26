export type PerformanceRow = {
  published_at?: string | null; caption?: string | null; permalink?: string | null; content_type?: string | null;
  source?: string | null; content_title?: string | null; duration_seconds?: number | null;
  reach?: number | null; views?: number | null; likes?: number | null; comments?: number | null;
  shares?: number | null; saves?: number | null; follows?: number | null;
  avg_watch_seconds?: number | null; retention_percent?: number | null; skip_rate_percent?: number | null;
};

export function buildPerformanceAnalysisPrompt(rows: PerformanceRow[], profile: Record<string, unknown> = {}) {
  const safeRows = rows.map((r) => ({
    date: r.published_at, type: r.content_type, title: r.content_title,
    caption: (r.caption || "").slice(0, 700), source: r.source,
    durationSeconds: r.duration_seconds, reach: r.reach, views: r.views,
    likes: r.likes, comments: r.comments, shares: r.shares, saves: r.saves,
    follows: r.follows, avgWatchSeconds: r.avg_watch_seconds,
    retentionPercent: r.retention_percent, skipRatePercent: r.skip_rate_percent,
    permalink: r.permalink
  }));
  return {
    system: [
      "Sen dernekler için sosyal medya performans analisti ve içerik stratejistisin.",
      "Yalnızca sağlanan gerçek ölçümleri kullan; eksik/null alanları uydurma veya sıfır sayma.",
      "Kaynak ayrımını koru: metricool_export Metricool dışa aktarımıdır; instagram_manual_excel kullanıcı tarafından girilmiş tablodur.",
      "Kaynaklar arasında aynı paylaşım olabileceğini unutma. Tarih, tür, başlık veya bağlantı kesin eşleşmeden kayıtları birleştirme ve toplamları mükerrer kayıtlarla şişirme.",
      "Metricool verisi mevcutsa erişim, görüntülenme ve izlenme kalitesi için öncelikli kaynaktır; Excel verisini ek etkileşim ve içerik bağlamı olarak değerlendir. Çelişkileri açıkça belirt.",
      "Excel'de bilinmeyen olarak işaretlenmiş null alanları gerçek sıfır kabul etme. Statik gönderiler için video metriklerini yorumlama.",
      "Küçük örneklemden nedensellik veya kesin izlenme tahmini çıkarma; gözlem ve hipotezi ayır.",
      "Çocukların ve yardım alan kişilerin kimliğini açığa çıkaracak öneriler verme. Yüz, isim, adres, okul ve hassas kişisel verilerin ifşasını önle.",
      "Gerçekleşmemiş yardımı yapılmış gibi anlatma. Dernek faaliyetlerini sömürücü/acıma odaklı sunma.",
      "Tek kişilik üretim kapasitesine uygun, sürdürülebilir öneriler ver. Çıktıyı Türkçe ve uygulanabilir hazırla."
    ].join(" "),
    user: JSON.stringify({
      task: "Veri setini kaynak bazında analiz et. Reels ve kalıcı gönderileri karşılaştır; en güçlü/zayıf içerik örüntülerini, paylaşım ve kaydetme sinyallerini, yorumları, izlenme kalitesini ve takipçi kazanımını değerlendir. Story verisi bu analizde yoktur; story performansı hakkında çıkarım yapma.",
      organizationProfile: profile,
      sampleSize: safeRows.length,
      sourceCounts: safeRows.reduce<Record<string, number>>((acc, row) => {
        const key = row.source || "unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
      dataCoverage: safeRows.length ? {
        from: safeRows.map(x => x.date).filter(Boolean).sort()[0],
        to: safeRows.map(x => x.date).filter(Boolean).sort().at(-1)
      } : null,
      content: safeRows,
      requiredOutput: {
        executiveSummary: "string",
        sampleLimitations: ["string"],
        sourceQualityAndDuplicates: ["string"],
        topPatterns: [{ pattern: "string", evidence: "string", confidence: "low|medium|high" }],
        underperformingPatterns: [{ pattern: "string", evidence: "string" }],
        nextExperiments: [{ hypothesis: "string", variable: "string", successMetric: "string" }],
        contentIdeas: [{ title: "string", hook: "string", format: "string", rationale: "string", sourceMetrics: ["string"] }]
      }
    })
  };
}
