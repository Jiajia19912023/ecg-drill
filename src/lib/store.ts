// ===== 記録(端末のブラウザ内にだけ保存。ログインなし・サーバー送信なし) =====
import type { Level } from '@/data/cases';

export const STORE_KEY = 'ecgdrill-v1';
export const DAY = 86400000;
/** 復習の間隔(日):間違えた翌日 → 正解すれば7日後 → 正解すれば卒業 */
export const INTERVALS = [1, 7];

export type Rec = { c: number; n: number };
export type ReviewItem = { stage: number; next: number };
export type Attempt = { caseId: string; mode: string; level: Level | null; ok: boolean; score: number | null; max: number | null; at: number };
export type Records = {
  v: 1;
  level: Level;
  attempts: Attempt[];
  tags: Record<string, Rec>;
  steps: Record<string, Rec>;
  cases: Record<string, Rec>;
  review: Record<string, ReviewItem>;
  quiz: Record<string, Rec>;
  best: { s60?: number };
  explain?: Record<string, { missed: number[]; at: number; done: number }>;
  theme?: 'light' | 'dark';
};

export const emptyStore = (): Records => ({ v: 1, level: 'beginner', attempts: [], tags: {}, steps: {}, cases: {}, review: {}, quiz: {}, best: {} });

export function loadStore(): Records {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (s && s.v === 1) return { ...emptyStore(), ...s };
  } catch { /* 読めないときは新しく始める */ }
  return emptyStore();
}
export function saveStore(s: Records) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* 保存できない環境(プライベートモードなど) */ }
}
export function bump(map: Record<string, Rec>, key: string, ok: boolean) {
  const r = map[key] || (map[key] = { c: 0, n: 0 });
  r.n++; if (ok) r.c++;
}
export function reviewUpdate(store: Records, id: string, ok: boolean) {
  const r = store.review[id];
  if (!ok) store.review[id] = { stage: 0, next: Date.now() + DAY };
  else if (r) {
    if (r.stage >= INTERVALS.length - 1) delete store.review[id];
    else { r.stage++; r.next = Date.now() + INTERVALS[r.stage] * DAY; }
  }
}
/** 復習の予定のサンプル(表示の確認用) */
export function sampleReview(): Record<string, ReviewItem> {
  const t0 = new Date(); t0.setHours(9, 0, 0, 0);
  const d = (n: number) => t0.getTime() + n * DAY;
  return { inf: { stage: 0, next: d(0) - 3600000 }, af: { stage: 1, next: d(0) - 7200000 }, lbbb: { stage: 0, next: d(0) - 1800000 }, rbbb: { stage: 0, next: d(1) }, avb1: { stage: 1, next: d(3) }, lafb: { stage: 1, next: d(6) } };
}
export const pct = (r?: Rec | null) => (r && r.n ? Math.round(r.c / r.n * 100) : null);
