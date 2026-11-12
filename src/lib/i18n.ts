// 言語の切り替え(日本語・英語)
export const LANGS = ['ja', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const isLang = (s: string): s is Lang => (LANGS as readonly string[]).includes(s);

/** 日本語と英語の組 */
export type Tx = { ja: string; en: string };
export const tx = (t: Tx | string, lang: Lang): string => (typeof t === 'string' ? t : t[lang]);
/** 短く書くためのヘルパー */
export const T = (ja: string, en: string): Tx => ({ ja, en });
