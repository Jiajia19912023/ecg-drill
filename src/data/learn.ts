// ===== 学ぶ(動画・画像はあとで入れる) =====
// src に public/ フォルダ内のファイルのパス(例:'/learn/heart.mp4')を入れると表示される。null は「準備中」。
// images は言語ごとの画像(日本語版と英語版で切り替わる)。
import { T, type Lang, type Tx } from '@/lib/i18n';

export type LearnItem = { id: string; type: 'video' | 'image'; title: Tx; desc: Tx; src: string | null; note?: Tx; images?: Record<Lang, { src: string; alt: string }[]> };
export const LEARN_ITEMS: LearnItem[] = [
  { id: 'heart', type: 'video', title: T('心臓の動きと心電図', 'How the heart moves and the ECG'), desc: T('電気の伝わり方・心房と心室の収縮・心電図の波形のつながり', 'How electricity spreads, how the atria and ventricles contract, and how this links to the ECG waves'), src: '/learn/heart.mp4',
    note: T('', 'The labels in this video are in Japanese for now.') },
  { id: 'leads', type: 'image', title: T('12誘導はどこから見ているか', 'Where each of the 12 leads looks from'), desc: T('肢誘導・胸部誘導が見ている向きと、電極を貼る位置', 'The direction each limb and chest lead faces, and where the electrodes go'), src: null,
    images: {
      ja: [
        { src: '/learn/leads-overview-ja.webp', alt: '12誘導心電図とは?目的、わかること、電極の貼付位置、誘導と心臓の領域・冠動脈、代表的な異常' },
        { src: '/learn/leads-views-ja.webp', alt: '12誘導の見える方向:電極の位置、各誘導の向き、実際の波形の並び、各誘導が見ている心臓の場所' },
      ],
      en: [
        { src: '/learn/leads-overview-en.webp', alt: 'What is a 12-lead ECG? Purpose, what it detects, electrode placement, leads and coronary territories, typical abnormalities' },
        { src: '/learn/leads-views-en.webp', alt: 'Viewing direction of the 12 leads: electrode placement, direction of each lead, waveform layout, and which part of the heart each lead sees' },
      ],
    } },
];
