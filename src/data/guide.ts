// ===== 波形チェック(手元の心電図と照らし合わせる) =====
import { T, type Tx } from '@/lib/i18n';
import { BASE, VMORPH, sinusTimes, type Beat, type GenOpts, type LeadName, type LeadShape, type SynthCase } from '@/lib/engine';
import { CASES } from './cases';

/** 見本の症例(練習問題にない心電図) */
export type GuideCase = SynthCase & { name: Tx };
export const GUIDE_CASES: GuideCase[] = [
  { id: 'flut', name: T('心房粗動(4:1伝導)', 'Atrial flutter (4:1 conduction)'), hr: 75, rhythm: 'flutter', seed: 43 },
  {
    id: 'pvc', name: T('心室期外収縮', 'Premature ventricular contractions (PVCs)'), hr: 75, seed: 47,
    plan: () => { const b: Beat[] = []; sinusTimes(0.3, 0.8, 13).forEach((t, k) => { if (k % 4 === 3) b.push({ q0: +(t - 0.32).toFixed(3), v: true }); else b.push({ q0: t }); }); return { beats: b }; },
  },
  {
    id: 'wenck', name: T('II度房室ブロック(ウェンケバッハ型)', 'Second-degree AV block (Wenckebach / Mobitz I)'), hr: 75, seed: 53,
    plan: () => { const prs = [0.2, 0.28, 0.34], b: Beat[] = [], ex: number[] = []; for (let i = 0; i < 13; i++) { const pOn = 0.1 + 0.8 * i, m = i % 4; if (m < 3) b.push({ q0: +(pOn + prs[m]).toFixed(3), pr: prs[m] }); else ex.push(pOn); } return { beats: b, extraP: ex }; },
  },
  {
    id: 'mob2', name: T('II度房室ブロック(モビッツII型)', 'Second-degree AV block (Mobitz II)'), hr: 80, seed: 59,
    plan: () => { const b: Beat[] = [], ex: number[] = []; for (let i = 0; i < 14; i++) { const pOn = 0.1 + 0.75 * i; if (i % 3 === 2) ex.push(pOn); else b.push({ q0: +(pOn + 0.18).toFixed(3), pr: 0.18 }); } return { beats: b, extraP: ex }; },
  },
  {
    id: 'avb3', name: T('III度(完全)房室ブロック', 'Third-degree (complete) AV block'), hr: 40, seed: 61,
    plan: () => ({ beats: sinusTimes(0.5, 1.5, 7).map((q0) => ({ q0, v: true, wf: 1.8, qt: 0.46 })), extraP: sinusTimes(0.12, 0.667, 15) }),
  },
  { id: 'wpw', name: T('WPW症候群(早期興奮)', 'WPW syndrome (pre-excitation)'), hr: 72, seed: 67, pr: 0.1, wf: 1.35, delta: 0.22 },
  { id: 'lqt', name: T('QT延長', 'Long QT'), hr: 66, seed: 71, qtc: 0.56 },
  {
    id: 'hyk', name: T('高カリウム血症(テント状T波)', 'Hyperkalemia (peaked T waves)'), hr: 70, seed: 73,
    leads: { II: { t: 0.75, tw: 0.028 }, I: { t: 0.5, tw: 0.028 }, aVF: { t: 0.6, tw: 0.028 }, III: { t: 0.35, tw: 0.028 }, V2: { t: 1.2, tw: 0.028 }, V3: { t: 1.1, tw: 0.028 }, V4: { t: 0.9, tw: 0.028 }, V5: { t: 0.7, tw: 0.028 }, V6: { t: 0.5, tw: 0.028 }, aVR: { t: -0.5, tw: 0.028 } },
  },
  {
    id: 'hok', name: T('低カリウム血症(U波)', 'Hypokalemia (U waves)'), hr: 70, seed: 79,
    leads: { II: { t: 0.07, u: 0.16, st: -0.05 }, I: { t: 0.05, u: 0.08 }, aVF: { t: 0.06, u: 0.12 }, III: { t: 0.04, u: 0.08 }, V2: { t: 0.08, u: 0.2, st: -0.05 }, V3: { t: 0.08, u: 0.2, st: -0.05 }, V4: { t: 0.07, u: 0.16 }, V5: { t: 0.06, u: 0.12 }, V6: { t: 0.05, u: 0.1 } },
  },
  { id: 'vt', name: T('心室頻拍', 'Ventricular tachycardia'), hr: 150, seed: 83, plan: () => ({ beats: sinusTimes(0.25, 0.4, 25).map((q0) => ({ q0, v: true, wf: 2.0, qt: 0.36 })) }) },
];

