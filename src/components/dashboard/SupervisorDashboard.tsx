import { useAuth } from "@/src/context/AuthContext";

const targetsOverview = [
  {
    label: "Sales Target",
    value: "$125K",
    color: "bg-blue-600",
    icon: <span className="text-white">$</span>,
  },
  {
    label: "Customer Satisfaction",
    value: "95%",
    color: "bg-green-600",
    icon: <span className="text-white">❤</span>,
  },
  {
    label: "Team Productivity",
    value: "88%",
    color: "bg-orange-500",
    icon: <span className="text-white">👥</span>,
  },
  {
    label: "Quality Score",
    value: "92%",
    color: "bg-purple-600",
    icon: <span className="text-white">★</span>,
  },
];

const targets = [
  {
    name: "Monthly Sales",
    icon: <span className="text-blue-600">$</span>,
    current: "$98,500",
    target: "$125,000",
    progress: 78.8,
    color: "bg-blue-600",
    status: "In Progress",
    statusColor: "bg-yellow-100 text-yellow-700",
  },
  {
    name: "Customer Satisfaction",
    icon: <span className="text-green-600">❤</span>,
    current: "95.2%",
    target: "95.0%",
    progress: 100.2,
    color: "bg-green-600",
    status: "Achieved",
    statusColor: "bg-green-100 text-green-700",
  },
  {
    name: "Team Productivity",
    icon: <span className="text-orange-500">👥</span>,
    current: "88.3%",
    target: "90.0%",
    progress: 98.1,
    color: "bg-orange-500",
    status: "In Progress",
    statusColor: "bg-yellow-100 text-yellow-700",
  },
  {
    name: "Quality Score",
    icon: <span className="text-purple-600">★</span>,
    current: "92.1%",
    target: "95.0%",
    progress: 97.0,
    color: "bg-purple-600",
    status: "In Progress",
    statusColor: "bg-yellow-100 text-yellow-700",
  },
];

export function SupervisorDashboard() {
  const { user, loading } = useAuth();

  return (
    <div className="space-y-6 w-full">
      {/* Profile Info */}
      <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
        <div className="font-semibold text-lg mb-2">Profile Information</div>
        {loading ? (
          <div>Loading...</div>
        ) : !user ? (
          <div>Not signed in</div>
        ) : (
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2 min-w-[220px]">
              <span className="bg-blue-100 p-2 rounded-full">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path d="M4 4h16v16H4V4z" fill="#e0e7ff" />
                  <path d="M4 4h16v16H4V4z" stroke="#3b82f6" strokeWidth="2" />
                  <path d="M4 8h16" stroke="#3b82f6" strokeWidth="2" />
                </svg>
              </span>
              <span className="text-gray-700">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 bg-green-50 rounded-lg px-4 py-2 min-w-[180px]">
              <span className="bg-green-100 p-2 rounded-full">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="#bbf7d0" />
                  <path d="M12 7v5l3 3" stroke="#22c55e" strokeWidth="2" />
                </svg>
              </span>
              <span className="text-gray-700">
                Role <span className="font-bold">{user.role ?? "-"}</span>
              </span>
            </div>
            {/* You can keep department static or remove if not in user */}
          </div>
        )}
      </div>
      {/* Targets Overview */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-lg">Targets Overview</div>
          <div className="text-blue-600 bg-blue-50 rounded-full px-3 py-1 text-sm font-medium">
            Total: 8 Targets
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {targetsOverview.map((t) => (
            <div
              key={t.label}
              className={`rounded-lg flex items-center gap-4 p-4 ${t.color} text-white`}
            >
              <div className="text-2xl">{t.icon}</div>
              <div>
                <div className="font-bold text-lg">{t.value}</div>
                <div className="text-sm opacity-90">{t.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* All Targets Table */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-lg">All Targets</div>
          <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded px-3 py-1 text-sm font-medium">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#64748b" strokeWidth="2" />
              <path
                d="M8 12h8"
                stroke="#64748b"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left">
                <th className="py-2 px-2 font-medium">Target Name</th>
                <th className="py-2 px-2 font-medium">Current Value</th>
                <th className="py-2 px-2 font-medium">Target Value</th>
                <th className="py-2 px-2 font-medium">Progress</th>
                <th className="py-2 px-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t.name} className="border-t border-gray-100">
                  <td className="py-2 px-2 flex items-center gap-2 font-medium">
                    {t.icon}
                    {t.name}
                  </td>
                  <td className="py-2 px-2">{t.current}</td>
                  <td className="py-2 px-2">{t.target}</td>
                  <td className="py-2 px-2 w-48">
                    <div className="w-full h-2 bg-gray-200 rounded">
                      <div
                        className="h-2 rounded"
                        style={{ width: `${t.progress}%`, background: t.color }}
                      />
                    </div>
                    <span
                      className="ml-2 font-semibold"
                      style={{ color: t.color }}
                    >
                      {t.progress}%
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${t.statusColor}`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-lg flex items-center justify-center gap-2">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 5v14M5 12h14"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Upload Record
        </button>
        <button className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 rounded-lg text-lg flex items-center justify-center gap-2">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <rect
              x="4"
              y="4"
              width="16"
              height="16"
              rx="2"
              stroke="#fff"
              strokeWidth="2"
            />
            <path d="M8 8h8v8H8V8z" stroke="#fff" strokeWidth="2" />
          </svg>
          View Reports
        </button>
        <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg text-lg flex items-center justify-center gap-2">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" />
            <path
              d="M12 8v4l3 3"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Settings
        </button>
      </div>
    </div>
  );
}
