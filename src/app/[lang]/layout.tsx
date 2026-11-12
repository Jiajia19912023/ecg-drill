import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
// フォントはnpmのパッケージから自前で配信する(Googleへの通信なし)
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/800.css';
import '@fontsource/noto-sans-jp/400.css';
import '@fontsource/noto-sans-jp/500.css';
import '@fontsource/noto-sans-jp/700.css';
import '@fontsource/ibm-plex-mono/600.css';
import { LANGS, isLang } from '@/lib/i18n';
import '../globals.css';

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params;
  const ja = lang === 'ja';
  return {
    title: ja ? 'ECG DRILL|12誘導心電図トレーニング' : 'ECG DRILL | 12-lead ECG training',
    description: ja
      ? '手元の心電図と照らし合わせて波形を振り返る、医療者向けの12誘導心電図トレーニング。ログイン不要・無料。'
      : 'A 12-lead ECG training app for clinicians: check the ECG in front of you step by step, then practice. Free, no login.',
    alternates: { languages: { ja: '/ja', en: '/en' } },
  };
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1E293B' };

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