export type AnyCase = SynthCase & { name: Tx };
export const caseById = (id: string): AnyCase | undefined => CASES.find((c) => c.id === id) || GUIDE_CASES.find((c) => c.id === id);

// ===== 質問(図つきの選択肢)。図はすべて実寸の比率(25mm/秒・10mm/mV) =====
const II0 = BASE.II;
export const VB = (lead: LeadName): LeadShape => ({ ...BASE[lead], ...VMORPH[lead] });
const vbeat = (q0: number, lead: LeadName, wf?: number, qt?: number): Beat => ({ q0, noP: true, L: VB(lead), wf: wf || 2.1, qt: qt || 0.42 });

/** 選択肢の図 */
export type StripFig = { L: LeadShape; beats: (number | Beat)[]; sec: number; pr?: number; wf?: number; qt?: number; o?: GenOpts };
export type PairPanel = [string, LeadShape, (Beat & GenOpts)?];
export type OptFig = StripFig | { pair: PairPanel[] } | { axis: number } | { map: LeadName[] };
const S2 = (L: LeadShape, o?: Partial<StripFig>): StripFig => ({ L, beats: [0.3, 1.1], sec: 1.6, ...(o || {}) });
const PAIR = (v1: [LeadShape, (Beat & GenOpts)?], v6: [LeadShape, (Beat & GenOpts)?]) => ({ pair: [['V1', ...v1] as PairPanel, ['V6', ...v6] as PairPanel] });
export const ST_MAP: Record<string, LeadName[]> = { inf: ['II', 'III', 'aVF'], ant: ['V1', 'V2', 'V3', 'V4'], lat: ['I', 'aVL', 'V5', 'V6'] };

export type GuideAns = Record<string, string>;
export type GuideQ = {
  k: string; title: Tx; lead: Tx; look: Tx; q: Tx;
  when?: (a: GuideAns) => boolean;
  only?: (a: GuideAns) => string[] | null;
  opts: [string, Tx, OptFig][];
};

