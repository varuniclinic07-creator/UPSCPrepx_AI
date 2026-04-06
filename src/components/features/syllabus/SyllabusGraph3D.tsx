'use client';

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SYLLABUS_GRAPH, SyllabusNode, getConnectedNodes } from '@/lib/syllabus/graph-data';

function Node({ node, position, onHover }: { node: SyllabusNode; position: [number, number, number]; onHover: (n: SyllabusNode | null) => void }) {
    const mesh = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.x += 0.01;
            mesh.current.scale.setScalar(hovered ? 1.5 : 1);
        }
    });

    return (
        <group position={position}>
            <mesh
                ref={mesh}
                onPointerOver={(e) => { e.stopPropagation(); setHover(true); onHover(node); }}
                onPointerOut={() => { setHover(false); onHover(null); }}
            >
                <sphereGeometry args={[node.importance / 15, 32, 32]} />
                <meshStandardMaterial color={hovered ? '#fbbf24' : '#60a5fa'} />
            </mesh>
            <Text
                position={[0, node.importance / 15 + 0.2, 0]}
                fontSize={0.2}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                {node.label}
            </Text>
        </group>
    );
}

function Connections({ nodes, nodePositions }: { nodes: SyllabusNode[], nodePositions: Map<string, [number, number, number]> }) {
    const lines = useMemo(() => {
        const l: JSX.Element[] = [];
        nodes.forEach(node => {
            const start = nodePositions.get(node.id);
            if (!start) return;

            node.connections.forEach(targetId => {
                const end = nodePositions.get(targetId);
                if (end) {
                    l.push(
                        <line key={`${node.id}-${targetId}`}>
                            <bufferGeometry>
                                <float32BufferAttribute
                                    attach="attributes-position"
                                    args={[new Float32Array([...start, ...end]), 3]}
                                    count={2}
                                />
                            </bufferGeometry>
                            <lineBasicMaterial color="#ffffff" opacity={0.2} transparent />
                        </line>
                    );
                }
            });
        });
        return l;
    }, [nodes, nodePositions]);

    return <group>{lines}</group>;
}

export function SyllabusGraph3D() {
    const [activeNode, setActiveNode] = useState<SyllabusNode | null>(null);

    // Calculate positions (simple spherical layout)
    const nodePositions = useMemo(() => {
        const positions = new Map<string, [number, number, number]>();
        const phi = Math.PI * (3 - Math.sqrt(5));

        SYLLABUS_GRAPH.forEach((node, i) => {
            const y = 1 - (i / (SYLLABUS_GRAPH.length - 1)) * 2;
            const radius = Math.sqrt(1 - y * y);
            const theta = phi * i;

            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;

            positions.set(node.id, [x * 5, y * 5, z * 5]);
        });
        return positions;
    }, []);

    return (
        <div className="w-full h-[600px] bg-slate-900 rounded-xl overflow-hidden relative">
            <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <OrbitControls autoRotate autoRotateSpeed={0.5} />

                {SYLLABUS_GRAPH.map(node => (
                    <Node
                        key={node.id}
                        node={node}
                        position={nodePositions.get(node.id) || [0, 0, 0]}
                        onHover={setActiveNode}
                    />
                ))}

                <Connections nodes={SYLLABUS_GRAPH} nodePositions={nodePositions} />
            </Canvas>

            {activeNode && (
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-xl w-64 text-slate-800">
                    <h3 className="font-bold text-lg">{activeNode.label}</h3>
                    <p className="text-sm text-slate-600">{activeNode.subject}</p>
                    <div className="mt-2 text-xs">
                        <strong>Relates to:</strong>
                        <ul className="list-disc list-inside">
                            {getConnectedNodes(activeNode.id).map(n => (
                                <li key={n.id}>{n.label}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 text-white/50 text-sm">
                Left Click + Drag to Rotate • Scroll to Zoom
            </div>
        </div>
    );
}
