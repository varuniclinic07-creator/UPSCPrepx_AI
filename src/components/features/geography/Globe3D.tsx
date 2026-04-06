'use client';

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { INDIA_STATES, MAJOR_RIVERS, MapFeature } from '@/lib/maps/atlas-data';

function Marker({ feature, onHover }: { feature: MapFeature; onHover: (f: MapFeature | null) => void }) {
    // Convert lat/long to 3D position
    // Lat: -90 to 90, Long: -180 to 180
    // We assume the globe has radius 4
    const position = useMemo(() => {
        const [lat, lon] = feature.coordinates;
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const radius = 4.05; // Slightly above surface

        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = (radius * Math.sin(phi) * Math.sin(theta));
        const y = (radius * Math.cos(phi));

        return [x, y, z] as [number, number, number];
    }, [feature]);

    const [hovered, setHover] = useState(false);

    return (
        <group position={position}>
            <mesh
                onPointerOver={(e) => { e.stopPropagation(); setHover(true); onHover(feature); }}
                onPointerOut={() => { setHover(false); onHover(null); }}
            >
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshStandardMaterial
                    color={feature.type === 'river' ? '#3b82f6' : '#ef4444'}
                    emissive={feature.type === 'river' ? '#1d4ed8' : '#b91c1c'}
                    emissiveIntensity={hovered ? 2 : 0.5}
                />
            </mesh>
            {hovered && (
                <Html distanceFactor={10}>
                    <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none">
                        {feature.name}
                    </div>
                </Html>
            )}
        </group>
    );
}

function Earth() {
    return (
        <Sphere args={[4, 64, 64]}>
            <meshStandardMaterial
                color="#1e293b"
                roughness={0.7}
                metalness={0.1}
                wireframe={false}
            />
            {/* Outline overlay for cyber look */}
            <mesh>
                <sphereGeometry args={[4.01, 32, 32]} />
                <meshBasicMaterial color="#334155" wireframe transparent opacity={0.3} />
            </mesh>
        </Sphere>
    );
}

export function Globe3D() {
    const [activeFeature, setActiveFeature] = useState<MapFeature | null>(null);

    return (
        <div className="w-full h-[700px] bg-slate-950 rounded-xl overflow-hidden relative">
            <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
                <ambientLight intensity={0.4} />
                <pointLight position={[15, 15, 15]} intensity={1} />
                <pointLight position={[-10, -10, -5]} intensity={0.5} />

                <OrbitControls
                    enablePan={false}
                    minDistance={5}
                    maxDistance={20}
                    autoRotate
                    autoRotateSpeed={0.5}
                />

                <Earth />

                {[...INDIA_STATES, ...MAJOR_RIVERS].map(feature => (
                    <Marker
                        key={feature.id}
                        feature={feature}
                        onHover={setActiveFeature}
                    />
                ))}
            </Canvas>

            {activeFeature && (
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-xl w-72 text-slate-800 z-10">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-xl">{activeFeature.name}</h3>
                        <span className="text-[10px] uppercase bg-slate-200 px-2 py-1 rounded font-bold">
                            {activeFeature.type}
                        </span>
                    </div>
                    <p className="text-sm mt-2 text-slate-700">{activeFeature.description}</p>

                    <div className="mt-3 pt-3 border-t border-slate-200">
                        <h4 className="text-xs font-bold text-indigo-600 uppercase">UPSC Relevance</h4>
                        <p className="text-xs mt-1 leading-relaxed">{activeFeature.upscRelevance}</p>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                        {activeFeature.relatedTopics.map(t => (
                            <span key={t} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                                #{t}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="absolute bottom-6 right-6 text-white text-right">
                <h1 className="text-4xl font-black text-white/10 select-none">ATLAS</h1>
                <p className="text-xs text-white/40">3D Interactive Geography</p>
            </div>
        </div>
    );
}
