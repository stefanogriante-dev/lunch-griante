import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pranzi & Cene — Famiglia Griante',
    short_name: 'Pranzi & Cene',
    description: 'Gestisci le presenze a pranzo e cena',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#16a34a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
