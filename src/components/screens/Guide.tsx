'use client';
// ===== 波形チェック(手元の心電図を、順番に確かめる) =====
import { DIAGS, GUIDE_QS, GUIDE_TAB, caseById, effAns, guideResult, matches } from '@/data/guide';
import { DIAG_INFO } from '@/data/diaginfo';
import { useApp } from '../AppCtx';
import { GuideFig, OptFigure, ThumbII, Viewer } from '../ecg';
import { IC, Legend, OverlaySwitch, TopBar } from '../ui';

export function Guide() {
  const { S } = useApp();
  return S.g!.qi >= GUIDE_QS.length ? <GuideResult /> : <GuideQuestion />;
}

function GuideQuestion() {
  const { L, t, S, act } = useApp();
  const g = S.g!, q = GUIDE_QS[g.qi], cur = g.ans[q.k], only = q.only ? q.only(g.ans) : null;
  let prev = -1; for (let i = g.qi - 1; i >= 0; i--) if (!g.auto[GUIDE_QS[i].k]) { prev = i; break; }
  return (
    <>
      <TopBar title={L('波形チェック', 'ECG Check')} right={`${g.qi + 1}/${GUIDE_QS.length}`} />
      <main className="wrap grow" style={{ gap: 12 }}>
        {g.qi === 0 ? <div className="hintbox">{L('手元の心電図(紙の記録やモニター)を見ながら、1つずつ答えていきます。最後に、選んだ所見から考えられる心電図を表示します。わからないところはとばせます。', 'Answer one question at a time while looking at the ECG in front of you (paper or monitor). At the end, the app shows the ECG that best matches your findings. You can skip anything you are unsure of.')}</div> : null}
        <div className="segbar" style={{ gridTemplateColumns: `repeat(${GUIDE_QS.length},1fr)` }}>
          {GUIDE_QS.map((x, i) => {
            const can = (i < g.qi || (g.ans[x.k] != null && !g.auto[x.k])) && i !== g.qi && !g.auto[x.k];
            return <button key={x.k} type="button" className={`segbtn${i < g.qi ? ' d' : ''}${i === g.qi ? ' c' : ''}${g.auto[x.k] ? ' a' : ''}`} disabled={!can} onClick={() => act.gjump(x.k)} aria-label={L(`ステップ${i + 1} ${t(x.title)}`, `Step ${i + 1}: ${t(x.title)}`)} />;
          })}
        </div>
        <section className="col" style={{ gap: 10 }}>
          <div className="stepno">{L(`ステップ ${g.qi + 1}:`, `Step ${g.qi + 1}: `)}{t(q.title)}</div>
          <h2 className="q" style={{ lineHeight: 1.5 }}>{t(q.lead)}</h2>
          <div className="lookhint"><b>{L('ここを見る', 'Where to look')}</b> {t(q.look)}</div>
          <GuideFig k={q.k} />
          <h2 className="q" style={{ marginTop: 8 }}>{t(q.q)}</h2>
          <div className="col" style={{ gap: 10 }}>
            {q.opts.filter((o) => !only || only.includes(o[0])).map(([v, label, fig]) => (
              <button key={v} type="button" className={`gopt2${cur === v ? ' sel' : ''}`} aria-pressed={cur === v} onClick={() => act.gsel(v)}>
                <span className="gtxt"><span className="radio" />{t(label)}</span>
                <OptFigure f={fig} k={q.k} />
              </button>
            ))}
          </div>
          <button type="button" className={`gopt2 skipbtn${cur === 'skip' ? ' sel' : ''}`} aria-pressed={cur === 'skip'} onClick={() => act.gsel('skip')}>
            <span className="gtxt"><span className="radio" />{L('わからない・とばす', 'Not sure / skip')}</span>
          </button>
        </section>
      </main>
      <div className="foot two">
        <button type="button" className="btn sec" onClick={act.gprev}>{prev < 0 ? L('やめる', 'Quit') : L('前へ', 'Back')}</button>
        <button type="button" className="btn pri" onClick={act.gnext} disabled={cur == null}>{L('次へ', 'Next')}</button>
      </div>
    </>
  );
}

