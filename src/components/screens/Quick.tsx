'use client';
// ===== クイック判読(練習・60秒チャレンジ)と今日の復習 =====
import { practiceById } from '@/lib/logic';
import { useApp, type QuickSess } from '../AppCtx';
import { Viewer } from '../ecg';
import { IC, Legend, OverlaySwitch, QuitButton, TopBar } from '../ui';

export function QuickMenu() {
  const { L, store, act } = useApp();
  const b = store.best;
  const card = (sub: 'practice' | 's60', title: string, desc: string, best: string) => (
    <button type="button" className="mode" onClick={() => act.startQuick(sub)}>
      <span className="mtext"><span className="mt">{title}</span><span className="sub">{desc}</span>{best ? <span className="sub" style={{ color: '#1E293B', fontWeight: 600 }}>{L('自己ベスト:', 'Personal best: ')}{best}</span> : null}</span>
      {IC.chev()}
    </button>
  );
  return (
    <>
      <TopBar title={L('クイック判読', 'Quick read')} />
      <main className="wrap grow">
        <p className="sub" style={{ margin: 0 }}>{L('波形を見て、総合判断をすばやく選びます。全レベルの問題から出題します。', 'Look at the ECG and quickly choose the interpretation. Cases come from all levels.')}</p>
        {card('practice', L('練習', 'Practice'), L('時間制限なし。1問ごとに解説', 'No time limit. Explanation after each case'), '')}
        {card('s60', L('60秒チャレンジ', '60-second challenge'), L('60秒で何問正解できるか(間違えると−3秒)', 'How many can you get right in 60 s? (−3 s per mistake)'), b.s60 != null ? L(`${b.s60}問`, `${b.s60}`) : '')}
      </main>
    </>
  );
}

const EXP_DONE = 2; // 説明を2回書けたら完了

function Explain({ ss }: { ss: QuickSess }) {
  const { L, t, store, act } = useApp();
  const c = practiceById(ss.caseId);
  const EXP_ITEMS = [L('所見:どの誘導に、何が見えるか', 'Findings: what you see, and in which leads'), L('生理:なぜその誘導に出るのか', 'Physiology: why it shows in those leads'), L('細胞機序:心筋細胞で何が起きているか', 'Cellular mechanism: what is happening in the myocytes'), L('原因:何が原因か', 'Cause: what causes it')];
  const prev = !ss.sample && store.explain ? store.explain[c.id] : undefined;
  const done = prev?.done || 0;
  if (done >= EXP_DONE) {
    return <div className="expdone">{IC.ok()}<span><b>{L('説明はクリアしました', 'Explanation complete')}</b>{L(`(${EXP_DONE}回書けました)。この問題は、答えるだけで復習を続けます。`, ` (written ${EXP_DONE} times). From now on, just answer this one in reviews.`)}</span></div>;
  }
  const missed = prev && prev.missed.length ? prev.missed.map((i) => EXP_ITEMS[i].split(/[::]/)[0]).join(L('・', ', ')) : '';
  const LN = [L('所見', 'Findings'), L('生理', 'Physiology'), L('細胞機序', 'Cellular'), L('根本原因', 'Cause')];
  const wrote = (ss.expText || '').trim().length >= 5;
  return (
    <section className="explain">
      <div className="row-b"><span className="tag">{L('新人に説明してみる', 'Explain it to a new nurse')}</span><span className="sub">{L(`説明 ${done + 1} / ${EXP_DONE}回目`, `Explanation ${done + 1} of ${EXP_DONE}`)}</span></div>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.6 }}>{L(`新人さんに「なぜ${t(c.finalName)}だとわかるんですか?」と聞かれました。説明してみましょう。`, `A new nurse asks you: "How can you tell it’s ${t(c.finalName)}?" Try explaining it.`)}</p>
      {missed ? <div className="hintbox" style={{ padding: '8px 10px', fontSize: 13 }}>{L('前回うまく説明できなかったところ:', 'Last time you missed: ')}<b>{missed}</b></div> : null}
      <p className="sub" style={{ margin: 0 }}>🗣 {L('小さく声に出して説明してみると、より効果的です。', 'Saying it quietly out loud makes it even more effective.')}</p>
      <textarea className="ta" style={{ fontFamily: 'inherit', fontSize: 14, minHeight: 96 }} value={ss.expText} onChange={(e) => act.expText(e.target.value)}
        placeholder={L('どの誘導で何が見えるか、なぜそうなるのか、を書いてみよう(書かずに声に出すだけでもOK)', 'Write what you see in which leads, and why (or just say it out loud)')} aria-label={L('説明のメモ', 'Your explanation')} />
      {ss.expShown ? (
        <div className="col" style={{ gap: 6, marginTop: 4 }}>
          <b style={{ fontSize: 14 }}>{L('答え合わせ(4層の解説)', 'Check (four-layer explanation)')}</b>
          {c.layers.map((x, i) => <div key={i} className="expans"><span>{LN[i]}</span>{t(x)}</div>)}
          <b style={{ fontSize: 14, marginTop: 6 }}>{L('説明できたものに印をつけよう', 'Tick what you were able to explain')}</b>
          {EXP_ITEMS.map((x, i) => (
            <button key={i} type="button" className={`check${ss.expChecks[i] ? ' on' : ''}`} role="checkbox" aria-checked={!!ss.expChecks[i]} onClick={() => act.expCheck(i)}>
              <span className="cbox">{ss.expChecks[i] ? '✓' : ''}</span><span>{x}</span>
            </button>
          ))}
          <p className="sub" style={{ margin: 0 }}>
            {L('印がつかなかったところは、次の復習で「前回うまく説明できなかったところ」として表示します。', 'Anything left unticked is shown next time as "Last time you missed".')}
            {wrote ? L(`この説明で ${done + 1} / ${EXP_DONE}回分になります。`, ` This counts as explanation ${done + 1} of ${EXP_DONE}.`) : L('メモ欄に説明を書くと、回数に数えられます。', ' Writing in the box counts toward completion.')}
          </p>
        </div>
      ) : (
        <>
          <button type="button" className="btn sec" style={{ height: 46, fontSize: 15 }} onClick={act.expShow}>{L('答え合わせをする', 'Check my explanation')}</button>
          <p className="sub" style={{ margin: 0 }}>{L(`説明を${EXP_DONE}回書けたら、この問題の説明は完了です。`, `Once you have written ${EXP_DONE} explanations, this case is complete.`)}</p>
        </>
      )}
    </section>
  );
}

