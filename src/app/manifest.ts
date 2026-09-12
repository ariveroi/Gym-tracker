import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pulso · Tu entrenamiento',
    short_name: 'Pulso',
    description: 'Tu diario personal de fuerza.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f8fa',
    theme_color: '#f7f8fa',
    lang: 'es',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
