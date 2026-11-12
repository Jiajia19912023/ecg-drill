'use client';
// ===== 苦手分析 =====
import { QZ } from '@/data/quiz';
import { pct, type Attempt, type Rec } from '@/lib/store';
import type { Lang } from '@/lib/i18n';
import { useApp } from '../AppCtx';
import { NavBar, PlainTop } from '../ui';

const LOOK_GROUPS: [string, string, string, string, string[]][] = [
  ['リズムと心拍数', 'Rhythm & rate', '脈が規則的か、速さはどうか', 'Is it regular, and how fast?', ['rhythm', 'reg', 'rate']],
  ['P波とPR間隔', 'P wave & PR', '心房の動きと、心室への伝わり方', 'Atrial activity and conduction to the ventricles', ['p', 'pr']],
  ['QRSと電気軸', 'QRS & axis', '心室の興奮の幅・形・向き', 'Width, shape and direction of ventricular activation', ['qrs', 'axis', 'qwave', 'hyp']],
  ['ST・T波・QT', 'ST, T & QT', '虚血や、心筋の回復(再分極)の異常', 'Ischemia and repolarization abnormalities', ['st', 'stt', 'qt']],
  ['総合判断', 'Final call', '最後に、何の心電図かを答える', 'Naming the ECG at the end', ['final']],
];

type Look = { name: string; desc: string; p: number | null; n: number };
type Data = { tags: Record<string, Rec>; steps: Record<string, Rec>; cats: Record<string, Rec>; attempts: Pick<Attempt, 'ok' | 'at'>[]; waiting: number };

