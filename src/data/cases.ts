// ===== 練習問題の症例(プログラムで描いた模式的な波形) =====
// 将来PTB-XL(PhysioNet, CC BY 4.0)の実波形に置き換える予定。
import { T, type Tx } from '@/lib/i18n';
import type { LeadName, SynthCase } from '@/lib/engine';

export type Level = 'beginner' | 'intermediate' | 'advanced';
export const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];
export const LEVEL_NAMES: Record<Level, Tx> = { beginner: T('初級', 'Beginner'), intermediate: T('中級', 'Intermediate'), advanced: T('上級', 'Advanced') };
export const LEVEL_COLORS: Record<Level, { fg: string; bg: string; bar: string }> = {
  beginner: { fg: '#166534', bg: '#DCFCE7', bar: '#16A34A' },
  intermediate: { fg: '#1E40AF', bg: '#DBEAFE', bar: '#2563EB' },
  advanced: { fg: '#6B21A8', bg: '#F3E8FF', bar: '#9333EA' },
};

export type StepKey = 'b_reg' | 'b_rate' | 'b_p' | 'b_qrs' | 'b_st' | 'rhythm' | 'rate' | 'axis' | 'pr' | 'qrs' | 'qt' | 'stt' | 'qwave' | 'hyp' | 'final';
export type Answers = Partial<Record<StepKey, string | string[]>>;

export type PracticeCase = SynthCase & {
  name: Tx; // 一覧などで使う短い名前
  finalName: Tx; // 総合判断の答え
  levels: Level[];
  tags: string[];
  keyLead: LeadName;
  ans: Answers;
  finalChoices: string[]; // 症例のid
  sttWhy: Tx;
  comparePoint: Tx;
  layers: [Tx, Tx, Tx, Tx];
  memo: Tx;
};

export const TAG_NAMES: Record<string, Tx> = {
  normal: T('正常洞調律', 'Normal sinus rhythm'), sinus_tachy: T('洞性頻脈', 'Sinus tachycardia'), sinus_brady: T('洞性徐脈', 'Sinus bradycardia'), af: T('心房細動', 'Atrial fibrillation'),
  stemi_inf: T('下壁STEMI', 'Inferior STEMI'), stemi_ant: T('前壁中隔STEMI', 'Anteroseptal STEMI'), stemi_lat: T('側壁STEMI', 'Lateral STEMI'), reciprocal: T('対側性変化', 'Reciprocal changes'),
  rbbb: T('右脚ブロック', 'RBBB'), lbbb: T('左脚ブロック', 'LBBB'), avb1: T('I度房室ブロック', 'First-degree AV block'), lafb: T('左脚前枝ブロック', 'LAFB'), axis: T('電気軸', 'Axis'), lvh: T('左室肥大', 'LVH'),
};

// 共通の解説(梗塞の細胞機序)
const MI_CELL = T(
  '虚血でエネルギーが不足し、心筋細胞が膜電位を正常に保てなくなる。正常な心筋との間に電位差が生まれ、ST部分が基線からずれる。',
  'Ischemia starves the myocytes of energy, so they cannot maintain a normal membrane potential. The voltage difference between injured and healthy myocardium shifts the ST segment away from baseline.',
);
const STT_NONE = T('ST部分は基線(PR部分の高さ)とほぼ同じで、T波も正常な向き。', 'The ST segment sits at about the same level as the baseline (PR segment), and the T waves point in the normal direction.');

