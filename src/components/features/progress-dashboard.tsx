'use client';

// Progress Dashboard Component
export function ProgressDashboard() {
    const stats = {
        notesRead: 45,
        quizzesTaken: 23,
        lecturesWatched: 12,
        studyHours: 156,
        streak: 15
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Your Progress</h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-600">{stats.notesRead}</p>
                    <p className="text-sm text-gray-600">Notes Read</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-600">{stats.quizzesTaken}</p>
                    <p className="text-sm text-gray-600">Quizzes</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-purple-600">{stats.lecturesWatched}</p>
                    <p className="text-sm text-gray-600">Lectures</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-orange-600">{stats.studyHours}h</p>
                    <p className="text-sm text-gray-600">Study Time</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-red-600">🔥 {stats.streak}</p>
                    <p className="text-sm text-gray-600">Day Streak</p>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-3">Weekly Activity</h3>
                <div className="flex gap-2 justify-between">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                        <div key={day} className="text-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${idx < 5 ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                                {idx < 5 ? '✓' : ''}
                            </div>
                            <p className="text-xs mt-1">{day}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
