'use client';

// Statistics/Data Visualization Component
export function Statistics() {
    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Data & Statistics</h2>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">GDP Growth Rate</h3>
                    <p className="text-3xl font-bold text-blue-600">7.2%</p>
                    <p className="text-sm text-gray-600">FY 2023-24 (Estimated)</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">Literacy Rate</h3>
                    <p className="text-3xl font-bold text-green-600">77.7%</p>
                    <p className="text-sm text-gray-600">Census 2021</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">Population</h3>
                    <p className="text-3xl font-bold text-purple-600">1.44B</p>
                    <p className="text-sm text-gray-600">World's largest</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">HDI Rank</h3>
                    <p className="text-3xl font-bold text-orange-600">132</p>
                    <p className="text-sm text-gray-600">Out of 193 countries</p>
                </div>
            </div>
        </div>
    );
}
