'use client';
// ===== ホーム:上が波形チェック(メイン)、下が練習・クイズ =====
import { CASES, LEVEL_COLORS, LEVEL_NAMES, LEVELS } from '@/data/cases';
import { KNOW_N, READ_N } from '@/data/quiz';
import { dueReviews } from '@/lib/logic';
import { loadResume, type Saved } from '@/lib/resume';
import { LEVEL_STEPS } from '@/data/cases';
import { QZ } from '@/data/quiz';
import { useApp } from '../AppCtx';
import { IC, LvBadge, Mark, NavBar, PaperThumb } from '../ui';

export function Home() {
  const { L, t, store, act, now } = useApp();
  const lv = store.level, due = dueReviews(store, now).length, waiting = Object.keys(store.review).length;
  const lvCases = CASES.filter((c) => c.levels.includes(lv));
  const done = lvCases.filter((c) => (store.cases[c.id]?.c || 0) > 0).length;
  return (
    <>
      <main className="wrap grow">
        <div className="row-b" style={{ height: 48 }}>
          <div className="row" style={{ gap: 10 }}><Mark /><span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '.04em' }}>ECG DRILL</span></div>
        </div>
        <ResumeCard />
        <section className="hero">
          <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
            <PaperThumb size={56} cls="hthumb" />
            <div className="col" style={{ gap: 4 }}>
              <span className="sub" style={{ color: '#BFDBFE' }}>{L('波形チェック', 'ECG Check')}</span>
              <b style={{ fontSize: 17, lineHeight: 1.4 }}>{L('手元の心電図と照らし合わせる', 'Check the ECG in front of you')}</b>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#E2E8F0' }}>
            {L('紙の記録やモニターを見ながら、「まずここ、次にここ」と1つずつ確かめます。答えた所見から、考えられる心電図と解説を表示します。',
              'Look at a paper tracing or monitor and check it one step at a time—"look here first, then here." Based on your findings, the app shows the likely ECG and an explanation.')}
          </p>
          <button type="button" className="btn light" onClick={act.gstart}>{L('波形チェックをはじめる', 'Start ECG Check')}</button>
        </section>

        <h2 style={{ marginTop: 6 }}>{L('練習・クイズ', 'Practice & quizzes')}</h2>
        <button type="button" className="mode slim" onClick={() => (due ? act.review() : act.revList(false))}>
          <span className="micon sm" style={{ background: '#DBEAFE' }}>{IC.ok()}</span>
          <span className="mtext">
            <span className="mt">{L('今日の復習', 'Today’s review')} <b style={{ color: '#1D4ED8' }}>{due}{L('問', '')}</b></span>
            <span className="sub">{due ? L('間違えた問題をもう一度', 'Try your missed questions again') : L('今日の復習はありません', 'No reviews today')}{waiting ? L(`(復習待ち ${waiting}問)`, ` (${waiting} waiting)`) : ''}</span>
          </span>
          {IC.chev()}
        </button>
        <div className="row" style={{ gap: 16, marginTop: -6 }}>
          <button type="button" className="linkbtn" onClick={() => act.revList(false)}>{L('復習の予定を見る', 'Review schedule')}</button>
          <button type="button" className="linkbtn" onClick={() => act.revList(true)}>{L('サンプルで見る', 'See a sample')}</button>
        </div>

        <section className="col">
          <div className="row-b"><b style={{ fontSize: 14 }}>{L('レベル', 'Level')}</b><span className="sub">{L(`正解 ${done} / ${lvCases.length}問`, `${done} / ${lvCases.length} solved`)}</span></div>
          <div className="seg" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            {LEVELS.map((id) => (
              <button key={id} type="button" className={lv === id ? 'on' : ''} aria-pressed={lv === id} onClick={() => act.setLevel(id)}
                style={lv === id ? { background: LEVEL_COLORS[id].bg, color: LEVEL_COLORS[id].fg } : { color: LEVEL_COLORS[id].fg }}>
                <span className="dot" style={{ background: LEVEL_COLORS[id].bar }} />{t(LEVEL_NAMES[id])}
              </button>
            ))}
          </div>
          <div className="bar"><i style={{ width: `${lvCases.length ? (done / lvCases.length) * 100 : 0}%`, background: LEVEL_COLORS[lv].bar }} /></div>
        </section>

        <section className="col">
          <button type="button" className="mode" onClick={() => act.startStep()}>
            <PaperThumb />
            <span className="mtext"><span className="mt">{L('順番に読む練習', 'Step-by-step reading')}</span><span className="sub row" style={{ gap: 6, flexWrap: 'wrap' }}><LvBadge lv={lv} />{L('リズム→心拍数→…の順に答える', 'Rhythm → rate → … in order')}</span></span>
            {IC.chev()}
          </button>
          <button type="button" className="mode" onClick={() => act.nav('quickMenu')}>
            <span className="micon" style={{ background: '#FEF3C7' }}>{IC.clock()}</span>
            <span className="mtext"><span className="mt">{L('クイック判読', 'Quick read')}</span><span className="sub">{L('練習・60秒チャレンジ', 'Practice · 60-second challenge')}</span></span>
            {IC.chev()}
          </button>
          <button type="button" className="mode" onClick={() => act.nav('quizMenu')}>
            <span className="micon" style={{ background: '#E0E7FF' }}>{IC.book()}</span>
            <span className="mtext"><span className="mt">{L('基礎クイズ', 'Basics quiz')}</span><span className="sub">{L(`基礎知識 ${KNOW_N}問・心電図を読む ${READ_N}問`, `Basics ${KNOW_N} · Reading ECGs ${READ_N}`)}</span></span>
            {IC.chev()}
          </button>
        </section>
      </main>
      <NavBar on="home" />
    </>
  );
}

