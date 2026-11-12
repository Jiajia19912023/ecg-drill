'use client';
// ===== 復習の予定 =====
import { caseById } from '@/data/guide';
import { dayLabel, nextAfter } from '@/lib/logic';
import { sampleReview } from '@/lib/store';
import { useApp } from '../AppCtx';
import { ThumbII } from '../ecg';
import { TopBar } from '../ui';

export function ReviewList() {
  const { L, t, S, store, act, lang, now } = useApp();
  const sample = S.revSample, m = sample ? sampleReview() : store.review, n = now || Date.now();
  const ids = Object.keys(m).filter((id) => caseById(id)).sort((a, b) => m[a].next - m[b].next);
  const due = ids.filter((id) => m[id].next <= n);
  const today = L('今日', 'Today');
  const groups: [string, string[]][] = [];
  ids.forEach((id) => {
    const k = m[id].next <= n ? today : dayLabel(m[id].next, lang);
    const g = groups.find((x) => x[0] === k);
    if (g) g[1].push(id); else groups.push([k, [id]]);
  });
  const steps = [L('間違えた', 'Missed'), L('翌日', 'Next day'), L('7日後', '7 days later'), L('卒業', 'Graduated')];
  return (
    <>
      <TopBar title={L('復習の予定', 'Review schedule')} sub={sample ? L('サンプル', 'Sample') : undefined} />
      <main className="wrap grow" style={{ gap: 12 }}>
        {sample ? <div className="hintbox">{L('サンプルデータです。ここで解いても記録は変わりません。', 'This is sample data. Answering here does not change your records.')}</div> : null}
        <section className="card col" style={{ gap: 8 }}>
          <b>{L('復習のタイミング', 'When reviews happen')}</b>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>
            {L('復習では、答えたあとに「新人に説明してみる」で、なぜその心電図になるのかを自分の言葉で説明します(1つの問題につき2回書けたら完了)。間違えた問題は、翌日から「今日の復習」に出てきます。翌日の復習で正解すると次は7日後、7日後にも正解すると卒業です。復習で間違えると、また翌日からやり直しになります。',
              'After answering a review, use "Explain it to a new nurse" to put into your own words why the ECG looks the way it does (complete once you have written it twice per case). Missed cases appear in "Today’s review" the next day. Get it right then and it comes back in 7 days; get it right again and it graduates. A wrong answer in review starts it over from the next day.')}
          </p>
          <div className="rflow">{steps.map((x, i) => <span key={i} style={{ display: 'contents' }}><span className={i === 0 ? 'ng' : i === steps.length - 1 ? 'ok' : ''}>{x}</span>{i < steps.length - 1 ? <i>→</i> : null}</span>)}</div>
          <p className="sub" style={{ margin: 0 }}>{L('ホームの「今日の復習」に、その日に出題する問題の数が表示されます。', '"Today’s review" on the home screen shows how many cases are due.')}</p>
        </section>
        {ids.length ? groups.map(([g, arr]) => (
          <div key={g} className="col" style={{ gap: 8 }}>
            <h2 style={{ marginTop: 4 }}>{g}{g === today ? <span className="tag" style={{ marginLeft: 8 }}>{L(`${arr.length}問`, `${arr.length}`)}</span> : null}</h2>
            {arr.map((id) => {
              const c = caseById(id)!, r = m[id];
              return (
                <div key={id} className="cand" style={{ cursor: 'default' }}>
                  <ThumbII c={c} W={96} />
                  <span className="mtext"><b>{t(c.name)}</b><span className="sub">{L(`復習 ${r.stage + 1}回目・正解すると次は`, `Review #${r.stage + 1} · if correct, next: `)}{t(nextAfter(r.stage, true))}</span></span>
                </div>
              );
            })}
          </div>
        )) : <p className="sub">{L('復習待ちの問題はありません。順番に読む練習やクイック判読で間違えた問題が、ここに入ります。', 'Nothing waiting for review. Cases you miss in step-by-step reading or quick read will appear here.')}</p>}
      </main>
      {due.length ? <div className="foot"><button type="button" className="btn pri" onClick={act.revStart}>{L(`今日の復習をはじめる(${due.length}問)`, `Start today’s review (${due.length})`)}</button></div> : null}
    </>
  );
}
