"use client";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
        Welcome to your dashboard! Here you can manage your account, view
        analytics, and access all your features.
      </p>
      {/* Add dashboard widgets or content here */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Quick Stats</h2>
          <p className="text-gray-600 dark:text-gray-400">
            No data yet. Connect your app to see stats.
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
          <p className="text-gray-600 dark:text-gray-400">
            No recent activity.
          </p>
        </div>
      </div>
    </div>
  );
}