function GuideResult() {
  const { L, t, S, act } = useApp();
  const g = S.g!, R = guideResult(g.ans);
  const top = R.list[0].d;
  if (!g.res || g.res.forId !== top.id) g.res = { id: top.id, forId: top.id, tab: R.normal ? 'limb' : GUIDE_TAB[top.id] || 'limb', overlay: false };
  const shown = DIAGS.find((d) => d.id === g.res!.id)!, sc = caseById(shown.id)!;
  const EA = effAns(g.ans);
  const answered = GUIDE_QS.filter((q) => g.ans[q.k] != null && !g.auto[q.k]);
  return (
    <>
      <TopBar title={L('波形チェック', 'ECG Check')} sub={L('結果', 'Result')} />
      <main className="wrap grow" style={{ gap: 12 }}>
        {R.normal ? (
          <section className="okcard">
            <div className="row" style={{ gap: 10 }}>{IC.ok()}<b style={{ fontSize: 18 }}>{L('正常な心電図です', 'This is a normal ECG')}</b></div>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>{L('選んだ所見は、すべて正常洞調律の特徴と一致しました。下の正常心電図と見比べて確認しましょう。', 'All of your findings match normal sinus rhythm. Compare with the normal ECG below to confirm.')}</div>
          </section>
        ) : (
          <section className="rescard">
            <div className="sub">{R.exact ? L('選んだ所見から考えられる心電図', 'The ECG that matches your findings') : L('すべてに合う心電図はありませんでした。いちばん近いもの', 'Nothing matched every finding. The closest match')}</div>
            {DIAG_INFO[shown.id]
              ? <button type="button" className="infobtn" onClick={() => act.info(shown.id)}><span>{t(sc.name)}</span><span className="ibadge">{L('タップで説明', 'Tap for details')}</span></button>
              : <b style={{ fontSize: 19 }}>{t(sc.name)}</b>}
          </section>
        )}
        <Viewer c={sc} tab={g.res.tab} overlay={g.res.overlay} onTab={act.tab} onZoom={(l) => act.zoom(l)} />
        {R.normal ? null : <><OverlaySwitch on={g.res.overlay} onClick={act.overlay} />{g.res.overlay ? <Legend /> : null}</>}
        <div className="card col" style={{ gap: 6 }}>
          <b style={{ color: '#1E3A8A' }}>{L('見分けるポイント:', 'Key features: ')}{t(sc.name)}</b>
          {shown.points.map((p, i) => <div key={i} style={{ fontSize: 14, lineHeight: 1.6 }}>{L('・', '• ')}{t(p)}</div>)}
        </div>
        {!R.normal && answered.some((q) => g.ans[q.k] !== 'skip') ? (
          <div className="card">
            <b style={{ fontSize: 14 }}>{L('選んだ所見との一致', 'How your findings match')}</b>
            {answered.filter((q) => g.ans[q.k] !== 'skip').map((q) => {
              const kk = q.k === 'st1' ? 'st' : q.k;
              const ok = q.k === 'st1' && g.ans.st && g.ans.st !== 'skip' ? true : matches(shown, kk, EA[kk]);
              const o = q.opts.find((x) => x[0] === g.ans[q.k]);
              return <div key={q.k} className="row" style={{ gap: 8, padding: '5px 0', fontSize: 13 }}>{ok ? IC.ok() : IC.ng()}<span><span className="sub">{t(q.title)}{L(':', ': ')}</span>{o ? t(o[1]) : ''}</span></div>;
            })}
          </div>
        ) : null}
        {R.list.filter((x) => x.d.id !== g.res!.id).length ? (
          <>
            <h2>{L('ほかの可能性', 'Other possibilities')}</h2>
            <div className="col" style={{ gap: 8 }}>
              {R.list.filter((x) => x.d.id !== g.res!.id).map((x) => {
                const cc = caseById(x.d.id)!;
                return (
                  <button key={x.d.id} type="button" className="cand" onClick={() => act.gshow(x.d.id)}>
                    <ThumbII c={cc} W={110} />
                    <span className="mtext"><b>{t(cc.name)}</b><span className="sub">{L(`選んだ所見 ${x.hit}/${R.keys.length} 個が一致`, `${x.hit} of ${R.keys.length} findings match`)}</span></span>
                    {IC.chev()}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
        <h2>{L('選んだ所見(タップで変更)', 'Your findings (tap to change)')}</h2>
        <div className="card" style={{ padding: '4px 12px' }}>
          {answered.length ? answered.map((q) => {
            const v = g.ans[q.k], o = q.opts.find((x) => x[0] === v);
            return (
              <button key={q.k} type="button" className="srow" onClick={() => act.gjump(q.k)}>
                <span className="sub" style={{ minWidth: 72, textAlign: 'left' }}>{t(q.title)}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{v === 'skip' ? <span className="sub">{L('とばした', 'Skipped')}</span> : o ? t(o[1]) : v}</span>
                <span className="linkish">{L('変更', 'Change')}</span>
              </button>
            );
          }) : <p className="sub">{L('すべてとばしました', 'You skipped everything')}</p>}
        </div>
        <p className="src" style={{ margin: 0 }}>{L('見本はプログラムで描いた模式的な波形です。実際の心電図では形や大きさに個人差があります。診断には使わず、施設の手順と医師の判断に従ってください。', 'The examples are schematic waveforms drawn by the app. Real ECGs vary in shape and size from person to person. Do not use this for diagnosis—follow your facility’s protocols and the physician’s judgment.')}</p>
      </main>
      <div className="foot"><button type="button" className="btn pri" onClick={act.gstart}>{L('最初からやり直す', 'Start over')}</button></div>
    </>
  );
}
