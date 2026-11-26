export type JsonRecord = Record<string, unknown>;

const arrayKeys = ["weeklyBriefHistoryV5", "ideaHistoryV5", "archive", "analytics", "recentIdeas"];
const objectKeys = ["orgProfileV5", "weeklyBriefV5", "calendar", "growth", "rotation"];

export function validateV5Backup(input: unknown): { ok: true; payload: JsonRecord; summary: Record<string, number> } | { ok: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "Yedek JSON nesnesi olmalı." };
  const payload = input as JsonRecord;
  if (payload.app !== "Dilara Ceylan Content Factory" && payload.version !== 4 && payload.version !== 5) {
    return { ok: false, error: "Dosya tanınan V4/V5 yedek formatında değil." };
  }
  const summary: Record<string, number> = {};
  for (const key of arrayKeys) {
    if (payload[key] !== undefined && !Array.isArray(payload[key])) return { ok: false, error: key + " alanı dizi olmalı." };
    summary[key] = Array.isArray(payload[key]) ? (payload[key] as unknown[]).length : 0;
  }
  for (const key of objectKeys) {
    if (payload[key] !== undefined && (!payload[key] || typeof payload[key] !== "object" || Array.isArray(payload[key]))) {
      return { ok: false, error: key + " alanı nesne olmalı." };
    }
    summary[key] = payload[key] && typeof payload[key] === "object" ? Object.keys(payload[key] as object).length : 0;
  }
  return { ok: true, payload, summary };
}

export function extractV5Memory(payload: JsonRecord) {
  return {
    orgProfile: payload.orgProfileV5 && typeof payload.orgProfileV5 === "object" ? payload.orgProfileV5 : {},
    weeklyBrief: payload.weeklyBriefV5 && typeof payload.weeklyBriefV5 === "object" ? payload.weeklyBriefV5 : {},
    weeklyBriefHistory: Array.isArray(payload.weeklyBriefHistoryV5) ? payload.weeklyBriefHistoryV5 : [],
    ideaHistory: Array.isArray(payload.ideaHistoryV5) ? payload.ideaHistoryV5 : [],
    archive: Array.isArray(payload.archive) ? payload.archive : [],
    analytics: Array.isArray(payload.analytics) ? payload.analytics : [],
    calendar: payload.calendar ?? {},
    recentIdeas: Array.isArray(payload.recentIdeas) ? payload.recentIdeas : [],
    growth: payload.growth ?? {},
    rotation: payload.rotation ?? {}
  };
}