export const GUIDE_QS: GuideQ[] = [
  {
    k: 'reg', title: T('R-R間隔', 'R-R interval'),
    lead: T('まず、IIのリズムでR波とR波の間隔(R-R間隔)を見ます。', 'First, look at the distance between R waves (R-R interval) on the lead II rhythm strip.'),
    look: T('II誘導で、R波(いちばん高くとがった山)の頂点どうしの間隔を、いくつかの拍で比べる', 'In lead II, compare the distance between the peaks of the R waves (the tallest, sharpest spikes) over several beats'),
    q: T('R-R間隔は?', 'What is the R-R interval like?'),
    opts: [
      ['reg', T('毎回ほぼ同じ(整)', 'About the same every time (regular)'), { L: II0, beats: sinusTimes(0.2, 0.8, 4), sec: 2.6 }],
      ['irr', T('バラバラで規則性がない(不整)', 'Random, with no pattern (irregular)'), { L: II0, beats: [0.2, 0.62, 1.3, 1.62, 2.35], sec: 2.6, o: { hasP: false, af: true, afK: 0.8 } }],
      ['ect', T('基本は一定だが、ときどき早く来る拍がある', 'Mostly steady, but some beats come early'), { L: II0, beats: [0.2, 1.0, vbeat(1.48, 'II'), 2.6], sec: 2.6 }],
    ],
  },
  {
    k: 'p', title: T('P波', 'P waves'),
    lead: T('次に、II誘導でQRSの前にP波があるかを見ます。', 'Next, check lead II for a P wave before each QRS.'),
    look: T('II誘導で、QRS(大きくとがった波)の少し前にある、小さくなだらかな山を探す', 'In lead II, look for a small rounded bump just before each QRS (the big sharp complex)'),
    q: T('P波は?', 'What do the P waves look like?'),
    opts: [
      ['sinus', T('すべてのQRSの前に、同じ形のP波がある', 'An identical P wave before every QRS'), { L: II0, beats: sinusTimes(0.3, 0.8, 4), sec: 2.6 }],
      ['fib', T('P波がなく、基線が細かく不規則に揺れている', 'No P waves; the baseline wobbles finely and irregularly'), { L: II0, beats: [0.2, 0.75, 1.5, 1.95], sec: 2.6, o: { hasP: false, af: true, afK: 0.9 } }],
      ['saw', T('のこぎりの歯のような規則正しい波がある', 'Regular sawtooth waves'), { L: II0, beats: [0.3, 1.1, 1.9], sec: 2.6, o: { hasP: false, flutter: 0.22 } }],
      ['drop', T('P波のあとにQRSが続かないことがある', 'Some P waves are not followed by a QRS'), { L: II0, beats: [{ q0: 0.3, pr: 0.2 }, { q0: 1.18, pr: 0.28 }], sec: 2.6, o: { extraP: [1.7] } }],
      ['dissoc', T('P波とQRSが、それぞれ別のリズムで出ている', 'P waves and QRS complexes each march at their own rate'), { L: II0, beats: [vbeat(0.45, 'II', 1.8, 0.46), vbeat(1.95, 'II', 1.8, 0.46)], sec: 2.6, o: { extraP: [0.1, 0.77, 1.43, 2.1] } }],
      ['none', T('P波がはっきり見えない(幅広いQRSが速く続く)', 'No clear P waves (fast, wide QRS complexes)'), { L: II0, beats: sinusTimes(0.15, 0.4, 7).map((q0) => vbeat(q0, 'II', 2.0, 0.36)), sec: 2.6 }],
    ],
  },
  {
    k: 'rate', title: T('心拍数', 'Heart rate'),
    lead: T('II誘導で心拍数を数えます。', 'Count the heart rate on lead II.'),
    look: T('R-R間隔が大マス(太い線で囲まれた四角)いくつ分かを数え、300をその数で割る', 'Count how many large boxes (squares outlined by thick lines) fit in one R-R interval, then divide 300 by that number'),
    q: T('心拍数は?', 'What is the heart rate?'),
    opts: [
      ['slow', T('60回/分未満(R-Rが大マス5つより長い)', 'Under 60 bpm (R-R longer than 5 large boxes)'), { L: II0, beats: sinusTimes(0.3, 1.25, 3), sec: 2.6 }],
      ['norm', T('60〜100回/分(R-Rが大マス3〜5つ)', '60–100 bpm (R-R of 3–5 large boxes)'), { L: II0, beats: sinusTimes(0.3, 0.8, 4), sec: 2.6 }],
      ['fast', T('100回/分超(R-Rが大マス3つより短い)', 'Over 100 bpm (R-R shorter than 3 large boxes)'), { L: II0, beats: sinusTimes(0.3, 0.48, 6), sec: 2.6, o: { qt: 0.3 } }],
    ],
  },
  {
    k: 'pr', title: T('PR間隔', 'PR interval'),
    lead: T('II誘導で、P波の始まりからQRSの始まりまで(PR間隔)を測ります。', 'In lead II, measure from the start of the P wave to the start of the QRS (PR interval).'),
    look: T('II誘導で、P波が立ち上がる点からQRSが始まる点までの小マス(細い線の四角)を数える。小マス1個=0.04秒', 'In lead II, count the small boxes (thin-line squares) from where the P wave starts to where the QRS starts. 1 small box = 0.04 s'),
    q: T('PR間隔は?', 'What is the PR interval?'),
    when: (a) => ['sinus', 'drop', 'skip', undefined].indexOf(a.p) >= 0,
    only: (a) => (a.p === 'drop' ? ['norm', 'prog'] : null),
    opts: [
      ['norm', T('0.12〜0.20秒(小マス3〜5個)で毎回同じ', '0.12–0.20 s (3–5 small boxes), the same every beat'), S2(II0)],
      ['long', T('0.20秒(小マス5個)より長いが、毎回同じ', 'Longer than 0.20 s (5 small boxes), but the same every beat'), S2(II0, { beats: [0.4, 1.2], pr: 0.3, sec: 1.7 })],
      ['prog', T('1拍ごとにだんだん延びて、QRSが抜ける', 'Gets longer beat by beat until a QRS is dropped'), { L: II0, beats: [{ q0: 0.3, pr: 0.2 }, { q0: 1.18, pr: 0.28 }], sec: 2.6, o: { extraP: [1.7] } }],
      ['short', T('0.12秒(小マス3個)より短い', 'Shorter than 0.12 s (3 small boxes)'), S2({ ...II0, delta: 0.22 }, { pr: 0.1, wf: 1.35 })],
    ],
  },
  {
    k: 'qrsw', title: T('QRS幅', 'QRS width'),
    lead: T('II誘導でQRSの幅を測ります。', 'Measure the QRS width in lead II.'),
    look: T('QRSが始まる点から終わる点までの小マスを数える。小マス3個(0.12秒)が境目', 'Count the small boxes from the start to the end of the QRS. The cut-off is 3 small boxes (0.12 s)'),
    q: T('QRS幅は?', 'How wide is the QRS?'),
    opts: [
      ['narrow', T('0.12秒未満(小マス3個未満)', 'Under 0.12 s (fewer than 3 small boxes)'), S2(II0)],
      ['wide', T('0.12秒以上(小マス3個以上)', '0.12 s or more (3 small boxes or more)'), { L: II0, beats: [vbeat(0.25, 'II'), vbeat(1.05, 'II')], sec: 1.6 }],
    ],
  },
  {
    k: 'shape', title: T('QRSの形', 'QRS shape'),
    lead: T('V1とV6でQRSの形を見ます。', 'Look at the QRS shape in V1 and V6.'),
    look: T('V1(胸の真ん中のすぐ右)とV6(左わきの下)の2つの誘導を見比べる', 'Compare V1 (just right of the sternum) with V6 (under the left armpit)'),
    q: T('V1とV6のQRSの形は?', 'What is the QRS shape in V1 and V6?'),
    only: (a) => (a.qrsw === 'narrow' ? ['normal', 'highV', 'delta'] : a.qrsw === 'wide' ? ['rbbb', 'lbbb', 'vent', 'delta'] : null),
    opts: [
      ['normal', T('特に変わった形はない', 'Nothing unusual'), PAIR([BASE.V1], [BASE.V6])],
      ['rbbb', T('V1でrsR′型(ウサギの耳のような形)、V6で幅広いS波', 'rsR′ in V1 ("rabbit ears"), broad S wave in V6'), PAIR([{ ...BASE.V1, r: 0.25, s: -0.35, r2: 0.8, t: -0.25 }, { q0: 0.3, wf: 1.6 }], [{ ...BASE.V6, r2: -0.35 }, { q0: 0.3, wf: 1.6 }])],
      ['lbbb', T('V1で深いQS型、V6で幅広く分裂したR波', 'Deep QS in V1, broad notched R wave in V6'), PAIR([{ ...BASE.V1, r: 0.05, s: -1.4, st: 0.2, t: 0.4 }, { q0: 0.3, wf: 1.7 }], [{ ...BASE.V6, q: 0, r: 0.9, r2: 0.9, s: 0, st: -0.1, t: -0.3 }, { q0: 0.3, wf: 1.7 }])],
      ['vent', T('幅広く奇妙な形で、前にP波がない', 'Wide and bizarre, with no preceding P wave'), PAIR([VB('V1'), { q0: 0.3, wf: 2.1, qt: 0.42, noP: true }], [VB('V6'), { q0: 0.3, wf: 2.1, qt: 0.42, noP: true }])],
      ['delta', T('QRSの立ち上がりがなだらか(デルタ波)', 'Slurred QRS upstroke (delta wave)'), PAIR([{ ...BASE.V1, delta: 0.1 }, { q0: 0.3, pr: 0.1, wf: 1.35 }], [{ ...BASE.V6, delta: 0.22 }, { q0: 0.3, pr: 0.1, wf: 1.35 }])],
      ['highV', T('V1のS波が深く、V6のR波がとても高い(高電位)', 'Deep S in V1 and very tall R in V6 (high voltage)'), PAIR([{ ...BASE.V1, s: -2.0 }, { q0: 0.3, wf: 1.1 }], [{ ...BASE.V6, r: 2.4, st: -0.12, t: -0.25 }, { q0: 0.3, wf: 1.1 }])],
    ],
  },
  {
    k: 'axis', title: T('電気軸', 'Axis'),
    lead: T('I・II・aVFでQRSの向きを見ます(電気軸)。', 'Look at the QRS direction in I, II and aVF (the axis).'),
    look: T('I・II・aVFの3つの誘導で、QRSが主に上向き(基線より上が大きい)か、下向きかを見る', 'In leads I, II and aVF, see whether the QRS is mainly positive (more above baseline) or negative'),
    q: T('I・II・aVFのQRSの向きは?', 'Which way does the QRS point in I, II and aVF?'),
    opts: [
      ['normal', T('IもaVFも上向き(正常軸)', 'Both I and aVF positive (normal axis)'), { axis: 50 }],
      ['left', T('Iは上向き、IIとaVFは下向き(左軸偏位)', 'I positive, II and aVF negative (left axis deviation)'), { axis: -50 }],
      ['right', T('Iは下向き、aVFは上向き(右軸偏位)', 'I negative, aVF positive (right axis deviation)'), { axis: 120 }],
    ],
  },
  {
    k: 'st1', title: T('ST部分', 'ST segment'),
    lead: T('12誘導すべてで、ST部分の高さを基線と比べます。', 'In all 12 leads, compare the height of the ST segment with the baseline.'),
    look: T('QRSの終わり(J点)のすぐ後の高さを、P波の前の平らな部分(基線)と比べる。1つの誘導でも変化があれば選ぶ', 'Compare the level just after the end of the QRS (J point) with the flat line before the P wave (baseline). Choose a change if you see it in even one lead'),
    q: T('ST部分は?(例はII誘導)', 'What does the ST segment look like? (examples are lead II)'),
    opts: [
      ['up', T('基線より上がっている誘導がある(ST上昇)', 'Raised above baseline in some leads (ST elevation)'), S2({ ...II0, stp: 0.2, t: 0.35 })],
      ['dep', T('基線より下がっている、またはT波が下向きの誘導がある', 'Below baseline, or inverted T waves, in some leads'), S2({ ...II0, stp: -0.12, t: -0.2 })],
      ['none', T('どの誘導も基線と同じ高さ(変化なし)', 'At baseline in every lead (no change)'), S2(II0)],
    ],
  },
  {
    k: 'st', title: T('ST上昇の場所', 'Where is the ST elevation?'),
    lead: T('ST上昇がどの誘導にあるかを確かめます。', 'Check which leads show the ST elevation.'),
    look: T('12誘導の並び(下の図)で、ST上昇がある誘導の組み合わせを探す', 'Using the 12-lead layout below, find the group of leads with ST elevation'),
    q: T('ST上昇があるのはどの誘導?', 'Which leads show ST elevation?'),
    when: (a) => a.st1 === 'up',
    opts: [
      ['inf', T('II・III・aVF(下壁)', 'II, III, aVF (inferior)'), { map: ST_MAP.inf }],
      ['ant', T('V1〜V4(前壁中隔)', 'V1–V4 (anteroseptal)'), { map: ST_MAP.ant }],
      ['lat', T('I・aVL・V5・V6(側壁)', 'I, aVL, V5, V6 (lateral)'), { map: ST_MAP.lat }],
    ],
  },
  {
    k: 't', title: T('T波とQT', 'T wave and QT'),
    lead: T('最後に、II誘導でT波の形とQTの長さを見ます。', 'Finally, look at the T-wave shape and QT length in lead II.'),
    look: T('QRSの後のなだらかな山(T波)の形と高さ、QRSの始まりからT波の終わりまで(QT)を見る', 'Look at the shape and height of the rounded wave after the QRS (T wave), and the distance from QRS onset to the end of the T wave (QT)'),
    q: T('T波とQTは?', 'What do the T wave and QT look like?'),
    opts: [
      ['normal', T('なだらかな上向きのT波で、QTも正常', 'Smooth, upright T wave with a normal QT'), S2(II0)],
      ['peaked', T('高くとがったテント状のT波', 'Tall, narrow, peaked ("tented") T wave'), S2({ ...II0, t: 0.8, tw: 0.028 })],
      ['flatU', T('平らなT波と、その後に続くU波', 'Flat T wave followed by a U wave'), S2({ ...II0, t: 0.07, u: 0.16 }, { sec: 1.7 })],
      ['longqt', T('T波の終わりが遠い(QTが長い)', 'The T wave ends late (long QT)'), S2(II0, { beats: [0.3, 1.3], qt: 0.56, sec: 2.0 })],
    ],
  },
];

