// ===== 学ぶ(動画・画像はあとで入れる) =====
// src に public/ フォルダ内のファイルのパス(例:'/learn/heart.mp4')を入れると表示される。null は「準備中」。
import { T, type Tx } from '@/lib/i18n';

export type LearnItem = { id: string; type: 'video' | 'image'; title: Tx; desc: Tx; src: string | null; note?: Tx };
export const LEARN_ITEMS: LearnItem[] = [
  { id: 'heart', type: 'video', title: T('心臓の動きと心電図', 'How the heart moves and the ECG'), desc: T('電気の伝わり方・心房と心室の収縮・心電図の波形のつながり', 'How electricity spreads, how the atria and ventricles contract, and how this links to the ECG waves'), src: '/learn/heart.mp4',
    note: T('', 'The labels in this video are in Japanese for now.') },
  { id: 'leads', type: 'image', title: T('12誘導はどこから見ているか', 'Where each of the 12 leads looks from'), desc: T('肢誘導・胸部誘導が見ている向きと、電極を貼る位置', 'The direction each limb and chest lead faces, and where the electrodes go'), src: null },
];
