import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...preset,
    maskable: {
      ...preset.maskable,
      resizeOptions: { background: '#10b981', fit: 'contain' },
    },
    apple: {
      ...preset.apple,
      resizeOptions: { background: '#10b981', fit: 'contain' },
    },
  },
  images: ['public/icon.svg'],
});
