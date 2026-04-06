'use client';

// Mind Map Component
import { useState } from 'react';

interface Node {
    id: string;
    text: string;
    x: number;
    y: number;
    children: string[];
}

export function MindMap() {
    const [nodes, setNodes] = useState<Node[]>([
        { id: 'root', text: 'Indian Constitution', x: 400, y: 200, children: ['1', '2', '3'] },
        { id: '1', text: 'Preamble', x: 200, y: 100, children: [] },
        { id: '2', text: 'Fundamental Rights', x: 600, y: 100, children: [] },
        { id: '3', text: 'DPSP', x: 400, y: 350, children: [] }
    ]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Mind Map</h2>
            <div className="relative h-96 bg-gray-50 rounded-lg overflow-hidden">
                <svg className="absolute inset-0 w-full h-full">
                    {nodes.map(node =>
                        node.children.map(childId => {
                            const child = nodes.find(n => n.id === childId);
                            if (!child) return null;
                            return <line key={`${node.id}-${childId}`} x1={node.x} y1={node.y} x2={child.x} y2={child.y} stroke="#3B82F6" strokeWidth="2" />;
                        })
                    )}
                </svg>
                {nodes.map(node => (
                    <div
                        key={node.id}
                        className="absolute bg-primary text-white px-4 py-2 rounded-lg cursor-move"
                        style={{ left: node.x - 50, top: node.y - 15 }}
                    >
                        {node.text}
                    </div>
                ))}
            </div>
            <button className="mt-4 bg-primary text-white px-4 py-2 rounded-lg">+ Add Node</button>
        </div>
    );
}
