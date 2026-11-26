export type PerformanceRow = {
  published_at?: string | null; caption?: string | null; permalink?: string | null; content_type?: string | null;
  reach?: number | null; views?: number | null; likes?: number | null; comments?: number | null;
  shares?: number | null; saves?: number | null; follows?: number | null;
  avg_watch_seconds?: number | null; retention_percent?: number | null; skip_rate_percent?: number | null;
};

export function buildPerformanceAnalysisPrompt(rows: PerformanceRow[], profile: Record<string, unknown> = {}) {
  const safeRows = rows.map((r) => ({
    date: r.published_at, type: r.content_type, caption: (r.caption || "").slice(0, 700),
    reach: r.reach, views: r.views, likes: r.likes, comments: r.comments,
    shares: r.shares, saves: r.saves, follows: r.follows,
    avgWatchSeconds: r.avg_watch_seconds, retentionPercent: r.retention_percent,
    skipRatePercent: r.skip_rate_percent, permalink: r.permalink
  }));
  return {
    system: [
      "Sen dernekler için sosyal medya performans analisti ve içerik stratejistisin.",
      "Yalnızca sağlanan gerçek ölçümleri kullan; eksik alanları uydurma.",
      "Küçük örneklemden nedensellik veya kesin izlenme tahmini çıkarma.",
      "Çocukların ve yardım alan kişilerin kimliğini açığa çıkaracak öneriler verme.",
      "Gerçekleşmemiş yardımı yapılmış gibi anlatma. Hassas kişisel veri isteme.",
      "Çıktıyı Türkçe, uygulanabilir ve kaynak metriklere bağlı hazırla."
    ].join(" "),
    user: JSON.stringify({
      task: "Performans verilerini analiz et; en güçlü ve zayıf içerik örüntülerini, paylaşım ve takipçi kazanımı sinyallerini, izlenme kalitesini ve sonraki test önerilerini çıkar.",
      organizationProfile: profile,
      sampleSize: safeRows.length,
      dataCoverage: safeRows.length ? { from: safeRows.map(x => x.date).filter(Boolean).sort()[0], to: safeRows.map(x => x.date).filter(Boolean).sort().at(-1) } : null,
      content: safeRows,
      requiredOutput: {
        executiveSummary: "string",
        sampleLimitations: ["string"],
        topPatterns: [{ pattern: "string", evidence: "string", confidence: "low|medium|high" }],
        underperformingPatterns: [{ pattern: "string", evidence: "string" }],
        nextExperiments: [{ hypothesis: "string", variable: "string", successMetric: "string" }],
        contentIdeas: [{ title: "string", hook: "string", format: "string", rationale: "string", sourceMetrics: ["string"] }]
      }
    })
  };
}
