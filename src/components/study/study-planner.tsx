'use client';

// Study Planner Component
import { useState } from 'react';

interface StudyTask {
    id: string;
    subject: string;
    topic: string;
    duration: number; // minutes
    day: number; // 0-6 (Sun-Sat)
    time: string;
    completed: boolean;
}

export function StudyPlanner() {
    const [tasks, setTasks] = useState<StudyTask[]>([]);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const toggleTask = (id: string) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Weekly Study Planner</h2>

            <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => (
                    <div key={day} className="border rounded-lg p-3">
                        <h3 className="font-bold text-sm mb-2">{day}</h3>
                        <div className="space-y-2">
                            {tasks
                                .filter(task => task.day === idx)
                                .map(task => (
                                    <div
                                        key={task.id}
                                        className={`p-2 rounded text-xs ${task.completed ? 'bg-green-100 line-through' : 'bg-blue-50'
                                            }`}
                                        onClick={() => toggleTask(task.id)}
                                    >
                                        <div className="font-semibold">{task.subject}</div>
                                        <div className="text-gray-600">{task.duration}min</div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>

            <button className="mt-4 w-full bg-primary text-white py-2 rounded-lg">
                + Add Task
            </button>
        </div>
    );
}
