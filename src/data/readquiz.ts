// ===== 心電図を読む問題(図つき) =====
import { T, type Tx } from '@/lib/i18n';
import { BASE, axisLeads, caseSig, type LeadShape } from '@/lib/engine';
import type { Level } from './cases';
import { CASES } from './cases';

const II0 = BASE.II;

export type QuizFig =
  | { type: 'beat'; L: LeadShape; q0: number; sec: number; wf?: number; pr?: number; qt?: number; arrow?: number }
  | { type: 'strip'; L: LeadShape; first: number; rr: number; sec: number; calib?: boolean; sens?: number; speed?: number; wf?: number; pr?: number; qt?: number }
  | { type: 'long'; caseId: string }
  | { type: 'twelve'; caseId: string }
  | { type: 'leadset'; leads: [string, LeadShape][] };

export type QuizQ = { id: string; cat: number; lv: Level; q: Tx; opts: Tx[]; ans: number | { ja: number; en: number }; why: Tx; src: Tx; fig?: QuizFig };
/** 正解の番号(言語によって問題の内容が違う問題がある) */
export const ansOf = (q: QuizQ, lang: 'ja' | 'en') => (typeof q.ans === 'number' ? q.ans : q.ans[lang]);
export type QuizCat = { id: number; name: Tx; group: 'read' | 'know' };

const BEAT = (extra: Partial<Extract<QuizFig, { type: 'beat' }>>): QuizFig => ({ type: 'beat', L: II0, q0: 0.35, sec: 1.0, wf: 1.3, ...extra });
const B = 'beginner' as const, M = 'intermediate' as const;
const TB = T('教科書', 'Textbook');
const src = (s: string) => T(s, s.replace(/教科書/g, 'Textbook'));

const AX_OPTS = [T('正常軸', 'Normal axis'), T('左軸偏位', 'Left axis deviation'), T('右軸偏位', 'Right axis deviation'), T('高度軸偏位', 'Extreme axis deviation')];
const R_ST = [T('II・III・aVF', 'II, III, aVF'), T('V1〜V4', 'V1–V4'), T('I・aVL・V5・V6', 'I, aVL, V5, V6'), T('ST上昇なし', 'No ST elevation')];
const SENS_OPTS = [T('5mm/mV(半分の感度)', '5 mm/mV (half standard)'), T('10mm/mV(標準の感度)', '10 mm/mV (standard)'), T('20mm/mV(2倍の感度)', '20 mm/mV (double standard)'), T('判定できない', 'Cannot be determined')];
const RHY4 = [T('正常洞調律', 'Normal sinus rhythm'), T('洞性頻脈', 'Sinus tachycardia'), T('洞性徐脈', 'Sinus bradycardia'), T('心房細動', 'Atrial fibrillation')];
const bpm = (n: number) => T(`${n}回/分`, `${n} bpm`);
const sec = (n: string) => T(`${n}秒`, `${n} s`);
const mv = (n: string) => T(`${n}mV`, `${n} mV`);
const mm = (n: string) => T(`${n}mm`, `${n} mm`);
const RHY_Q = T('IIの10秒間の記録。リズムは?', '10-second strip of lead II. What is the rhythm?');
const AX_Q = T('I・II・aVFのQRSの向きから、電気軸は?', 'From the QRS direction in I, II and aVF, what is the axis?');
const ST_Q = T('ST上昇が見られる誘導の組み合わせは?', 'Which group of leads shows ST elevation?');
const HR_Q = T('リズムは整。心拍数は?', 'The rhythm is regular. What is the heart rate?');

export const READ_CATS: QuizCat[] = [
  { id: 101, name: T('波形の名前と意味', 'Waves: names and meaning'), group: 'read' },
  { id: 102, name: T('マス目から時間と電位を読む', 'Reading time and voltage from the grid'), group: 'read' },
  { id: 103, name: T('心拍数を求める', 'Calculating heart rate'), group: 'read' },
  { id: 104, name: T('間隔を測る(PR・QRS・QT)', 'Measuring intervals (PR, QRS, QT)'), group: 'read' },
  { id: 105, name: T('リズムを見分ける', 'Recognizing rhythms'), group: 'read' },
  { id: 106, name: T('電気軸を判定する', 'Determining the axis'), group: 'read' },
  { id: 107, name: T('ST変化と部位', 'ST changes and location'), group: 'read' },
];

