'use client';
// ===== アプリ本体:状態・操作・画面の切り替え =====
import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { tx, type Lang, type Tx } from '@/lib/i18n';
import { shuffle } from '@/lib/engine';
import { bump, emptyStore, loadStore, reviewUpdate, sampleReview, saveStore, type Records } from '@/lib/store';
import { answerFor, dueReviews, nextAfter, practiceById, sameAns, statKey } from '@/lib/logic';
import { CASES, LEVEL_STEPS, STEPS, type Level, type PracticeCase } from '@/data/cases';
import { GUIDE_QS, GUIDE_TAB, caseById } from '@/data/guide';
import { QZ } from '@/data/quiz';
import { clearResume, loadResume, restoreSess, saveResume } from '@/lib/resume';
import { ansOf } from '@/data/readquiz';
import { AppContext, type Actions, type AppApi, type NavTo, type QuickSess, type QuizSess, type Screen, type State, type StepSess } from './AppCtx';
import { Modals, Toast } from './Modals';
import { Splash } from './screens/Splash';
import { Home } from './screens/Home';
import { Step, StepResult } from './screens/Step';
import { Compare } from './screens/Compare';
import { QuickMenu, Quick, QuickResult } from './screens/Quick';
import { ReviewList } from './screens/ReviewList';
import { QuizMenu, Quiz, QuizResult } from './screens/Quiz';
import { Guide } from './screens/Guide';
import { Learn } from './screens/Learn';
import { Analysis } from './screens/Analysis';
import { Settings } from './screens/Settings';

const START_KEY = 'ecgdrill-start';
const SOFT_KEY = 'ecgdrill-softin';
const SWAP_MS = 450; // 消えるまでの時間
const initialState = (): State => ({
  screen: 'splash', sess: null, modal: null, info: null, g: null, cmp: null, back: 'home', revSample: false, anaSample: false,
  qmOpen: {}, confirmReset: false, showExport: false, importMsg: '', fadeIn: false, swap: false, softIn: false, leaving: false, toast: null,
});

