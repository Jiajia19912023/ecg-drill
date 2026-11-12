// ===== 途中でやめた練習・クイズの自動保存(端末内に1つだけ) =====
import { QZ } from '@/data/quiz';
import type { QuickSess, QuizSess, StepSess } from '@/components/AppCtx';

export const RESUME_KEY = 'ecgdrill-resume';

type SavedQuiz = Omit<QuizSess, 'list'> & { listIds: string[] };
export type Saved =
  | { screen: 'step'; sess: StepSess; savedAt: number }
  | { screen: 'quick'; sess: QuickSess; savedAt: number }
  | { screen: 'quiz'; sess: SavedQuiz; savedAt: number };

export function saveResume(screen: 'step' | 'quick' | 'quiz', sess: StepSess | QuickSess | QuizSess) {
  try {
    let data: Saved;
    if (sess.kind === 'quiz') {
      const { list, ...rest } = sess;
      data = { screen: 'quiz', sess: { ...rest, listIds: list.map((q) => q.id) }, savedAt: Date.now() };
    } else data = { screen, sess, savedAt: Date.now() } as Saved;
    localStorage.setItem(RESUME_KEY, JSON.stringify(data));
  } catch { /* 保存できない環境 */ }
}
export function loadResume(): Saved | null {
  try {
    const s = JSON.parse(localStorage.getItem(RESUME_KEY) || 'null');
    if (s && (s.screen === 'step' || s.screen === 'quick' || s.screen === 'quiz') && s.sess) return s as Saved;
  } catch { /* 読めないときは無いものとする */ }
  return null;
}
export function clearResume() {
  try { localStorage.removeItem(RESUME_KEY); } catch { /* 無視 */ }
}
/** 保存したものから、続きの状態をつくる(時間は止めていた分をのぞく) */
export function restoreSess(d: Saved): StepSess | QuickSess | QuizSess | null {
  if (d.screen === 'quiz') {
    const { listIds, ...rest } = d.sess;
    const list = listIds.map((id) => QZ.qs.find((q) => q.id === id)).filter(Boolean) as QuizSess['list'];
    if (!list.length) return null;
    return { ...rest, list, i: Math.min(rest.i, list.length - 1) };
  }
  if (d.screen === 'quick') {
    const elapsed = Math.max(0, d.savedAt - d.sess.start);
    return { ...d.sess, start: Date.now() - elapsed };
  }
  return d.sess;
}