export const CASES: PracticeCase[] = [
  {
    id: 'nsr', name: T('正常洞調律', 'Normal sinus rhythm'), finalName: T('正常洞調律', 'Normal sinus rhythm'), levels: ['beginner'], hr: 72, seed: 3, tags: ['normal'], keyLead: 'II',
    ans: { b_reg: 'reg', b_p: 'yes', b_qrs: 'narrow', b_st: 'no', rhythm: 'sinus', axis: 'normal', pr: 'normal', qrs: 'normal', qt: 'normal', stt: ['none'], qwave: 'no', hyp: 'no', final: 'nsr' },
    finalChoices: ['nsr', 'stach', 'sbrad', 'af'],
    sttWhy: STT_NONE,
    comparePoint: T('正常波形とほぼ重なる。これが判読の基準になる「正常」。', 'It almost exactly overlaps the normal trace. This is the "normal" you compare everything else against.'),
    layers: [
      T('リズムは整で心拍数60〜100回/分。各QRSの前に同じ形のP波があり、PR・QRS・QTは正常範囲。ST-T変化なし。', 'Regular rhythm at 60–100 bpm. Every QRS is preceded by an identical P wave; PR, QRS and QT are within normal limits. No ST-T changes.'),
      T('洞結節から始まった興奮が、心房 → 房室結節 → ヒス束 → 左右の脚 → 心室の正常な順番で伝わっている。', 'The impulse starts in the sinus node and travels in the normal order: atria → AV node → bundle of His → right and left bundle branches → ventricles.'),
      T('洞結節の細胞は、自分でゆっくり脱分極する性質(自動能)を持ち、一定の間隔で興奮をつくる。', 'Sinus node cells depolarize slowly on their own (automaticity), generating impulses at a steady interval.'),
      T('異常なし。この形を基準として覚えておくと、異常に気づきやすくなる。', 'Nothing abnormal. Knowing this shape well makes abnormalities easier to spot.'),
    ],
    memo: T('正常な心電図でも、症状があるときは時間をおいて記録し、前回と比べることが大切。', 'Even when the ECG is normal, if the patient has symptoms, repeat it after some time and compare with previous tracings.'),
  },
  {
    id: 'stach', name: T('洞性頻脈', 'Sinus tachycardia'), finalName: T('洞性頻脈', 'Sinus tachycardia'), levels: ['beginner'], hr: 125, seed: 5, tags: ['sinus_tachy'], keyLead: 'II',
    ans: { b_reg: 'reg', b_p: 'yes', b_qrs: 'narrow', b_st: 'no', rhythm: 'sinus', axis: 'normal', pr: 'normal', qrs: 'normal', qt: 'normal', stt: ['none'], qwave: 'no', hyp: 'no', final: 'stach' },
    finalChoices: ['stach', 'nsr', 'af', 'sbrad'],
    sttWhy: T('ST部分は基線とほぼ同じ。心拍数が速いのでT波と次のP波が近づいている。', 'The ST segment is at baseline. Because the rate is fast, each T wave sits close to the next P wave.'),
    comparePoint: T('1拍ごとの形は正常とほぼ同じ。違うのは拍と拍の間隔(速さ)。', 'Each beat looks almost normal. What differs is the spacing between beats (the rate).'),
    layers: [
      T('洞調律(各QRSの前に同じ形のP波)で、心拍数が100回/分を超えている。', 'Sinus rhythm (an identical P wave before every QRS) with a rate above 100 bpm.'),
      T('交感神経の刺激が強まり、洞結節が興奮をつくる間隔が短くなっている。', 'Increased sympathetic drive shortens the interval at which the sinus node fires.'),
      T('交感神経の刺激で、洞結節細胞のゆっくりした脱分極(第4相)の傾きが急になり、早く閾値に届く。', 'Sympathetic stimulation steepens the slow (phase 4) depolarization of sinus node cells, so they reach threshold sooner.'),
      T('発熱・脱水・痛み・不安・貧血・低酸素・出血など、体の需要や刺激への反応であることが多い。', 'Usually a response to demand or stress: fever, dehydration, pain, anxiety, anemia, hypoxia, bleeding, etc.'),
    ],
    memo: T('頻脈そのものを止めるより、原因(発熱、脱水、痛み、出血など)を探して対処する。', 'Look for and treat the cause (fever, dehydration, pain, bleeding, etc.) rather than trying to slow the rate itself.'),
  },
  {
    id: 'sbrad', name: T('洞性徐脈', 'Sinus bradycardia'), finalName: T('洞性徐脈', 'Sinus bradycardia'), levels: ['beginner'], hr: 46, seed: 9, tags: ['sinus_brady'], keyLead: 'II',
    ans: { b_reg: 'reg', b_p: 'yes', b_qrs: 'narrow', b_st: 'no', rhythm: 'sinus', axis: 'normal', pr: 'normal', qrs: 'normal', qt: 'normal', stt: ['none'], qwave: 'no', hyp: 'no', final: 'sbrad' },
    finalChoices: ['sbrad', 'nsr', 'avb1', 'stach'],
    sttWhy: T('ST部分は基線とほぼ同じで、T波も正常な向き。', 'The ST segment is at baseline and the T waves point in the normal direction.'),
    comparePoint: T('1拍ごとの形は正常とほぼ同じ。違うのは拍と拍の間隔(遅さ)。', 'Each beat looks almost normal. What differs is the spacing between beats (the slowness).'),
    layers: [
      T('洞調律(各QRSの前に同じ形のP波)で、心拍数が60回/分未満。PR間隔は正常。', 'Sinus rhythm (an identical P wave before every QRS) with a rate below 60 bpm. The PR interval is normal.'),
      T('副交感神経(迷走神経)のはたらきが強いと、洞結節が興奮をつくる間隔が長くなる。', 'Strong parasympathetic (vagal) tone lengthens the interval at which the sinus node fires.'),
      T('アセチルコリンの作用でカリウムの流れが増え、洞結節細胞のゆっくりした脱分極(第4相)の傾きがゆるやかになる。', 'Acetylcholine increases potassium current, flattening the slow (phase 4) depolarization of sinus node cells.'),
      T('運動習慣のある人や睡眠中では生理的。β遮断薬などの薬、甲状腺機能低下症、下壁梗塞などでも起こる。', 'Physiological in athletes and during sleep. Also caused by drugs such as beta blockers, hypothyroidism, inferior MI, and more.'),
    ],
    memo: T('血圧低下、めまい、意識の変化など、症状があるかどうかを必ず確認する。', 'Always check for symptoms such as hypotension, dizziness or altered consciousness.'),
  },
  {
    id: 'af', name: T('心房細動', 'Atrial fibrillation'), finalName: T('心房細動', 'Atrial fibrillation'), levels: ['beginner'], hr: 112, seed: 11, rhythm: 'af', tags: ['af'], keyLead: 'V1',
    ans: { b_reg: 'irr', b_p: 'no', b_qrs: 'narrow', b_st: 'no', rhythm: 'af', axis: 'normal', pr: 'na', qrs: 'normal', qt: 'normal', stt: ['none'], qwave: 'no', hyp: 'no', final: 'af' },
    finalChoices: ['af', 'stach', 'nsr', 'sbrad'],
    sttWhy: T('ST部分に明らかな上昇や低下はない。基線の細かい揺れ(f波)と区別する。', 'No clear ST elevation or depression. Do not confuse the fine baseline undulation (f waves) with ST changes.'),
    comparePoint: T('正常にあるP波がなく、代わりに基線が細かく揺れている(f波)。QRSの間隔もそろっていない。', 'The normal P waves are missing; instead the baseline wobbles finely (f waves). The QRS spacing is also uneven.'),
    layers: [
      T('P波がなく、基線が細かく不規則に揺れている(f波)。R-R間隔がバラバラ(絶対性不整脈)。', 'No P waves; the baseline shows fine, irregular undulations (f waves). The R-R intervals are irregularly irregular.'),
      T('心房のあちこちで無秩序な興奮が起こり、房室結節がそれを不規則に心室へ伝えるため、心室のリズムもバラバラになる。', 'Chaotic activity arises throughout the atria, and the AV node conducts it to the ventricles irregularly, so the ventricular rhythm is irregular too.'),
      T('肺静脈の付近などから出る異常な興奮と、心房筋の中を興奮がぐるぐる回り続ける状態(リエントリー)が続いている。', 'Abnormal firing (often near the pulmonary veins) combined with impulses circling continuously through atrial muscle (re-entry) keeps it going.'),
      T('加齢、高血圧、心不全、弁膜症、甲状腺機能亢進症、飲酒などが関係する。', 'Associated with aging, hypertension, heart failure, valve disease, hyperthyroidism, alcohol, and more.'),
    ],
    memo: T('心房内に血栓ができやすく、脳梗塞の予防(抗凝固療法)が必要かの評価が大切。', 'Clots form easily in the atria, so assessing the need for stroke prevention (anticoagulation) is important.'),
  },
  {
    id: 'inf', name: T('下壁STEMI', 'Inferior STEMI'), finalName: T('急性下壁梗塞(下壁STEMI)', 'Acute inferior MI (inferior STEMI)'), levels: ['beginner', 'intermediate'], hr: 78, seed: 13, tags: ['stemi_inf', 'reciprocal'], keyLead: 'III',
    leads: { II: { st: 0.22, t: 0.4 }, III: { st: 0.28, t: 0.35 }, aVF: { st: 0.25, t: 0.38 }, aVL: { st: -0.18, t: -0.12 }, I: { st: -0.05, t: 0.05 } },
    ans: { b_reg: 'reg', b_p: 'yes', b_qrs: 'narrow', b_st: 'yes', rhythm: 'sinus', axis: 'normal', pr: 'normal', qrs: 'normal', qt: 'normal', stt: ['inf', 'dep'], qwave: 'no', hyp: 'no', final: 'inf' },
    finalChoices: ['inf', 'ant', 'nsr', 'lat'],
    sttWhy: T('II・III・aVFでST上昇。aVL(とI)で対側性のST低下。', 'ST elevation in II, III and aVF. Reciprocal ST depression in aVL (and I).'),
    comparePoint: T('J点からT波にかけて、正常よりも基線が上にずれている(ST上昇)。QRSの形はほぼ同じ。', 'From the J point to the T wave, the trace sits higher than normal (ST elevation). The QRS shape is almost unchanged.'),
    layers: [
      T('II・III・aVFでST上昇。I・aVLで対側性のST低下。', 'ST elevation in II, III and aVF. Reciprocal ST depression in I and aVL.'),
      T('下壁を向いているII・III・aVFでは、傷ついた心筋からの損傷電流がST上昇として見える。反対側を向くaVLには、その鏡像としてST低下が出る。', 'Leads II, III and aVF face the inferior wall, so the injury current from damaged myocardium appears as ST elevation. aVL faces the opposite direction and shows the mirror image as ST depression.'),
      MI_CELL,
      T('下壁を養う冠動脈の閉塞。多くは右冠動脈、ときに回旋枝。', 'Occlusion of the artery supplying the inferior wall—usually the right coronary artery, sometimes the circumflex.'),
    ],
    memo: T('右室梗塞の合併を確認するため、右側胸部誘導(V4R)の記録を考慮する。', 'Consider recording right-sided chest leads (V4R) to check for right ventricular infarction.'),
  },
  {
    id: 'rbbb', name: T('完全右脚ブロック', 'Complete RBBB'), finalName: T('完全右脚ブロック', 'Complete right bundle branch block'), levels: ['beginner', 'intermediate'], hr: 70, seed: 17, wf: 1.6, tags: ['rbbb'], keyLead: 'V1',
    leads: { V1: { r: 0.25, s: -0.35, r2: 0.8, t: -0.25 }, V2: { r: 0.35, s: -0.8, r2: 0.6, t: -0.15 }, V3: { r2: 0.25 }, I: { r2: -0.3 }, aVL: { r2: -0.2 }, V5: { r2: -0.3 }, V6: { r2: -0.35 }, II: { r2: -0.15 }, aVR: { r2: 0.3 } },
    ans: { b_reg: 'reg', b_p: 'yes', b_qrs: 'wide', b_st: 'no', rhythm: 'sinus', axis: 'normal', pr: 'normal', qrs: 'rbbb', qt: 'normal', stt: ['secondary'], qwave: 'no', hyp: 'no', final: 'rbbb' },
    finalChoices: ['rbbb', 'lbbb', 'nsr', 'ant'],
    sttWhy: T('V1・V2のT波陰転は、右脚ブロックで再分極の順番が変わったための二次性変化。', 'The T-wave inversion in V1–V2 is a secondary change caused by the altered repolarization sequence in RBBB.'),
    comparePoint: T('QRSの後半に、正常にはない上向きの波(R′)が加わり、QRSが幅広くなっている。T波は下向き。', 'An extra upward wave (R′) is added to the end of the QRS, making it wide. The T wave is inverted.'),
    layers: [
      T('QRS幅が0.12秒以上。V1でrsR′型、I・V6で幅広いS波。V1・V2のT波陰転は二次性変化。', 'QRS ≥ 0.12 s. rsR′ pattern in V1 and a broad S wave in I and V6. T-wave inversion in V1–V2 is a secondary change.'),
      T('右脚が興奮を伝えられないため、右室は左室から遅れて興奮する。遅れた右室の興奮が、QRSの後半(V1のR′、I・V6のS波)に表れる。', 'The right bundle cannot conduct, so the right ventricle is activated after the left. This late RV activation forms the end of the QRS (R′ in V1, S in I and V6).'),
      T('右脚での伝導が途絶え、右室の筋肉は心筋細胞どうしのゆっくりした伝導で興奮していく。', 'With the right bundle blocked, RV muscle is activated by slow cell-to-cell conduction.'),
      T('健康な人にもみられる。肺塞栓などの右室への負担、心筋の病気などでも起こる。', 'Can be seen in healthy people. Also occurs with right ventricular strain (e.g., pulmonary embolism) and myocardial disease.'),
    ],
    memo: T('新しく出てきた右脚ブロックは原因を考える。以前の心電図と比べることが大切。', 'A new RBBB needs a cause. Comparing with previous ECGs is important.'),
  },
  {
    id: 'ant', name: T('前壁中隔STEMI', 'Anteroseptal STEMI'), finalName: T('急性前壁中隔梗塞(前壁STEMI)', 'Acute anteroseptal MI (anterior STEMI)'), levels: ['intermediate', 'advanced'], hr: 88, seed: 19, tags: ['stemi_ant', 'reciprocal'], keyLead: 'V2',
    leads: { V1: { st: 0.15, t: 0.2 }, V2: { st: 0.35, t: 0.55 }, V3: { st: 0.38, t: 0.55 }, V4: { st: 0.25, t: 0.45 }, II: { st: -0.08 }, III: { st: -0.12, t: 0.02 }, aVF: { st: -0.1 } },
    ans: { b_reg: 'reg', b_p: 'yes', b_qrs: 'narrow', b_st: 'yes', rhythm: 'sinus', axis: 'normal', pr: 'normal', qrs: 'normal', qt: 'normal', stt: ['ant', 'dep'], qwave: 'no', hyp: 'no', final: 'ant' },
    finalChoices: ['ant', 'inf', 'lbbb', 'lat'],
    sttWhy: T('V1〜V4でST上昇。II・III・aVFで対側性のST低下。', 'ST elevation in V1–V4. Reciprocal ST depression in II, III and aVF.'),
    comparePoint: T('J点からT波にかけて、正常よりも大きく上にずれている(ST上昇)。T波も高くなっている。', 'From the J point to the T wave, the trace is shifted well above normal (ST elevation). The T waves are also taller.'),
    layers: [
      T('V1〜V4でST上昇。II・III・aVFで対側性のST低下。', 'ST elevation in V1–V4. Reciprocal ST depression in II, III and aVF.'),
      T('前壁と中隔を向いている胸部誘導V1〜V4で、傷ついた心筋からの損傷電流がST上昇として見える。', 'Chest leads V1–V4 face the anterior wall and septum, so the injury current from damaged myocardium appears as ST elevation there.'),
      MI_CELL,
      T('左前下行枝の閉塞。', 'Occlusion of the left anterior descending artery (LAD).'),
    ],
    memo: T('広い範囲の心筋が危険な状態。ポンプ機能の低下や致死性不整脈に注意し、すぐに再灌流療法を検討する。', 'A large area of myocardium is at risk. Watch for pump failure and lethal arrhythmias, and consider reperfusion immediately.'),
  },
  {
    id: 'avb1', name: T('I度房室ブロック', 'First-degree AV block'), finalName: T('I度房室ブロック', 'First-degree AV block'), levels: ['intermediate', 'advanced'], hr: 66, seed: 23, pr: 0.3, tags: ['avb1'], keyLead: 'II',
    ans: { b_reg: 'reg', b_p: 'yes', b_qrs: 'narrow', b_st: 'no', rhythm: 'sinus', axis: 'normal', pr: 'long', qrs: 'normal', qt: 'normal', stt: ['none'], qwave: 'no', hyp: 'no', final: 'avb1' },
    finalChoices: ['avb1', 'nsr', 'sbrad', 'rbbb'],
    sttWhy: T('ST部分は基線とほぼ同じで、T波も正常な向き。', 'The ST segment is at baseline and the T waves point in the normal direction.'),
    comparePoint: T('QRSの位置をそろえると、P波が正常よりも早い位置(QRSから遠く)にある。PR間隔が延びている。', 'With the QRS complexes aligned, the P wave sits earlier than normal (farther from the QRS). The PR interval is prolonged.'),
    layers: [
      T('PR間隔が0.20秒を超えている(この例では約0.30秒)。すべてのP波の後にQRSが続いている。', 'PR interval > 0.20 s (about 0.30 s here). Every P wave is followed by a QRS.'),
      T('房室結節での伝導がゆっくりになっている。ただし、心室に伝わらない拍はない。', 'Conduction through the AV node is slowed, but no beat fails to reach the ventricles.'),
      T('房室結節の細胞はカルシウムの流れで興奮を伝えるため、薬や迷走神経の影響で伝導が遅くなりやすい。', 'AV node cells depend on calcium current to conduct, so drugs and vagal tone readily slow conduction.'),
      T('迷走神経の緊張、β遮断薬・カルシウム拮抗薬・ジゴキシンなどの薬、加齢による伝導系の変化、下壁梗塞など。', 'High vagal tone; drugs such as beta blockers, calcium channel blockers and digoxin; age-related conduction-system changes; inferior MI, etc.'),
    ],
    memo: T('単独では症状がないことが多い。使っている薬を確認し、II度以上のブロックへの進行に注意する。', 'Usually asymptomatic on its own. Review medications and watch for progression to second-degree or higher block.'),
  },
  {
    id: 'lafb', name: T('左脚前枝ブロック', 'Left anterior fascicular block'), finalName: T('左脚前枝ブロック(左軸偏位)', 'Left anterior fascicular block (left axis deviation)'), levels: ['intermediate', 'advanced'], hr: 74, seed: 29, wf: 1.1, tags: ['lafb', 'axis'], keyLead: 'aVF',
    leads: { I: { q: -0.05, r: 0.7, s: -0.05 }, II: { q: 0, r: 0.3, s: -0.6 }, III: { q: 0, r: 0.12, s: -0.9, t: -0.05 }, aVF: { q: 0, r: 0.2, s: -0.8, t: 0.05 }, aVL: { q: -0.1, r: 0.9, s: 0, t: 0.2 }, aVR: { r: -0.35 } },
    ans: { b_reg: 'reg', b_p: 'yes', b_qrs: 'narrow', b_st: 'no', rhythm: 'sinus', axis: 'lad', pr: 'normal', qrs: 'normal', qt: 'normal', stt: ['none'], qwave: 'no', hyp: 'no', final: 'lafb' },
    finalChoices: ['lafb', 'lbbb', 'inf', 'nsr'],
    sttWhy: T('ST部分に明らかな上昇や低下はない。', 'No clear ST elevation or depression.'),
    comparePoint: T('正常では上向きのQRSが、下向き(深いS波)になっている。ST部分のずれはない。', 'The QRS, normally upright, is mainly negative here (deep S wave). The ST segment is not shifted.'),
    layers: [
      T('Iは上向き、IIとaVFが下向き(−30°より左の左軸偏位)。QRS幅は0.12秒未満。', 'Lead I positive, II and aVF negative (left axis deviation beyond −30°). QRS < 0.12 s.'),
      T('左脚前枝が興奮を伝えないため、左室の上・前側は後枝からの興奮で遅れて興奮し、電気軸が左上に向く。', 'The left anterior fascicle does not conduct, so the superior/anterior LV is activated late via the posterior fascicle, swinging the axis up and to the left.'),
      T('前枝の伝導が途絶え、その領域の心筋は後枝から広がる興奮に頼って脱分極する。', 'With the anterior fascicle blocked, that region depolarizes only from activation spreading from the posterior fascicle.'),
      T('高血圧、冠動脈疾患、加齢による伝導系の線維化など。', 'Hypertension, coronary artery disease, age-related fibrosis of the conduction system, etc.'),
    ],
    memo: T('右脚ブロックと合併すると二枝ブロックになる。失神などの症状があれば精査する。', 'Combined with RBBB it becomes bifascicular block. Investigate if there are symptoms such as syncope.'),
  },
  {
    id: 'lbbb', name: T('完全左脚ブロック', 'Complete LBBB'), finalName: T('完全左脚ブロック', 'Complete left bundle branch block'), levels: ['intermediate', 'advanced'], hr: 70, seed: 31, wf: 1.7, tags: ['lbbb'], keyLead: 'V6',
    leads: {
      I: { q: 0, r: 0.55, r2: 0.55, s: 0, st: -0.08, t: -0.25 }, aVL: { q: 0, r: 0.5, r2: 0.5, s: 0, st: -0.08, t: -0.2 },
      V5: { q: 0, r: 1.0, r2: 1.0, s: 0, st: -0.1, t: -0.3 }, V6: { q: 0, r: 0.9, r2: 0.9, s: 0, st: -0.1, t: -0.3 },
      V1: { r: 0.05, s: -1.4, st: 0.2, t: 0.4 }, V2: { r: 0.05, s: -1.8, st: 0.25, t: 0.45 }, V3: { r: 0.1, s: -1.4, st: 0.2, t: 0.35 }, V4: { r: 0.5, s: -0.8, st: 0.1, t: 0.2 },
      II: { q: 0, r: 0.6, r2: 0.3, s: -0.1, t: 0.1 }, aVF: { q: 0, r: 0.4, r2: 0.2, s: -0.1, t: 0.05 }, III: { q: 0, r: 0.25, s: -0.2, t: 0.02 }, aVR: { r: -0.5, r2: -0.4, t: 0.2 },
    },
    ans: { b_reg: 'reg', b_p: 'yes', b_qrs: 'wide', b_st: 'yes', rhythm: 'sinus', axis: 'normal', pr: 'normal', qrs: 'lbbb', qt: 'normal', stt: ['secondary'], qwave: 'no', hyp: 'no', final: 'lbbb' },
    finalChoices: ['lbbb', 'rbbb', 'lvh', 'ant'],
    sttWhy: T('V1〜V3のST上昇とI・aVL・V5・V6のST低下・T波陰転は、QRSと逆向きの二次性変化。', 'The ST elevation in V1–V3 and the ST depression / T-wave inversion in I, aVL, V5 and V6 are secondary changes, opposite in direction to the QRS.'),
    comparePoint: T('QRSが幅広く、上が分裂した形(M型)になっている。ST-TはQRSと逆向き(下向き)。', 'The QRS is wide with a notched (M-shaped) top. The ST-T points opposite to the QRS (downward).'),
    layers: [
      T('QRS幅が0.12秒以上。V1で深いQS型、I・aVL・V5・V6で幅広く分裂したR波。ST-TはQRSと逆向き。', 'QRS ≥ 0.12 s. Deep QS in V1; broad, notched R waves in I, aVL, V5 and V6. ST-T discordant to the QRS.'),
      T('左脚が伝えないため、興奮は右室から中隔を右→左に通って左室へ広がる。左室の興奮が遅れてQRSが幅広くなる。', 'The left bundle cannot conduct, so activation spreads from the RV across the septum right-to-left into the LV. Delayed LV activation widens the QRS.'),
      T('左脚の伝導が途絶え、左室は心筋細胞どうしのゆっくりした伝導で興奮する。再分極の順番も変わり、ST-TがQRSと逆向きになる(二次性変化)。', 'With the left bundle blocked, the LV is activated by slow cell-to-cell conduction. The repolarization sequence also changes, so ST-T points opposite to the QRS (secondary change).'),
      T('高血圧、心筋症、冠動脈疾患、弁膜症、加齢による伝導系の変化など。', 'Hypertension, cardiomyopathy, coronary artery disease, valve disease, age-related conduction-system changes, etc.'),
    ],
    memo: T('ST-Tの判読が難しくなる。胸痛があるときはSgarbossa基準などで急性梗塞を評価し、以前の心電図と比べる。', 'ST-T interpretation becomes difficult. With chest pain, assess for acute MI using criteria such as Sgarbossa and compare with previous ECGs.'),
  },
  {
    id: 'lvh', name: T('左室肥大(ストレインパターン)', 'LVH with strain'), finalName: T('左室肥大(ストレインパターン)', 'Left ventricular hypertrophy (strain pattern)'), levels: ['advanced'], hr: 72, seed: 37, wf: 1.1, tags: ['lvh'], keyLead: 'V5',
    leads: { V1: { s: -2.0 }, V2: { s: -2.6 }, V3: { r: 0.6, s: -1.4 }, V4: { r: 2.0, s: -0.4 }, V5: { r: 3.0, st: -0.12, t: -0.25 }, V6: { r: 2.4, st: -0.12, t: -0.25 }, I: { r: 1.0, st: -0.08, t: -0.15 }, aVL: { r: 1.0, s: -0.1, st: -0.08, t: -0.15 }, II: { r: 1.1 }, aVF: { r: 0.6 }, III: { r: 0.2, s: -0.3, t: 0.1 } },
    ans: { b_reg: 'reg', b_p: 'yes', b_qrs: 'narrow', b_st: 'no', rhythm: 'sinus', axis: 'normal', pr: 'normal', qrs: 'normal', qt: 'normal', stt: ['dep'], qwave: 'no', hyp: 'lvh', final: 'lvh' },
    finalChoices: ['lvh', 'lbbb', 'lat', 'nsr'],
    sttWhy: T('I・aVL・V5・V6でST低下とT波陰転(ストレインパターン)。', 'ST depression and T-wave inversion in I, aVL, V5 and V6 (strain pattern).'),
    comparePoint: T('R波が正常よりずっと高く、ST低下とT波陰転がある。', 'The R waves are much taller than normal, with ST depression and T-wave inversion.'),
    layers: [
      T('V5の高いR波とV1の深いS波(SV1+RV5が3.5mV超)。I・aVL・V5・V6でST低下とT波陰転(ストレインパターン)。', 'Tall R in V5 and deep S in V1 (SV1 + RV5 > 3.5 mV). ST depression and T-wave inversion in I, aVL, V5 and V6 (strain pattern).'),
      T('左室の壁が厚くなり、左室の電気の量が増えてQRSが高くなる。厚い心筋では再分極の順番が変わり、ST-Tが変化する。', 'The thickened LV wall generates more electrical force, so the QRS gets taller. In thick myocardium the repolarization sequence changes, altering the ST-T.'),
      T('心筋細胞が大きくなり(肥大)、血液の供給が相対的に足りなくなることや、再分極の変化が起こる。', 'Myocytes enlarge (hypertrophy), leading to relative undersupply of blood and changes in repolarization.'),
      T('高血圧、大動脈弁狭窄症、肥大型心筋症など、左室に圧の負担がかかる病気。', 'Conditions that pressure-load the LV: hypertension, aortic stenosis, hypertrophic cardiomyopathy, etc.'),
    ],
    memo: T('若くやせた人では、肥大がなくても電位が高く出ることがある。心エコーで確認する。', 'Young, thin people can show high voltage without hypertrophy. Confirm with echocardiography.'),
  },
  {
    id: 'lat', name: T('側壁STEMI', 'Lateral STEMI'), finalName: T('急性側壁梗塞(側壁STEMI)', 'Acute lateral MI (lateral STEMI)'), levels: ['advanced'], hr: 82, seed: 41, tags: ['stemi_lat', 'reciprocal'], keyLead: 'aVL',
    leads: { I: { st: 0.18, t: 0.35 }, aVL: { st: 0.22, t: 0.3 }, V5: { st: 0.18, t: 0.4 }, V6: { st: 0.18, t: 0.35 }, III: { st: -0.2, t: -0.1 }, aVF: { st: -0.1, t: 0.05 } },
    ans: { b_reg: 'reg', b_p: 'yes', b_qrs: 'narrow', b_st: 'yes', rhythm: 'sinus', axis: 'normal', pr: 'normal', qrs: 'normal', qt: 'normal', stt: ['lat', 'dep'], qwave: 'no', hyp: 'no', final: 'lat' },
    finalChoices: ['lat', 'inf', 'lvh', 'ant'],
    sttWhy: T('I・aVL・V5・V6でST上昇。III・aVFで対側性のST低下。', 'ST elevation in I, aVL, V5 and V6. Reciprocal ST depression in III and aVF.'),
    comparePoint: T('J点からT波にかけて、正常よりも上にずれている(ST上昇)。aVLは小さな変化なので見逃しやすい。', 'From the J point to the T wave, the trace is shifted above normal (ST elevation). The change in aVL is small and easy to miss.'),
    layers: [
      T('I・aVL・V5・V6でST上昇。III・aVFで対側性のST低下。', 'ST elevation in I, aVL, V5 and V6. Reciprocal ST depression in III and aVF.'),
      T('側壁を向いているI・aVL・V5・V6で、傷ついた心筋からの損傷電流がST上昇として見える。aVLの反対側を向くIIIには鏡像としてST低下が出る。', 'Leads I, aVL, V5 and V6 face the lateral wall, so the injury current appears as ST elevation there. Lead III, facing opposite aVL, shows the mirror image as ST depression.'),
      MI_CELL,
      T('回旋枝、または左前下行枝の対角枝の閉塞。', 'Occlusion of the circumflex artery or a diagonal branch of the LAD.'),
    ],
    memo: T('側壁の梗塞は変化が小さく見逃されやすい。aVLの小さなST上昇と、IIIの対側性変化に注意する。', 'Lateral infarcts produce small changes and are easily missed. Look for subtle ST elevation in aVL and reciprocal change in III.'),
  },
];

