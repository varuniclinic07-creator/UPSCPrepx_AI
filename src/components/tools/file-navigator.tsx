'use client';

// File Navigator Component - wired to Supabase Storage
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface FileItem {
    name: string;
    type: 'folder' | 'file';
    path: string;
    size?: string;
}

function formatSize(bytes: number | null | undefined): string | undefined {
    if (!bytes) return undefined;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const supabase = createClient();

export function FileNavigator() {
    const [currentPath, setCurrentPath] = useState('');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFiles = async (path: string) => {
            setLoading(true);
            try {
                const { data, error } = await supabase.storage
                    .from('documents')
                    .list(path || '', { limit: 100, sortBy: { column: 'name', order: 'asc' } });

                if (error) {
                    console.error('Storage list error:', error);
                    setFiles([]);
                    return;
                }

                const items: FileItem[] = (data || []).map((item) => {
                    const isFolder = !item.metadata || item.id === null;
                    const fullPath = path ? `${path}/${item.name}` : item.name;
                    return {
                        name: item.name,
                        type: isFolder ? 'folder' : 'file',
                        path: fullPath,
                        size: isFolder ? undefined : formatSize((item.metadata as any)?.size),
                    };
                });

                setFiles(items);
            } catch (err) {
                console.error('Failed to fetch files:', err);
                setFiles([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFiles(currentPath);
    }, [currentPath]);

    const navigate = (path: string) => {
        setCurrentPath(path);
    };

    const handleDownload = async (filePath: string) => {
        const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
        if (data?.publicUrl) {
            window.open(data.publicUrl, '_blank');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg">
            <div className="p-4 border-b flex items-center gap-2">
                <button onClick={() => navigate('')} className="text-primary">🏠</button>
                <span className="text-gray-400">/</span>
                <span>{currentPath || '/'}</span>
                {currentPath && (
                    <button
                        onClick={() => {
                            const parent = currentPath.split('/').slice(0, -1).join('/');
                            navigate(parent);
                        }}
                        className="ml-auto text-sm text-gray-500 hover:text-gray-700"
                    >
                        ⬆️ Up
                    </button>
                )}
            </div>

            <div className="divide-y">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading...</div>
                ) : files.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No files found</div>
                ) : (
                    files.map((file, idx) => (
                        <div
                            key={idx}
                            onClick={() => file.type === 'folder' ? navigate(file.path) : undefined}
                            className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer"
                        >
                            <span className="text-2xl">{file.type === 'folder' ? '📁' : '📄'}</span>
                            <div className="flex-1">
                                <p className="font-semibold">{file.name}</p>
                                {file.size && <p className="text-sm text-gray-500">{file.size}</p>}
                            </div>
                            {file.type === 'file' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDownload(file.path); }}
                                    className="text-primary"
                                >
                                    ⬇️
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