// ===== 心電図の一覧と特徴(配列は「どれでも当てはまる」) =====
export type Diag = { id: string; a: Record<string, string | string[]>; points: Tx[] };
export const DIAGS: Diag[] = [
  { id: 'nsr', a: { reg: 'reg', p: 'sinus', rate: 'norm', pr: 'norm', qrsw: 'narrow', shape: 'normal', axis: 'normal', st: 'none', t: 'normal' }, points: [T('R-R間隔が一定で、すべてのQRSの前に同じ形のP波', 'Constant R-R interval with an identical P wave before every QRS'), T('心拍数60〜100回/分、PR・QRS・QTは正常範囲', 'Rate 60–100 bpm; PR, QRS and QT within normal limits'), T('ST-T変化なし', 'No ST-T changes')] },
  { id: 'stach', a: { reg: 'reg', p: 'sinus', rate: 'fast', pr: 'norm', qrsw: 'narrow', shape: 'normal', axis: 'normal', st: 'none', t: 'normal' }, points: [T('洞調律(各QRSの前に同じ形のP波)', 'Sinus rhythm (an identical P wave before every QRS)'), T('心拍数が100回/分を超える', 'Rate above 100 bpm')] },
  { id: 'sbrad', a: { reg: 'reg', p: 'sinus', rate: 'slow', pr: 'norm', qrsw: 'narrow', shape: 'normal', axis: 'normal', st: 'none', t: 'normal' }, points: [T('洞調律(各QRSの前に同じ形のP波)', 'Sinus rhythm (an identical P wave before every QRS)'), T('心拍数が60回/分未満', 'Rate below 60 bpm')] },
  { id: 'af', a: { reg: 'irr', p: ['fib', 'none'], rate: ['fast', 'norm', 'slow'], pr: 'none', qrsw: 'narrow', shape: 'normal', axis: 'normal', st: 'none', t: 'normal' }, points: [T('R-R間隔がまったく不規則(絶対性不整脈)', 'Irregularly irregular R-R intervals'), T('P波がなく、基線が細かく揺れる(f波)。V1で見やすい', 'No P waves; fine baseline undulation (f waves), best seen in V1')] },
  { id: 'flut', a: { reg: ['reg', 'irr'], p: 'saw', rate: ['norm', 'fast', 'slow'], pr: 'none', qrsw: 'narrow', shape: 'normal', axis: 'normal', st: 'none', t: 'normal' }, points: [T('II・III・aVFで、のこぎりの歯のような規則正しい波(F波、約300回/分)', 'Regular sawtooth waves in II, III and aVF (F waves, about 300/min)'), T('2:1や4:1など、決まった割合でQRSが出る(この例は4:1)', 'QRS complexes follow at a fixed ratio such as 2:1 or 4:1 (4:1 in this example)')] },
  { id: 'pvc', a: { reg: 'ect', p: 'sinus', rate: 'norm', pr: 'norm', qrsw: ['narrow', 'wide'], shape: ['normal', 'vent'], axis: 'normal', st: 'none', t: 'normal' }, points: [T('予定より早く、P波を伴わない幅広く奇妙なQRSが出る', 'An early, wide, bizarre QRS with no preceding P wave'), T('T波はQRSと逆向き。その後に休止(代償性休止)がある', 'The T wave points opposite to the QRS, followed by a pause (compensatory pause)')] },
  { id: 'avb1', a: { reg: 'reg', p: 'sinus', rate: ['norm', 'slow'], pr: 'long', qrsw: 'narrow', shape: 'normal', axis: 'normal', st: 'none', t: 'normal' }, points: [T('PR間隔が0.20秒を超えるが、毎回同じ', 'PR interval > 0.20 s but constant'), T('すべてのP波の後にQRSが続く', 'Every P wave is followed by a QRS')] },
  { id: 'wenck', a: { reg: 'irr', p: 'drop', rate: ['norm', 'slow'], pr: 'prog', qrsw: 'narrow', shape: 'normal', axis: 'normal', st: 'none', t: 'normal' }, points: [T('PR間隔が1拍ごとにだんだん延びる', 'The PR interval lengthens beat by beat'), T('やがてP波の後のQRSが1つ抜け、また短いPRから始まる', 'Eventually a QRS is dropped after a P wave, and the cycle restarts with a short PR')] },
  { id: 'mob2', a: { reg: 'irr', p: 'drop', rate: ['slow', 'norm'], pr: 'norm', qrsw: ['narrow', 'wide'], shape: 'normal', axis: 'normal', st: 'none', t: 'normal' }, points: [T('PR間隔は一定のまま、突然QRSが抜ける', 'The PR interval stays constant, then a QRS is suddenly dropped'), T('ウェンケバッハ型より危険で、完全房室ブロックに進むことがある', 'More dangerous than Wenckebach; can progress to complete AV block')] },
  { id: 'avb3', a: { reg: 'reg', p: 'dissoc', rate: 'slow', pr: 'none', qrsw: ['wide', 'narrow'], shape: ['vent', 'normal'], axis: 'normal', st: 'none', t: 'normal' }, points: [T('P波とQRSがそれぞれ別の一定のリズムで出ている(房室解離)', 'P waves and QRS complexes each follow their own regular rhythm (AV dissociation)'), T('P波の数のほうが多く、QRSは遅い(補充調律)', 'There are more P waves than QRS complexes; the QRS rate is slow (escape rhythm)')] },
  { id: 'wpw', a: { reg: 'reg', p: 'sinus', rate: 'norm', pr: 'short', qrsw: ['narrow', 'wide'], shape: 'delta', axis: 'normal', st: 'none', t: 'normal' }, points: [T('PR間隔が0.12秒未満と短い', 'Short PR interval (< 0.12 s)'), T('QRSの立ち上がりがなだらか(デルタ波)で、QRS幅がやや広い', 'Slurred QRS upstroke (delta wave) with a slightly wide QRS')] },
  { id: 'rbbb', a: { reg: 'reg', p: 'sinus', rate: 'norm', pr: 'norm', qrsw: 'wide', shape: 'rbbb', axis: 'normal', st: ['none', 'dep'], t: 'normal' }, points: [T('QRS幅0.12秒以上', 'QRS ≥ 0.12 s'), T('V1でrsR′型、I・V6で幅広いS波', 'rsR′ in V1; broad S waves in I and V6'), T('V1・V2のT波陰転は二次性変化', 'T-wave inversion in V1–V2 is a secondary change')] },
  { id: 'lbbb', a: { reg: 'reg', p: 'sinus', rate: 'norm', pr: 'norm', qrsw: 'wide', shape: 'lbbb', axis: 'normal', st: ['dep', 'ant', 'none'], t: 'normal' }, points: [T('QRS幅0.12秒以上', 'QRS ≥ 0.12 s'), T('V1で深いQS型、I・aVL・V5・V6で幅広く分裂したR波', 'Deep QS in V1; broad, notched R waves in I, aVL, V5 and V6'), T('ST-TはQRSと逆向き(二次性変化)', 'ST-T discordant to the QRS (secondary change)')] },
  { id: 'lafb', a: { reg: 'reg', p: 'sinus', rate: 'norm', pr: 'norm', qrsw: 'narrow', shape: 'normal', axis: 'left', st: 'none', t: 'normal' }, points: [T('Iは上向き、IIとaVFは下向き(−30°より左の左軸偏位)', 'I positive; II and aVF negative (left axis deviation beyond −30°)'), T('QRS幅は0.12秒未満', 'QRS < 0.12 s')] },
  { id: 'vt', a: { reg: 'reg', p: 'none', rate: 'fast', pr: 'none', qrsw: 'wide', shape: 'vent', axis: 'normal', st: 'none', t: 'normal' }, points: [T('幅広いQRSが速く規則正しく続く', 'Fast, regular, wide QRS complexes'), T('P波がはっきりしない。すぐに患者さんの状態を確認する', 'No clear P waves. Check the patient immediately')] },
  { id: 'inf', a: { reg: 'reg', p: 'sinus', rate: 'norm', pr: 'norm', qrsw: 'narrow', shape: 'normal', axis: 'normal', st: ['inf', 'dep'], t: 'normal' }, points: [T('II・III・aVFでST上昇', 'ST elevation in II, III and aVF'), T('I・aVLで対側性のST低下', 'Reciprocal ST depression in I and aVL')] },
  { id: 'ant', a: { reg: 'reg', p: 'sinus', rate: 'norm', pr: 'norm', qrsw: 'narrow', shape: 'normal', axis: 'normal', st: ['ant', 'dep'], t: 'normal' }, points: [T('V1〜V4でST上昇', 'ST elevation in V1–V4'), T('II・III・aVFで対側性のST低下', 'Reciprocal ST depression in II, III and aVF')] },
  { id: 'lat', a: { reg: 'reg', p: 'sinus', rate: 'norm', pr: 'norm', qrsw: 'narrow', shape: 'normal', axis: 'normal', st: ['lat', 'dep'], t: 'normal' }, points: [T('I・aVL・V5・V6でST上昇', 'ST elevation in I, aVL, V5 and V6'), T('IIIで対側性のST低下', 'Reciprocal ST depression in III')] },
  { id: 'lvh', a: { reg: 'reg', p: 'sinus', rate: 'norm', pr: 'norm', qrsw: 'narrow', shape: 'highV', axis: 'normal', st: 'dep', t: 'normal' }, points: [T('V1の深いS波とV5の高いR波(合計3.5mV超)', 'Deep S in V1 and tall R in V5 (sum > 3.5 mV)'), T('I・aVL・V5・V6でST低下とT波陰転(ストレインパターン)', 'ST depression and T-wave inversion in I, aVL, V5 and V6 (strain pattern)')] },
  { id: 'lqt', a: { reg: 'reg', p: 'sinus', rate: 'norm', pr: 'norm', qrsw: 'narrow', shape: 'normal', axis: 'normal', st: 'none', t: 'longqt' }, points: [T('T波の終わりがR-R間隔の半分より遠い', 'The T wave ends beyond the midpoint of the R-R interval'), T('QTcが男性0.45秒・女性0.46秒以上。薬剤や電解質異常を確認する', 'QTc ≥ 0.45 s (men) / 0.46 s (women). Check medications and electrolytes')] },
  { id: 'hyk', a: { reg: 'reg', p: 'sinus', rate: 'norm', pr: 'norm', qrsw: 'narrow', shape: 'normal', axis: 'normal', st: 'none', t: 'peaked' }, points: [T('高くとがった左右対称のテント状T波(胸部誘導で目立つ)', 'Tall, narrow, symmetrical peaked T waves (prominent in the chest leads)'), T('進むとP波が平らになり、QRSが幅広くなる', 'As it worsens, P waves flatten and the QRS widens')] },
  { id: 'hok', a: { reg: 'reg', p: 'sinus', rate: 'norm', pr: 'norm', qrsw: 'narrow', shape: 'normal', axis: 'normal', st: ['none', 'dep'], t: 'flatU' }, points: [T('T波が平らになり、その後のU波が目立つ', 'Flattened T waves with prominent U waves after them'), T('軽いST低下を伴うことがある', 'May be accompanied by mild ST depression')] },
];

