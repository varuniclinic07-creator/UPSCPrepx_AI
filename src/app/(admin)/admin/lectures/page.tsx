import Link from "next/link";

const lectures = [
  { id: 1, title: "Indian Polity - Parliament", subject: "Polity", duration: "45 min", status: "Published", views: 342 },
  { id: 2, title: "Ancient India - Mauryan Empire", subject: "History", duration: "38 min", status: "Published", views: 218 },
  { id: 3, title: "Monetary Policy & RBI", subject: "Economy", duration: "52 min", status: "Processing", views: 0 },
  { id: 4, title: "Climate Change & India", subject: "Environment", duration: "41 min", status: "Draft", views: 0 },
];

export default function LecturesPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/admin" className="hover:underline">Admin</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">Lectures</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lecture Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          Upload Lecture
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Upload New Lecture</h2>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">Drag and drop lecture files here, or click to browse</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Supports MP4, PDF, PPTX (max 500MB)</p>
          <button className="mt-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            Browse Files
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Views</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {lectures.map((lec) => (
              <tr key={lec.id} className="text-gray-700 dark:text-gray-300">
                <td className="px-4 py-3 font-medium">{lec.title}</td>
                <td className="px-4 py-3">{lec.subject}</td>
                <td className="px-4 py-3">{lec.duration}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    lec.status === "Published" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                    lec.status === "Processing" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                    "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                  }`}>{lec.status}</span>
                </td>
                <td className="px-4 py-3">{lec.views}</td>
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
