import { Globe3D } from '@/components/features/geography/Globe3D';

export default function GeographyPage() {
    return (
        <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Geography Explorer</h1>
                    <p className="text-slate-400">3D Interactive Atlas with UPSC Relevance</p>
                </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-2xl shadow-blue-900/20">
                <Globe3D />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Rivers', count: 12, color: 'bg-blue-600' },
                    { label: 'Mountains', count: 8, color: 'bg-stone-600' },
                    { label: 'States', count: 28, color: 'bg-red-600' },
                    { label: 'Ports', count: 13, color: 'bg-emerald-600' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${stat.color} flex items-center justify-center font-bold`}>
                            {stat.label[0]}
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{stat.count}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