// ===== 判読ステップの定義 =====
export type StepDef = {
  title: Tx; q: Tx; opts?: string[]; multi?: boolean; tab: 'rhythm' | 'limb' | 'chest'; focus: LeadName[]; hint?: Tx;
};
const RATE_OPTS = ['lt60', 'n60', 'gt100'];
export const STEPS: Record<StepKey, StepDef> = {
  b_reg: { title: T('リズム', 'Rhythm'), q: T('リズムは整?不整?', 'Is the rhythm regular or irregular?'), opts: ['reg', 'irr'], tab: 'rhythm', focus: ['II'], hint: T('IIのリズムで、R波とR波の間隔(R-R間隔)が毎回同じか比べてみよう。', 'On the lead II rhythm strip, check whether the distance between R waves (R-R interval) is the same every time.') },
  b_rate: { title: T('心拍数', 'Heart rate'), q: T('心拍数はだいたいいくつ?', 'Roughly what is the heart rate?'), opts: RATE_OPTS, tab: 'rhythm', focus: ['II'], hint: T('リズム(10秒分)のQRSの数を数えて6倍する。または300 ÷(R-R間の大きいマスの数)。', 'Count the QRS complexes on the 10-second strip and multiply by 6, or use 300 ÷ (number of large boxes between R waves).') },
  b_p: { title: T('P波', 'P waves'), q: T('各QRSの前にP波はある?', 'Is there a P wave before every QRS?'), opts: ['yes', 'no'], tab: 'rhythm', focus: ['II'], hint: T('P波はIIでいちばん見やすい。QRSの少し前にある小さな山を探そう。', 'P waves are easiest to see in lead II. Look for the small bump just before each QRS.') },
  b_qrs: { title: T('QRS幅', 'QRS width'), q: T('QRS幅は狭い?広い?', 'Is the QRS narrow or wide?'), opts: ['narrow', 'wide'], tab: 'chest', focus: ['V1', 'V6'], hint: T('小さいマス3つ分(0.12秒)より広いかを見る。V1とV6が見やすい。', 'Check whether it is wider than 3 small boxes (0.12 s). V1 and V6 are easiest to read.') },
  b_st: { title: T('ST上昇', 'ST elevation'), q: T('ST上昇はある?', 'Is there ST elevation?'), opts: ['yes', 'no'], tab: 'limb', focus: [], hint: T('QRSの終わり(J点)が、PR部分の高さ(基線)より上にずれている誘導を探そう。胸部誘導も確認する。', 'Look for leads where the end of the QRS (J point) sits above the PR segment (baseline). Check the chest leads too.') },
  rhythm: { title: T('リズム', 'Rhythm'), q: T('リズムは?', 'What is the rhythm?'), opts: ['sinus', 'af', 'flutter', 'other'], tab: 'rhythm', focus: ['II'] },
  rate: { title: T('心拍数', 'Heart rate'), q: T('心拍数は?', 'What is the heart rate?'), opts: RATE_OPTS, tab: 'rhythm', focus: ['II'] },
  axis: { title: T('電気軸', 'Axis'), q: T('電気軸は?', 'What is the axis?'), opts: ['normal', 'lad', 'rad', 'extreme'], tab: 'limb', focus: ['I', 'aVF'] },
  pr: { title: T('PR間隔', 'PR interval'), q: T('PR間隔は?', 'What is the PR interval?'), opts: ['normal', 'long', 'short', 'na'], tab: 'rhythm', focus: ['II'] },
  qrs: { title: T('QRS', 'QRS'), q: T('QRSは?', 'What does the QRS look like?'), opts: ['normal', 'rbbb', 'lbbb', 'wideOther'], tab: 'chest', focus: ['V1', 'V6'] },
  qt: { title: T('QT/QTc', 'QT/QTc'), q: T('QT(QTc)は?', 'What is the QT (QTc)?'), opts: ['normal', 'long'], tab: 'rhythm', focus: ['II'] },
  stt: { title: T('ST-T変化', 'ST-T changes'), q: T('ST-T変化は?(当てはまるものをすべて)', 'ST-T changes? (select all that apply)'), opts: ['inf', 'ant', 'lat', 'dep', 'secondary', 'none'], multi: true, tab: 'limb', focus: [] },
  qwave: { title: T('異常Q波', 'Pathological Q waves'), q: T('異常Q波は?', 'Pathological Q waves?'), opts: ['no', 'yes'], tab: 'limb', focus: [] },
  hyp: { title: T('肥大', 'Hypertrophy'), q: T('肥大の所見は?', 'Signs of hypertrophy?'), opts: ['no', 'lvh', 'rvh'], tab: 'chest', focus: ['V1', 'V5'] },
  final: { title: T('総合判断', 'Final interpretation'), q: T('総合判断は?', 'What is your final interpretation?'), tab: 'limb', focus: [], hint: T('ここまでの答えをまとめて考えよう。', 'Put together everything you have answered so far.') },
};

