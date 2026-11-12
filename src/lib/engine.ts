// ===== 波形の生成(プログラムで描く模式的な波形) =====
// 将来PTB-XLの実波形に差し替えるときは、caseSig()/normSig() が返す sig を実データにすればよい。
export const FS = 250;
export const DUR = 10;
export const NS = FS * DUR;
export const LEADS = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'] as const;
export type LeadName = (typeof LEADS)[number];

/** 1誘導の波の大きさ(mV) */
export type LeadShape = {
  p?: number; q?: number; r?: number; s?: number; r2?: number; t?: number; tw?: number; u?: number;
  st?: number; stp?: number; delta?: number;
};
export type Beat = { q0: number; pr?: number; noP?: boolean; L?: LeadShape; wf?: number; qt?: number; v?: boolean };
export type GenOpts = {
  dur?: number; wf?: number; pr?: number; qt?: number; hasP?: boolean; wander?: boolean; phase?: number;
  af?: boolean; afK?: number; flutter?: number; extraP?: number[]; qrsd?: number;
};

// 正常の形(mV)
export const BASE: Record<LeadName, LeadShape> = {
  I: { p: 0.08, q: -0.04, r: 0.6, s: -0.1, t: 0.2 },
  II: { p: 0.15, q: -0.05, r: 1.0, s: -0.15, t: 0.3 },
  III: { p: 0.07, q: -0.02, r: 0.45, s: -0.1, t: 0.12 },
  aVR: { p: -0.1, r: -0.75, t: -0.25 },
  aVL: { p: 0.03, q: -0.04, r: 0.3, s: -0.15, t: 0.08 },
  aVF: { p: 0.1, q: -0.03, r: 0.7, s: -0.12, t: 0.2 },
  V1: { p: 0.08, r: 0.2, s: -0.9, t: 0.05 },
  V2: { p: 0.08, r: 0.35, s: -1.3, t: 0.35 },
  V3: { p: 0.08, r: 0.7, s: -0.8, t: 0.35 },
  V4: { p: 0.1, r: 1.2, s: -0.4, t: 0.3 },
  V5: { p: 0.1, q: -0.08, r: 1.2, s: -0.15, t: 0.25 },
  V6: { p: 0.1, q: -0.06, r: 0.9, s: -0.1, t: 0.2 },
};
const AF_K: Partial<Record<LeadName, number>> = { II: 0.8, III: 0.7, aVF: 0.7, V1: 1.2, V2: 0.8 };

// 心室由来の拍(幅広く奇妙な形)
export const VMORPH: Record<LeadName, LeadShape> = {
  I: { q: 0, r: 1.0, s: -0.15, t: -0.4 }, II: { q: 0, r: 1.2, s: -0.2, t: -0.45 }, III: { q: 0, r: 0.7, s: -0.2, t: -0.3 },
  aVR: { q: 0, r: -1.0, s: 0, t: 0.4 }, aVL: { q: 0, r: 0.4, s: -0.3, t: -0.1 }, aVF: { q: 0, r: 0.9, s: -0.2, t: -0.35 },
  V1: { q: 0, r: 0.1, s: -1.4, t: 0.45 }, V2: { q: 0, r: 0.1, s: -1.6, t: 0.5 }, V3: { q: 0, r: 0.3, s: -1.2, t: 0.35 },
  V4: { q: 0, r: 0.9, s: -0.5, t: -0.2 }, V5: { q: 0, r: 1.2, s: -0.2, t: -0.4 }, V6: { q: 0, r: 1.0, s: -0.1, t: -0.4 },
};
const FLUT_K: Record<LeadName, number> = { II: 0.22, III: 0.22, aVF: 0.22, V1: -0.12, aVR: -0.12, I: 0.04, aVL: -0.06, V2: -0.06, V3: 0.03, V4: 0.04, V5: 0.05, V6: 0.05 };

function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/** 波形をつくるための症例の情報 */
export type SynthCase = {
  id: string; hr: number; seed?: number; rhythm?: 'af' | 'flutter'; wf?: number; pr?: number; qtc?: number; delta?: number;
  leads?: Partial<Record<LeadName, LeadShape>>;
  plan?: () => { beats: Beat[]; extraP?: number[] };
};

function beatTimes(c: SynthCase) {
  const r = rng(c.seed || 7), out: number[] = [], rr = 60 / c.hr;
  let t = 0.3;
  while (t < DUR + 0.8) { out.push(t); t += c.rhythm === 'af' ? rr * (0.62 + 0.76 * r()) : rr; }
  return out;
}

