'use client';
// ===== 共通の部品(アイコン・ヘッダー・メニューなど) =====
import type { ReactNode } from 'react';
import { LEVEL_COLORS, LEVEL_NAMES, type Level } from '@/data/cases';
import { useApp } from './AppCtx';

const svg = (w: number, children: ReactNode, o: { stroke?: string; sw?: number; label?: string } = {}) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={o.stroke || 'currentColor'} strokeWidth={o.sw || 1.9} strokeLinecap="round" strokeLinejoin="round" {...(o.label ? { role: 'img', 'aria-label': o.label } : { 'aria-hidden': true })}>
    {children}
  </svg>
);

export const IC = {
  back: () => svg(22, <path d="M15 6l-6 6 6 6" />, { sw: 2 }),
  close: () => svg(22, <path d="M6 6l12 12M18 6L6 18" />, { sw: 2 }),
  chev: () => svg(20, <path d="M9 6l6 6-6 6" />, { stroke: '#64748B', sw: 2 }),
  chevDown: () => svg(20, <path d="M6 9l6 6 6-6" />, { stroke: '#64748B', sw: 2 }),
  ok: (label?: string, color = '#15803D') => svg(20, <path d="M5 12l5 5 9-10" />, { stroke: color, sw: 2.6, label }),
  ng: (label?: string, color = '#B91C1C') => svg(20, <path d="M6 6l12 12M18 6L6 18" />, { stroke: color, sw: 2.6, label }),
  home: () => svg(24, <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>),
  chart: () => svg(24, <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />),
  gear: () => svg(24, <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>),
  clock: () => svg(28, <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></>, { stroke: '#92400E', sw: 1.8 }),
  book: () => svg(28, <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 21V5M9 8h6" /></>, { stroke: '#3730A3', sw: 1.8 }),
  play: () => svg(44, <><circle cx="12" cy="12" r="10" /><path d="M10 8l6 4-6 4z" /></>, { stroke: '#64748B', sw: 1.6 }),
  image: () => svg(44, <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 17l-5-5-9 8" /></>, { stroke: '#64748B', sw: 1.6 }),
  learn: () => svg(24, <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M10 9l5 3-5 3z" /></>),
  wave: (w = 18) => svg(w, <path d="M2 14h4l2-6 3 10 2-4h9" />, { sw: 2 }),
};

/** ロゴの小さなマーク */
export function Mark() {
  return (
    <div className="paper mark" style={{ backgroundSize: '16px 16px,16px 16px,3.2px 3.2px,3.2px 3.2px' }}>
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><polyline points="0,23 10,23 13,26 18,6 23,31 26,23 36,23" fill="none" stroke="#1A1A1A" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" /></svg>
    </div>
  );
}
export function PaperThumb({ size = 64, cls = 'mthumb' }: { size?: number; cls?: string }) {
  return (
    <span className={`paper ${cls}`} style={{ backgroundSize: '16px 16px,16px 16px,3.2px 3.2px,3.2px 3.2px' }}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><polyline points="0,40 14,40 17,37 20,40 26,40 29,43 33,10 37,47 40,40 46,40 52,32 58,40 64,40" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinejoin="round" /></svg>
    </span>
  );
}

export function TopBar({ title, sub, right, onBack }: { title: string; sub?: string; right?: ReactNode; onBack?: () => void }) {
  const { L, act } = useApp();
  return (
    <header className="top">
      <button type="button" className="ib" onClick={onBack || act.back} aria-label={L('戻る', 'Back')}>{IC.back()}</button>
      <div className="ttl">{sub ? <div className="sub">{sub}</div> : null}{title}</div>
      <div className="ib" style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{right}</div>
    </header>
  );
}
/** 戻るボタンのない、メニュー画面のヘッダー */
export function PlainTop({ title }: { title: string }) {
  return <header className="top"><div className="ib" /><div className="ttl">{title}</div><div className="ib" /></header>;
}

export function NavBar({ on }: { on: 'home' | 'learn' | 'analysis' | 'settings' }) {
  const { L, act } = useApp();
  const items: [typeof on, ReactNode, string][] = [
    ['home', IC.home(), L('ホーム', 'Home')],
    ['learn', IC.learn(), L('学ぶ', 'Learn')],
    ['analysis', IC.chart(), L('苦手分析', 'Progress')],
    ['settings', IC.gear(), L('設定', 'Settings')],
  ];
  return (
    <nav className="nav">
      {items.map(([to, ic, lb]) => (
        <button key={to} type="button" className={on === to ? 'on' : ''} aria-current={on === to ? 'page' : undefined} onClick={() => act.nav(to)}>{ic}{lb}</button>
      ))}
    </nav>
  );
}

export function LvBadge({ lv }: { lv: Level }) {
  const { t } = useApp();
  return <span className="lvb" style={{ color: LEVEL_COLORS[lv].fg, background: LEVEL_COLORS[lv].bg }}>{t(LEVEL_NAMES[lv])}</span>;
}

export function Switch({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="switch" role="switch" aria-checked={on} onClick={onClick}>
      <span>{children}</span>
      <span className={`trk${on ? ' on' : ''}`}><span className="knob" /></span>
    </button>
  );
}
export function OverlaySwitch({ on, onClick }: { on: boolean; onClick: () => void }) {
  const { L } = useApp();
  return <Switch on={on} onClick={onClick}>{IC.wave()} {L('正常の波形を重ねる', 'Overlay the normal ECG')}</Switch>;
}
export function Legend() {
  const { L } = useApp();
  return (
    <div className="legend">
      <span><i style={{ background: '#2563EB', opacity: 0.5, height: 3 }} />{L('正常(参考)', 'Normal (reference)')}</span>
      <span><i style={{ background: '#1A1A1A', height: 2 }} />{L('この波形', 'This ECG')}</span>
      <span><i style={{ background: 'rgba(245,158,11,.45)', height: 12, borderRadius: 3 }} />{L('違いのある部分', 'Where they differ')}</span>
    </div>
  );
}
export type Tab = 'rhythm' | 'limb' | 'chest';
export function TabsBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const { L } = useApp();
  const list: [Tab, string][] = [['rhythm', L('リズム', 'Rhythm')], ['limb', L('肢誘導', 'Limb leads')], ['chest', L('胸部誘導', 'Chest leads')]];
  return (
    <div className="seg" role="tablist" aria-label={L('表示する誘導', 'Leads to show')} style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
      {list.map(([id, lb]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => onTab(id)}>{lb}</button>)}
    </div>
  );
}
