'use client';
// ===== 順番に読む練習 =====
import { LEVEL_COLORS, LEVEL_STEPS, STEPS } from '@/data/cases';
import { answerFor, fmtAns, optLabel, practiceById, sameAns, whyFor } from '@/lib/logic';
import { useApp, type StepSess } from '../AppCtx';
import { Viewer } from '../ecg';
import { IC, Legend, LvBadge, OverlaySwitch, TopBar } from '../ui';

const REFS = 'AHA/ACCF/HRS ECG Standardization Part I–VI (2007, 2009) / Fourth Universal Definition of Myocardial Infarction (2018)';

export function Step() {
  const { L, t, S, act, lang } = useApp();
  const ss = S.sess as StepSess, c = practiceById(ss.caseId), keys = LEVEL_STEPS[ss.level], key = keys[ss.idx], def = STEPS[key];
  const opts = key === 'final' ? ss.finalOpts : def.opts!;
  const corr = answerFor(c, key), adv = ss.level === 'advanced', beg = ss.level === 'beginner';
  const hasSel = def.multi ? ((ss.sel as string[]) || []).length > 0 : ss.sel !== null;
  const last = ss.idx === keys.length - 1;
  const ok = ss.revealed && sameAns(ss.answers[key], corr);
  const focus = def.focus || [];
  return (
    <>
      <TopBar title={L('順番に読む練習', 'Step-by-step reading')} right={`${ss.idx + 1}/${keys.length}`} />
      <main className="wrap grow" style={{ gap: 12, paddingTop: 10 }}>
        <div className="segbar" style={{ gridTemplateColumns: `repeat(${keys.length},1fr)` }}>
          {keys.map((k, i) => <i key={k} className={i < ss.idx ? 'd' : ''} style={i === ss.idx ? { background: LEVEL_COLORS[ss.level].bar } : undefined} />)}
        </div>
        <div className="row-b sub" style={{ flexWrap: 'wrap' }}>
          <span className="row" style={{ gap: 6 }}><LvBadge lv={ss.level} />{L(`ステップ ${ss.idx + 1} / ${keys.length}:`, `Step ${ss.idx + 1} / ${keys.length}: `)}{t(def.title)}</span>
          {focus.length ? <span>{L('見るべき誘導を', 'Leads to check are ')}<b style={{ color: '#1D4ED8' }}>{L('青枠', 'outlined in blue')}</b>{L('で表示', '')}</span> : null}
        </div>
        <Viewer c={c} tab={ss.tab} focus={focus} overlay={beg && ss.overlay} onTab={act.tab} onZoom={(l) => act.zoom(l)} />
        {beg ? <><OverlaySwitch on={ss.overlay} onClick={act.overlay} />{ss.overlay ? <Legend /> : null}</> : null}
        <section className="col" style={{ gap: 10 }}>
          <h2 className="q">{t(def.q)}</h2>
          <div className="opts" style={{ gridTemplateColumns: opts.length > 4 || key === 'final' ? '1fr' : 'repeat(2,1fr)' }}>
            {opts.map((o, i) => {
              const chosen = def.multi ? ((ss.sel as string[]) || []).includes(o) : ss.sel === o;
              let cls = chosen ? 'sel' : '';
              if (ss.revealed) { const isC = def.multi ? (corr as string[]).includes(o) : corr === o; cls = isC ? 'ok' : chosen ? 'ng' : 'dim'; }
              return (
                <button key={o} type="button" className={`opt ${cls}`} onClick={() => act.opt(i)} {...(def.multi ? { role: 'checkbox', 'aria-checked': chosen } : { 'aria-pressed': chosen })}>
                  {optLabel(key, o, lang)}
                </button>
              );
            })}
          </div>
          {beg && !ss.revealed && def.hint ? (ss.hint ? <div className="hintbox"><b>{L('ヒント', 'Hint')}</b> {t(def.hint)}</div> : <button type="button" className="linkbtn" onClick={act.hint}>{L('ヒントを見る', 'Show hint')}</button>) : null}
          {ss.revealed ? (
            <div className={`fb ${ok ? 'ok' : 'ng'}`}>
              {ok ? IC.ok(L('正解', 'Correct')) : IC.ng(L('不正解', 'Wrong'))}
              <div><b>{ok ? L('正解', 'Correct') : L(`不正解:正解は「${fmtAns(key, corr, lang)}」`, `Not quite. The answer is "${fmtAns(key, corr, lang)}"`)}</b><div>{whyFor(c, key, lang)}</div></div>
            </div>
          ) : null}
        </section>
      </main>
      <div className="foot">
        {adv ? <button type="button" className="btn pri" onClick={act.stepNext} disabled={!hasSel}>{last ? L('結果を見る', 'See results') : L('次へ', 'Next')}</button>
          : !ss.revealed ? <button type="button" className="btn pri" onClick={act.stepAnswer} disabled={!hasSel}>{L('回答する', 'Answer')}</button>
            : <button type="button" className="btn pri" onClick={act.stepNext}>{last ? L('結果を見る', 'See results') : L('次のステップへ', 'Next step')}</button>}
      </div>
    </>
  );
}