/** 選択肢の表示名(stepごと) */
export const OPT_LABELS: Partial<Record<StepKey, Record<string, Tx>>> = {
  b_reg: { reg: T('整', 'Regular'), irr: T('不整', 'Irregular') },
  b_rate: { lt60: T('60未満', 'Under 60'), n60: T('60〜100', '60–100'), gt100: T('100超', 'Over 100') },
  b_p: { yes: T('ある', 'Yes'), no: T('ない', 'No') },
  b_qrs: { narrow: T('狭い(0.12秒未満)', 'Narrow (< 0.12 s)'), wide: T('広い(0.12秒以上)', 'Wide (≥ 0.12 s)') },
  b_st: { yes: T('ある', 'Yes'), no: T('ない', 'No') },
  rhythm: { sinus: T('洞調律', 'Sinus rhythm'), af: T('心房細動', 'Atrial fibrillation'), flutter: T('心房粗動', 'Atrial flutter'), other: T('その他', 'Other') },
  rate: { lt60: T('60未満', 'Under 60'), n60: T('60〜100', '60–100'), gt100: T('100超', 'Over 100') },
  axis: { normal: T('正常軸', 'Normal axis'), lad: T('左軸偏位', 'Left axis deviation'), rad: T('右軸偏位', 'Right axis deviation'), extreme: T('高度軸偏位', 'Extreme axis deviation') },
  pr: { normal: T('正常', 'Normal'), long: T('延長', 'Prolonged'), short: T('短縮', 'Short'), na: T('判定できない', 'Cannot be measured') },
  qrs: { normal: T('正常', 'Normal'), rbbb: T('右脚ブロック型', 'RBBB pattern'), lbbb: T('左脚ブロック型', 'LBBB pattern'), wideOther: T('その他(幅広い)', 'Other (wide)') },
  qt: { normal: T('正常', 'Normal'), long: T('延長', 'Prolonged') },
  stt: {
    inf: T('ST上昇:下壁', 'ST elevation: inferior'), ant: T('ST上昇:前壁', 'ST elevation: anterior'), lat: T('ST上昇:側壁', 'ST elevation: lateral'),
    dep: T('ST低下・T波陰転(対側性を含む)', 'ST depression / T inversion (incl. reciprocal)'), secondary: T('脚ブロックに伴う二次性変化', 'Secondary change from bundle branch block'), none: T('明らかな変化なし', 'No obvious change'),
  },
  qwave: { no: T('なし', 'None'), yes: T('あり', 'Present') },
  hyp: { no: T('なし', 'None'), lvh: T('左室肥大', 'LVH'), rvh: T('右室肥大', 'RVH') },
};

