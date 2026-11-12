'use client';
// ===== 正常と比べる(重ねる/上下に並べる) =====
import { FS, LEADS, caseSig, diffPath, normSig, paperSize, sigRange, tracePath, type LeadName } from '@/lib/engine';
import { practiceById } from '@/lib/logic';
import { useApp } from '../AppCtx';
import { Legend, Switch, TopBar } from '../ui';

export function Compare() {
  const { L, t, S, act, W } = useApp();
  const cm = S.cmp!, c = practiceById(cm.caseId), pxmm = 7, lead = cm.lead as LeadName;
  const cs = caseSig(c), ns = normSig(c), a = cs.sig[lead], n = ns.sig[lead];
  const t0 = Math.max(0, cs.beats[0] - 0.25), t1 = t0 + W / (25 * pxmm);
  const { mx, mn } = sigRange([a, n], t0, t1);
  const topMm = Math.ceil(mx * 10 / 5) * 5 + 5, botMm = Math.ceil(-mn * 10 / 5) * 5 + 5, h = (topMm + botMm) * pxmm, y0 = topMm * pxmm;
  const tp = (s: Float32Array) => tracePath(s, t0, t1, 0, y0, pxmm);
  const k = 25 * pxmm;
  const bg = { width: W, height: h, backgroundSize: paperSize(pxmm) };
  let view;
  if (cm.mode === 'overlay') {
    view = (
      <>
        <div className="paper viewer" style={bg}>
          <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`} role="img" aria-label={L(`${lead}誘導:この波形に正常波形を重ねた図`, `Lead ${lead}: this ECG overlaid on a normal one`)}>
            {cm.diff ? <path d={diffPath(a, n, t0, t1, 0, y0, pxmm)} fill="rgba(245,158,11,0.38)" /> : null}
            <path d={tp(n)} fill="none" stroke="#2563EB" strokeOpacity="0.45" strokeWidth="3.2" strokeLinejoin="round" />
            <path d={tp(a)} fill="none" stroke="#1A1A1A" strokeWidth="1.7" strokeLinejoin="round" />
          </svg>
          <span className="lbl">{lead}</span>
        </div>
        <Legend />
      </>
    );
  } else {
    const i0 = Math.round(t0 * FS), i1 = Math.round(t1 * FS);
    const bands: { x: number; w: number }[] = [];
    let st = -1;
    for (let i = i0; i <= i1 + 1; i++) {
      const on = i <= i1 && Math.abs(a[i] - n[i]) > 0.04;
      if (on && st < 0) st = i;
      if (!on && st >= 0) { if (i - st > 3) bands.push({ x: (st - i0) / FS * k, w: (i - st) / FS * k }); st = -1; }
    }
    const guides = cs.beats.filter((b) => b + cs.qrsd > t0 && b + cs.qrsd < t1).map((b) => (b + cs.qrsd - t0) * k);
    const strip = (s: Float32Array, color: string, withBands: boolean, label: string) => (
      <div className="paper viewer" style={bg}>
        <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`} role="img" aria-label={label}>
          {withBands ? bands.map((b, i) => <rect key={i} x={b.x.toFixed(1)} y="0" width={b.w.toFixed(1)} height={h} fill="rgba(245,158,11,0.22)" />) : null}
          <path d={tp(s)} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        <span className="lbl">{lead}</span>
      </div>
    );
    view = (
      <>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <b style={{ fontSize: 12, color: '#1D4ED8' }}>{L('正常(参考)', 'Normal (reference)')}</b>
          {strip(n, '#1D4ED8', false, L(`${lead}誘導の正常波形`, `Normal lead ${lead}`))}
          <b style={{ fontSize: 12 }}>{L('この波形', 'This ECG')}</b>
          {strip(a, '#1A1A1A', cm.diff, L(`${lead}誘導のこの波形`, `This ECG, lead ${lead}`))}
          {guides.map((x, i) => <div key={i} className="guide" style={{ left: x }} />)}
        </div>
        <div className="legend">
          <span><i style={{ borderLeft: '2px dashed #1D4ED8', width: 0, height: 14 }} />{L('QRSの終わり(上下で同じ時刻)', 'End of QRS (same moment in both)')}</span>
          <span><i style={{ background: 'rgba(245,158,11,.45)', height: 12, borderRadius: 3 }} />{L('違いのある部分', 'Where they differ')}</span>
        </div>
      </>
    );
  }
  const point = cm.lead === c.keyLead ? t(c.comparePoint) : L(`オレンジは、正常と0.04mV以上ずれている部分。この問題でいちばん違いがわかりやすいのは ${c.keyLead} 誘導。`, `Orange marks where the trace differs from normal by 0.04 mV or more. The difference is clearest in lead ${c.keyLead} for this case.`);
  return (
    <>
      <TopBar title={L('正常と比べる', 'Compare with normal')} sub={t(c.name)} />
      <main className="wrap grow" style={{ gap: 12 }}>
        <div className="seg" role="tablist" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button type="button" role="tab" aria-selected={cm.mode === 'overlay'} className={cm.mode === 'overlay' ? 'on' : ''} onClick={() => act.cmpMode('overlay')}>{L('重ねて比べる', 'Overlay')}</button>
          <button type="button" role="tab" aria-selected={cm.mode === 'stack'} className={cm.mode === 'stack' ? 'on' : ''} onClick={() => act.cmpMode('stack')}>{L('上下に並べる', 'Stacked')}</button>
        </div>
        <div className="lchips" role="group" aria-label={L('誘導', 'Lead')}>
          {LEADS.map((l) => <button key={l} type="button" className={`lchip${cm.lead === l ? ' on' : ''}`} aria-pressed={cm.lead === l} onClick={() => act.cmpLead(l)}>{l}</button>)}
        </div>
        {view}
        <Switch on={cm.diff} onClick={act.cmpDiff}>{L('違いのある部分を塗る', 'Highlight the differences')}</Switch>
        <div className="card" style={{ background: '#F8FAFC' }}>
          <b style={{ color: '#1E3A8A', fontSize: 13 }}>{L(`${cm.lead}誘導の違い`, `What differs in lead ${cm.lead}`)}</b>
          <div style={{ fontSize: 14, lineHeight: 1.7, marginTop: 4 }}>{point}</div>
        </div>
        <div className="src">{L('正常波形は、QRSの始まりの時刻と基線の高さを合わせて表示しています。人によって波の大きさは違うため、形とずれの方向を比べる目安です。', 'The normal trace is aligned to the same QRS onset and baseline. Wave size varies between people, so use this to compare shape and direction of change.')}</div>
      </main>
    </>
  );
}
