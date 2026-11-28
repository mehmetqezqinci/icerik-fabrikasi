import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Mode = "chat" | "dist" | "fun" | "viral" | "emanet" | "etkinlik" | "kombin" | "roportaj";
type Generated = {
  title: string; hook: string; concept: string; duration: string;
  timeline: string[]; script: string[]; shots: string[]; overlays: string[];
  cta: string; caption: string; hashtags: string[]; music: string; note: string; metric: string;
};

const stationNames: Record<Mode, string> = {
  chat: "Sohbet İçeriği / Başkanım Bir Sorum Var",
  dist: "Dağıtım İçeriği",
  fun: "Eğlenceli İçerik",
  viral: "Viral Format",
  emanet: "Emanet / Şeffaflık",
  etkinlik: "Etkinlik Fabrikası",
  kombin: "6 Günlük Kampanya Paketi",
  roportaj: "Röportaj Fabrikası"
};

const stationBriefs: Record<Mode, string> = {
  chat: "İki kişilik gerçekçi sohbet yaz. Sunucu sorusu, başkanın konuya özel ilk cevabı, cevaptaki bir ayrıntıyı açan takip sorusu, ikinci ve farklı başkan cevabı, gerekirse kısa itiraz/derinleştirme ve güçlü kapanış üret. Başkan cevapları genel geçer slogan olmasın; somut örnek, gerekçe ve insani dil içersin. Derneğin yapmadığı bir işlemi yapıyormuş gibi yazma; bilinmeyen süreçlerde [DERNEKTEN TEYİT] notu koy.",
  dist: "Dağıtım videosunu belgesel gibi kurgula. Açılışta merak, hazırlık, kontrol, gönüllü emeği, teslimatın mahremiyeti ve doğrulanmış sonuç olsun. Görüntüde gerçekten çekilebilecek eylemler yaz; yapılmamış dağıtımı olmuş gibi anlatma.",
  fun: "Yoksulluk, çocuklar veya yardım alan kişiler üzerinden asla mizah kurma. Mizahı yalnızca gönüllü ekibin zararsız kamera arkası durumlarından üret. Net bir kurulum, beklenmedik dönüş ve punchline içeren oynanabilir diyalog yaz.",
  viral: "Trend taklidi değil, dernek misyonuna uygun özgün ve izlenebilir bir format üret. İlk saniyede güçlü hook, görsel anlatım, ritim değişimi ve paylaşılabilir final tasarla. Gerçek trend olduğunu doğrulamadan trend iddiasında bulunma.",
  emanet: "Bağış ve destek yolculuğunu kayıt, teyit, planlama, temin ve teslim adımları üzerinden anlat. Gerçek olmayan tutar, belge, tarih veya sonuç uydurma; eksik doğrulama gereken yere [TEYİT GEREKİYOR] yaz.",
  etkinlik: "Uygulanabilir etkinlik fikri oluştur. Amaç, hedef kitle, hazırlık, izin/güvenlik, görev dağılımı, etkinlik akışı, çekim planı ve etkinlik sonrası ölçüm üret. Planlanan etkinliği gerçekleşmiş gibi sunma.",
  kombin: "Tek bir gerçek çalışma etrafında altı farklı gün için birbirini tekrar etmeyen içerik serisi tasarla. Duyuru, merak, hazırlık, insan hikâyesi/sohbet, saha ve sonuç aşamalarını birbirinden ayır. Doğrulanmamış tarih veya rakam ekleme.",
  roportaj: "Katılımcı izinlerini gözeten doğal sokak/gönüllü/bağışçı röportajı tasarla. Farklı kişilerden gerçekten farklı cevaplar alınmasını sağlayacak açık uçlu sorular yaz; katılımcı cevaplarını önceden uydurma, örnek cevap gerekiyorsa örnek olduğunu belirt."
};