export function Quick() {
  const { L, t, S, act, now } = useApp();
  const ss = S.sess as QuickSess, c = practiceById(ss.caseId), corr = c.id;
  const title = { practice: L('練習', 'Practice'), s60: L('60秒チャレンジ', '60-second challenge'), review: L('今日の復習', 'Today’s review') }[ss.sub];
  const remain = Math.max(0, 60000 - ((now || Date.now()) - ss.start) - ss.penalty);
  const right = ss.sub === 's60' ? L(`${Math.ceil(remain / 1000)}秒`, `${Math.ceil(remain / 1000)} s left`) : '';
  const prog = ss.sub === 'review' ? L(`${ss.i + 1} / ${ss.queue.length}問`, `${ss.i + 1} / ${ss.queue.length}`) : L(`${ss.i + 1}問目`, `Case ${ss.i + 1}`);
  const lastLog = ss.log[ss.log.length - 1];
  const ok = ss.sel === corr;
  return (
    <>
      <TopBar title={title} sub={right ? `${prog}${L('・残り', ' · ')}${right}` : prog} right={<QuitButton />} />
      <main className="wrap grow" style={{ gap: 12, paddingTop: 10 }}>
        {ss.sample ? <div className="hintbox" style={{ padding: '6px 10px' }}>{L('サンプルの復習です(記録されません)', 'This is a sample review (not recorded)')}</div> : null}
        {ss.sub === 'review' && ss.revMap && ss.revMap[ss.caseId] ? <div className="row" style={{ gap: 8 }}><span className="tag">{L(`復習 ${ss.revMap[ss.caseId].stage + 1}回目`, `Review #${ss.revMap[ss.caseId].stage + 1}`)}</span><span className="sub">{L('前に間違えた問題です', 'You missed this one before')}</span></div> : null}
        <div className="row-b sub">
          <span>{L('正解', 'Correct')} <b style={{ color: '#15803D' }}>{ss.correct}</b>{L('・不正解', ' · Wrong')} <b style={{ color: '#B91C1C' }}>{ss.wrong}</b></span>
          {ss.sub === 's60' ? <span>{L('タップするとすぐ次の問題へ', 'Tap to go straight to the next')}</span> : null}
        </div>
        <Viewer c={c} tab={ss.tab} overlay={ss.revealed && ss.overlay} onTab={act.tab} onZoom={(l) => act.zoom(l)} />
        {ss.revealed && ss.overlay ? <Legend /> : null}
        <section className="col" style={{ gap: 10 }}>
          <h2 className="q">{L('総合判断は?', 'What is your interpretation?')}</h2>
          <div className="opts">
            {ss.opts.map((o, i) => {
              let cls = ss.sel === o ? 'sel' : '';
              if (ss.revealed) cls = o === corr ? 'ok' : ss.sel === o ? 'ng' : 'dim';
              return (
                <button key={o} type="button" className={`opt ${cls}`} style={{ textAlign: 'left' }} onClick={() => act.qopt(i)}>
                  {t(practiceById(o).finalName)}
                  {ss.revealed && o === corr ? <span className="optwhy">{t(c.layers[0])}</span> : null}
                </button>
              );
            })}
          </div>
          {ss.revealed ? (
            <>
              <div className={`fb ${ok ? 'ok' : 'ng'}`}>{ok ? IC.ok() : IC.ng()}<div><b>{ok ? L('正解', 'Correct') : L(`不正解:正解は「${t(c.finalName)}」`, `Not quite. The answer is "${t(c.finalName)}"`)}</b></div></div>
              {ss.sub === 'review' && lastLog?.next ? <div className={`nextrev ${lastLog.ok ? 'ok' : 'ng'}`}>{L('次の復習:', 'Next review: ')}<b>{t(lastLog.next)}</b></div> : null}
              {ss.sub === 'review' ? <Explain ss={ss} /> : null}
              <OverlaySwitch on={ss.overlay} onClick={act.overlay} />
              <button type="button" className="linkbtn" onClick={act.compare}>{L('正常の波形と比べる', 'Compare with normal')}</button>
            </>
          ) : null}
        </section>
      </main>
      {ss.revealed ? <div className="foot"><button type="button" className="btn pri" onClick={act.qnext}>{ss.sub === 'review' && ss.i >= ss.queue.length - 1 ? L('結果を見る', 'See results') : L('次の問題', 'Next case')}</button></div> : null}
    </>
  );
}

