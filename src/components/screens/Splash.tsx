'use client';
// ===== タイトル画面(タップすると、ゆっくりメイン画面に切り替わる) =====
import { useLayoutEffect, useRef } from 'react';
import { useApp } from '../AppCtx';

export function Splash() {
  const { L, act, S, winW } = useApp();
  const ref = useRef<SVGPathElement>(null);
  const pxmm = 5, W = Math.min(winW, 480), tc = W / 2 / (25 * pxmm);
  let d = '';
  const P = { p: 0.2, q: -0.15, r: 1.5, s: -0.4, t: 0.4 };
  for (let t = 0; t <= W / (25 * pxmm); t += 0.004) {
    const ph = t - tc + 0.205, g = (a: number, c: number, w: number) => a * Math.exp(-((ph - c) ** 2) / (2 * w * w));
    const v = g(P.p, 0.1, 0.022) + g(P.q, 0.185, 0.008) + g(P.r, 0.205, 0.009) + g(P.s, 0.226, 0.009) + g(P.t, 0.42, 0.045);
    d += (d ? 'L' : 'M') + (t * 25 * pxmm).toFixed(1) + ' ' + (110 - v * 50).toFixed(1);
  }
  // 線の長さを端末で計算してから描き始める(iPhoneのSafariでも途切れないように)
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const len = Math.ceil(el.getTotalLength()) + 2;
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
    el.classList.add('draw');
  }, [d]);
  return (
    <button type="button" className={`splash paper${S.leaving ? ' out' : ''}`} onClick={act.skip} aria-label={L('タップしてはじめる', 'Tap to start')} style={{ backgroundSize: '25px 25px,25px 25px,5px 5px,5px 5px' }}>
      <span className="logo">ECG DRILL</span>
      <svg width={W} height="170" viewBox={`0 0 ${W} 170`} className="beat" aria-hidden="true">
        <path ref={ref} d={d} fill="none" stroke="#1A1A1A" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </button>
  );
}