/** 1誘導の波形をつくる。beats:QRSの始まりの時刻、またはBeat */
export function genLead(L: LeadShape, beats: (number | Beat)[], o: GenOpts): Float32Array {
  const dur = o.dur || DUR, n = Math.round(dur * FS), s = new Float32Array(n);
  type Comp = [number, number, number] | ['stp', number, number, number, number];
  const comps: Comp[] = [];
  for (const bt of beats) {
    const b: Beat = typeof bt === 'number' ? { q0: bt } : bt;
    const LL = b.L || L, wf = b.wf || o.wf || 1, pr = b.pr || o.pr || 0.16, qt = b.qt || o.qt || 0.4, q0 = b.q0;
    const qrsd = wf > 1.3 ? 0.15 : 0.09, tw = LL.tw || 0.045;
    if (o.hasP !== false && !b.noP && LL.p) comps.push([LL.p, q0 - pr + 0.05, 0.02]);
    if (LL.delta) comps.push([LL.delta, q0 + 0.03, 0.02]);
    if (LL.q) comps.push([LL.q, q0 + 0.01, 0.006]);
    if (LL.r) comps.push([LL.r, q0 + 0.032 * wf, 0.009 * wf]);
    if (LL.s) comps.push([LL.s, q0 + 0.058 * wf, 0.009 * wf]);
    if (LL.r2) comps.push([LL.r2, q0 + 0.088 * wf, 0.012 * wf]);
    if (LL.st) comps.push([LL.st, q0 + qrsd + 0.08, 0.055]);
    if (LL.t) comps.push([LL.t, q0 + qt - 2 * tw, tw]);
    if (LL.u) comps.push([LL.u, q0 + qt + 0.07, 0.04]);
    if (LL.stp) comps.push(['stp', q0, wf, qt, LL.stp]);
  }
  for (const tp of o.extraP || []) if (L.p) comps.push([L.p, tp + 0.05, 0.02]);
  const sg = (x: number) => 1 / (1 + Math.exp(-x));
  for (const cp of comps) {
    if (cp[0] === 'stp') {
      const [, q0, wf, qt, a] = cp, j = q0 + 0.085 * wf;
      const i0 = Math.max(0, Math.floor((j - 0.05) * FS)), i1 = Math.min(n - 1, Math.ceil((j + qt) * FS));
      for (let i = i0; i <= i1; i++) { const t = i / FS; s[i] += a * (sg((t - j) / 0.006) - sg((t - (q0 + qt - 0.12)) / 0.03)); }
      continue;
    }
    const [a, c0, w] = cp as [number, number, number];
    const i0 = Math.max(0, Math.floor((c0 - 4 * w) * FS)), i1 = Math.min(n - 1, Math.ceil((c0 + 4 * w) * FS));
    for (let i = i0; i <= i1; i++) { const d = i / FS - c0; s[i] += a * Math.exp(-d * d / (2 * w * w)); }
  }
  const ph = o.phase || 0;
  for (let i = 0; i < n; i++) {
    const t = i / FS;
    if (o.wander !== false) s[i] += 0.012 * Math.sin(2 * Math.PI * 0.25 * t + ph);
    if (o.af) s[i] += 0.045 * (o.afK || 0.45) * (Math.sin(2 * Math.PI * 5.7 * t) + 0.6 * Math.sin(2 * Math.PI * 7.9 * t + 1.3) + 0.4 * Math.sin(2 * Math.PI * 4.3 * t + 2.1));
    if (o.flutter) { const f = (t * 5 + 0.37) % 1; s[i] += o.flutter * ((f < 0.8 ? -f / 0.8 : -(1 - f) / 0.2) + 0.5); }
  }
  return s;
}

export type Sig = { sig: Record<LeadName, Float32Array>; beats: number[]; qrsd: number };

export function synth(c: SynthCase, normal: boolean): Sig {
  const plan = c.plan ? c.plan() : null;
  const beats: Beat[] = plan ? plan.beats : beatTimes(c).map((q0) => ({ q0 }));
  const rr = 60 / c.hr;
  const wf = normal ? 1 : c.wf || 1;
  const qrsd = wf > 1.3 ? 0.15 : 0.09;
  const qt = (normal ? 0.4 : c.qtc || 0.4) * Math.sqrt(rr);
  const sig = {} as Record<LeadName, Float32Array>;
  for (const lead of LEADS) {
    const L: LeadShape = normal ? BASE[lead] : { ...BASE[lead], ...(c.leads || {})[lead] };
    if (!normal && c.delta) L.delta = c.delta * Math.sign(L.r || 1);
    const bs: Beat[] = beats.map((b) => {
      if (normal) return { q0: b.q0 };
      if (b.v) return { q0: b.q0, noP: true, L: { ...BASE[lead], ...VMORPH[lead] }, wf: b.wf || 2.1, qt: b.qt || 0.42 };
      return { ...b };
    });
    sig[lead] = genLead(L, bs, {
      wf, qrsd, pr: normal ? 0.16 : c.pr || 0.16, hasP: normal ? true : c.rhythm !== 'af' && c.rhythm !== 'flutter', qt,
      phase: lead.length * 0.7, af: !normal && c.rhythm === 'af', afK: AF_K[lead],
      extraP: normal || !plan ? [] : plan.extraP || [], flutter: !normal && c.rhythm === 'flutter' ? FLUT_K[lead] || 0.04 : 0,
    });
  }
  return { sig, beats: beats.map((b) => b.q0).filter((b) => b < DUR), qrsd };
}

