import Link from "next/link";

const entries = [
  { id: 1, title: "Indian Polity - Constitutional Framework", category: "Polity", documents: 24, updated: "2026-04-06" },
  { id: 2, title: "Modern Indian History", category: "History", documents: 38, updated: "2026-04-05" },
  { id: 3, title: "Physical Geography", category: "Geography", documents: 19, updated: "2026-04-04" },
  { id: 4, title: "Indian Economy - Macro Concepts", category: "Economy", documents: 31, updated: "2026-04-03" },
  { id: 5, title: "Environment & Ecology", category: "Environment", documents: 15, updated: "2026-04-01" },
];

export default function KnowledgeBasePage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/admin" className="hover:underline">Admin</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">Knowledge Base</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          Add Collection
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Documents</th>
              <th className="px-4 py-3 font-medium">Last Updated</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {entries.map((entry) => (
              <tr key={entry.id} className="text-gray-700 dark:text-gray-300">
                <td className="px-4 py-3 font-medium">{entry.title}</td>
                <td className="px-4 py-3">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full">{entry.category}</span>
                </td>
                <td className="px-4 py-3">{entry.documents}</td>
                <td className="px-4 py-3">{entry.updated}</td>
                <td className="px-4 py-3 space-x-2">
                  <button className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
