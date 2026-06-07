const env = import.meta.env;
export const SITE = { name: 'Spectra', tagline: 'Color palettes, instantly.', url: (env.VITE_SITE_URL as string) || 'https://spectra.vercel.app' };
export const LINKS = {
  pro: (env.VITE_PRO_CHECKOUT as string) || 'https://spectra.gumroad.com/l/packs',
  tip: (env.VITE_TIP_URL as string) || 'https://www.buymeacoffee.com/spectra',
  gear: (env.VITE_AFF_GEAR as string) || 'https://www.awwwards.com/',
  twitter: (env.VITE_TWITTER_URL as string) || 'https://twitter.com/spectraapp',
  github: (env.VITE_GITHUB_URL as string) || 'https://github.com/Rahul777111/spectra',
};
