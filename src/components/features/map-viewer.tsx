'use client';

// Map Viewer Component
export function MapViewer() {
    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Interactive Maps</h2>
            <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">🗺️ Map integration - India geography, rivers, states</p>
            </div>
            <div className="flex gap-2 mt-4">
                <button className="px-4 py-2 bg-primary text-white rounded-lg">Rivers</button>
                <button className="px-4 py-2 bg-gray-100 rounded-lg">States</button>
                <button className="px-4 py-2 bg-gray-100 rounded-lg">Mountains</button>
                <button className="px-4 py-2 bg-gray-100 rounded-lg">Soil Types</button>
            </div>
        </div>
    );
}
