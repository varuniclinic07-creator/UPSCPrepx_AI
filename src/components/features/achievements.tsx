'use client';

// Achievements Component
export function Achievements() {
    const achievements = [
        { id: '1', name: 'First Steps', desc: 'Complete your first lesson', icon: '🎯', unlocked: true },
        { id: '2', name: 'Quiz Master', desc: 'Score 100% on 5 quizzes', icon: '🏆', unlocked: true },
        { id: '3', name: 'Streak Champion', desc: 'Maintain a 30-day streak', icon: '🔥', unlocked: false },
        { id: '4', name: 'Note Taker', desc: 'Create 50 personal notes', icon: '📝', unlocked: false },
        { id: '5', name: 'Video Scholar', desc: 'Watch 20 lectures', icon: '🎓', unlocked: false },
        { id: '6', name: 'UPSC Ready', desc: 'Complete all syllabus topics', icon: '⭐', unlocked: false }
    ];

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Achievements</h2>
                <span className="text-primary font-bold">{unlockedCount}/{achievements.length} Unlocked</span>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                {achievements.map(badge => (
                    <div key={badge.id} className={`p-4 rounded-lg text-center ${badge.unlocked ? 'bg-yellow-50' : 'bg-gray-100 opacity-50'}`}>
                        <div className="text-4xl mb-2">{badge.icon}</div>
                        <h3 className="font-bold">{badge.name}</h3>
                        <p className="text-sm text-gray-600">{badge.desc}</p>
                        {badge.unlocked && <span className="text-xs text-green-600">✓ Unlocked</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}
