// ===== 答え合わせ・解説・復習の予定(画面に依存しない処理) =====
import { CASES, GENERIC_WHY, OPT_LABELS, type PracticeCase, type StepKey } from '@/data/cases';
import { caseById } from '@/data/guide';
import { caseSig } from './engine';
import { T, tx, type Lang, type Tx } from './i18n';
import { DAY, INTERVALS, type Records } from './store';

export const statKey = (k: string) => k.replace(/^b_/, '');
export const practiceById = (id: string) => CASES.find((c) => c.id === id) as PracticeCase;

export function rateAns(c: PracticeCase) {
  const hr = caseSig(c).beats.length * 6;
  return hr < 60 ? 'lt60' : hr > 100 ? 'gt100' : 'n60';
}
export function answerFor(c: PracticeCase, key: StepKey): string | string[] {
  return key === 'rate' || key === 'b_rate' ? rateAns(c) : (c.ans[key] as string | string[]);
}
export function sameAns(a: unknown, b: unknown) {
  if (Array.isArray(a) || Array.isArray(b)) {
    const x = ((a as string[]) || []).slice().sort(), y = ((b as string[]) || []).slice().sort();
    return x.length === y.length && x.every((v, i) => v === y[i]);
  }
  return a === b;
}
/** 選択肢のidを表示名にする */
export function optLabel(key: StepKey, id: string, lang: Lang): string {
  if (key === 'final') { const c = practiceById(id); return c ? tx(c.finalName, lang) : id; }
  const m = OPT_LABELS[key];
  return m && m[id] ? tx(m[id], lang) : id;
}
export function fmtAns(key: StepKey, a: string | string[] | null | undefined, lang: Lang) {
  const none = lang === 'ja' ? '(未選択)' : '(not answered)';
  if (Array.isArray(a)) return a.length ? a.map((x) => optLabel(key, x, lang)).join(lang === 'ja' ? '、' : ', ') : none;
  return a == null ? none : optLabel(key, a, lang);
}
export function whyFor(c: PracticeCase, key: StepKey, lang: Lang): string {
  if (key === 'rate' || key === 'b_rate') {
    const n = caseSig(c).beats.length;
    return lang === 'ja' ? `10秒間にQRSが${n}個 → 約${n * 6}回/分。` : `${n} QRS complexes in 10 s → about ${n * 6} bpm.`;
  }
  if (key === 'pr') {
    const a = c.ans.pr, pr = (c.pr || 0.16).toFixed(2);
    if (a === 'na') return lang === 'ja' ? 'P波がないため、PR間隔は測れない。' : 'There are no P waves, so the PR interval cannot be measured.';
    if (a === 'long') return lang === 'ja' ? `PR間隔は約${pr}秒で、0.20秒を超えている。` : `The PR interval is about ${pr} s, longer than 0.20 s.`;
    return lang === 'ja' ? `PR間隔は約${pr}秒で、0.12〜0.20秒の範囲。` : `The PR interval is about ${pr} s, within 0.12–0.20 s.`;
  }
  if (key === 'stt' || key === 'b_st') return tx(c.sttWhy, lang);
  if (key === 'final') return tx(c.layers[0], lang);
  if (key === 'qt' && (c.wf || 1) > 1.3) {
    return tx(GENERIC_WHY.qt!.normal, lang) + (lang === 'ja' ? ' 脚ブロックではQRSが広い分QTが長く見えるため、その分を差し引いて考える。' : ' In bundle branch block the wide QRS makes the QT look longer, so allow for that.');
  }
  if (key === 'hyp' && c.id === 'lbbb') return lang === 'ja' ? '脚ブロックがあるときは、電位による肥大の基準はそのまま使えない。ここでは「なし」とする。' : 'Voltage criteria for hypertrophy cannot be applied as-is in bundle branch block, so the answer here is "none".';
  const m = GENERIC_WHY[key];
  const v = c.ans[key];
  return m && typeof v === 'string' && m[v] ? tx(m[v], lang) : '';
}

// ===== 復習 =====
export function dueReviews(store: Records, now = Date.now()) {
  return Object.keys(store.review).filter((id) => store.review[id].next <= now && caseById(id));
}
export function nextAfter(stage: number, ok: boolean): Tx {
  if (!ok) return T('明日もう一度', 'Again tomorrow');
  return stage >= INTERVALS.length - 1 ? T('復習を卒業(リストから外れます)', 'Graduated (removed from the list)') : T(`${INTERVALS[stage + 1]}日後`, `In ${INTERVALS[stage + 1]} days`);
}
export function dayLabel(t: number, lang: Lang) {
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(t).setHours(0, 0, 0, 0) - a.getTime()) / DAY);
  const dt = new Date(t), md = `${dt.getMonth() + 1}/${dt.getDate()}`;
  if (lang === 'ja') return diff <= 0 ? '今日' : diff === 1 ? `明日(${md})` : `${diff}日後(${md})`;
  return diff <= 0 ? 'Today' : diff === 1 ? `Tomorrow (${md})` : `In ${diff} days (${md})`;
}
