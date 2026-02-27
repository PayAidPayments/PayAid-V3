import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PayAid - Business Operating System',
    short_name: 'PayAid',
    description: 'All-in-one business operating system for Indian startups and SMBs. HR, Finance, CRM, and more.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#53328A',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
        purpose: 'any',
      },
    ],
    categories: ['business', 'finance', 'productivity'],
  }
}
