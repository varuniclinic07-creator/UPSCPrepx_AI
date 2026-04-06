'use client';

// Discussion Forum Component
export function Discussion() {
    const threads = [
        { id: '1', title: 'How to prepare for GS-1?', author: 'User123', replies: 15, views: 234 },
        { id: '2', title: 'Best books for Indian Economy', author: 'Aspirant', replies: 28, views: 567 }
    ];

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Discussion Forum</h2>
                <button className="bg-primary text-white px-4 py-2 rounded-lg">+ New Thread</button>
            </div>
            <div className="space-y-4">
                {threads.map(thread => (
                    <div key={thread.id} className="p-4 border rounded-lg hover:shadow cursor-pointer">
                        <h3 className="font-bold">{thread.title}</h3>
                        <p className="text-sm text-gray-500">by {thread.author} • {thread.replies} replies • {thread.views} views</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
