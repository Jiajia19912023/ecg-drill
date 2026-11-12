// URLに言語(/ja・/en)がないときは、保存した言語→ブラウザの言語の順で振り分ける
import { NextResponse, type NextRequest } from 'next/server';

const LANGS = ['ja', 'en'];

function pickLang(req: NextRequest) {
  const saved = req.cookies.get('lang')?.value;
  if (saved && LANGS.includes(saved)) return saved;
  const al = (req.headers.get('accept-language') || '').toLowerCase();
  // 先に出てくる言語を優先(例:"en-US,en;q=0.9,ja;q=0.8" → en)
  const ja = al.indexOf('ja'), en = al.indexOf('en');
  if (ja >= 0 && (en < 0 || ja < en)) return 'ja';
  if (en >= 0) return 'en';
  return 'ja';
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (LANGS.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return;
  const url = req.nextUrl.clone();
  url.pathname = `/${pickLang(req)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // 静的ファイルとNext.jsの内部パスは除く
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
};
