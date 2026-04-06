'use client';

// Reusable Data Table Component
interface Column { key: string; label: string; }
interface DataTableProps {
    columns: Column[];
    data: any[];
    onRowClick?: (row: any) => void;
}

export function DataTable({ columns, data, onRowClick }: DataTableProps) {
    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map(col => (
                            <th key={col.key} className="px-6 py-3 text-left text-sm font-semibold">{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {data.map((row, idx) => (
                        <tr
                            key={idx}
                            onClick={() => onRowClick?.(row)}
                            className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                        >
                            {columns.map(col => (
                                <td key={col.key} className="px-6 py-4">{row[col.key]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {data.length === 0 && (
                <div className="p-8 text-center text-gray-500">No data available</div>
            )}
        </div>
    );
}
