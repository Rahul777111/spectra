import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { LockSimple, LockSimpleOpen, Copy, Check, ArrowsClockwise, Export, X, GithubLogo, Coffee, Cube } from '@phosphor-icons/react';
import { generate, readableOn, exporters, SCHEMES, type Scheme } from './lib/color';
import { LINKS, SITE } from './data/config';

const PaletteOrb = lazy(() => import('./components/PaletteOrb').then((m) => ({ default: m.PaletteOrb })));

function fromHash(): string[] | null {
  const h = window.location.hash.replace('#', '');
  const parts = h.split('-').filter((p) => /^[0-9a-fA-F]{6}$/.test(p));
  return parts.length === 5 ? parts.map((p) => `#${p}`) : null;
}

export default function App() {
  const [palette, setPalette] = useState<string[]>(() => fromHash() ?? generate('auto'));
  const [locks, setLocks] = useState<boolean[]>([false, false, false, false, false]);
  const [scheme, setScheme] = useState<Scheme>('auto');
  const [mode, setMode] = useState<'palette' | 'gradient'>('palette');
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [angle, setAngle] = useState(120);
  const [showOrb, setShowOrb] = useState(false);

  useEffect(() => {
    window.location.hash = palette.map((c) => c.replace('#', '')).join('-');
  }, [palette]);

  const regen = useCallback(() => {
    setPalette((prev) => { const next = generate(scheme); return prev.map((c, i) => (locks[i] ? c : next[i])); });
  }, [scheme, locks]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.code === 'Space' && tag !== 'INPUT' && tag !== 'SELECT') { e.preventDefault(); regen(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [regen]);

  const copy = useCallback((text: string, key?: string, label?: string) => {
    const k = key ?? 'default';
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(k);
      setToast(label ?? 'Copied to clipboard');
      setTimeout(() => setCopied((cur) => (cur === k ? null : cur)), 1200);
      setTimeout(() => setToast((cur) => (cur === (label ?? 'Copied to clipboard') ? null : cur)), 1600);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <header className="z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-bg/80 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-2">
          <Mark /><span className="font-semibold tracking-tight">Spectra</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-lg border border-white/10 p-0.5 sm:flex">
            {(['palette', 'gradient'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`rounded-md px-3 py-1 text-sm capitalize transition-colors ${mode === m ? 'bg-white/10 text-fg' : 'text-fg-mut hover:text-fg'}`}>{m}</button>
            ))}
          </div>
          {mode === 'palette' && (
            <select value={scheme} onChange={(e) => setScheme(e.target.value as Scheme)} className="hidden rounded-lg border border-white/10 bg-bg-soft px-2.5 py-1.5 text-sm capitalize text-fg-mut outline-none sm:block">
              {SCHEMES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {mode === 'palette' && (
            <button onClick={() => setShowOrb((v) => !v)} aria-pressed={showOrb} className={`btn-ghost ${showOrb ? 'border-white/30 text-fg' : ''}`}>
              <Cube size={16} /> <span className="hidden sm:inline">3D</span>
            </button>
          )}
          <button onClick={() => setExportOpen(true)} className="btn-ghost"><Export size={16} /> <span className="hidden sm:inline">Export</span></button>
          {mode === 'palette' && <button onClick={regen} className="btn-solid"><ArrowsClockwise size={16} /> <span className="hidden sm:inline">Generate</span></button>}
        </div>
      </header>

      {mode === 'palette' ? (
        <>
          <div className="flex flex-1 flex-col sm:flex-row">
            {palette.map((c, i) => (
              <div key={i} className="group relative flex flex-1 flex-col items-center justify-end pb-10" style={{ background: c }}>
                <div className="flex flex-col items-center gap-3" style={{ color: readableOn(c) }}>
                  <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => setLocks((l) => l.map((v, j) => (j === i ? !v : v)))} aria-label="Lock" className="rounded-full p-2 transition-colors hover:bg-black/10">
                      {locks[i] ? <LockSimple size={20} weight="fill" /> : <LockSimpleOpen size={20} />}
                    </button>
                    <button onClick={() => copy(c, `swatch-${i}`, `${c.toUpperCase()} copied`)} aria-label="Copy hex" className="rounded-full p-2 transition-colors hover:bg-black/10">
                      {copied === `swatch-${i}` ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                  <button onClick={() => copy(c, `swatch-${i}`, `${c.toUpperCase()} copied`)} className="font-mono text-lg font-semibold uppercase tracking-wide">{c.replace('#', '')}</button>
                </div>
                {locks[i] && <span className="absolute right-3 top-3" style={{ color: readableOn(c) }}><LockSimple size={16} weight="fill" /></span>}
              </div>
            ))}
          </div>
          <p className="border-t border-white/10 py-2 text-center text-xs text-fg-dim">press <span className="chip mx-1">space</span> to generate · click a colour to copy · lock the ones you like</p>
          {showOrb && (
            <div className="fixed bottom-20 right-4 z-30 w-44 sm:bottom-24 sm:right-6 sm:w-56">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-bg-card/80 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs uppercase tracking-wider text-fg-mut">3D preview</span>
                  <button onClick={() => setShowOrb(false)} aria-label="Hide 3D preview" className="text-fg-mut hover:text-fg"><X size={14} /></button>
                </div>
                <div className="h-40 w-full sm:h-52">
                  <Suspense fallback={<div className="h-full w-full animate-pulse bg-white/5" />}>
                    <PaletteOrb palette={palette} />
                  </Suspense>
                </div>
                <p className="px-3 pb-2 text-center text-[10px] text-fg-dim">drag to rotate</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <GradientStudio palette={palette} angle={angle} setAngle={setAngle} copy={copy} copied={copied} />
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-16 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-bg-card/95 px-4 py-2 text-sm text-fg shadow-lg backdrop-blur">
            <Check size={15} className="text-green-400" /> {toast}
          </div>
        </div>
      )}

      {/* footer links */}
      <footer className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs text-fg-dim sm:px-6">
        <span>{SITE.name} · free color tools</span>
        <div className="flex items-center gap-3">
          <a href={LINKS.tip} target="_blank" rel="noopener noreferrer" aria-label="Tip"><Coffee size={16} className="hover:text-fg" /></a>
          <a href={LINKS.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub"><GithubLogo size={16} className="hover:text-fg" /></a>
        </div>
      </footer>

      {exportOpen && <ExportModal palette={palette} onClose={() => setExportOpen(false)} copy={copy} copied={copied} />}
    </div>
  );
}

function GradientStudio({ palette, angle, setAngle, copy, copied }: { palette: string[]; angle: number; setAngle: (n: number) => void; copy: (t: string, k?: string, label?: string) => void; copied: string | null }) {
  const [stopA, setStopA] = useState(1);
  const [stopB, setStopB] = useState(3);
  const a = palette[Math.min(stopA, palette.length - 1)];
  const b = palette[Math.min(stopB, palette.length - 1)];
  const css = `background: linear-gradient(${angle}deg, ${a}, ${b});`;
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1" style={{ background: `linear-gradient(${angle}deg, ${a}, ${b})` }} />
      <div className="flex flex-col items-center gap-4 border-t border-white/10 bg-bg-soft px-4 py-5 sm:px-6">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-8">
          <StopPicker label="From" palette={palette} value={stopA} onChange={setStopA} />
          <StopPicker label="To" palette={palette} value={stopB} onChange={setStopB} />
        </div>
        <input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full max-w-md accent-fg" aria-label="Angle" />
        <span className="font-mono text-xs text-fg-dim">{angle} deg</span>
        <div className="flex w-full max-w-xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <code className="overflow-x-auto rounded-lg border border-white/10 bg-bg px-4 py-2 font-mono text-sm text-fg-mut">{css}</code>
          <button onClick={() => copy(css, 'grad', 'Gradient CSS copied')} className="btn-solid shrink-0">{copied === 'grad' ? <Check size={16} /> : <Copy size={16} />} Copy</button>
        </div>
      </div>
    </div>
  );
}

function StopPicker({ label, palette, value, onChange }: { label: string; palette: string[]; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-fg-mut">{label}</span>
      <div className="flex gap-1.5">
        {palette.map((c, i) => (
          <button key={i} onClick={() => onChange(i)} aria-label={`${label} ${c}`}
            className={`h-6 w-6 rounded-md transition-transform hover:scale-110 ${value === i ? 'ring-2 ring-fg ring-offset-2 ring-offset-bg-soft' : 'ring-1 ring-white/10'}`}
            style={{ background: c }} />
        ))}
      </div>
    </div>
  );
}

function ExportModal({ palette, onClose, copy, copied }: { palette: string[]; onClose: () => void; copy: (t: string, k?: string, label?: string) => void; copied: string | null }) {
  const blocks: [string, string][] = [
    ['CSS variables', exporters.css(palette)],
    ['Tailwind', exporters.tailwind(palette)],
    ['JSON', exporters.json(palette)],
    ['Share URL', `${SITE.url}/#${palette.map((c) => c.replace('#', '')).join('-')}`],
  ];
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-5" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-bg-card p-6">
        <button onClick={onClose} className="absolute right-4 top-4 text-fg-mut hover:text-fg"><X size={20} /></button>
        <h3 className="text-lg font-semibold">Export palette</h3>
        <div className="mt-4 space-y-4">
          {blocks.map(([label, code]) => {
            const key = `export-${label}`;
            return (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-fg-mut">{label}</span>
                  <button onClick={() => copy(code, key, `${label} copied`)} className="flex items-center gap-1 text-xs text-fg-mut hover:text-fg">
                    {copied === key ? <><Check size={12} /> copied</> : <><Copy size={12} /> copy</>}
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-lg border border-white/10 bg-bg px-3 py-2 font-mono text-xs text-fg-mut">{code}</pre>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Mark() {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" fill="#FF6B6B" />
      <circle cx="20" cy="14" r="8" fill="#4ECDC4" fillOpacity="0.85" />
      <circle cx="15" cy="20" r="8" fill="#FFD93D" fillOpacity="0.8" />
    </svg>
  );
}
