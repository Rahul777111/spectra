import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { hexToRgb } from '../lib/color';

// A 3D preview of the current palette: an icosahedron whose vertex colors are
// driven by the 5 palette colors. Auto-rotates (unless reduced motion) and can
// be dragged to rotate by hand. All GPU resources are disposed on unmount.

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function PaletteOrb({ palette }: { palette: string[] }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const geomRef = useRef<THREE.IcosahedronGeometry | null>(null);
  const paletteRef = useRef(palette);
  paletteRef.current = palette;

  // Apply palette colors to the geometry's vertex color attribute.
  const applyColors = () => {
    const geom = geomRef.current;
    if (!geom) return;
    const colors = paletteRef.current.map(hexToRgb);
    const pos = geom.getAttribute('position');
    const count = pos.count;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Spread the 5 colors across faces using the vertex's height + index.
      const y = pos.getY(i);
      const t = Math.max(0, Math.min(1, (y / 1.4 + 1) / 2)); // clamp 0..1 (radius 1.4)
      const idx = Math.max(0, Math.min(colors.length - 1, Math.floor(t * colors.length)));
      const [r, g, b] = colors[idx] ?? [255, 255, 255];
      arr[i * 3] = r / 255;
      arr[i * 3 + 1] = g / 255;
      arr[i * 3 + 2] = b / 255;
    }
    geom.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    geom.getAttribute('color').needsUpdate = true;
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduce = prefersReducedMotion();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.cursor = 'grab';

    const geom = new THREE.IcosahedronGeometry(1.4, 0);
    geomRef.current = geom;
    applyColors();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 0.45,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geom, mat);
    scene.add(mesh);

    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geom),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 }),
    );
    mesh.add(wire);

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2, 3, 4);
    scene.add(key);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // Pointer drag to rotate.
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const vel = { x: 0, y: 0 };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.style.cursor = 'grabbing';
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      mesh.rotation.y += dx * 0.01;
      mesh.rotation.x += dy * 0.01;
      vel.x = dy * 0.01;
      vel.y = dx * 0.01;
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      renderer.domElement.style.cursor = 'grab';
      try { renderer.domElement.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointerleave', onUp);

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!dragging) {
        if (!reduce) {
          mesh.rotation.y += 0.0032;
          mesh.rotation.x += 0.0014;
        } else {
          // glide out any leftover drag momentum, then rest
          mesh.rotation.y += vel.y;
          mesh.rotation.x += vel.x;
          vel.x *= 0.92;
          vel.y *= 0.92;
        }
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointerleave', onUp);
      wire.geometry.dispose();
      (wire.material as THREE.Material).dispose();
      geom.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      geomRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live-update colors when the palette changes (locks, regenerate, swatch edits).
  useEffect(() => {
    applyColors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette.join('-')]);

  return <div ref={mountRef} className="h-full w-full" aria-hidden />;
}
