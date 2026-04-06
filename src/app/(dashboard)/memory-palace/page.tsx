'use client';

import { useState } from 'react';
import { Brain, Plus } from 'lucide-react';

export default function MemoryPalacePage() {
    const [palaces, setPalaces] = useState<any[]>([]);

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-4xl font-bold">Memory <span className="text-gradient">Palace</span></h1>
                <p className="text-muted-foreground">VR memory technique for better retention</p>
            </header>

            <div className="bento-card p-6 text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-bold mb-2">Create Your First Palace</h3>
                <p className="text-muted-foreground mb-4">
                    Memory Palace uses the Method of Loci - place information in virtual rooms
                </p>
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl">
                    <Plus className="w-5 h-5 inline mr-2" />
                    Create Palace
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                {palaces.map((palace, i) => (
                    <div key={i} className="bento-card p-6">
                        <h3 className="font-bold">{palace.name}</h3>
                        <p className="text-sm text-muted-foreground">{palace.memoryPoints} items</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
