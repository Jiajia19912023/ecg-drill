import type { MetadataRoute } from 'next';

// ホーム画面に追加したときの名前とアイコン(Android など)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ECG DRILL',
    short_name: 'ECG DRILL',
    start_url: '/',
    display: 'browser',
    background_color: '#FFF7F7',
    theme_color: '#1E293B',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
