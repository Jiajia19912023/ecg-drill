'use client';
// ===== 拡大表示・説明のシート・トースト =====
import { useEffect, useState } from 'react';
import type { LeadName } from '@/lib/engine';
import { caseById } from '@/data/guide';
import { DIAG_INFO } from '@/data/diaginfo';
import { useApp } from './AppCtx';
import { ZoomStrip } from './ecg';
import { IC } from './ui';

function Sheet({ label, onClose, children, max }: { label: string; onClose: () => void; children: React.ReactNode; max?: number }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()} style={max ? { maxWidth: max } : undefined}>
        {children}
      </div>
    </div>
  );
}

export function Modals() {
  const { S, L, t, act, winW } = useApp();
  if (S.modal) {
    const c = caseById(S.modal.caseId)!;
    return (
      <Sheet label={L(`${S.modal.lead}誘導の拡大`, `Lead ${S.modal.lead} enlarged`)} onClose={act.closeModal}>
        <div className="row-b" style={{ padding: '8px 8px 8px 16px' }}>
          <b>{L(`${S.modal.lead}誘導(10秒)`, `Lead ${S.modal.lead} (10 s)`)}</b>
          <button type="button" className="ib" onClick={act.closeModal} aria-label={L('閉じる', 'Close')}>{IC.close()}</button>
        </div>
        <div className="hscroll"><ZoomStrip c={c} lead={S.modal.lead as LeadName} overlay={S.modal.overlay} /></div>
        <p className="sub" style={{ padding: '8px 16px 14px', margin: 0 }}>{L('横にスクロールできます。小さいマス=0.04秒・0.1mV', 'Scroll sideways. Small box = 0.04 s · 0.1 mV')}</p>
      </Sheet>
    );
  }
  if (S.img) {
    // 横向きのときは、画像全体を画面いっぱいに表示する
    const land = typeof window !== 'undefined' && winW > window.innerHeight;
    if (land) {
      return (
        <div className="imgfull" role="dialog" aria-modal="true" aria-label={S.img.alt} onClick={act.closeImg}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={S.img.src} alt={S.img.alt} />
          <button type="button" className="imgclose" onClick={act.closeImg} aria-label={L('閉じる', 'Close')}>{IC.close()}</button>
        </div>
      );
    }
    return (
      <Sheet label={S.img.alt} onClose={act.closeImg} max={1200}>
        <div className="row-b" style={{ padding: '8px 8px 4px 16px' }}>
          <span className="sub">{L('横にスクロールできます。スマホを横にすると全体を表示します', 'Scroll sideways, or turn your phone to see the whole image')}</span>
          <button type="button" className="ib" onClick={act.closeImg} aria-label={L('閉じる', 'Close')}>{IC.close()}</button>
        </div>
        <div className="hscroll" style={{ padding: '0 0 12px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={S.img.src} alt={S.img.alt} style={{ width: 1100, maxWidth: 'none', display: 'block' }} />
        </div>
      </Sheet>
    );
  }
  if (S.info) {
    const c = caseById(S.info), I = DIAG_INFO[S.info];
    if (!c || !I) return null;
    const row = (title: string, v: string) => <div className="irow"><b>{title}</b><div>{v}</div></div>;
    return (
      <Sheet label={L(`${t(c.name)}の説明`, `About ${t(c.name)}`)} onClose={act.closeInfo} max={480}>
        <div className="row-b" style={{ padding: '8px 8px 4px 16px' }}>
          <b style={{ fontSize: 17 }}>{t(c.name)}</b>
          <button type="button" className="ib" onClick={act.closeInfo} aria-label={L('閉じる', 'Close')}>{IC.close()}</button>
        </div>
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {row(L('どんな状態?', 'What is it?'), t(I.what))}
          {row(L('主な原因', 'Main causes'), t(I.cause))}
          <div className="irow"><b>{L('一般的な治療', 'Usual treatment')}</b><div>{t(I.tx)}</div><div className="drugs"><span>{L('薬の例', 'Drug examples')}</span>{t(I.drugs)}</div></div>
          {row(L('観察・注意点', 'What to watch for'), t(I.care))}
          {row(L('確認する採血データ', 'Blood tests to check'), t(I.labs))}
          <p className="src" style={{ margin: '10px 0 0' }}>{L('一般的な内容です。実際の治療や対応は、施設の手順と医師の指示に従ってください。', 'General information only. Follow your facility’s protocols and the physician’s orders for actual treatment.')}</p>
        </div>
      </Sheet>
    );
  }
  return null;
}

export function Toast() {
  const { S } = useApp();
  const [show, setShow] = useState(false);
  const key = S.toast?.key;
  useEffect(() => {
    if (!key) return;
    setShow(true);
    const id = setTimeout(() => setShow(false), 650);
    return () => clearTimeout(id);
  }, [key]);
  return <div className={`toast${show && S.toast ? ' show ' + (S.toast.ok ? 'ok' : 'ng') : ''}`} role="status" aria-live="polite">{S.toast?.text}</div>;
}