const SIG_CACHE: Record<string, Sig> = {};
export const caseSig = (c: SynthCase) => SIG_CACHE[c.id] || (SIG_CACHE[c.id] = synth(c, false));
export const normSig = (c: SynthCase) => SIG_CACHE[c.id + ':n'] || (SIG_CACHE[c.id + ':n'] = synth(c, true));
export const caseRate = (c: SynthCase) => caseSig(c).beats.length * 6;

// ===== 描画用のパス =====
export function tracePath(s: Float32Array, t0: number, t1: number, x0: number, y0: number, pxmm: number) {
  const i0 = Math.max(0, Math.round(t0 * FS)), i1 = Math.min(s.length - 1, Math.round(t1 * FS));
  const k = 25 * pxmm / FS, a = 10 * pxmm;
  let d = '';
  for (let i = i0; i <= i1; i++) d += (i === i0 ? 'M' : 'L') + (x0 + (i - i0) * k).toFixed(1) + ' ' + (y0 - s[i] * a).toFixed(1);
  return d;
}

/** 正常と0.04mV以上ずれている部分を塗るパス */
export function diffPath(sa: Float32Array, sn: Float32Array, t0: number, t1: number, x0: number, y0: number, pxmm: number) {
  const i0 = Math.max(0, Math.round(t0 * FS)), i1 = Math.min(NS - 1, Math.round(t1 * FS));
  const k = 25 * pxmm / FS, a = 10 * pxmm;
  let d = '';
  let seg: number[] = [];
  const flush = () => {
    if (seg.length > 3) {
      d += 'M' + seg.map((i) => (x0 + (i - i0) * k).toFixed(1) + ' ' + (y0 - sa[i] * a).toFixed(1)).join(' L');
      d += ' L' + seg.slice().reverse().map((i) => (x0 + (i - i0) * k).toFixed(1) + ' ' + (y0 - sn[i] * a).toFixed(1)).join(' L') + ' Z ';
    }
    seg = [];
  };
  for (let i = i0; i <= i1; i++) { if (Math.abs(sa[i] - sn[i]) > 0.04) seg.push(i); else flush(); }
  flush();
  return d;
}

export function sigRange(arrs: Float32Array[], t0: number, t1: number) {
  let mx = 0.3, mn = -0.3;
  const i0 = Math.max(0, Math.round(t0 * FS)), i1 = Math.min(NS - 1, Math.round(t1 * FS));
  for (const s of arrs) for (let i = i0; i <= i1; i++) { if (s[i] > mx) mx = s[i]; if (s[i] < mn) mn = s[i]; }
  return { mx, mn };
}

/** 方眼紙の背景の大きさ(1mm = pxmm px) */
export function paperSize(pxmm: number) {
  const s = pxmm.toFixed(2), l = (pxmm * 5).toFixed(2);
  return `${l}px ${l}px,${l}px ${l}px,${s}px ${s}px,${s}px ${s}px`;
}

export const regBeats = (first: number, rr: number, dur: number) => {
  const b: number[] = [];
  for (let t = first; t < dur + 0.5; t += rr) b.push(+t.toFixed(4));
  return b;
};
export const sinusTimes = (first: number, rr: number, n: number) => Array.from({ length: n }, (_, k) => +(first + rr * k).toFixed(3));

/** 電気軸の問題用:角度からI・II・aVFの形をつくる */
export function axisLeads(deg: number): [string, LeadShape][] {
  const th = deg * Math.PI / 180;
  const mk = (x: number): LeadShape => (x >= 0 ? { p: 0.08, r: x + 0.1, s: -0.1, t: 0.15 } : { p: 0.05, r: 0.1, s: x - 0.1, t: 0.05 });
  return [['I', mk(Math.cos(th))], ['II', mk(Math.cos(th - Math.PI / 3))], ['aVF', mk(Math.sin(th))]];
}

export const shuffle = <X,>(a: X[]): X[] => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
