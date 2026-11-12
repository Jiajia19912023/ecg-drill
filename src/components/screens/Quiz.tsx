'use client';
// ===== 基礎クイズ =====
import { QZ } from '@/data/quiz';
import { ansOf, type QuizQ } from '@/data/readquiz';
import { pct } from '@/lib/store';
import { useApp, type QuizSess } from '../AppCtx';
import { QuizFigure } from '../ecg';
import { IC, LvBadge, QuitButton, TopBar } from '../ui';

export function QuizMenu() {
  const { L, t, S, store, act } = useApp();
  const rate = (qs: QuizQ[]) => {
    const r = qs.filter((q) => store.quiz[q.id]).reduce((a, q) => ({ c: a.c + store.quiz[q.id].c, n: a.n + store.quiz[q.id].n }), { c: 0, n: 0 });
    return r.n ? pct(r) : null;
  };
  const group = (g: 'know' | 'read', rnd: number, title: string, desc: string, icon: React.ReactNode, bg: string) => {
    const cats = QZ.cats.filter((c) => c.group === g), qs = QZ.qs.filter((q) => cats.some((c) => c.id === q.cat)), r = rate(qs), open = !!S.qmOpen[g];
    return (
      <section className="qgroup">
        <div className="row" style={{ gap: 12 }}>
          <span className="micon sm" style={{ background: bg }}>{icon}</span>
          <div className="col" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 18 }}>{title}</b><span className="sub">{L(`${qs.length}問`, `${qs.length} questions`)}{r != null ? L(`・正答率 ${r}%`, ` · ${r}% correct`) : ''}</span></div>
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#334155' }}>{desc}</p>
        <button type="button" className="btn pri" style={{ height: 48, fontSize: 15 }} onClick={() => act.startQuiz(rnd)}>{L('ランダムに10問', '10 random questions')}</button>
        <button type="button" className="linkbtn" style={{ alignSelf: 'flex-start' }} onClick={() => act.qmToggle(g)} aria-expanded={open}>
          {open ? L('テーマを閉じる ▲', 'Hide topics ▲') : L(`テーマを選んで解く(${cats.length}つ) ▼`, `Choose a topic (${cats.length}) ▼`)}
        </button>
        {open ? (
          <div className="qchips">
            {cats.map((cat) => {
              const cq = QZ.qs.filter((q) => q.cat === cat.id), cr = rate(cq);
              return <button key={cat.id} type="button" className="qchip" onClick={() => act.startQuiz(cat.id)}><b>{t(cat.name)}</b><span>{L(`${cq.length}問`, `${cq.length} Q`)}{cr != null ? ` · ${cr}%` : ''}</span></button>;
            })}
          </div>
        ) : null}
      </section>
    );
  };
  return (
    <>
      <TopBar title={L('基礎クイズ', 'Basics quiz')} />
      <main className="wrap grow">
        {group('know', -1, L('基礎知識', 'Basics'), L('電極の位置、刺激伝導系、正常値など、心電図を読むための前提知識。', 'Electrode placement, the conduction system, normal values and other groundwork for reading ECGs.'), IC.book(), '#E0E7FF')}
        {group('read', 0, L('心電図を読む', 'Reading ECGs'), L('記録用紙の波形を見て、マス目を数えたり形を見分けたりする問題。', 'Look at tracings on ECG paper: count boxes and recognize shapes.'), IC.wave(26), '#FCE7F3')}
      </main>
    </>
  );
}

export function Quiz() {
  const { L, t, S, act, lang } = useApp();
  const ss = S.sess as QuizSess, q = ss.list[ss.i], sel = ss.ans[ss.i] ?? null, answered = sel !== null, order = ss.orders[ss.i];
  const catName = t((QZ.cats.find((c) => c.id === q.cat) || { name: { ja: '', en: '' } }).name);
  const ans = ansOf(q, lang), ok = sel === ans;
  return (
    <>
      <TopBar title={catName} sub={`${L('基礎クイズ', 'Basics quiz')} ${ss.i + 1}/${ss.list.length}`} right={<QuitButton />} />
      <div className="bar" style={{ margin: '0 16px', borderRadius: 3, height: 6 }}><i style={{ width: `${((ss.i + (answered ? 1 : 0)) / ss.list.length) * 100}%` }} /></div>
      <main className="wrap grow">
        <div className="row" style={{ gap: 8 }}><LvBadge lv={q.lv} /><span className="sub">{q.id.startsWith('R') ? '' : 'Q'}{q.id}</span></div>
        <h2 className="q" style={{ fontSize: 19, lineHeight: 1.5 }}>{t(q.q)}</h2>
        {q.fig ? <QuizFigure f={q.fig} /> : null}
        <div className="opts">
          {order.map((oi, k) => {
            const cls = answered ? (oi === ans ? 'ok' : oi === sel ? 'ng' : 'dim') : '';
            return (
              <button key={oi} type="button" className={`opt ${cls}`} style={{ textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center' }} onClick={() => act.zopt(oi)}>
                <span className="key">{'ABCD'[k]}</span><span>{t(q.opts[oi])}</span>
              </button>
            );
          })}
        </div>
        {answered ? (
          <div className="card" style={{ background: '#F8FAFC' }}>
            <b style={{ color: ok ? '#15803D' : '#B91C1C' }}>{ok ? L('正解!', 'Correct!') : L(`不正解:正解は ${t(q.opts[ans])}`, `Not quite. The answer is: ${t(q.opts[ans])}`)}</b>
            <div style={{ fontSize: 14, lineHeight: 1.7, marginTop: 4 }}>{t(q.why)}</div>
            <div className="src" style={{ marginTop: 6 }}>{L('根拠:', 'Source: ')}{t(q.src)}</div>
          </div>
        ) : <p className="sub" style={{ textAlign: 'center' }}>{L('選択肢をタップして回答', 'Tap an option to answer')}</p>}
      </main>
      {answered ? <div className="foot"><button type="button" className="btn pri" onClick={act.znext}>{ss.i === ss.list.length - 1 ? L('結果を見る', 'See results') : L('次の問題', 'Next question')}</button></div> : null}
    </>
  );
}

export function QuizResult() {
  const { L, t, S, act, lang } = useApp();
  const ss = S.sess as QuizSess;
  const correct = ss.list.filter((q, i) => ss.ans[i] === ansOf(q, lang)).length;
  const wrongs = ss.list.filter((q, i) => ss.ans[i] !== ansOf(q, lang));
  return (
    <>
      <TopBar title={L('クイズの結果', 'Quiz results')} />
      <main className="wrap grow">
        <section className="hero"><b style={{ fontSize: 30 }}>{L(`${correct} / ${ss.list.length}問 正解`, `${correct} / ${ss.list.length} correct`)}</b></section>
        {wrongs.length ? (
          <>
            <h2>{L('間違えた問題', 'Questions you missed')}</h2>
            <div className="card" style={{ padding: '4px 14px' }}>
              {wrongs.map((q) => <div key={q.id} className="rrow"><b style={{ fontSize: 14 }}>{t(q.q)}</b><div className="why">{L('正解:', 'Answer: ')}{t(q.opts[ansOf(q, lang)])}</div></div>)}
            </div>
          </>
        ) : <p>{L('全問正解です。', 'All correct!')}</p>}
      </main>
      <div className="foot two">
        <button type="button" className="btn sec" onClick={() => act.nav('quizMenu')}>{L('カテゴリへ', 'Topics')}</button>
        <button type="button" className="btn pri" onClick={() => act.startQuiz(ss.cat)}>{L('もう一度', 'Try again')}</button>
      </div>
    </>
  );
}
