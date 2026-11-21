export interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

export interface WebAppManifest {
  id: string;
  name: string;
  short_name: string;
  description: string;
  theme_color: string;
  background_color: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  start_url: string;
  scope: string;
  icons: ManifestIcon[];
}

export const manifest: WebAppManifest = {
  id: '/',
  name: 'ROKTO DATA - রক্তদাতা',
  short_name: 'রক্তদাতা',
  description: 'Bangladesh Voluntary Blood Donor Network connecting emergency blood seekers and voluntary donors across 64 districts.',
  theme_color: '#DC2626',
  background_color: '#FFFFFF',
  display: 'standalone',
  start_url: '/',
  scope: '/',
  icons: [
    {
      src: '/pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/pwa-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};
