'use client';
// ===== 学ぶ(動画・画像はあとで追加) =====
import { LEARN_ITEMS } from '@/data/learn';
import { useApp } from '../AppCtx';
import { IC, NavBar, PlainTop } from '../ui';

export function Learn() {
  const { L, t, lang, act } = useApp();
  return (
    <>
      <PlainTop title={L('学ぶ', 'Learn')} />
      <main className="wrap grow">
        {LEARN_ITEMS.map((it) => {
          const kind = it.type === 'video' ? L('動画', 'Video') : L('画像', 'Image');
          return (
            <section key={it.id} className="card col" style={{ gap: 10 }}>
              <div className="row" style={{ gap: 8 }}><span className="tag">{kind}</span><b style={{ fontSize: 16 }}>{t(it.title)}</b></div>
              <p className="sub" style={{ margin: 0 }}>{t(it.desc)}</p>
              {it.note && t(it.note) ? <p className="sub" style={{ margin: 0, fontStyle: 'italic' }}>{t(it.note)}</p> : null}
              {it.images ? (
                <div className="col" style={{ gap: 10 }}>
                  {it.images[lang].map((im) => (
                    <button key={im.src} type="button" className="imgbtn" onClick={() => act.imgZoom(im.src, im.alt)} aria-label={L(`拡大:${im.alt}`, `Enlarge: ${im.alt}`)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={im.src} alt={im.alt} loading="lazy" />
                    </button>
                  ))}
                  <span className="sub">{L('画像をタップすると拡大できます', 'Tap an image to enlarge it')}</span>
                </div>
              ) : it.src
                ? it.type === 'video'
                  ? <video src={it.src} controls playsInline preload="metadata" style={{ width: '100%', borderRadius: 12, display: 'block', background: '#0B1220' }} />
                  // eslint-disable-next-line @next/next/no-img-element
                  : <img src={it.src} alt={t(it.title)} style={{ width: '100%', borderRadius: 12, display: 'block' }} />
                : <div className="ph" role="img" aria-label={L(`${kind}(準備中)`, `${kind} (coming soon)`)}>{it.type === 'video' ? IC.play() : IC.image()}<span>{L(`${kind}を準備中`, `${kind} coming soon`)}</span></div>}
            </section>
          );
        })}
      </main>
      <NavBar on="learn" />
    </>
  );
}
