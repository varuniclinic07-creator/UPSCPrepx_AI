'use client';

// File Navigator Component
import { useState } from 'react';

interface FileItem {
    name: string;
    type: 'folder' | 'file';
    path: string;
    size?: string;
}

export function FileNavigator() {
    const [currentPath, setCurrentPath] = useState('/');
    const [files, setFiles] = useState<FileItem[]>([
        { name: 'Notes', type: 'folder', path: '/notes' },
        { name: 'Newspapers', type: 'folder', path: '/newspapers' },
        { name: 'Lectures', type: 'folder', path: '/lectures' },
        { name: 'Introduction.pdf', type: 'file', path: '/Introduction.pdf', size: '2.4 MB' }
    ]);

    const navigate = (path: string) => {
        setCurrentPath(path);
        // TODO: Fetch files from API
    };

    return (
        <div className="bg-white rounded-lg shadow-lg">
            <div className="p-4 border-b flex items-center gap-2">
                <button onClick={() => navigate('/')} className="text-primary">🏠</button>
                <span className="text-gray-400">/</span>
                <span>{currentPath}</span>
            </div>

            <div className="divide-y">
                {files.map((file, idx) => (
                    <div
                        key={idx}
                        onClick={() => file.type === 'folder' && navigate(file.path)}
                        className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer"
                    >
                        <span className="text-2xl">{file.type === 'folder' ? '📁' : '📄'}</span>
                        <div className="flex-1">
                            <p className="font-semibold">{file.name}</p>
                            {file.size && <p className="text-sm text-gray-500">{file.size}</p>}
                        </div>
                        {file.type === 'file' && <button className="text-primary">⬇️</button>}
                    </div>
                ))}
            </div>
        </div>
    );
}