export const LEVEL_STEPS: Record<Level, StepKey[]> = {
  beginner: ['b_reg', 'b_rate', 'b_p', 'b_qrs', 'b_st', 'final'],
  intermediate: ['rhythm', 'rate', 'axis', 'pr', 'qrs', 'qt', 'stt', 'qwave', 'final'],
  advanced: ['rhythm', 'rate', 'axis', 'pr', 'qrs', 'qt', 'stt', 'qwave', 'hyp', 'final'],
};

export const GENERIC_WHY: Partial<Record<StepKey, Record<string, Tx>>> = {
  b_reg: { reg: T('R-R間隔がほぼ一定なので「整」。', 'The R-R intervals are nearly constant, so it is regular.'), irr: T('R-R間隔が毎回違うので「不整」。', 'The R-R intervals vary from beat to beat, so it is irregular.') },
  b_p: { yes: T('各QRSの前に同じ形のP波がある。', 'Every QRS is preceded by an identical P wave.'), no: T('QRSの前にはっきりしたP波がなく、基線が細かく揺れている。', 'There are no clear P waves before the QRS complexes, and the baseline wobbles finely.') },
  b_qrs: { narrow: T('QRS幅は小さいマス3つ(0.12秒)未満。', 'The QRS is narrower than 3 small boxes (0.12 s).'), wide: T('QRS幅が小さいマス3つ(0.12秒)以上ある。', 'The QRS is 3 small boxes (0.12 s) or wider.') },
  rhythm: { sinus: T('IIで上向きのP波が、各QRSの前に同じ形で並んでいる。', 'Upright P waves of identical shape precede every QRS in lead II.'), af: T('P波がなく、基線が細かく揺れ(f波)、R-R間隔が不規則。', 'No P waves, a finely undulating baseline (f waves), and irregular R-R intervals.') },
  axis: { normal: T('IもaVFもQRSが主に上向き → 正常範囲(−30°〜+90°)。', 'QRS mainly positive in both I and aVF → normal range (−30° to +90°).'), lad: T('Iは上向き、aVFとIIが下向き → −30°より左なので左軸偏位。', 'I positive, aVF and II negative → beyond −30°, so left axis deviation.') },
  qrs: {
    normal: T('QRS幅は0.12秒未満で、形も正常。', 'QRS < 0.12 s with a normal shape.'),
    rbbb: T('QRS幅が0.12秒以上。V1でrsR′型、I・V6で幅の広いS波。', 'QRS ≥ 0.12 s. rsR′ in V1 and broad S waves in I and V6.'),
    lbbb: T('QRS幅が0.12秒以上。V1で深いQS型、I・V6で幅広く分裂したR波。', 'QRS ≥ 0.12 s. Deep QS in V1 and broad, notched R waves in I and V6.'),
  },
  qt: { normal: T('T波の終わりはR-R間隔の半分より手前で、QTcは延長の目安(男性0.45秒・女性0.46秒)未満。', 'The T wave ends before the midpoint of the R-R interval, and the QTc is below the prolongation thresholds (0.45 s men, 0.46 s women).') },
  qwave: { no: T('異常Q波(V4〜V6などで幅0.03秒以上かつ深さ0.1mV以上など)は見られない。急性期の梗塞では、Q波がまだできていないことも多い。', 'No pathological Q waves (e.g., ≥ 0.03 s wide and ≥ 0.1 mV deep in V4–V6). In acute infarction, Q waves often have not formed yet.') },
  hyp: { no: T('SV1+RV5は3.5mV以下で、高電位の基準を満たさない。', 'SV1 + RV5 ≤ 3.5 mV, so the voltage criterion is not met.'), lvh: T('SV1+RV5が3.5mVを超える(Sokolow-Lyon基準)。', 'SV1 + RV5 > 3.5 mV (Sokolow-Lyon criterion).') },
};