export default function App({ lang }: { lang: Lang }) {
  const router = useRouter();
  const S = useRef<State>(initialState()).current;
  const storeRef = useRef<Records>(emptyStore());
  const [, force] = useReducer((x: number) => x + 1, 0);
  const render = useCallback(() => force(), []);
  const [mounted, setMounted] = useState(false);
  const [win, setWin] = useState({ w: 390, h: 844 });
  const [now, setNow] = useState(0);

  // 端末に保存した記録を読み込む(サーバーには何も送らない)
  useEffect(() => {
    storeRef.current = loadStore();
    try {
      const st = sessionStorage.getItem(START_KEY);
      if (st) { sessionStorage.removeItem(START_KEY); S.screen = st as Screen; }
      if (sessionStorage.getItem(SOFT_KEY)) { sessionStorage.removeItem(SOFT_KEY); S.softIn = true; setTimeout(() => { S.softIn = false; force(); }, 1300); }
    } catch { /* sessionStorageが使えない環境 */ }
    const onResize = () => setWin({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    setNow(Date.now());
    setMounted(true);
    let t: ReturnType<typeof setTimeout>;
    const rz = () => { clearTimeout(t); t = setTimeout(onResize, 150); };
    window.addEventListener('resize', rz);
    return () => window.removeEventListener('resize', rz);
  }, [S]);

  const store = storeRef.current;
  useEffect(() => { document.documentElement.classList.toggle('dark', store.theme === 'dark'); });

  // 60秒チャレンジのタイマー
  const sess = S.sess;
  const timed = S.screen === 'quick' && sess?.kind === 'quick' && sess.sub === 's60';
  useEffect(() => {
    if (!timed) return;
    const id = setInterval(() => {
      const ss = S.sess as QuickSess;
      if (!ss || S.screen !== 'quick') return;
      if (60000 - (Date.now() - ss.start) - ss.penalty <= 0) finishQuick();
      else setNow(Date.now());
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed]);

  // 途中でやめた練習・クイズを自動保存(画面を閉じてもホームから続きができる)
  useEffect(() => {
    if (!mounted) return;
    const sc = S.screen, ss = S.sess;
    if ((sc === 'step' || sc === 'quick' || sc === 'quiz') && ss && !(ss.kind === 'quick' && ss.sample)) saveResume(sc, ss);
    else if (sc === 'stepResult' || sc === 'quizResult' || (sc === 'quickResult' && !(ss?.kind === 'quick' && ss.sample))) clearResume();
  });

  const L = useCallback((ja: string, en: string) => (lang === 'ja' ? ja : en), [lang]);
  const t = useCallback((x: Tx) => tx(x, lang), [lang]);
  const save = () => saveStore(storeRef.current);

  function go(screen: Screen) {
    S.screen = screen; S.modal = null; S.info = null;
    setNow(Date.now());
    render();
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }
  function toast(text: string, ok: boolean) { S.toast = { text, ok, key: Date.now() }; }

  // ===== 練習の記録 =====
  function recordFinal(c: PracticeCase, ok: boolean, mode: string, level?: Level, score?: number, max?: number) {
    const st = storeRef.current;
    bump(st.cases, c.id, ok);
    c.tags.forEach((tg) => bump(st.tags, tg, ok));
    reviewUpdate(st, c.id, ok);
    st.attempts.push({ caseId: c.id, mode, level: level || null, ok, score: score ?? null, max: max ?? null, at: Date.now() });
    if (st.attempts.length > 500) st.attempts = st.attempts.slice(-500);
    save();
  }

  // ===== 順番に読む練習 =====
  function pickCase(level: Level) {
    const st = storeRef.current;
    const pool = CASES.filter((c) => c.levels.includes(level));
    const last = st.attempts.length ? st.attempts[st.attempts.length - 1].caseId : null;
    const cand = pool.filter((c) => c.id !== last);
    const minN = Math.min(...cand.map((c) => (st.cases[c.id] || { n: 0 }).n));
    const least = cand.filter((c) => (st.cases[c.id] || { n: 0 }).n === minN);
    return least[Math.floor(Math.random() * least.length)];
  }
  function startStep(caseId?: string) {
    const level = storeRef.current.level, c = caseId ? practiceById(caseId) : pickCase(level);
    const keys = LEVEL_STEPS[level];
    S.sess = { kind: 'step', level, caseId: c.id, idx: 0, answers: {}, sel: null, revealed: false, tab: STEPS[keys[0]].tab, overlay: false, hint: false, finalOpts: shuffle(c.finalChoices), open: { 0: true } };
    go('step');
  }
  function restoreStep(ss: StepSess) {
    const key = LEVEL_STEPS[ss.level][ss.idx], def = STEPS[key];
    const done = Object.prototype.hasOwnProperty.call(ss.answers, key);
    const a = ss.answers[key];
    ss.sel = done ? (Array.isArray(a) ? a.slice() : (a ?? null)) : def.multi ? [] : null;
    ss.revealed = done && ss.level !== 'advanced'; ss.hint = false; ss.tab = def.tab;
  }
  function finishStep() {
    const ss = S.sess as StepSess, c = practiceById(ss.caseId), keys = LEVEL_STEPS[ss.level];
    let score = 0, max = 0;
    ss.results = keys.map((k) => {
      const corr = answerFor(c, k), ok = sameAns(ss.answers[k], corr), pts = k === 'final' ? 30 : 10;
      max += pts; if (ok) score += pts;
      bump(storeRef.current.steps, statKey(k), ok);
      return { k, ok, your: ss.answers[k], corr };
    });
    ss.score = score; ss.max = max; ss.overlay = true; ss.tab = 'limb';
    recordFinal(c, ss.results[ss.results.length - 1].ok, 'step', ss.level, score, max);
    go('stepResult');
  }

  // ===== クイック判読・復習 =====
  function startQuick(sub: QuickSess['sub'], queue?: string[], sample?: boolean) {
    const rm = sub === 'review' ? JSON.parse(JSON.stringify(sample ? sampleReview() : storeRef.current.review)) : null;
    S.sess = { kind: 'quick', sub, sample: !!sample, revMap: rm, queue: queue || [], i: 0, sel: null, revealed: false, correct: 0, wrong: 0, start: Date.now(), penalty: 0, tab: 'limb', caseId: '', log: [], overlay: false, opts: [], expShown: false, expChecks: [false, false, false, false], expText: '' };
    nextQuick(true);
    go('quick');
  }
  function nextQuick(first?: boolean) {
    const ss = S.sess as QuickSess;
    if (!first) ss.i++;
    if (ss.sub === 'review' && ss.i >= ss.queue.length) return finishQuick();
    let c: PracticeCase;
    if (ss.queue.length) c = practiceById(ss.queue[ss.i]);
    else { const pool = CASES.filter((x) => x.id !== ss.caseId); c = pool[Math.floor(Math.random() * pool.length)]; }
    ss.caseId = c.id; ss.sel = null; ss.revealed = false; ss.opts = shuffle(c.finalChoices); ss.tab = 'limb'; ss.overlay = false;
    ss.expShown = false; ss.expChecks = [false, false, false, false]; ss.expText = '';
  }
  function finishQuick() {
    const ss = S.sess as QuickSess, st = storeRef.current;
    ss.ms = Date.now() - ss.start; ss.newBest = false;
    if (ss.sub === 's60' && (st.best.s60 == null || ss.correct > st.best.s60)) { st.best.s60 = ss.correct; ss.newBest = true; }
    save();
    go('quickResult');
  }
  function saveExplain(ss: QuickSess) {
    if (ss.sub !== 'review' || ss.sample || !ss.expShown) return;
    const st = storeRef.current;
    st.explain = st.explain || {};
    const old = st.explain[ss.caseId] || { done: 0 };
    const wrote = (ss.expText || '').trim().length >= 5;
    st.explain[ss.caseId] = { missed: [0, 1, 2, 3].filter((i) => !ss.expChecks[i]), at: Date.now(), done: (old.done || 0) + (wrote ? 1 : 0) };
    save();
  }

  // ===== 基礎クイズ =====
  function startQuiz(cat: number) {
    const grp = (g: string) => QZ.qs.filter((q) => (QZ.cats.find((c) => c.id === q.cat) || { group: '' }).group === g);
    const list = cat > 0 ? QZ.qs.filter((q) => q.cat === cat) : shuffle(grp(cat === 0 ? 'read' : 'know')).slice(0, 10);
    S.sess = { kind: 'quiz', cat, list, i: 0, ans: [], orders: [shuffle([0, 1, 2, 3])] };
    go('quiz');
  }

  // ===== 波形チェック =====
  function guideNext(from: number) {
    const g = S.g!;
    for (let i = from; i < GUIDE_QS.length; i++) {
      const q = GUIDE_QS[i];
      if (!q.when || q.when(g.ans)) { delete g.auto[q.k]; return i; }
      g.ans[q.k] = q.k === 'pr' ? 'none' : 'skip'; g.auto[q.k] = true;
    }
    return GUIDE_QS.length;
  }
  function guidePrev(from: number) { const g = S.g!; for (let i = from - 1; i >= 0; i--) if (!g.auto[GUIDE_QS[i].k]) return i; return -1; }

  const viewerSess = () => (S.screen === 'guide' ? S.g?.res : S.sess && S.sess.kind !== 'quiz' ? S.sess : null);

  const act: Actions = {
    skip() {
      if (S.leaving) return; S.leaving = true; render();
      setTimeout(() => { S.leaving = false; S.fadeIn = true; go('home'); setTimeout(() => { S.fadeIn = false; render(); }, 2300); }, 1000);
    },
    home() { go('home'); },
    nav(to: NavTo) { go(to); },
    setLevel(lv) { storeRef.current.level = lv; save(); render(); },
    startStep(id) { startStep(id); },
    retry() { startStep((S.sess as StepSess).caseId); },
    tab(tb) { const ss = viewerSess(); if (ss) { ss.tab = tb; render(); } },
    overlay() { const ss = viewerSess(); if (ss) { ss.overlay = !ss.overlay; render(); } },
    zoom(lead, caseId, overlay) {
      if (caseId) { S.modal = { caseId, lead, overlay: !!overlay }; return render(); }
      if (S.screen === 'guide' && S.g?.res) { S.modal = { caseId: S.g.res.id, lead, overlay: S.g.res.overlay }; return render(); }
      const ss = S.sess as StepSess | QuickSess;
      const ov = !!ss && ss.overlay && (S.screen === 'stepResult' || (S.screen === 'step' && (ss as StepSess).level === 'beginner') || (S.screen === 'quick' && ss.revealed));
      S.modal = { caseId: ss.caseId, lead, overlay: ov }; render();
    },
    closeModal() { S.modal = null; render(); },
    hint() { (S.sess as StepSess).hint = true; render(); },
    opt(i) {
      const ss = S.sess as StepSess; if (ss.revealed) return;
      const key = LEVEL_STEPS[ss.level][ss.idx], def = STEPS[key];
      const opts = key === 'final' ? ss.finalOpts : def.opts!;
      const o = opts[i];
      if (def.multi) {
        let s = ((ss.sel as string[]) || []).slice();
        if (o === 'none') s = s.includes(o) ? [] : [o];
        else { s = s.filter((x) => x !== 'none'); s = s.includes(o) ? s.filter((x) => x !== o) : s.concat(o); }
        ss.sel = s;
      } else ss.sel = o;
      render();
    },
    stepAnswer() { const ss = S.sess as StepSess, key = LEVEL_STEPS[ss.level][ss.idx]; ss.answers[key] = ss.sel; ss.revealed = true; render(); },
    stepNext() {
      const ss = S.sess as StepSess, keys = LEVEL_STEPS[ss.level], key = keys[ss.idx];
      if (ss.level === 'advanced') ss.answers[key] = ss.sel;
      if (ss.idx >= keys.length - 1) return finishStep();
      ss.idx++; restoreStep(ss); render(); window.scrollTo(0, 0);
    },
    layer(i) { const ss = S.sess as StepSess; ss.open[i] = !ss.open[i]; render(); },
    compare() {
      const ss = S.sess as StepSess | QuickSess, c = practiceById(ss.caseId);
      S.cmp = { caseId: c.id, lead: c.keyLead, mode: 'overlay', diff: true }; S.back = S.screen; go('compare');
    },
    cmpMode(m) { S.cmp!.mode = m; render(); },
    cmpLead(l) { S.cmp!.lead = l; render(); },
    cmpDiff() { S.cmp!.diff = !S.cmp!.diff; render(); },
    startQuick(sub) { startQuick(sub); },
    review() { const d = shuffle(dueReviews(storeRef.current)); if (d.length) startQuick('review', d); },
    revList(sample) { S.revSample = sample; go('reviewList'); },
    revStart() {
      const m = S.revSample ? sampleReview() : storeRef.current.review, n = Date.now();
      const d = Object.keys(m).filter((id) => m[id].next <= n && caseById(id));
      if (d.length) startQuick('review', shuffle(d), S.revSample);
    },
    qopt(i) {
      const ss = S.sess as QuickSess; if (ss.revealed) return;
      const o = ss.opts[i], c = practiceById(ss.caseId), ok = o === c.id;
      ss.sel = o; if (ok) ss.correct++; else ss.wrong++;
      const stage = ss.revMap && ss.revMap[c.id] ? ss.revMap[c.id].stage : null;
      ss.log.push({ id: c.id, ok, your: o, stage, next: stage != null ? nextAfter(stage, ok) : null });
      if (!ss.sample) recordFinal(c, ok, 'quick-' + ss.sub);
      if (ss.sub === 's60') {
        if (!ok) ss.penalty += 3000;
        toast(ok ? L('正解', 'Correct') : L('不正解 −3秒', 'Wrong −3 s'), ok);
        nextQuick(); setNow(Date.now()); render();
      } else { ss.revealed = true; render(); }
    },
    expShow() { (S.sess as QuickSess).expShown = true; render(); },
    expCheck(i) { const ss = S.sess as QuickSess; ss.expChecks[i] = !ss.expChecks[i]; render(); },
    expText(v) { (S.sess as QuickSess).expText = v; render(); },
    qnext() {
      const ss = S.sess as QuickSess; saveExplain(ss);
      if (ss.sub === 'review' && ss.i >= ss.queue.length - 1) return finishQuick();
      nextQuick(); render(); window.scrollTo(0, 0);
    },
    startQuiz(cat) { startQuiz(cat); },
    zopt(o) {
      const ss = S.sess as QuizSess; if (ss.ans[ss.i] != null) return;
      const q = ss.list[ss.i];
      ss.ans[ss.i] = o; bump(storeRef.current.quiz, q.id, o === ansOf(q, lang)); save(); render();
    },
    znext() {
      const ss = S.sess as QuizSess;
      if (ss.i >= ss.list.length - 1) return go('quizResult');
      ss.i++; if (!ss.orders[ss.i]) ss.orders[ss.i] = shuffle([0, 1, 2, 3]); render(); window.scrollTo(0, 0);
    },
    back() {
      const sc = S.screen, ss = S.sess;
      if (sc === 'guide') {
        const g = S.g!, p = g.qi >= GUIDE_QS.length ? guidePrev(GUIDE_QS.length) : guidePrev(g.qi);
        if (p >= 0) { g.qi = p; render(); window.scrollTo(0, 0); return; }
        return go(g.from || 'home');
      }
      if (sc === 'step' && ss?.kind === 'step') {
        if (ss.idx > 0) { if (ss.level === 'advanced') ss.answers[LEVEL_STEPS[ss.level][ss.idx]] = ss.sel; ss.idx--; restoreStep(ss); render(); window.scrollTo(0, 0); return; }
        return go('home');
      }
      if (sc === 'quiz' && ss?.kind === 'quiz') { if (ss.i > 0) { ss.i--; render(); window.scrollTo(0, 0); return; } return go('quizMenu'); }
      if ((sc === 'quick' || sc === 'quickResult') && ss?.kind === 'quick' && ss.sub === 'review') return go('reviewList');
      if (sc === 'quick' || sc === 'quickResult') return go('quickMenu');
      if (sc === 'quizResult') return go('quizMenu');
      if (sc === 'compare') return go(S.back || 'home');
      return go('home');
    },
    anaMode(sample) { S.anaSample = sample; render(); window.scrollTo(0, 0); },
    theme(th) {
      if ((storeRef.current.theme || 'light') === th || S.swap) return;
      // いったんふわっと消してから色を変え、ゆっくり戻す
      S.swap = true; render();
      setTimeout(() => { storeRef.current.theme = th; save(); render(); setTimeout(() => { S.swap = false; render(); }, 60); }, SWAP_MS);
    },
    qmToggle(g) { S.qmOpen[g] = !S.qmOpen[g]; render(); },
    gstart() {
      const from: Screen = S.screen === 'guide' ? S.g?.from || 'home' : S.screen;
      S.g = { qi: 0, ans: {}, auto: {}, res: null, from }; go('guide');
    },
    gsel(v) {
      const g = S.g!, k = GUIDE_QS[g.qi].k; g.ans[k] = v;
      GUIDE_QS.forEach((q, i) => {
        if (i <= g.qi) return;
        if (g.auto[q.k]) { delete g.ans[q.k]; delete g.auto[q.k]; }
        const only = q.only ? q.only(g.ans) : null;
        if (g.ans[q.k] && g.ans[q.k] !== 'skip' && only && !only.includes(g.ans[q.k])) delete g.ans[q.k];
        if (q.when && !q.when(g.ans)) delete g.ans[q.k];
      });
      g.res = null; render();
    },
    gnext() {
      const g = S.g!; if (g.ans[GUIDE_QS[g.qi].k] == null) return;
      let nx = guideNext(g.qi + 1);
      if (g.jumped) { while (nx < GUIDE_QS.length && g.ans[GUIDE_QS[nx].k] != null) nx = guideNext(nx + 1); if (nx >= GUIDE_QS.length) g.jumped = false; }
      g.qi = nx; render(); window.scrollTo(0, 0);
    },
    gprev() { const g = S.g!, p = guidePrev(g.qi); if (p < 0) return go(g.from || 'home'); g.qi = p; g.jumped = false; render(); window.scrollTo(0, 0); },
    gjump(k) { const g = S.g!; g.jumped = g.qi >= GUIDE_QS.length; g.qi = GUIDE_QS.findIndex((q) => q.k === k); render(); window.scrollTo(0, 0); },
    gshow(id) { const g = S.g!; g.res = { ...(g.res || { forId: id }), id, tab: GUIDE_TAB[id] || 'limb', overlay: false } as typeof g.res; render(); window.scrollTo(0, 0); },
    info(id) { S.info = id; render(); },
    closeInfo() { S.info = null; render(); },
    async copyExport() {
      try { await navigator.clipboard.writeText(JSON.stringify(storeRef.current)); return true; } catch { S.showExport = true; render(); return false; }
    },
    toggleExport() { S.showExport = !S.showExport; render(); },
    importRec(text) {
      try {
        const s = JSON.parse(text);
        if (!s || s.v !== 1) throw new Error('bad');
        storeRef.current = { ...emptyStore(), ...s }; save(); S.importMsg = L('読み込みました。', 'Records imported.');
      } catch { S.importMsg = L('読み込めませんでした。書き出した内容をそのまま貼り付けてください。', 'Could not import. Paste the exported text exactly as it was copied.'); }
      render();
    },
    askReset() { S.confirmReset = true; render(); },
    cancelReset() { S.confirmReset = false; render(); },
    resume() {
      const d = loadResume(); const ss = d ? restoreSess(d) : null;
      if (!d || !ss) { clearResume(); return render(); }
      S.sess = ss; go(d.screen);
    },
    discardResume() { clearResume(); render(); },
    quit() {
      const ss = S.sess, sample = ss?.kind === 'quick' && ss.sample;
      if (!sample && ss && (S.screen === 'step' || S.screen === 'quick' || S.screen === 'quiz')) { saveResume(S.screen, ss); toast(L('途中まで保存しました', 'Progress saved'), true); }
      go('home');
    },
    doReset() { storeRef.current = emptyStore(); save(); clearResume(); S.confirmReset = false; go('home'); },
    setLang(l) {
      if (l === lang || S.swap) return;
      S.swap = true; render();
      setTimeout(() => {
        try { sessionStorage.setItem(START_KEY, S.screen === 'settings' ? 'settings' : 'home'); sessionStorage.setItem(SOFT_KEY, '1'); } catch { /* 無視 */ }
        document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
        router.push(`/${l}`);
      }, SWAP_MS);
    },
  };

  const W = Math.min(win.w, 480) - 32;
  const landscape = win.w > win.h && win.w >= 560;
  // 状態はrefで持ち、操作のあとに render() で描き直す(毎回新しいオブジェクトを渡す)
  const api: AppApi = { lang, L, t, S, store, act, W, landscape, winW: win.w, now };

  if (!mounted) return <div id="app" />;

  const sc = S.screen;
  const wide = landscape && ['step', 'stepResult', 'quick'].includes(sc);
  let body: ReactNode;
  switch (sc) {
    case 'splash': body = <Splash />; break;
    case 'home': body = <Home />; break;
    case 'step': body = <Step />; break;
    case 'stepResult': body = <StepResult />; break;
    case 'compare': body = <Compare />; break;
    case 'quickMenu': body = <QuickMenu />; break;
    case 'quick': body = <Quick />; break;
    case 'quickResult': body = <QuickResult />; break;
    case 'reviewList': body = <ReviewList />; break;
    case 'quizMenu': body = <QuizMenu />; break;
    case 'quiz': body = <Quiz />; break;
    case 'quizResult': body = <QuizResult />; break;
    case 'guide': body = <Guide />; break;
    case 'learn': body = <Learn />; break;
    case 'analysis': body = <Analysis />; break;
    case 'settings': body = <Settings />; break;
  }
  return (
    <AppContext.Provider value={api}>
      <div id="app" className={[wide ? 'wide' : '', S.fadeIn ? 'fadein' : '', S.swap ? 'swap' : '', S.softIn ? 'softin' : ''].join(' ').trim()}>
        {body}
        <Modals />
      </div>
      <Toast />
    </AppContext.Provider>
  );
}