const required = ["title","hook","concept","duration","timeline","script","shots","overlays","cta","caption","hashtags","music","note","metric"] as const;
function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, 4000) : fallback;
}
function cleanList(value: unknown, fallback: string[], max = 12) {
  if (!Array.isArray(value)) return fallback;
  return value.filter((x): x is string => typeof x === "string").map(x => x.trim()).filter(Boolean).slice(0, max);
}
function parseOutput(raw: string): Generated {
  const text = raw.trim().replace(/^\x60\x60\x60(?:json)?\s*/i, "").replace(/\s*\x60\x60\x60$/, "");
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(text); }
  catch {
    const start = text.indexOf("{"), end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("Model geçerli JSON üretmedi. Yeniden deneyin.");
    parsed = JSON.parse(text.slice(start, end + 1));
  }
  for (const key of required) if (!(key in parsed)) throw new Error("Üretim yanıtında eksik alan var: " + key);
  return {
    title: cleanString(parsed.title, "Yeni içerik"),
    hook: cleanString(parsed.hook),
    concept: cleanString(parsed.concept),
    duration: cleanString(parsed.duration, "30–45 saniye"),
    timeline: cleanList(parsed.timeline, ["Açılış", "Gelişme", "Kapanış"]),
    script: cleanList(parsed.script, ["Senaryo yeniden üretilmeli."], 24),
    shots: cleanList(parsed.shots, ["Ana çekim planı"]),
    overlays: cleanList(parsed.overlays, []),
    cta: cleanString(parsed.cta),
    caption: cleanString(parsed.caption),
    hashtags: cleanList(parsed.hashtags, ["#Mersin", "#dayanışma", "#iyilik"], 15),
    music: cleanString(parsed.music, "Doğal ortam sesi ve sade enstrümantal"),
    note: cleanString(parsed.note),
    metric: cleanString(parsed.metric, "İzlenme süresi · paylaşım · kaydetme")
  };
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_GENERATION_MODEL || process.env.OPENAI_ANALYSIS_MODEL;
    if (!apiKey) return NextResponse.json({ error: "Yapay zekâ henüz etkinleştirilmedi. Vercel'e OPENAI_API_KEY eklenmeli." }, { status: 503 });
    if (!model) return NextResponse.json({ error: "Vercel'e geçerli bir OPENAI_GENERATION_MODEL eklenmeli." }, { status: 503 });

    const body = await request.json();
    const mode = body?.mode as Mode;
    if (!(mode in stationNames)) return NextResponse.json({ error: "Geçersiz istasyon." }, { status: 400 });
    const brief = typeof body.brief === "string" ? body.brief.trim().slice(0, 1200) : "";
    const sub = typeof body.sub === "string" ? body.sub.trim().slice(0, 100) : "";
    const previousTitles = Array.isArray(body.previousTitles)
      ? body.previousTitles.filter((x: unknown) => typeof x === "string").slice(0, 12)
      : [];
    const performanceRows = Array.isArray(body.performanceRows)
      ? body.performanceRows.slice(0, 20)
      : [];

    const system = [
      "Sen Dilara Ceylan Yardım Derneği'nin kıdemli yaratıcı yönetmeni, senaryo yazarı ve sosyal medya stratejistisin.",
      "Türkçe, doğal, sahada çekilebilir, özgün ve klişeden uzak içerik üret.",
      "Dernek Mersin'de yetim çocuklara ve ihtiyaç sahibi ailelere destek olur. Kurumsal anlatım saygın, samimi, güven veren ve insan onurunu koruyan bir dil kullanır.",
      "Yardım alan kişileri acındırma, teşhir etme veya içerik malzemesine dönüştürme. Çocukların yüzü, kimliği, okulu, adresi ve hassas bilgileri gösterilmesin.",
      "Derneğin yapmadığı faaliyeti, gerçekleşmemiş etkinliği, bağış miktarını, aile hikâyesini, istatistiği veya sonucu asla uydurma. Bilgi eksikse [DERNEKTEN TEYİT] şeklinde işaretle.",
      "Önceki içerik başlıklarını tekrar etme; aynı açıyı, diyalog kalıbını, cümleleri veya finali kopyalama. Her üretimde yeni yaratıcı yaklaşım seç.",
      "Sadece başlıkları değiştirme. Script, timeline, shots, overlays, caption ve CTA aynı fikri tutarlı biçimde taşısın.",
      "Yanıtı yalnızca geçerli JSON olarak ver. Markdown çiti, açıklama veya JSON dışında metin ekleme.",
      "JSON şeması: {title:string,hook:string,concept:string,duration:string,timeline:string[],script:string[],shots:string[],overlays:string[],cta:string,caption:string,hashtags:string[],music:string,note:string,metric:string}."
    ].join("\n");

    const user = {
      station: stationNames[mode],
      stationSpecificCreativeRules: stationBriefs[mode],
      selectedSubtopic: sub || null,
      userBrief: brief || null,
      avoidRepeatingTheseRecentTitles: previousTitles,
      optionalPerformanceContext: performanceRows,
      instructions: [
        "Her alanı bu üretime özel doldur; genel geçer placeholder kullanma.",
        "Süre ve sahne zamanları birbiriyle tutarlı olsun.",
        "Senaryo satırları doğrudan çekimde söylenebilecek veya uygulanabilecek kadar somut olsun.",
        "Sohbet istasyonunda Başkanın en az iki ayrı, konuya özgü cevabı ve sunucunun en az bir derinleştirici takip sorusu bulunsun.",
        "Röportaj istasyonunda katılımcıların gerçek cevaplarını uydurma; soru ve kurgu planı ver.",
        "Kampanya istasyonunda altı günün her biri farklı bir anlatı işlevine sahip olsun.",
        "Performans verisi verilmişse yalnızca fikir seçimini desteklemek için kullan; veri olmayan sonuç iddia etme."
      ]
    };

    const response = await new OpenAI({ apiKey }).responses.create({
      model,
      store: false,
      max_output_tokens: 3600,
      input: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) }
      ]
    });
    const generated = parseOutput(response.output_text || "");
    return NextResponse.json({ ...generated, provider: "openai", model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yapay zekâ üretimi başarısız.";
    return NextResponse.json({ error: message.slice(0, 500) }, { status: 500 });
  }
}
