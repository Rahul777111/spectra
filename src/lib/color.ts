export function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

export function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

// Perceived luminance — decide black/white text over a swatch
export function readableOn(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.58 ? '#0B0B0F' : '#FFFFFF';
}

export type Scheme = 'auto' | 'analogous' | 'monochrome' | 'triadic' | 'complementary';
export const SCHEMES: Scheme[] = ['auto', 'analogous', 'monochrome', 'triadic', 'complementary'];

const rand = (a: number, b: number) => a + Math.random() * (b - a);

// Generate a 5-colour palette using a harmony scheme.
export function generate(scheme: Scheme): string[] {
  const base = rand(0, 360);
  const sat = rand(55, 80);
  const pick = scheme === 'auto' ? (['analogous', 'monochrome', 'triadic', 'complementary'] as Scheme[])[Math.floor(rand(0, 4))] : scheme;
  const ls = [88, 72, 56, 40, 24]; // light to dark spread
  return ls.map((l, i) => {
    let h = base;
    if (pick === 'analogous') h = base + (i - 2) * 22;
    else if (pick === 'triadic') h = base + [0, 120, 240, 120, 0][i];
    else if (pick === 'complementary') h = base + [0, 0, 180, 180, 0][i];
    // monochrome keeps h = base
    const s = pick === 'monochrome' ? sat : sat + rand(-8, 8);
    return hslToHex((h + 360) % 360, Math.max(20, Math.min(92, s)), l);
  });
}

export const exporters = {
  css: (c: string[]) => `:root {\n${c.map((x, i) => `  --color-${i + 1}: ${x};`).join('\n')}\n}`,
  tailwind: (c: string[]) => `// tailwind.config.js\ncolors: {\n${c.map((x, i) => `  brand${i + 1}: '${x}',`).join('\n')}\n}`,
  json: (c: string[]) => JSON.stringify(c, null, 2),
  array: (c: string[]) => c.join(', '),
};