export const READ_QS: QuizQ[] = [
  // --- 101 波形の名前と意味 ---
  { id: 'R1-1', cat: 101, lv: B, q: T('矢印の波の名前は?', 'What is the wave at the arrow called?'), fig: BEAT({ arrow: 0.24 }), opts: [T('P波', 'P wave'), T('Q波', 'Q wave'), T('T波', 'T wave'), T('U波', 'U wave')], ans: 0, why: T('QRSの前にある小さくなだらかな山がP波。心房の脱分極を表す。', 'The small rounded bump before the QRS is the P wave. It represents atrial depolarization.'), src: TB },
  { id: 'R1-2', cat: 101, lv: B, q: T('矢印の大きな波(QRS)が表しているのは?', 'What does the large complex at the arrow (QRS) represent?'), fig: BEAT({ arrow: 0.392 }), opts: [T('心房の脱分極', 'Atrial depolarization'), T('心室の脱分極', 'Ventricular depolarization'), T('心室の再分極', 'Ventricular repolarization'), T('房室結節の伝導', 'AV node conduction')], ans: 1, why: T('QRSは心室に電気が広がる様子(脱分極)。心室の筋肉は量が多いので大きく鋭い波になる。', 'The QRS shows electricity spreading through the ventricles (depolarization). Ventricular muscle mass is large, so the wave is big and sharp.'), src: TB },
  { id: 'R1-3', cat: 101, lv: B, q: T('矢印の波が表しているのは?', 'What does the wave at the arrow represent?'), fig: BEAT({ arrow: 0.66 }), opts: [T('心房の脱分極', 'Atrial depolarization'), T('心室の脱分極', 'Ventricular depolarization'), T('心室の再分極', 'Ventricular repolarization'), T('心房の再分極', 'Atrial repolarization')], ans: 2, why: T('QRSの後のなだらかな山はT波。心室が電気的に元の状態に戻る過程(再分極)を表す。', 'The rounded wave after the QRS is the T wave. It represents the ventricles returning to their resting electrical state (repolarization).'), src: TB },
  { id: 'R1-4', cat: 101, lv: B, q: T('矢印の点(QRSの終わり)の名前は?', 'What is the point at the arrow (end of the QRS) called?'), fig: BEAT({ arrow: 0.462 }), opts: [T('J点', 'J point'), T('P波の頂点', 'Peak of the P wave'), T('T波の終わり', 'End of the T wave'), T('PR部分', 'PR segment')], ans: 0, why: T('QRSが終わりST部分が始まる点がJ点。ST上昇・低下は、J点の高さで判定する。', 'The J point is where the QRS ends and the ST segment begins. ST elevation or depression is judged at the J point.'), src: src('AHA-IV/UDMI4') },
  { id: 'R1-5', cat: 101, lv: B, q: T('STの上昇・低下を判定するとき、高さ0の基準(基線)として使うのは?', 'When judging ST elevation or depression, what is used as the zero reference (baseline)?'), fig: BEAT({ arrow: 0.32 }), opts: [T('矢印の部分(PR部分)', 'The segment at the arrow (PR segment)'), T('T波の頂点', 'Peak of the T wave'), T('R波の頂点', 'Peak of the R wave'), T('U波', 'U wave')], ans: 0, why: T('P波の終わりからQRSの始まりまでの平らな部分(PR部分)を基線として、J点の高さを比べる。', 'The flat segment from the end of the P wave to the start of the QRS (PR segment) is the baseline against which the J point is compared.'), src: src('AHA-IV/UDMI4') },
  { id: 'R1-6', cat: 101, lv: M, q: T('矢印の波の名前と、目立つときに考える状態は?', 'What is the wave at the arrow, and what condition does a prominent one suggest?'), fig: BEAT({ L: { ...II0, t: 0.1, u: 0.12 }, sec: 1.1, arrow: 0.82 }), opts: [T('U波・低カリウム血症', 'U wave – hypokalemia'), T('P波・心房拡大', 'P wave – atrial enlargement'), T('T波・高カリウム血症', 'T wave – hyperkalemia'), T('デルタ波・WPW症候群', 'Delta wave – WPW syndrome')], ans: 0, why: T('T波の後の小さな山はU波。低カリウム血症ではT波が平らになり、U波が目立つ。', 'The small bump after the T wave is the U wave. In hypokalemia the T wave flattens and the U wave becomes prominent.'), src: src('AHA-IV/教科書') },

  // --- 102 マス目から時間と電位を読む ---
  { id: 'R2-1', cat: 102, lv: B, q: T('記録の始めにある較正波(1mV)の高さから、この記録の感度は?', 'From the height of the 1 mV calibration pulse at the start, what is the gain of this recording?'), fig: { type: 'strip', L: II0, first: 0.66, rr: 0.8, sec: 2.6, calib: true, sens: 10 }, opts: SENS_OPTS, ans: 1, why: T('較正波の高さが10mm(大マス2つ)なので標準の感度。判読の前にまず較正波を確認する。', 'The calibration pulse is 10 mm (2 large boxes), so the gain is standard. Always check the calibration before reading.'), src: src('AHA-I') },
  { id: 'R2-2', cat: 102, lv: M, q: T('較正波(1mV)の高さから、この記録の感度は?', 'From the height of the 1 mV calibration pulse, what is the gain of this recording?'), fig: { type: 'strip', L: II0, first: 0.66, rr: 0.8, sec: 2.6, calib: true, sens: 5 }, opts: SENS_OPTS, ans: 0, why: T('較正波が5mm(大マス1つ)なので半分の感度。波形は実際の半分の高さで記録されている。', 'The calibration pulse is 5 mm (1 large box), so the gain is half standard. The waves are recorded at half their true height.'), src: src('AHA-I') },
  { id: 'R2-3', cat: 102, lv: B, q: T('標準の感度で、このR波の高さ(基線から頂点まで)は何mV?', 'At standard gain, how tall is this R wave (baseline to peak) in mV?'), fig: BEAT({ L: { ...II0, r: 1.5 } }), opts: [mv('0.15'), mv('0.5'), mv('1.5'), mv('3.0')], ans: 2, why: T('小マス15個分(大マス3つ)=15mm。標準の感度では1mm=0.1mVなので1.5mV。', '15 small boxes (3 large boxes) = 15 mm. At standard gain, 1 mm = 0.1 mV, so it is 1.5 mV.'), src: src('AHA-I') },
  { id: 'R2-4', cat: 102, lv: M, q: T('較正波を見て、このR波の実際の高さを答えて。', 'Using the calibration pulse, what is the true height of this R wave?'), fig: { type: 'strip', L: { ...II0, r: 2.0 }, first: 0.66, rr: 0.8, sec: 2.6, calib: true, sens: 5 }, opts: [mv('1.0'), mv('2.0'), mv('0.5'), mv('4.0')], ans: 1, why: T('較正波が5mmなので半分の感度。R波は見た目10mmだが、実際はその2倍の2.0mV。', 'The calibration pulse is 5 mm, so the gain is half. The R wave looks 10 mm tall, but its true height is double: 2.0 mV.'), src: src('AHA-I') },
  { id: 'R2-5', cat: 102, lv: M, q: T('J点のすぐ後のST部分は、基線(PR部分)から何mm上がっている?', 'How many mm above the baseline (PR segment) is the ST segment just after the J point?'), fig: BEAT({ L: { ...II0, stp: 0.2, t: 0.35 } }), opts: [mm('0.5'), mm('1'), mm('2'), mm('4')], ans: 2, why: T('基線から小マス2つ分=2mm(0.2mV)の上昇。ST上昇は「連続する2誘導で1mm以上」などの基準で判定する(V2・V3は性別・年齢で基準が違う)。', 'It is raised 2 small boxes = 2 mm (0.2 mV). ST elevation is judged by criteria such as "≥ 1 mm in two contiguous leads" (V2–V3 thresholds differ by sex and age).'), src: src('UDMI4') },
  { id: 'R2-6', cat: 102, lv: M, q: T('この記録は紙送り50mm/秒。R-R間隔は何秒?', 'This strip was recorded at 50 mm/s. What is the R-R interval?'), fig: { type: 'strip', L: II0, first: 0.368, rr: 0.8, sec: 1.8, speed: 50 }, opts: [sec('0.4'), sec('0.8'), sec('1.6'), sec('0.2')], ans: 1, why: T('50mm/秒では大マス1つ(5mm)が0.1秒。R-R間隔は大マス8つなので0.8秒。25mm/秒のつもりで読むと1.6秒と読み違える。', 'At 50 mm/s, one large box (5 mm) = 0.1 s. The R-R interval is 8 large boxes = 0.8 s. Reading it as if at 25 mm/s gives the wrong answer of 1.6 s.'), src: src('AHA-I') },

  // --- 103 心拍数を求める ---
  { id: 'R3-1', cat: 103, lv: B, q: HR_Q, fig: { type: 'strip', L: II0, first: 0.368, rr: 0.8, sec: 2.8 }, opts: [bpm(60), bpm(75), bpm(100), bpm(150)], ans: 1, why: T('R-R間隔は大マス4つ。300 ÷ 4 = 75回/分。', 'The R-R interval is 4 large boxes. 300 ÷ 4 = 75 bpm.'), src: TB },
  { id: 'R3-2', cat: 103, lv: B, q: HR_Q, fig: { type: 'strip', L: II0, first: 0.368, rr: 0.4, sec: 2.0 }, opts: [bpm(100), bpm(150), bpm(200), bpm(75)], ans: 1, why: T('R-R間隔は大マス2つ。300 ÷ 2 = 150回/分。', 'The R-R interval is 2 large boxes. 300 ÷ 2 = 150 bpm.'), src: TB },
  { id: 'R3-3', cat: 103, lv: B, q: HR_Q, fig: { type: 'strip', L: II0, first: 0.368, rr: 1.2, sec: 3.4 }, opts: [bpm(40), bpm(50), bpm(60), bpm(75)], ans: 1, why: T('R-R間隔は大マス6つ。300 ÷ 6 = 50回/分。', 'The R-R interval is 6 large boxes. 300 ÷ 6 = 50 bpm.'), src: TB },
  { id: 'R3-4', cat: 103, lv: B, q: HR_Q, fig: { type: 'strip', L: II0, first: 0.368, rr: 0.6, sec: 2.2 }, opts: [bpm(75), bpm(100), bpm(120), bpm(150)], ans: 1, why: T('R-R間隔は大マス3つ。300 ÷ 3 = 100回/分。', 'The R-R interval is 3 large boxes. 300 ÷ 3 = 100 bpm.'), src: TB },
  { id: 'R3-5', cat: 103, lv: B, q: HR_Q, fig: { type: 'strip', L: II0, first: 0.368, rr: 1.0, sec: 3.0 }, opts: [bpm(50), bpm(60), bpm(75), bpm(100)], ans: 1, why: T('R-R間隔は大マス5つ。300 ÷ 5 = 60回/分。', 'The R-R interval is 5 large boxes. 300 ÷ 5 = 60 bpm.'), src: TB },
  { id: 'R3-6', cat: 103, lv: M, q: T('R-R間隔が大マスの区切りに合わない。小マスを数えて心拍数を求めると?', 'The R-R interval does not line up with the large boxes. Counting small boxes, what is the heart rate?'), fig: { type: 'strip', L: II0, first: 0.368, rr: 0.72, sec: 2.4 }, opts: [T('約63回/分', 'About 63 bpm'), T('約83回/分', 'About 83 bpm'), T('約100回/分', 'About 100 bpm'), T('約120回/分', 'About 120 bpm')], ans: 1, why: T('R-R間隔は小マス18個。1500 ÷ 18 ≒ 83回/分。', 'The R-R interval is 18 small boxes. 1500 ÷ 18 ≈ 83 bpm.'), src: TB },
  { id: 'R3-7', cat: 103, lv: M, q: T('リズムが不整。この10秒間の記録から心拍数を求めると?', 'The rhythm is irregular. From this 10-second strip, what is the heart rate?'), fig: { type: 'long', caseId: 'af' }, opts: [], ans: 0, why: T('', ''), src: TB },
  { id: 'R3-8', cat: 103, lv: M, q: T('この記録は紙送り50mm/秒。心拍数は?', 'This strip was recorded at 50 mm/s. What is the heart rate?'), fig: { type: 'strip', L: II0, first: 0.368, rr: 0.6, sec: 1.7, speed: 50 }, opts: [bpm(50), bpm(100), bpm(150), bpm(200)], ans: 1, why: T('50mm/秒では大マス1つが0.1秒。R-R間隔は大マス6つ=0.6秒なので、60 ÷ 0.6 = 100回/分(600 ÷ 大マス数でも求められる)。', 'At 50 mm/s, one large box = 0.1 s. The R-R interval is 6 large boxes = 0.6 s, so 60 ÷ 0.6 = 100 bpm (or 600 ÷ number of large boxes).'), src: src('AHA-I') },

  // --- 104 間隔を測る ---
  { id: 'R4-1', cat: 104, lv: B, q: T('PR間隔(P波の始まりからQRSの始まりまで)は何秒?', 'What is the PR interval (start of P wave to start of QRS)?'), fig: BEAT({}), opts: [sec('0.08'), sec('0.16'), sec('0.24'), sec('0.32')], ans: 1, why: T('小マス4つ分=0.16秒。0.12〜0.20秒なので正常。', '4 small boxes = 0.16 s. Within 0.12–0.20 s, so normal.'), src: src('AHA-II') },
  { id: 'R4-2', cat: 104, lv: M, q: T('PR間隔は何秒?また何を考える?', 'What is the PR interval, and what does it suggest?'), fig: BEAT({ pr: 0.28, q0: 0.45, sec: 1.1 }), opts: [T('0.20秒・正常', '0.20 s – normal'), T('0.28秒・I度房室ブロック', '0.28 s – first-degree AV block'), T('0.12秒・正常', '0.12 s – normal'), T('0.36秒・III度房室ブロック', '0.36 s – third-degree AV block')], ans: 1, why: T('小マス7つ分=0.28秒。0.20秒を超えているのでI度房室ブロック。すべてのP波の後にQRSが続いていればI度。', '7 small boxes = 0.28 s. Over 0.20 s, so first-degree AV block—as long as every P wave is followed by a QRS.'), src: src('AHA-II/教科書') },
  { id: 'R4-3', cat: 104, lv: B, q: T('QRS幅は何秒?', 'How wide is the QRS?'), fig: BEAT({}), opts: [sec('0.04'), sec('0.08'), sec('0.12'), sec('0.16')], ans: 1, why: T('小マス2つ分=0.08秒。0.12秒未満なので幅は正常。', '2 small boxes = 0.08 s. Under 0.12 s, so the width is normal.'), src: src('AHA-III') },
  { id: 'R4-4', cat: 104, lv: M, q: T('QRS幅は何秒?', 'How wide is the QRS?'), fig: BEAT({ L: { ...II0, q: -0.08, r: 0.9, s: -0.25, t: -0.2 }, wf: 2.2 }), opts: [sec('0.08'), sec('0.12'), sec('0.16'), sec('0.24')], ans: 2, why: T('小マス4つ分=0.16秒。0.12秒以上なので幅の広いQRS。脚ブロックや心室由来の興奮などを考える。', '4 small boxes = 0.16 s. 0.12 s or more, so the QRS is wide—consider bundle branch block or a ventricular origin.'), src: src('AHA-III') },
  { id: 'R4-5', cat: 104, lv: M, q: T('QT間隔(QRSの始まりからT波の終わりまで)は何秒?', 'What is the QT interval (QRS onset to end of T wave)?'), fig: BEAT({ sec: 1.0, q0: 0.3 }), opts: [sec('0.30'), sec('0.40'), sec('0.50'), sec('0.60')], ans: 1, why: T('小マス10個分(大マス2つ)=0.40秒。', '10 small boxes (2 large boxes) = 0.40 s.'), src: src('AHA-IV') },
  { id: 'R4-6', cat: 104, lv: M, q: T('R-R間隔は1.0秒(心拍数60回/分)。QTcはいくつで、延長している?', 'The R-R interval is 1.0 s (rate 60 bpm). What is the QTc, and is it prolonged?'), fig: BEAT({ qt: 0.52, sec: 1.2, q0: 0.3 }), opts: [T('約0.40秒・正常', 'About 0.40 s – normal'), T('約0.52秒・延長', 'About 0.52 s – prolonged'), T('約0.52秒・正常', 'About 0.52 s – normal'), T('約0.30秒・短縮', 'About 0.30 s – short')], ans: 1, why: T('QTは小マス13個=0.52秒。R-R間隔が1秒なので、Bazettの式でもQTc=0.52秒。男性0.45秒・女性0.46秒以上が延長の目安なので延長。', 'The QT is 13 small boxes = 0.52 s. With an R-R of 1 s, Bazett’s formula gives QTc = 0.52 s. Prolongation thresholds are 0.45 s (men) and 0.46 s (women), so it is prolonged.'), src: src('AHA-IV') },

  // --- 105 リズムを見分ける ---
  { id: 'R5-1', cat: 105, lv: B, q: RHY_Q, fig: { type: 'long', caseId: 'nsr' }, opts: RHY4, ans: 0, why: T('各QRSの前に同じ形のP波があり、R-R間隔は一定、QRSは12個(10秒)で約72回/分。', 'An identical P wave precedes every QRS, the R-R interval is constant, and there are 12 QRS complexes in 10 s (about 72 bpm).'), src: TB },
  { id: 'R5-2', cat: 105, lv: B, q: RHY_Q, fig: { type: 'long', caseId: 'stach' }, opts: RHY4, ans: 1, why: T('各QRSの前に同じ形のP波があり(洞調律)、R-R間隔は一定。心拍数が100回/分を超えている。', 'An identical P wave precedes every QRS (sinus rhythm) and the R-R interval is constant. The rate is over 100 bpm.'), src: TB },
  { id: 'R5-3', cat: 105, lv: B, q: RHY_Q, fig: { type: 'long', caseId: 'sbrad' }, opts: RHY4, ans: 2, why: T('各QRSの前に同じ形のP波があり(洞調律)、R-R間隔は一定。QRSは8個(10秒)で約48回/分と60回/分未満。', 'An identical P wave precedes every QRS (sinus rhythm) and the R-R interval is constant. There are 8 QRS complexes in 10 s (about 48 bpm), below 60.'), src: TB },
  { id: 'R5-4', cat: 105, lv: B, q: RHY_Q, fig: { type: 'long', caseId: 'af' }, opts: RHY4, ans: 3, why: T('P波がなく、基線が細かく揺れている。R-R間隔がバラバラ(絶対性不整脈)なので心房細動。', 'No P waves and a finely undulating baseline. The R-R intervals are irregularly irregular, so this is atrial fibrillation.'), src: TB },
  { id: 'R5-5', cat: 105, lv: M, q: T('IIの10秒間の記録。考えられるのは?', '10-second strip of lead II. What is the most likely finding?'), fig: { type: 'long', caseId: 'avb1' }, opts: [T('正常洞調律', 'Normal sinus rhythm'), T('I度房室ブロック', 'First-degree AV block'), T('洞性徐脈', 'Sinus bradycardia'), T('心房細動', 'Atrial fibrillation')], ans: 1, why: T('すべてのP波の後にQRSが続くが、PR間隔が約0.30秒(小マス7〜8個)と0.20秒を超えている。', 'Every P wave is followed by a QRS, but the PR interval is about 0.30 s (7–8 small boxes), over 0.20 s.'), src: TB },
  { id: 'R5-6', cat: 105, lv: M, q: T('心房細動で、P波の代わりに見られる基線の細かい揺れの名前は?', 'In atrial fibrillation, what is the fine baseline undulation seen instead of P waves called?'), fig: { type: 'long', caseId: 'af' }, opts: [T('f波', 'f waves'), T('U波', 'U waves'), T('デルタ波', 'Delta waves'), T('F波(のこぎり状の波)', 'F waves (sawtooth waves)')], ans: 0, why: T('心房細動の不規則で細かい揺れはf波(細動波)。心房粗動で見られる規則的なのこぎり状の波はF波(粗動波)と呼んで区別する。', 'The fine, irregular undulations of AF are f waves (fibrillatory waves). The regular sawtooth waves of atrial flutter are called F waves (flutter waves).'), src: TB },

  // --- 106 電気軸 ---
  { id: 'R6-1', cat: 106, lv: B, q: AX_Q, fig: { type: 'leadset', leads: axisLeads(50) }, opts: AX_OPTS, ans: 0, why: T('IもaVFもQRSが主に上向き → 0°〜+90°の範囲なので正常軸。', 'QRS mainly positive in both I and aVF → between 0° and +90°, so normal axis.'), src: src('AHA-III/教科書') },
  { id: 'R6-2', cat: 106, lv: M, q: AX_Q, fig: { type: 'leadset', leads: axisLeads(-50) }, opts: AX_OPTS, ans: 1, why: T('Iは上向き、aVFは下向き。さらにIIも下向きなので−30°より左 → 左軸偏位。', 'I positive, aVF negative, and II also negative → beyond −30°, so left axis deviation.'), src: src('AHA-III/教科書') },
  { id: 'R6-3', cat: 106, lv: M, q: AX_Q, fig: { type: 'leadset', leads: axisLeads(-15) }, opts: AX_OPTS, ans: 0, why: T('Iは上向き、aVFは下向き。ただしIIが上向きなので−30°より右 → 正常範囲(0°〜−30°)に入る。IとaVFだけで左軸偏位と決めない。', 'I positive, aVF negative—but II is positive, so the axis is to the right of −30° → still normal (0° to −30°). Do not call LAD from I and aVF alone.'), src: src('AHA-III/教科書') },
  { id: 'R6-4', cat: 106, lv: B, q: AX_Q, fig: { type: 'leadset', leads: axisLeads(120) }, opts: AX_OPTS, ans: 2, why: T('Iが下向き、aVFが上向き → +90°〜+180°なので右軸偏位。右室肥大や左脚後枝ブロック、肺塞栓などを考える。', 'I negative, aVF positive → +90° to +180°, so right axis deviation. Consider RVH, left posterior fascicular block, pulmonary embolism, etc.'), src: src('AHA-III/教科書') },
  { id: 'R6-5', cat: 106, lv: M, q: AX_Q, fig: { type: 'leadset', leads: axisLeads(-135) }, opts: AX_OPTS, ans: 3, why: T('IもaVFも下向き → −90°〜±180°の範囲で高度軸偏位(北西軸)。心室由来のリズムや電極の付け間違いも考える。', 'Both I and aVF negative → −90° to ±180°, extreme axis deviation ("northwest axis"). Consider a ventricular rhythm or lead misplacement.'), src: TB },
  { id: 'R6-6', cat: 106, lv: M, q: T('この12誘導の電気軸は?(I・II・aVFを見る)', 'What is the axis of this 12-lead ECG? (look at I, II and aVF)'), fig: { type: 'twelve', caseId: 'lafb' }, opts: AX_OPTS, ans: 1, why: T('Iは上向き、IIとaVFは下向きで−30°より左 → 左軸偏位。QRS幅は正常で、左脚前枝ブロックの形。', 'I positive, II and aVF negative, beyond −30° → left axis deviation. The QRS width is normal, consistent with left anterior fascicular block.'), src: src('AHA-III') },

  // --- 107 ST変化と部位 ---
  { id: 'R7-1', cat: 107, lv: B, q: ST_Q, fig: { type: 'twelve', caseId: 'inf' }, opts: R_ST, ans: 0, why: T('II・III・aVFでST上昇 → 下壁。I・aVLには対側性のST低下がある。', 'ST elevation in II, III and aVF → inferior. There is reciprocal ST depression in I and aVL.'), src: src('AHA-VI/UDMI4') },
  { id: 'R7-2', cat: 107, lv: B, q: ST_Q, fig: { type: 'twelve', caseId: 'ant' }, opts: R_ST, ans: 1, why: T('V1〜V4でST上昇 → 前壁中隔。II・III・aVFには対側性のST低下がある。', 'ST elevation in V1–V4 → anteroseptal. There is reciprocal ST depression in II, III and aVF.'), src: src('AHA-VI/UDMI4') },
  { id: 'R7-3', cat: 107, lv: M, q: ST_Q, fig: { type: 'twelve', caseId: 'lat' }, opts: R_ST, ans: 2, why: T('I・aVL・V5・V6でST上昇 → 側壁。IIIに対側性のST低下がある。aVLの変化は小さいので見逃しやすい。', 'ST elevation in I, aVL, V5 and V6 → lateral. There is reciprocal ST depression in III. The change in aVL is small and easy to miss.'), src: src('AHA-VI/UDMI4') },
  { id: 'R7-4', cat: 107, lv: B, q: ST_Q, fig: { type: 'twelve', caseId: 'nsr' }, opts: R_ST, ans: 3, why: T('どの誘導でも、J点は基線(PR部分)とほぼ同じ高さ。ST上昇はない。', 'In every lead, the J point is at about the same level as the baseline (PR segment). There is no ST elevation.'), src: src('UDMI4') },
  { id: 'R7-5', cat: 107, lv: M, q: T('下壁のST上昇に対して、対側性(鏡像)のST低下が見られる誘導は?', 'Which leads show reciprocal (mirror-image) ST depression for inferior ST elevation?'), fig: { type: 'twelve', caseId: 'inf' }, opts: [T('I・aVL', 'I, aVL'), T('V1・V2', 'V1, V2'), T('V5・V6', 'V5, V6'), T('aVR・V1', 'aVR, V1')], ans: 0, why: T('aVLはIIIのほぼ反対方向を向いているため、下壁のST上昇の鏡像としてST低下が出やすい。', 'aVL faces nearly opposite to III, so it readily shows ST depression as the mirror image of inferior ST elevation.'), src: src('AHA-VI') },
  { id: 'R7-6', cat: 107, lv: M, q: T('この心電図で閉塞が疑われる冠動脈は?', 'Which coronary artery is most likely occluded on this ECG?'), fig: { type: 'twelve', caseId: 'ant' }, opts: [T('左前下行枝', 'Left anterior descending (LAD)'), T('右冠動脈', 'Right coronary artery (RCA)'), T('回旋枝', 'Circumflex (LCx)'), T('後下行枝', 'Posterior descending artery (PDA)')], ans: 0, why: T('V1〜V4のST上昇は前壁中隔の梗塞。前壁と中隔は主に左前下行枝が血液を送っている。', 'ST elevation in V1–V4 indicates an anteroseptal infarct. The anterior wall and septum are supplied mainly by the LAD.'), src: TB },
  { id: 'R7-7', cat: 107, lv: M, q: T('高いR波と、I・aVL・V5・V6のST低下・T波陰転がある。考えられるのは?', 'There are tall R waves with ST depression and T-wave inversion in I, aVL, V5 and V6. What is the most likely diagnosis?'), fig: { type: 'twelve', caseId: 'lvh' }, opts: [T('左室肥大(ストレインパターン)', 'LVH with strain pattern'), T('急性側壁梗塞', 'Acute lateral MI'), T('完全右脚ブロック', 'Complete RBBB'), T('正常', 'Normal')], ans: 0, why: T('V1の深いS波とV5の高いR波(合計3.5mV超)に、側壁誘導のST低下・T波陰転(ストレインパターン)を伴う。', 'Deep S in V1 and tall R in V5 (sum > 3.5 mV) with ST depression and T-wave inversion in the lateral leads (strain pattern).'), src: src('AHA-V') },
];

// 動的に決まる問題(症例の拍数から)
(() => {
  const q = READ_QS.find((x) => x.id === 'R3-7')!;
  const n = caseSig(CASES.find((c) => c.id === 'af')!).beats.length, hr = n * 6;
  q.opts = [hr - 30, hr, hr + 30, Math.round(hr / 2)].map((v) => T(`約${v}回/分`, `About ${v} bpm`));
  q.ans = 1;
  q.why = T(`不整なときは一定時間のQRSを数える。10秒間にQRSが${n}個 → ${n} × 6 = 約${hr}回/分。`, `When the rhythm is irregular, count QRS complexes over a fixed time. ${n} QRS in 10 s → ${n} × 6 = about ${hr} bpm.`);
})();
