import Link from "next/link";

const contentItems = [
  { id: 1, title: "Daily CA - April 7, 2026", type: "Current Affairs", status: "Published", author: "System" },
  { id: 2, title: "Prelims PYQ Analysis 2025", type: "Analysis", status: "Draft", author: "Admin" },
  { id: 3, title: "Essay Writing Framework", type: "Guide", status: "Published", author: "Admin" },
  { id: 4, title: "CSAT Logical Reasoning Pack", type: "Practice Set", status: "Review", author: "Admin" },
];

const stats = [
  { label: "Total Content", value: "1,247" },
  { label: "Published", value: "1,102" },
  { label: "Drafts", value: "89" },
  { label: "In Review", value: "56" },
];

export default function ContentPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/admin" className="hover:underline">Admin</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">Content</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          Create Content
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {contentItems.map((item) => (
              <tr key={item.id} className="text-gray-700 dark:text-gray-300">
                <td className="px-4 py-3 font-medium">{item.title}</td>
                <td className="px-4 py-3">{item.type}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === "Published" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                    item.status === "Draft" ? "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300" :
                    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                  }`}>{item.status}</span>
                </td>
                <td className="px-4 py-3">{item.author}</td>
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
