import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Html, OrbitControls, useGLTF } from '@react-three/drei';
import { useLang } from '../context/LanguageContext';
import { mediaUrl } from '../lib/api';

/** Schematic archetypes – clearly labelled as interpretations, never as authentic scans. */
function Schematic({ archetype }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.15;
  });

  const mesh = useMemo(() => {
    switch (archetype) {
      case 'mosque':
        return (
          <group>
            <mesh position={[0, 0.55, 0]} castShadow>
              <boxGeometry args={[1.6, 1.1, 1.6]} />
              <meshStandardMaterial color="#d8c7a4" roughness={0.85} />
            </mesh>
            <mesh position={[0, 1.35, 0]} castShadow>
              <sphereGeometry args={[0.85, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#c4b089" metalness={0.15} roughness={0.55} />
            </mesh>
            <mesh position={[0.95, 1.1, 0.95]} castShadow>
              <cylinderGeometry args={[0.12, 0.16, 2.2, 16]} />
              <meshStandardMaterial color="#b8a682" />
            </mesh>
            <mesh position={[0.95, 2.25, 0.95]}>
              <coneGeometry args={[0.18, 0.35, 16]} />
              <meshStandardMaterial color="#8a6b1f" />
            </mesh>
          </group>
        );
      case 'church':
      case 'cathedral':
        return (
          <group>
            <mesh position={[0, 0.7, 0]} castShadow>
              <boxGeometry args={[1.8, 1.4, 1.1]} />
              <meshStandardMaterial color="#c9b8a0" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.7, 0]} castShadow>
              <coneGeometry args={[0.7, 0.9, 4]} />
              <meshStandardMaterial color="#9a8a72" />
            </mesh>
            <mesh position={[-0.55, 1.5, -0.05]} castShadow>
              <boxGeometry args={[0.35, 1.6, 0.35]} />
              <meshStandardMaterial color="#b7a68c" />
            </mesh>
          </group>
        );
      case 'fortress':
        return (
          <group>
            <mesh position={[0, 0.35, 0]} castShadow>
              <boxGeometry args={[2.4, 0.7, 1.8]} />
              <meshStandardMaterial color="#8f8170" roughness={1} />
            </mesh>
            {[[-1, 0.9, -0.7], [1, 0.9, -0.7], [-1, 0.9, 0.7], [1, 0.9, 0.7]].map((p, i) => (
              <mesh key={i} position={p} castShadow>
                <cylinderGeometry args={[0.28, 0.32, 1.1, 8]} />
                <meshStandardMaterial color="#7d6f5e" />
              </mesh>
            ))}
          </group>
        );
      case 'bridge':
        return (
          <group>
            <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <torusGeometry args={[0.9, 0.18, 12, 32, Math.PI]} />
              <meshStandardMaterial color="#8a7b68" />
            </mesh>
            <mesh position={[0, 0.95, 0]} castShadow>
              <boxGeometry args={[2.4, 0.12, 0.7]} />
              <meshStandardMaterial color="#9a8b76" />
            </mesh>
          </group>
        );
      case 'hamam':
        return (
          <group>
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[2, 0.8, 1.4]} />
              <meshStandardMaterial color="#cfc0a4" />
            </mesh>
            <mesh position={[-0.45, 1.0, 0]} castShadow>
              <sphereGeometry args={[0.45, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#b8a888" metalness={0.2} />
            </mesh>
            <mesh position={[0.5, 0.95, 0]} castShadow>
              <sphereGeometry args={[0.35, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#b8a888" metalness={0.2} />
            </mesh>
          </group>
        );
      case 'tekke':
        return (
          <group>
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[1.8, 0.9, 1.5]} />
              <meshStandardMaterial color="#d2c2a5" />
            </mesh>
            <mesh position={[0, 1.15, 0]} castShadow>
              <cylinderGeometry args={[0.7, 0.7, 0.35, 8]} />
              <meshStandardMaterial color="#b89e6e" />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
              <coneGeometry args={[0.75, 0.55, 8]} />
              <meshStandardMaterial color="#8a6b1f" />
            </mesh>
          </group>
        );
      case 'museum':
      case 'complex':
      default:
        return (
          <group>
            <mesh position={[0, 0.55, 0]} castShadow>
              <boxGeometry args={[2.1, 1.1, 1.3]} />
              <meshStandardMaterial color="#efe2c8" />
            </mesh>
            <mesh position={[0, 1.2, 0]} castShadow>
              <boxGeometry args={[2.2, 0.15, 1.4]} />
              <meshStandardMaterial color="#6b4f2e" />
            </mesh>
            <mesh position={[0, 0.55, 0.72]}>
              <boxGeometry args={[0.9, 0.7, 0.08]} />
              <meshStandardMaterial color="#3a3026" />
            </mesh>
          </group>
        );
    }
  }, [archetype]);

  return <group ref={ref}>{mesh}</group>;
}

function UploadedModel({ url }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={clone} />;
}

export default function ModelViewer({ model, archetype, className = '' }) {
  const { t } = useLang();
  const authentic = model?.isAuthentic;
  const url = model ? mediaUrl(model.url) : null;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-ink/10 bg-gradient-to-b from-[#2a231c] to-[#1a1510] ${className}`}>
      <div className="absolute left-3 top-3 z-10 max-w-[85%]">
        <span className={`badge ${authentic ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100' : 'border-amber-300/40 bg-amber-400/15 text-amber-100'}`}>
          {authentic ? t('monuments.authentic') : t('monuments.schematic')}
        </span>
        {model && (
          <p className="mt-2 text-[11px] text-sand/70">
            {model.title}
            {model.sourceName ? ` · ${model.sourceName}` : ''}
            {model.license ? ` · ${model.license}` : ''}
          </p>
        )}
      </div>
      <div className="h-[360px] w-full sm:h-[420px]">
        <Canvas shadows camera={{ position: [3.2, 2.2, 3.6], fov: 42 }} dpr={[1, 1.75]}>
          <color attach="background" args={['#1a1510']} />
          <ambientLight intensity={0.55} />
          <directionalLight castShadow position={[4, 6, 3]} intensity={1.1} />
          <Suspense fallback={<Html center className="text-xs text-sand/70">{t('common.loading')}</Html>}>
            {url ? <UploadedModel url={url} /> : <Schematic archetype={archetype || 'complex'} />}
            <ContactShadows opacity={0.45} scale={10} blur={2.2} far={4} />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls enablePan={false} minDistance={2} maxDistance={9} maxPolarAngle={Math.PI / 2.05} />
        </Canvas>
      </div>
      {!authentic && (
        <p className="border-t border-white/10 px-4 py-3 text-xs leading-relaxed text-sand/65">
          {t('monuments.schematicBody')}
        </p>
      )}
    </div>
  );
}
