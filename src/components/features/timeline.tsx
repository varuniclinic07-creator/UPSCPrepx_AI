'use client';

// Timeline Component
export function Timeline() {
    const events = [
        { year: '1857', title: 'First War of Independence', desc: 'Sepoy Mutiny against British rule' },
        { year: '1885', title: 'Formation of INC', desc: 'Indian National Congress founded in Bombay' },
        { year: '1947', title: 'Independence', desc: 'India gains independence from British rule' },
        { year: '1950', title: 'Republic Day', desc: 'Constitution of India comes into effect' }
    ];

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Historical Timeline</h2>
            <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary" />
                {events.map((event, idx) => (
                    <div key={idx} className="relative pl-12 pb-8">
                        <div className="absolute left-2 w-5 h-5 bg-primary rounded-full" />
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <span className="text-primary font-bold">{event.year}</span>
                            <h3 className="font-bold mt-1">{event.title}</h3>
                            <p className="text-sm text-gray-600">{event.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