function Radar({ vals, W, L }: { vals: Look[]; W: number; L: (ja: string, en: string) => string }) {
  const n = vals.length, cx = W / 2, cy = 135, R = 80, ang = (i: number) => -Math.PI / 2 + i * 2 * Math.PI / n;
  const pt = (i: number, r: number) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const poly = (f: number) => vals.map((_, i) => pt(i, R * f).map((v) => v.toFixed(1)).join(',')).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${W} 270`} role="img" aria-label={L('見るところ別の正答率のレーダーチャート', 'Radar chart of accuracy by area')}>
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={poly(f)} fill="none" stroke="#E2E8F0" strokeWidth="1" />)}
      {vals.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="#E2E8F0" />; })}
      <polygon points={vals.map((v, i) => pt(i, R * (v.p == null ? 0 : v.p / 100)).map((x) => x.toFixed(1)).join(',')).join(' ')} fill="rgba(37,99,235,0.15)" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" />
      {vals.map((v, i) => {
        const [lx, ly] = pt(i, R + 20), anchor = Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end';
        const ax = anchor === 'start' ? lx - 8 : anchor === 'end' ? lx + 8 : lx, weak = v.p != null && v.p < 60;
        const dot = v.p != null ? pt(i, R * v.p / 100) : null;
        return (
          <g key={i}>
            {dot ? <circle cx={dot[0].toFixed(1)} cy={dot[1].toFixed(1)} r="4.5" fill="#2563EB" stroke="#fff" strokeWidth="2"><title>{`${v.name}: ${v.p}% (${v.n})`}</title></circle> : null}
            <text x={ax.toFixed(1)} y={(ly - 2).toFixed(1)} textAnchor={anchor} fontSize="12" fontWeight="700" fill="#1E293B">{v.name}</text>
            <text x={ax.toFixed(1)} y={(ly + 12).toFixed(1)} textAnchor={anchor} fontSize="11" fill={weak ? '#C2410C' : '#475569'} fontWeight={weak ? 800 : 400}>{v.p == null ? '—' : v.p + '%'}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Trend({ att, W, lang, L }: { att: Data['attempts']; W: number; lang: Lang; L: (ja: string, en: string) => string }) {
  const day = 86400000, start = new Date(); start.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const t0 = start.getTime() - (6 - i) * day, a = att.filter((x) => x.at >= t0 && x.at < t0 + day), d = new Date(t0);
    return { lb: `${d.getMonth() + 1}/${d.getDate()}`, n: a.length, p: a.length ? Math.round(a.filter((x) => x.ok).length / a.length * 100) : null };
  });
  const Lm = 34, Rr = 12, Tp = 26, B = 26, H = 182, pw = W - Lm - Rr, ph = H - Tp - B;
  const X = (i: number) => Lm + i * pw / 6, Y = (p: number) => Tp + ph * (1 - p / 100);
  const pts = days.map((d, i) => (d.p == null ? null : { x: X(i), y: Y(d.p), d })).filter(Boolean) as { x: number; y: number; d: (typeof days)[number] }[];
  if (!pts.length) return <p className="sub" style={{ margin: 0 }}>{L('直近7日間の記録がありません。', 'No records in the last 7 days.')}</p>;
  void lang;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={L('直近7日間の正答率の推移', 'Accuracy over the last 7 days')}>
      {[0, 50, 100].map((v) => <g key={v}><line x1={Lm} x2={W - Rr} y1={Y(v)} y2={Y(v)} stroke="#E2E8F0" /><text x={Lm - 6} y={Y(v) + 4} textAnchor="end" fontSize="10" fill="#475569">{v}%</text></g>)}
      {days.map((d, i) => <text key={i} x={X(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#475569">{d.lb}</text>)}
      {pts.length > 1 ? <polyline points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} fill="none" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /> : null}
      {pts.map((p, k) => (
        <g key={k}>
          <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4.5" fill="#2563EB" stroke="#fff" strokeWidth="2"><title>{`${p.d.lb}: ${p.d.p}% (${p.d.n})`}</title></circle>
          {k === pts.length - 1 ? <text x={(p.x - 6).toFixed(1)} y={(p.y - 10).toFixed(1)} textAnchor="end" fontSize="12" fontWeight="800" fill="#1E293B">{p.d.p}%</text> : null}
        </g>
      ))}
    </svg>
  );
}

export function Analysis() {
  const { L, t, store, W: W0, lang } = useApp();
  const realD: Data = (() => {
    const cats: Record<string, Rec> = {};
    QZ.qs.forEach((q) => { const r = store.quiz[q.id]; if (r) { const a = cats[q.cat] || (cats[q.cat] = { c: 0, n: 0 }); a.c += r.c; a.n += r.n; } });
    return { tags: store.tags, steps: store.steps, cats, attempts: store.attempts, waiting: Object.keys(store.review).length };
  })();
  const realEmpty = !Object.keys(realD.tags).length && !Object.keys(realD.steps).length && !Object.keys(realD.cats).length;
  const D = realD, W = W0 - 28;
  const catRows = Object.entries(D.cats).filter(([, v]) => v.n).map(([k, v]) => ({ id: k, name: t((QZ.cats.find((c) => String(c.id) === k) || { name: { ja: k, en: k } }).name), p: pct(v)!, n: v.n })).sort((a, b) => a.p - b.p);
  const looks: Look[] = LOOK_GROUPS.map(([nj, ne, dj, de, ks]) => {
    const r = ks.reduce((a, k) => { const x = D.steps[k]; return x ? { c: a.c + x.c, n: a.n + x.n } : a; }, { c: 0, n: 0 });
    return { name: L(nj, ne), desc: L(dj, de), p: r.n ? pct(r) : null, n: r.n };
  });
  const allN = D.attempts.length + Object.values(D.cats).reduce((a, v) => a + v.n, 0);
  const allC = D.attempts.filter((a) => a.ok).length + Object.values(D.cats).reduce((a, v) => a + v.c, 0);
  return (
    <>
      <PlainTop title={L('苦手分析', 'Progress')} />
      <main className="wrap grow">
        {realEmpty ? (
          <div className="card col" style={{ gap: 10 }}>
            <p style={{ margin: 0 }}>{L('まだ記録がありません。判読やクイズに挑戦すると、ここに苦手な分野がグラフで表示されます。', 'No records yet. As you practice and take quizzes, your weak areas will be charted here.')}</p>
          </div>
        ) : (
          <>
            <div className="tiles">
              <div className="tile"><span>{L('解いた問題', 'Answered')}</span><b>{allN}<small>{L('問', '')}</small></b></div>
              <div className="tile"><span>{L('全体の正答率', 'Overall')}</span><b>{allN ? Math.round(allC / allN * 100) : 0}<small>%</small></b></div>
              <div className="tile"><span>{L('復習待ち', 'To review')}</span><b>{D.waiting}<small>{L('問', '')}</small></b></div>
            </div>
            <section className="card">
              <b>{L('見るところ別の正答率', 'Accuracy by area')}</b>
              <p className="sub" style={{ margin: '2px 0 0' }}>{L('「順番に読む練習」の結果から。外側ほど正答率が高く、へこんでいるところが苦手です', 'From step-by-step reading. The farther out, the better—dips show weak areas')}</p>
              <Radar vals={looks} W={W} L={L} />
              <div className="col" style={{ gap: 4, fontSize: 13, lineHeight: 1.6 }}>{looks.map((r) => <div key={r.name}><b>{r.name}</b><span className="sub">{L(':', ': ')}{r.desc}</span></div>)}</div>
            </section>
            <section className="card"><b>{L('正答率の推移(直近7日)', 'Accuracy trend (last 7 days)')}</b><Trend att={D.attempts} W={W} lang={lang} L={L} /></section>
            {catRows.length ? (
              <section className="card">
                <b>{L('基礎クイズ(カテゴリ別)', 'Basics quiz by topic')}</b>
                <div style={{ height: 8 }} />
                {catRows.map((r) => (
                  <div key={r.id} className="hbar" title={`${r.name}: ${r.p}% (${r.n})`}>
                    <span className="hname">{r.name}{r.p < 60 ? <em>{L('苦手', 'Weak')}</em> : null}</span>
                    <span className="htrack"><i style={{ width: `${r.p}%` }} /></span>
                    <b>{r.p}%</b>
                  </div>
                ))}
              </section>
            ) : null}
          </>
        )}
      </main>
      <NavBar on="analysis" />
    </>
  );
}
