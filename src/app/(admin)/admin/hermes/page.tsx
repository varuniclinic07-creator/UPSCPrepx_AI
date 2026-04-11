import Link from "next/link";

const pipelines = [
  { name: "Daily CA Ingestion", status: "Running", lastRun: "2026-04-08 06:00", nextRun: "2026-04-09 06:00", successRate: "98.5%" },
  { name: "Content Embedding", status: "Idle", lastRun: "2026-04-08 03:00", nextRun: "2026-04-08 15:00", successRate: "99.1%" },
  { name: "PYQ Analysis", status: "Idle", lastRun: "2026-04-07 22:00", nextRun: "2026-04-08 22:00", successRate: "97.8%" },
  { name: "User Analytics Aggregation", status: "Failed", lastRun: "2026-04-08 04:00", nextRun: "2026-04-08 16:00", successRate: "94.2%" },
];

const stats = [
  { label: "Active Pipelines", value: "12" },
  { label: "Jobs Today", value: "47" },
  { label: "Success Rate", value: "97.3%" },
  { label: "Failed (24h)", value: "3" },
];

export default function HermesPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/admin" className="hover:underline">Admin</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">Hermes Pipeline</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Hermes Pipeline Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        <Link href="/admin/hermes/jobs" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          View All Jobs
        </Link>
        <Link href="/admin/hermes/logs" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          View Logs
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3 font-medium">Pipeline</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last Run</th>
              <th className="px-4 py-3 font-medium">Next Run</th>
              <th className="px-4 py-3 font-medium">Success Rate</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {pipelines.map((p) => (
              <tr key={p.name} className="text-gray-700 dark:text-gray-300">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.status === "Running" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                    p.status === "Failed" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" :
                    "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
                  }`}>{p.status}</span>
                </td>
                <td className="px-4 py-3">{p.lastRun}</td>
                <td className="px-4 py-3">{p.nextRun}</td>
                <td className="px-4 py-3">{p.successRate}</td>
                <td className="px-4 py-3">
                  <button className="text-blue-600 hover:underline text-xs">Trigger</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
