// ===== 基礎クイズ(心電図を読む問題+基礎知識) =====
import { READ_CATS, READ_QS } from './readquiz';
import { KNOW_CATS, KNOW_QS } from './knowledge';

export const QZ = { cats: [...READ_CATS, ...KNOW_CATS], qs: [...READ_QS, ...KNOW_QS] };
export const READ_N = READ_QS.length;
export const KNOW_N = KNOW_QS.length;