export function StepResult() {
  const { L, t, S, act, lang } = useApp();
  const ss = S.sess as StepSess, c = practiceById(ss.caseId), results = ss.results!, fin = results[results.length - 1];
  const LN: [string, string][] = [
    [L('所見', 'Findings'), L('波形で何が見えるか', 'What you see on the ECG')],
    [L('生理', 'Physiology'), L('なぜその誘導に出るのか', 'Why it shows in those leads')],
    [L('細胞機序', 'Cellular mechanism'), L('心筋細胞で何が起きているか', 'What is happening in the myocytes')],
    [L('根本原因', 'Underlying cause'), L('何が原因か', 'What causes it')],
  ];
  return (
    <>
      <TopBar title={L('判読結果', 'Results')} />
      <main className="wrap grow" style={{ background: '#F8FAFC' }}>
        <section className="hero">
          <div className="row-b"><span className="row" style={{ gap: 8 }}><LvBadge lv={ss.level} /><span className="sub" style={{ color: '#CBD5E1' }}>{L('スコア', 'Score')}</span></span><span><b style={{ fontSize: 34 }}>{ss.score}</b><span style={{ color: '#CBD5E1' }}> / {ss.max}</span></span></div>
          <div className="row inv" style={{ gap: 10 }}>
            {fin.ok ? IC.ok(L('正解', 'Correct'), '#86EFAC') : IC.ng(L('不正解', 'Wrong'), '#FCA5A5')}
            <div><div className="sub" style={{ color: '#CBD5E1' }}>{L('総合判断(正解)', 'Final interpretation (answer)')}</div><b style={{ fontSize: 16 }}>{t(c.finalName)}</b></div>
          </div>
        </section>
        <div className="card" style={{ padding: '4px 14px' }}>
          {results.map((r) => (
            <div key={r.k} className="rrow">
              <div className="row-b">
                <span className="row" style={{ gap: 8 }}>{r.ok ? IC.ok() : IC.ng()}<b>{t(STEPS[r.k].title)}</b></span>
                <span className={r.ok ? 'sub' : 'ngtxt'} style={{ textAlign: 'right' }}>
                  {r.ok ? fmtAns(r.k, r.corr, lang) : <>{L('あなた:', 'You: ')}{fmtAns(r.k, r.your, lang)}<br />{L('正解:', 'Answer: ')}{fmtAns(r.k, r.corr, lang)}</>}
                </span>
              </div>
              <div className="why">{whyFor(c, r.k, lang)}</div>
            </div>
          ))}
        </div>
        <h2>{L('答え合わせ', 'Review the ECG')}</h2>
        <Viewer c={c} tab={ss.tab} overlay={ss.overlay} onTab={act.tab} onZoom={(l) => act.zoom(l)} />
        <OverlaySwitch on={ss.overlay} onClick={act.overlay} />{ss.overlay ? <Legend /> : null}
        <button type="button" className="btn sec blue" onClick={act.compare}>{IC.wave()} {L('正常の波形と1拍ずつ比べる', 'Compare beat by beat with normal')}</button>
        <h2>{L('解説', 'Explanation')}</h2>
        {c.layers.map((tx, i) => (
          <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <button type="button" className="acc" onClick={() => act.layer(i)} aria-expanded={!!ss.open[i]}>
              <span className={`num${ss.open[i] ? ' on' : ''}`}>{i + 1}</span>
              <span style={{ flex: 1, textAlign: 'left' }}><b>{LN[i][0]}</b><br /><span className="sub">{LN[i][1]}</span></span>
              <span style={{ transform: `rotate(${ss.open[i] ? 180 : 0}deg)`, display: 'flex' }}>{IC.chevDown()}</span>
            </button>
            {ss.open[i] ? <div className="accb">{t(tx)}</div> : null}
          </div>
        ))}
        <div className="memo"><b>{L('臨床メモ', 'Clinical note')}</b><div>{t(c.memo)}</div></div>
        <div className="src">{L('根拠:', 'References: ')}{REFS}<br />{L('波形:プログラムで描いた模式的なサンプル。今後PTB-XL(PhysioNet, CC BY 4.0)の実波形に置き換える予定。', 'Waveforms: schematic samples generated by the app. To be replaced with real PTB-XL tracings (PhysioNet, CC BY 4.0).')}</div>
      </main>
      <div className="foot two">
        <button type="button" className="btn sec" onClick={act.retry}>{L('もう一度', 'Try again')}</button>
        <button type="button" className="btn pri" onClick={() => act.startStep()}>{L('次の問題', 'Next case')}</button>
      </div>
    </>
  );
}