/** 途中でやめた練習・クイズの「続きをやる/削除する」 */
function ResumeCard() {
  const { L, t, act, lang } = useApp();
  const d: Saved | null = loadResume();
  if (!d) return null;
  let title = '', detail = '';
  if (d.screen === 'step') {
    const ss = d.sess, n = LEVEL_STEPS[ss.level].length;
    title = L('順番に読む練習', 'Step-by-step reading') + L('(', ' (') + t(LEVEL_NAMES[ss.level]) + L(')', ')');
    detail = L(`ステップ ${ss.idx + 1} / ${n}`, `Step ${ss.idx + 1} of ${n}`);
  } else if (d.screen === 'quick') {
    const ss = d.sess;
    title = { practice: L('クイック判読・練習', 'Quick read · Practice'), s60: L('60秒チャレンジ', '60-second challenge'), review: L('今日の復習', 'Today’s review') }[ss.sub];
    const score = L(`正解 ${ss.correct}・不正解 ${ss.wrong}`, `${ss.correct} correct · ${ss.wrong} wrong`);
    if (ss.sub === 's60') { const rem = Math.max(0, Math.ceil((60000 - (d.savedAt - ss.start) - ss.penalty) / 1000)); detail = L(`残り ${rem}秒・`, `${rem} s left · `) + score; }
    else if (ss.sub === 'review') detail = L(`${ss.i + 1} / ${ss.queue.length}問目・`, `Case ${ss.i + 1} of ${ss.queue.length} · `) + score;
    else detail = L(`${ss.i + 1}問目・`, `Case ${ss.i + 1} · `) + score;
  } else {
    const ss = d.sess, cat = QZ.cats.find((c) => c.id === ss.cat);
    title = L('基礎クイズ', 'Basics quiz') + L(':', ': ') + (cat ? t(cat.name) : ss.cat === 0 ? L('心電図を読む(ランダム)', 'Reading ECGs (random)') : L('基礎知識(ランダム)', 'Basics (random)'));
    detail = L(`${ss.i + 1} / ${ss.listIds.length}問目`, `Question ${ss.i + 1} of ${ss.listIds.length}`);
  }
  const when = new Date(d.savedAt).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return (
    <section className="resume" aria-label={L('途中の練習', 'Unfinished practice')}>
      <div className="col" style={{ gap: 2 }}>
        <span className="sub" style={{ color: '#1D4ED8', fontWeight: 700 }}>{L('途中でやめた練習があります', 'You have unfinished practice')}</span>
        <b style={{ fontSize: 15 }}>{title}</b>
        <span className="sub">{detail}{L(`(${when} に保存)`, ` (saved ${when})`)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button type="button" className="btn sec" style={{ height: 44, fontSize: 15 }} onClick={act.discardResume}>{L('削除する', 'Delete')}</button>
        <button type="button" className="btn pri" style={{ height: 44, fontSize: 15 }} onClick={act.resume}>{L('続きをやる', 'Continue')}</button>
      </div>
    </section>
  );
}