/** 結果の心電図を最初に開くタブ */
export const GUIDE_TAB: Record<string, 'rhythm' | 'limb' | 'chest'> = { af: 'rhythm', flut: 'rhythm', pvc: 'rhythm', wenck: 'rhythm', mob2: 'rhythm', avb3: 'rhythm', vt: 'rhythm', stach: 'rhythm', sbrad: 'rhythm', avb1: 'rhythm', lqt: 'rhythm', wpw: 'chest', rbbb: 'chest', lbbb: 'chest', lvh: 'chest', ant: 'chest', hyk: 'chest', hok: 'chest' };

export const matches = (d: Diag, k: string, v: string) => {
  const x = ([] as string[]).concat(d.a[k] as string | string[]);
  if (k === 'st' && v === 'up') return x.some((y) => ST_MAP[y]);
  return x.indexOf(v) >= 0;
};
export function effAns(ans: GuideAns): GuideAns {
  const e: GuideAns = { ...ans }; delete e.st1;
  if (ans.st1 === 'dep' || ans.st1 === 'none') e.st = ans.st1;
  else if (ans.st1 === 'skip') e.st = 'skip';
  else if (ans.st1 === 'up' && (!ans.st || ans.st === 'skip')) e.st = 'up';
  return e;
}
export function rankDiags(ans0: GuideAns) {
  const ans = effAns(ans0);
  const keys = Object.keys(ans).filter((k) => ans[k] !== 'skip');
  return DIAGS.map((d) => ({ d, hit: keys.filter((k) => matches(d, k, ans[k])).length, n: keys.length })).sort((a, b) => b.hit - a.hit);
}
export function guideResult(ans: GuideAns) {
  const R = rankDiags(ans), e = effAns(ans), keys = Object.keys(e).filter((k) => e[k] !== 'skip');
  const exact = R.filter((x) => x.hit === keys.length);
  const list = exact.length ? exact : R.slice(0, 3);
  return { list, exact: exact.length > 0, normal: exact.length === 1 && exact[0].d.id === 'nsr', keys };
}
