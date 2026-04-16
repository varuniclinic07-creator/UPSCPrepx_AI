'use client';

import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';

const SyllabusGraph3D = dynamic(
  () => import('@/components/features/syllabus/SyllabusGraph3D').then(m => m.SyllabusGraph3D),
  { ssr: false, loading: () => <div className="h-[600px] flex items-center justify-center text-muted-foreground">Loading 3D graph...</div> }
);

export default function SyllabusPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Syllabus Navigator</h1>
                    <p className="text-muted-foreground">Interactive 3D visualization of UPSC topics and connections</p>
                </div>
            </div>

            <Card className="border-0 shadow-2xl ring-1 ring-slate-900/10 overflow-hidden">
                <SyllabusGraph3D />
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-4">
                    <h3 className="font-bold mb-2">How to Use</h3>
                    <p className="text-sm text-muted-foreground">
                        Drag to rotate the view. Scroll to zoom in/out. Hover over nodes to see connections.
                    </p>
                </Card>
                <Card className="p-4">
                    <h3 className="font-bold mb-2">Legend</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                            <span>Core Topics</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <span>High Importance</span>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <h3 className="font-bold mb-2">Stats</h3>
                    <div className="flex justify-between text-sm">
                        <span>Total Topics</span>
                        <span className="font-mono">42+</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                        <span>Connections</span>
                        <span className="font-mono">156</span>
                    </div>
                </Card>
            </div>
        </div>
    );
}
