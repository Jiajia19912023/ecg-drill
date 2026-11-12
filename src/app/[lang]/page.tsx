import App from '@/components/App';
import { isLang } from '@/lib/i18n';
import { notFound } from 'next/navigation';

export default async function Page({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <App lang={lang} />;
}