export function QuickResult() {
  const { L, t, S, act } = useApp();
  const ss = S.sess as QuickSess;
  const title = { practice: L('練習', 'Practice'), s60: L('60秒チャレンジ', '60-second challenge'), review: L('今日の復習', 'Today’s review') }[ss.sub];
  const main = ss.sub === 's60' ? L(`${ss.correct}問 正解`, `${ss.correct} correct`) : L(`${ss.correct} / ${ss.log.length}問 正解`, `${ss.correct} / ${ss.log.length} correct`);
  return (
    <>
      <TopBar title={L('結果', 'Results')} />
      <main className="wrap grow">
        <section className="hero">
          <div className="sub" style={{ color: '#CBD5E1' }}>{title}</div>
          <b style={{ fontSize: 26 }}>{main}</b>
          {ss.newBest ? <span className="tag" style={{ background: '#FDE68A', color: '#713F12', alignSelf: 'flex-start' }}>{L('自己ベスト更新', 'New personal best')}</span> : null}
        </section>
        {ss.log.length ? (
          <div className="card" style={{ padding: '4px 14px' }}>
            {ss.log.map((l, i) => {
              const c = practiceById(l.id);
              return (
                <div key={i} className="rrow">
                  <div className="row-b"><span className="row" style={{ gap: 8 }}>{l.ok ? IC.ok() : IC.ng()}<b>{t(c.finalName)}</b></span>{l.next ? <span className="sub" style={{ textAlign: 'right' }}>{L('次:', 'Next: ')}{t(l.next)}</span> : null}</div>
                  {l.ok ? null : <div className="why ngtxt">{L('あなた:', 'You: ')}{t(practiceById(l.your).finalName)}</div>}
                </div>
              );
            })}
          </div>
        ) : null}
        <p className="sub" style={{ margin: 0 }}>
          {ss.sub === 'review' ? L('正解した問題は間隔をあけて、間違えた問題は翌日にまた出題されます。', 'Correct answers come back after a longer gap; missed ones come back tomorrow.') : L('間違えた問題は「今日の復習」に入ります(翌日から出題)。', 'Missed cases go into "Today’s review" (from tomorrow).')}
          {ss.sample ? L('(サンプルのため記録されていません)', ' (Sample—not recorded.)') : ''}
        </p>
      </main>
      <div className="foot two">
        <button type="button" className="btn sec" onClick={act.home}>{L('ホームへ', 'Home')}</button>
        {ss.sub === 'review'
          ? <button type="button" className="btn pri" onClick={() => act.revList(ss.sample)}>{L('復習の予定を見る', 'Review schedule')}</button>
          : <button type="button" className="btn pri" onClick={() => act.startQuick(ss.sub as 'practice' | 's60')}>{L('もう一度', 'Try again')}</button>}
      </div>
    </>
  );
}
