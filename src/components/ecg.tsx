'use client';
// ===== 心電図の描画(方眼紙は実寸の比率:25mm/秒・10mm/mV) =====
import type { CSSProperties, ReactNode } from 'react';
import { DUR, FS, axisLeads, caseSig, diffPath, genLead, normSig, paperSize, regBeats, sigRange, tracePath, type Beat, type GenOpts, type LeadName, type LeadShape, type SynthCase } from '@/lib/engine';
import { BASE } from '@/lib/engine';
import { caseById } from '@/data/guide';
import type { OptFig, StripFig } from '@/data/guide';
import type { QuizFig } from '@/data/readquiz';
import { useApp } from './AppCtx';
import { TabsBar, type Tab } from './ui';

const paperStyle = (pxmm: number, extra?: CSSProperties): CSSProperties => ({ backgroundSize: paperSize(pxmm), ...extra });

export function SvgLead({ c, lead, t0, t1, w, h, y0, pxmm, overlay }: { c: SynthCase; lead: LeadName; t0: number; t1: number; w: number; h: number; y0: number; pxmm: number; overlay?: boolean }) {
  const cs = caseSig(c).sig[lead];
  const ns = overlay ? normSig(c).sig[lead] : null;
  return (
    <svg width={w.toFixed(1)} height={h} viewBox={`0 0 ${w.toFixed(1)} ${h}`} overflow="visible" aria-hidden="true">
      {ns ? <path d={diffPath(cs, ns, t0, t1, 0, y0, pxmm)} fill="rgba(245,158,11,0.38)" /> : null}
      {ns ? <path d={tracePath(ns, t0, t1, 0, y0, pxmm)} fill="none" stroke="#2563EB" strokeOpacity="0.45" strokeWidth="3" strokeLinejoin="round" /> : null}
      <path d={tracePath(cs, t0, t1, 0, y0, pxmm)} fill="none" stroke="#1A1A1A" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

type Cell = { lead: LeadName; label: string; x: number; y: number; w: number; h: number; t0: number; t1: number };
function Cells({ c, cells, pxmm, y0, focus, overlay, onZoom, W, H }: { c: SynthCase; cells: Cell[]; pxmm: number; y0: number; focus: string[]; overlay?: boolean; onZoom: (lead: string) => void; W: number; H: number }) {
  const { L } = useApp();
  return (
    <div className="paper viewer" style={paperStyle(pxmm, { width: W, height: H })}>
      {cells.map((k, i) => (
        <button key={i} type="button" className={`cell${focus.includes(k.lead) && k.label ? ' hl' : ''}`} onClick={() => onZoom(k.lead)}
          aria-label={L(`${k.lead}誘導を拡大`, `Enlarge lead ${k.lead}`)} style={{ left: k.x, top: k.y, width: k.w, height: k.h }}>
          <SvgLead c={c} lead={k.lead} t0={k.t0} t1={k.t1} w={k.w} h={Math.round(k.h)} y0={y0} pxmm={pxmm} overlay={overlay} />
          {k.label ? <span className="lbl">{k.label}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** 縦向き:2列×3行、またはリズム(IIを3段) */
export function ViewerPortrait({ c, tab, focus, overlay, W, onZoom }: { c: SynthCase; tab: Tab; focus: string[]; overlay?: boolean; W: number; onZoom: (lead: string) => void }) {
  const { L } = useApp();
  const pxmm = 4.4, ch = Math.round(25 * pxmm), y0 = 15 * pxmm;
  const cells: Cell[] = [];
  if (tab === 'rhythm') {
    const rd = W / (25 * pxmm);
    for (let r = 0; r < 3; r++) cells.push({ lead: 'II', label: r === 0 ? L('II(リズム)', 'II (rhythm)') : '', x: 0, y: r * ch, w: W, h: ch, t0: r * rd, t1: (r + 1) * rd });
  } else {
    const grid: LeadName[][] = tab === 'limb' ? [['I', 'aVR'], ['II', 'aVL'], ['III', 'aVF']] : [['V1', 'V4'], ['V2', 'V5'], ['V3', 'V6']];
    const cw = W / 2, cd = cw / (25 * pxmm);
    grid.forEach((row, r) => row.forEach((lead, col) => cells.push({ lead, label: lead, x: col * cw, y: r * ch, w: cw, h: ch, t0: col * cd, t1: (col + 1) * cd })));
  }
  return <Cells c={c} cells={cells} pxmm={pxmm} y0={y0} focus={focus} overlay={overlay} onZoom={onZoom} W={W} H={3 * ch} />;
}

/** 横向き:3行×4列+IIのリズム */
export function ViewerWide({ c, focus, overlay, W, onZoom }: { c: SynthCase; focus: string[]; overlay?: boolean; W: number; onZoom: (lead: string) => void }) {
  const pxmm = W / (25 * DUR), rh = 25 * pxmm, y0 = 15 * pxmm, cw = W / 4;
  const grid: LeadName[][] = [['I', 'aVR', 'V1', 'V4'], ['II', 'aVL', 'V2', 'V5'], ['III', 'aVF', 'V3', 'V6']];
  const cells: Cell[] = [];
  grid.forEach((row, r) => row.forEach((lead, col) => cells.push({ lead, label: lead, x: col * cw, y: r * rh, w: cw, h: rh, t0: col * 2.5, t1: (col + 1) * 2.5 })));
  cells.push({ lead: 'II', label: 'II', x: 0, y: 3 * rh, w: W, h: rh, t0: 0, t1: DUR });
  return <Cells c={c} cells={cells} pxmm={pxmm} y0={y0} focus={focus} overlay={overlay} onZoom={onZoom} W={W} H={4 * rh} />;
}

/** 心電図の表示(縦向きはタブで切り替え、横向きは12誘導すべて) */
export function Viewer({ c, tab, focus = [], overlay, onTab, onZoom }: { c: SynthCase; tab: Tab; focus?: string[]; overlay?: boolean; onTab: (t: Tab) => void; onZoom: (lead: string) => void }) {
  const { L, W, landscape, winW } = useApp();
  if (landscape) return <div className="vwrap"><ViewerWide c={c} focus={focus} overlay={overlay} W={winW - 32} onZoom={onZoom} /></div>;
  return (
    <div className="vwrap">
      <TabsBar tab={tab} onTab={onTab} />
      <ViewerPortrait c={c} tab={tab} focus={focus} overlay={overlay} W={W} onZoom={onZoom} />
      <div className="note">{L('波形をタップすると拡大できます。横向きにすると12誘導全体を表示します。', 'Tap a lead to enlarge it. Turn your phone sideways to see all 12 leads.')}</div>
    </div>
  );
}

/** 1誘導を大きく(拡大表示) */
export function ZoomStrip({ c, lead, overlay }: { c: SynthCase; lead: LeadName; overlay?: boolean }) {
  const pxmm = 6, W = 25 * pxmm * DUR;
  const arrs = [caseSig(c).sig[lead]].concat(overlay ? [normSig(c).sig[lead]] : []);
  const { mx, mn } = sigRange(arrs, 0, DUR);
  const topMm = Math.ceil(mx * 10 / 5) * 5 + 5, botMm = Math.ceil(-mn * 10 / 5) * 5 + 5;
  const h = (topMm + botMm) * pxmm, y0 = topMm * pxmm;
  return (
    <div className="paper" style={paperStyle(pxmm, { position: 'relative', width: W, height: h })}>
      <SvgLead c={c} lead={lead} t0={0} t1={DUR} w={W} h={h} y0={y0} pxmm={pxmm} overlay={overlay} />
      <span className="lbl" style={{ position: 'sticky' }}>{lead}</span>
    </div>
  );
}

/** IIの小さな見本 */
export function ThumbII({ c, W }: { c: SynthCase; W: number }) {
  const pxmm = W / (25 * 2.0), h = Math.round(22 * pxmm);
  return <div className="paper mfig" style={paperStyle(pxmm, { width: W, height: h })}><SvgLead c={c} lead="II" t0={0} t1={2.0} w={W} h={h} y0={14 * pxmm} pxmm={pxmm} /></div>;
}

// ===== クイズの図 =====
function pathOf(s: Float32Array, y0: number, sens: number, pxmm: number, speed: number, from = 0) {
  const k = speed * pxmm / FS; let d = '';
  for (let i = from; i < s.length; i++) d += (d ? 'L' : 'M') + (i * k).toFixed(1) + ' ' + (y0 - s[i] * sens * pxmm).toFixed(1);
  return d;
}
export function QuizFigure({ f }: { f: QuizFig }) {
  const { L, W, act } = useApp();
  if (f.type === 'long') {
    const c = caseById(f.caseId)!;
    return <div className="figwrap"><ViewerPortrait c={c} tab="rhythm" focus={[]} W={W} onZoom={(lead) => act.zoom(lead, c.id)} /></div>;
  }
  if (f.type === 'twelve') {
    const c = caseById(f.caseId)!, pxmm = 3.2, ch = 25 * pxmm, cw = W / 2, cd = cw / (25 * pxmm), y0 = 15 * pxmm;
    const rows: LeadName[][] = [['I', 'aVR'], ['II', 'aVL'], ['III', 'aVF'], ['V1', 'V4'], ['V2', 'V5'], ['V3', 'V6']];
    const cells: Cell[] = [];
    rows.forEach((row, r) => row.forEach((lead, col) => cells.push({ lead, label: lead, x: col * cw, y: r * ch, w: cw, h: ch, t0: col * cd, t1: (col + 1) * cd })));
    return <div className="figwrap"><Cells c={c} cells={cells} pxmm={pxmm} y0={y0} focus={[]} onZoom={(lead) => act.zoom(lead, c.id)} W={W} H={6 * ch} /><div className="note">{L('タップすると拡大できます', 'Tap a lead to enlarge it')}</div></div>;
  }
  if (f.type === 'leadset') {
    const pxmm = 4.4, sec = W / (25 * pxmm), ch = 22 * pxmm, y0 = 12 * pxmm, beats = regBeats(0.3, 0.8, sec);
    return (
      <div className="figwrap">
        <div className="paper viewer" role="img" aria-label={L('I・II・aVF誘導', 'Leads I, II and aVF')} style={paperStyle(pxmm, { width: W, height: 3 * ch })}>
          {f.leads.map(([name, Ls], r) => (
            <div key={name} style={{ position: 'absolute', left: 0, top: r * ch, width: W, height: ch }}>
              <svg width={W} height={ch} viewBox={`0 0 ${W} ${ch}`} overflow="visible" aria-hidden="true"><path d={pathOf(genLead(Ls, beats, { dur: sec, wander: false }), y0, 10, pxmm, 25)} fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinejoin="round" /></svg>
              <span className="lbl">{name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // beat / strip
  const s = f.type === 'beat'
    ? genLead(f.L, [f.q0], { dur: f.sec, wf: f.wf, pr: f.pr, qt: f.qt || 0.4, wander: false })
    : genLead(f.L, regBeats(f.first, f.rr, f.sec), { dur: f.sec, wf: f.wf, pr: f.pr, qt: f.qt || 0.4 * Math.sqrt(f.rr), wander: false });
  const speed = (f.type === 'strip' && f.speed) || 25, sens = (f.type === 'strip' && f.sens) || 10, calib = f.type === 'strip' && !!f.calib;
  const pxmm = W / (speed * f.sec);
  let mx = 0.3, mn = -0.3; for (let i = 0; i < s.length; i++) { if (s[i] > mx) mx = s[i]; if (s[i] < mn) mn = s[i]; }
  const topMm = Math.max(Math.ceil(mx * sens / 5) * 5 + 5, calib ? 15 : 0), botMm = Math.ceil(-mn * sens / 5) * 5 + 5;
  const h = Math.round((topMm + botMm) * pxmm), y0 = topMm * pxmm;
  const xs = (t: number) => t * speed * pxmm;
  const parts: ReactNode[] = [];
  if (calib) {
    const ch = sens * pxmm, a = xs(0.06), b = xs(0.26), from = Math.round(0.3 * FS);
    parts.push(<path key="cal" d={`M0 ${y0} L${a.toFixed(1)} ${y0} L${a.toFixed(1)} ${(y0 - ch).toFixed(1)} L${b.toFixed(1)} ${(y0 - ch).toFixed(1)} L${b.toFixed(1)} ${y0} L${xs(0.3).toFixed(1)} ${y0}`} fill="none" stroke="#1A1A1A" strokeWidth="1.6" />);
    parts.push(<path key="tr" d={pathOf(s, y0, sens, pxmm, speed, from)} fill="none" stroke="#1A1A1A" strokeWidth="1.6" strokeLinejoin="round" />);
  } else parts.push(<path key="tr" d={pathOf(s, y0, sens, pxmm, speed)} fill="none" stroke="#1A1A1A" strokeWidth="1.6" strokeLinejoin="round" />);
  if (f.type === 'beat' && f.arrow != null) {
    const i = Math.round(f.arrow * FS), x = xs(f.arrow);
    let top = 1e9; for (let j = Math.max(0, i - 6); j <= Math.min(s.length - 1, i + 6); j++) top = Math.min(top, y0 - s[j] * sens * pxmm);
    const tip = top - 6, tail = Math.max(4, tip - 34);
    parts.push(<path key="a1" d={`M${x.toFixed(1)} ${tail.toFixed(1)} L${x.toFixed(1)} ${tip.toFixed(1)}`} stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />);
    parts.push(<path key="a2" d={`M${(x - 7).toFixed(1)} ${(tip - 9).toFixed(1)} L${x.toFixed(1)} ${tip.toFixed(1)} L${(x + 7).toFixed(1)} ${(tip - 9).toFixed(1)}`} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />);
  }
  const info = `${speed}${L('mm/秒', ' mm/s')}${calib ? '' : (L('・', ' · ') + sens + L('mm/mV', ' mm/mV'))}`;
  return (
    <div className="figwrap">
      <div className="paper viewer" role="img" aria-label={L('心電図の図', 'ECG figure')} style={paperStyle(pxmm, { width: W, height: h })}>
        <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`} aria-hidden="true">{parts}</svg>
        <span className="lbl">II</span>
      </div>
      <div className="note">{info}{L('・小さいマス=1mm', ' · small box = 1 mm')}</div>
    </div>
  );
}

// ===== 波形チェックの図 =====
type StripCalc = { pxmm: number; h: number; y0: number; d: string; mx: number; mn: number };
function stripCalc(Ls: LeadShape, beats: (number | Beat)[], o: GenOpts, sec: number, W: number, rng?: [number, number]): StripCalc {
  const pxmm = W / (25 * sec), sg = genLead(Ls, beats, { dur: sec, wander: false, ...o });
  let mx = 0.3, mn = -0.3; for (let i = 0; i < sg.length; i++) { if (sg[i] > mx) mx = sg[i]; if (sg[i] < mn) mn = sg[i]; }
  if (rng) { mx = rng[0]; mn = rng[1]; }
  const topMm = Math.ceil(mx * 2) * 5 + 3, botMm = Math.ceil(-mn * 2) * 5 + 2, h = (topMm + botMm) * pxmm, y0 = topMm * pxmm;
  let d = ''; for (let i = 0; i < sg.length; i++) d += (i ? 'L' : 'M') + (i / FS * 25 * pxmm).toFixed(1) + ' ' + (y0 - sg[i] * 10 * pxmm).toFixed(1);
  return { pxmm, h, y0, d, mx, mn };
}
function StripView({ st, W, label, children }: { st: StripCalc; W: number; label?: string; children?: ReactNode }) {
  const h = Math.round(st.h);
  return (
    <div className="paper viewer" style={paperStyle(st.pxmm, { width: W, height: h, backgroundPosition: `0 ${(st.y0 % (5 * st.pxmm)).toFixed(1)}px` })}>
      <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`} aria-hidden="true">{children}<path d={st.d} fill="none" stroke="#1A1A1A" strokeWidth="1.6" strokeLinejoin="round" /></svg>
      {label ? <span className="lbl">{label}</span> : null}
    </div>
  );
}
type Panel = [string, LeadShape, (number | Beat)[], GenOpts?];
function Panels({ list, sec, W }: { list: Panel[]; sec: number; W: number }) {
  const pw = W / list.length;
  const pre = list.map(([, Ls, b, o]) => stripCalc(Ls, b, o || {}, sec, pw));
  const rng: [number, number] = [Math.max(...pre.map((p) => p.mx)), Math.min(...pre.map((p) => p.mn))];
  return (
    <div className="row" style={{ gap: 0, alignItems: 'flex-start' }}>
      {list.map(([n, Ls, b, o], i) => {
        const st = stripCalc(Ls, b, o || {}, sec, pw, rng), bb: Beat = typeof b[0] === 'number' ? { q0: b[0] } : b[0], w = (o && o.wf) || bb.wf || 1;
        const x0 = (bb.q0 - 0.005) * 25 * st.pxmm, x1 = (bb.q0 + (w > 1.05 ? 0.075 * w : 0.08)) * 25 * st.pxmm;
        return <StripView key={i} st={st} W={pw} label={n}><rect x={x0.toFixed(1)} y="0" width={(x1 - x0).toFixed(1)} height={Math.round(st.h)} fill="rgba(37,99,235,0.2)" /></StripView>;
      })}
    </div>
  );
}
export function LeadMap({ sel, W }: { sel: string[]; W: number }) {
  const rows = [['I', 'aVR', 'V1', 'V4'], ['II', 'aVL', 'V2', 'V5'], ['III', 'aVF', 'V3', 'V6']], cw = (W - 6) / 4;
  return <div className="lmap" style={{ width: W }}>{rows.flat().map((l) => <span key={l} className={sel.includes(l) ? 'on' : ''} style={{ width: cw }}>{l}</span>)}</div>;
}
/** 選択肢の図にも、上の見本と同じ印(青い枠・基線・矢印)をつける */
function annot(k: string, f: StripFig, st: StripCalc, W: number): ReactNode[] {
  const X = (t: number) => +(t * 25 * st.pxmm).toFixed(1), h = Math.round(st.h);
  const o = f.o || {}, beats: Beat[] = f.beats.map((b) => (typeof b === 'number' ? { q0: b } : b));
  const out: ReactNode[] = [];
  const band = (a: number, b: number) => { if (b > 0 && a < f.sec) out.push(<rect key={out.length} x={X(Math.max(0, a))} y="0" width={(X(Math.min(f.sec, b)) - X(Math.max(0, a))).toFixed(1)} height={h} fill="rgba(37,99,235,0.2)" />); };
  const prOf = (b: Beat) => b.pr || f.pr || o.pr || 0.16, wfOf = (b: Beat) => b.wf || f.wf || o.wf || 1, qtOf = (b: Beat) => b.qt || f.qt || o.qt || 0.4;
  const hasP = (b: Beat) => o.hasP !== false && !b.noP;
  if (k === 'p') { beats.forEach((b) => { if (hasP(b)) band(b.q0 - prOf(b), b.q0 - prOf(b) + 0.1); }); (o.extraP || []).forEach((t) => band(t, t + 0.1)); }
  if (k === 'pr') beats.forEach((b) => { if (hasP(b)) band(b.q0 - prOf(b), b.q0); });
  if (k === 'qrsw') beats.forEach((b) => { const w = wfOf(b); band(b.q0 - 0.005, b.q0 + (w > 1.05 ? 0.075 * w : 0.08)); });
  if (k === 'st1') { beats.forEach((b) => { const j = b.q0 + 0.085 * wfOf(b); band(j, j + 0.13); }); out.push(<path key="base" d={`M0 ${st.y0.toFixed(1)} L${W} ${st.y0.toFixed(1)}`} stroke="#2563EB" strokeWidth="1.5" strokeDasharray="5 4" />); }
  if (k === 't') beats.forEach((b) => { const Ls = b.L || f.L, tw = Ls.tw || 0.045, c = b.q0 + qtOf(b) - 2 * tw; band(c - 2 * tw, c + 2 * tw); });
  if (k === 'reg' || k === 'rate') {
    const rs = beats.map((b) => b.q0 + 0.032 * wfOf(b)).filter((t) => t < f.sec);
    for (let i = 1; i < rs.length; i++) {
      const a = X(rs[i - 1]) + 2, b = X(rs[i]) - 2, y = 10;
      if (b - a > 14) out.push(<g key={'rr' + i}><path d={`M${a} ${y} L${b} ${y}`} stroke="#1D4ED8" strokeWidth="1.5" /><path d={`M${a + 5} ${y - 4} L${a} ${y} L${a + 5} ${y + 4} M${b - 5} ${y - 4} L${b} ${y} L${b - 5} ${y + 4}`} fill="none" stroke="#1D4ED8" strokeWidth="1.5" /></g>);
    }
  }
  return out;
}
export function OptFigure({ f, k }: { f: OptFig; k: string }) {
  const { W: W0 } = useApp();
  const W = W0 - 20;
  if ('map' in f) return <LeadMap sel={f.map} W={W} />;
  if ('axis' in f) return <Panels list={axisLeads(f.axis).map(([n, Ls]) => [n, Ls, [0.15]] as Panel)} sec={0.6} W={W} />;
  if ('pair' in f) return <Panels list={f.pair.map(([n, Ls, o]) => [n, Ls, [{ q0: 0.3, ...(o && o.noP ? { noP: true, L: Ls, wf: o.wf, qt: o.qt } : {}) }], o] as Panel)} sec={0.8} W={W} />;
  const st = stripCalc(f.L, f.beats, { pr: f.pr, wf: f.wf, qt: f.qt, ...(f.o || {}) }, f.sec, W);
  return <StripView st={st} W={W} label="II">{annot(k, f, st, W)}</StripView>;
}

/** 「ここを見る」の図(正常の例・目盛りつき) */
export function GuideFig({ k }: { k: string }) {
  const { L, W } = useApp();
  if (k === 'shape') {
    const pw = W / 2;
    return (
      <>
        <div className="row" style={{ gap: 0 }}>
          {([['V1', BASE.V1], ['V6', BASE.V6]] as [string, LeadShape][]).map(([n, Ls]) => {
            const st = stripCalc(Ls, [0.3], {}, 0.8, pw);
            return <StripView key={n} st={st} W={pw} label={n}><rect x={(0.29 * 25 * st.pxmm).toFixed(1)} y="0" width={(0.1 * 25 * st.pxmm).toFixed(1)} height="400" fill="rgba(37,99,235,0.18)" /></StripView>;
          })}
        </div>
        <div className="note">{L('正常の例:V1は小さなr波と深いS波(下向き)、V6は小さなq波と高いR波(上向き)。青い部分がQRS', 'Normal example: V1 has a small r and a deep S (mainly negative); V6 has a small q and a tall R (mainly positive). The blue area is the QRS')}</div>
      </>
    );
  }
  if (k === 'axis') return <><Panels list={axisLeads(50).map(([n, Ls]) => [n, Ls, [0.15]] as Panel)} sec={0.6} W={W} /><div className="note">{L('正常の例:I・II・aVFのQRSがすべて上向き', 'Normal example: the QRS is positive in I, II and aVF')}</div></>;
  if (k === 'st') return <><LeadMap sel={[]} W={W} /><div className="note">{L('12誘導の並び。下壁=II・III・aVF、前壁中隔=V1〜V4、側壁=I・aVL・V5・V6', '12-lead layout. Inferior = II, III, aVF; anteroseptal = V1–V4; lateral = I, aVL, V5, V6')}</div></>;
  const sec = 1.6, st = stripCalc(BASE.II, [0.3, 1.1], {}, sec, W), pxmm = st.pxmm;
  const X = (t: number) => +(t * 25 * pxmm).toFixed(1), h = Math.round(st.h), y0 = st.y0;
  const band = (a: number, b: number, key: string) => <rect key={key} x={X(a)} y="0" width={(X(b) - X(a)).toFixed(1)} height={h} fill="rgba(37,99,235,0.2)" />;
  const arrow = (a: number, b: number, y: number, lb: string) => (
    <g key={'ar' + lb}>
      <path d={`M${X(a)} ${y} L${X(b)} ${y}`} stroke="#1D4ED8" strokeWidth="2" />
      <path d={`M${X(a) + 7} ${y - 5} L${X(a)} ${y} L${X(a) + 7} ${y + 5} M${X(b) - 7} ${y - 5} L${X(b)} ${y} L${X(b) - 7} ${y + 5}`} fill="none" stroke="#1D4ED8" strokeWidth="2" />
      <text x={((X(a) + X(b)) / 2).toFixed(1)} y={y - 8} textAnchor="middle" fontSize="12" fontWeight="800" fill="#1E3A8A" stroke="#FFF7F7" strokeWidth="4" style={{ paintOrder: 'stroke' }}>{lb}</text>
    </g>
  );
  const base = <path key="base" d={`M0 ${y0.toFixed(1)} L${W} ${y0.toFixed(1)}`} stroke="#2563EB" strokeWidth="1.5" strokeDasharray="5 4" />;
  const top = 18;
  const M: Record<string, [ReactNode[], string]> = {
    reg: [[arrow(0.332, 1.132, top, L('R-R間隔 0.80秒', 'R-R 0.80 s'))], L('R波の頂点から次のR波の頂点まで。この例は大マス4つ=0.80秒', 'From one R-wave peak to the next. Here it is 4 large boxes = 0.80 s')],
    p: [[band(0.14, 0.24, 'b1'), band(0.94, 1.04, 'b2'), <text key="t" x={X(0.19)} y={(y0 + 22).toFixed(0)} textAnchor="middle" fontSize="12" fontWeight="800" fill="#1E3A8A">{L('P波', 'P wave')}</text>], L('青い部分がP波。QRSの前にある、高さ小マス1〜2個ほどのなだらかな山', 'The blue areas are P waves: small rounded bumps, 1–2 small boxes tall, just before each QRS')],
    rate: [[arrow(0.332, 1.132, top, L('大マス4つ', '4 large boxes'))], L('R-R間隔が大マス4つなので、300 ÷ 4 = 75回/分。不整なときは10秒間のQRSの数 × 6', 'The R-R interval is 4 large boxes, so 300 ÷ 4 = 75 bpm. If irregular, count the QRS complexes in 10 s and multiply by 6')],
    pr: [[band(0.14, 0.3, 'b'), arrow(0.14, 0.3, top, L('PR 0.16秒', 'PR 0.16 s'))], L('P波の始まりからQRSの始まりまで。この例は小マス4個=0.16秒(正常は小マス3〜5個)', 'From the start of the P wave to the start of the QRS. Here it is 4 small boxes = 0.16 s (normal is 3–5 small boxes)')],
    qrsw: [[band(0.3, 0.38, 'b'), arrow(0.3, 0.38, top, L('QRS 0.08秒', 'QRS 0.08 s'))], L('QRSの始まりから終わりまで。この例は小マス2個=0.08秒(小マス3個以上なら幅が広い)', 'From the start to the end of the QRS. Here it is 2 small boxes = 0.08 s (3 or more small boxes is wide)')],
    st1: [[band(0.39, 0.52, 'b1'), band(1.19, 1.32, 'b2'), base, <text key="t" x="4" y={(y0 + 15).toFixed(0)} fontSize="11" fontWeight="800" fill="#1E3A8A">{L('基線(点線)', 'Baseline (dotted)')}</text>], L('青い部分がST部分。点線(基線=P波の前の平らな高さ)と同じ高さなら変化なし。小マス1個(0.1mV)以上ずれていれば変化あり', 'The blue areas are the ST segments. If they are level with the dotted line (baseline = the flat line before the P wave), there is no change. A shift of 1 small box (0.1 mV) or more is a change')],
    t: [[band(0.45, 0.72, 'b'), arrow(0.3, 0.7, top, L('QT 0.40秒', 'QT 0.40 s'))], L('青い部分がT波。QRSの始まりからT波の終わりまでがQT。この例は小マス10個=0.40秒', 'The blue area is the T wave. QT runs from QRS onset to the end of the T wave. Here it is 10 small boxes = 0.40 s')],
  };
  const m = M[k];
  // マスの見本を図の右下(基線の下)に入れる
  const bx = X(1.4), bw = X(1.6) - X(1.4), by = y0, bh = 5 * pxmm, sw = pxmm;
  const key = (
    <g key="key">
      <rect x={bx} y={by.toFixed(1)} width={bw.toFixed(1)} height={bh.toFixed(1)} fill="rgba(30,41,59,0.06)" stroke="#1E293B" strokeWidth="2" />
      <rect x={bx} y={by.toFixed(1)} width={sw.toFixed(1)} height={sw.toFixed(1)} fill="#1E293B" />
      <g fontSize="10.5" fontWeight="800" textAnchor="end" fill="#1E293B" stroke="#FFF7F7" strokeWidth="3.5" style={{ paintOrder: 'stroke' }}>
        <text x={bx - 5} y={(by + bh * 0.42).toFixed(1)}>{L('大マス(太線の四角)=0.2秒・0.5mV', 'Large box (thick lines) = 0.2 s · 0.5 mV')}</text>
        <text x={bx - 5} y={(by + bh * 0.42 + 13).toFixed(1)}>{L('■小マス=0.04秒・0.1mV', '■ Small box = 0.04 s · 0.1 mV')}</text>
      </g>
    </g>
  );
  const ticks: ReactNode[] = [];
  for (let i = 0; i * 0.2 <= sec + 1e-6; i++) {
    const t = i * 0.2, x = t * 25 * pxmm, last = t > sec - 0.1;
    ticks.push(<span key={i} style={{ left: x, ...(last ? { transform: 'translateX(-100%)' } : {}) }}>{t === 0 ? '0' : t.toFixed(1)}{last ? L('秒', ' s') : ''}</span>);
  }
  return (
    <>
      <StripView st={st} W={W} label="II">{m[0]}{key}</StripView>
      <div className="ruler" style={{ width: W }}>{ticks}</div>
      <div className="note">{m[1]}{L('(正常の例)', ' (normal example)')}</div>
    </>
  );
}
