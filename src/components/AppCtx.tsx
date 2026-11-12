'use client';
// ===== アプリ全体の状態と操作を各画面に渡す =====
import { createContext, useContext } from 'react';
import type { Lang, Tx } from '@/lib/i18n';
import type { Records } from '@/lib/store';
import type { Level, StepKey } from '@/data/cases';
import type { GuideAns } from '@/data/guide';
import type { QuizQ } from '@/data/readquiz';
import type { Tab } from './ui';

export type Screen = 'splash' | 'home' | 'step' | 'stepResult' | 'compare' | 'quickMenu' | 'quick' | 'quickResult' | 'reviewList' | 'quizMenu' | 'quiz' | 'quizResult' | 'guide' | 'learn' | 'analysis' | 'settings';
export type NavTo = 'home' | 'learn' | 'analysis' | 'settings' | 'quickMenu' | 'quizMenu';

export type StepSess = {
  kind: 'step'; level: Level; caseId: string; idx: number; answers: Partial<Record<StepKey, string | string[] | null>>;
  sel: string | string[] | null; revealed: boolean; tab: Tab; overlay: boolean; hint: boolean; finalOpts: string[]; open: Record<number, boolean>;
  results?: { k: StepKey; ok: boolean; your: string | string[] | null | undefined; corr: string | string[] }[]; score?: number; max?: number;
};
export type QuickLog = { id: string; ok: boolean; your: string; stage: number | null; next: Tx | null };
export type QuickSess = {
  kind: 'quick'; sub: 'practice' | 's60' | 'review'; sample: boolean; revMap: Records['review'] | null; queue: string[]; i: number;
  sel: string | null; revealed: boolean; correct: number; wrong: number; start: number; penalty: number; tab: Tab; caseId: string;
  log: QuickLog[]; overlay: boolean; opts: string[]; expShown: boolean; expChecks: boolean[]; expText: string; ms?: number; newBest?: boolean;
};
export type QuizSess = { kind: 'quiz'; cat: number; list: QuizQ[]; i: number; ans: (number | null)[]; orders: number[][] };
export type GuideState = { qi: number; ans: GuideAns; auto: Record<string, boolean>; res: { id: string; forId: string; tab: Tab; overlay: boolean } | null; from: Screen; jumped?: boolean };

export type State = {
  screen: Screen;
  sess: StepSess | QuickSess | QuizSess | null;
  modal: { caseId: string; lead: string; overlay: boolean } | null;
  info: string | null;
  g: GuideState | null;
  cmp: { caseId: string; lead: string; mode: 'overlay' | 'stack'; diff: boolean } | null;
  back: Screen;
  revSample: boolean;
  qmOpen: Record<string, boolean>;
  confirmReset: boolean;
  showExport: boolean;
  importMsg: string;
  fadeIn: boolean;
  swap: boolean; // 言語・色を変えるとき、いったん薄く消す
  softIn: boolean; // 言語を変えたあと、ゆっくり現れる
  leaving: boolean;
  toast: { text: string; ok: boolean; key: number } | null;
};

export type Actions = {
  skip(): void; home(): void; back(): void; nav(to: NavTo): void; setLevel(lv: Level): void;
  startStep(caseId?: string): void; retry(): void; tab(t: Tab): void; overlay(): void; zoom(lead: string, caseId?: string, overlay?: boolean): void; closeModal(): void;
  hint(): void; opt(i: number): void; stepAnswer(): void; stepNext(): void; layer(i: number): void;
  compare(): void; cmpMode(m: 'overlay' | 'stack'): void; cmpLead(l: string): void; cmpDiff(): void;
  startQuick(sub: 'practice' | 's60'): void; review(): void; revList(sample: boolean): void; revStart(): void;
  qopt(i: number): void; expShow(): void; expCheck(i: number): void; expText(v: string): void; qnext(): void;
  startQuiz(cat: number): void; zopt(o: number): void; znext(): void;
  theme(t: 'light' | 'dark'): void; qmToggle(g: string): void;
  gstart(): void; gsel(v: string): void; gnext(): void; gprev(): void; gjump(k: string): void; gshow(id: string): void;
  info(id: string): void; closeInfo(): void;
  copyExport(): Promise<boolean>; toggleExport(): void; importRec(text: string): void; askReset(): void; cancelReset(): void; doReset(): void;
  setLang(l: Lang): void;
  resume(): void; discardResume(): void; quit(): void;
};

export type AppApi = {
  lang: Lang;
  L: (ja: string, en: string) => string;
  t: (x: Tx) => string;
  S: State;
  store: Records;
  act: Actions;
  W: number; // 本文の幅(px)
  landscape: boolean;
  winW: number;
  now: number;
};

export const AppContext = createContext<AppApi | null>(null);
export function useApp(): AppApi {
  const a = useContext(AppContext);
  if (!a) throw new Error('AppContext missing');
  return a;
}
