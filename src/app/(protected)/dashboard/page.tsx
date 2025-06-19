"use client";
import { SupervisorProductivity } from "@/src/components/dashboard/SupervisorProductivity";
import { useAuth } from "@/src/context/AuthContext";
import { createClient } from "@/src/lib/supabase/client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    departments: 0,
    targets: 0,
    myTargets: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!user || loading) return;
    const supabase = createClient();
    const fetchStats = async () => {
      setStatsLoading(true);
      if (user.role === "admin" || user.role === "manager") {
        const [
          { count: usersRaw },
          { count: departmentsRaw },
          { count: targetsRaw },
        ] = await Promise.all([
          supabase.from("users").select("id", { count: "exact", head: true }),
          supabase
            .from("departments")
            .select("id", { count: "exact", head: true }),
          supabase.from("targets").select("id", { count: "exact", head: true }),
        ]);
        const users = typeof usersRaw === "number" ? usersRaw : 0;
        const departments =
          typeof departmentsRaw === "number" ? departmentsRaw : 0;
        const targets = typeof targetsRaw === "number" ? targetsRaw : 0;
        setStats({ users, departments, targets, myTargets: 0 });
      } else if (user.role === "supervisor") {
        // Count targets assigned to this supervisor
        const { count: myTargetsRaw } = await supabase
          .from("targets")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        const myTargets = typeof myTargetsRaw === "number" ? myTargetsRaw : 0;
        setStats({ users: 0, departments: 0, targets: 0, myTargets });
      }
      setStatsLoading(false);
    };
    fetchStats();
  }, [user, loading]);

  if (loading || statsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <span className="text-gray-500">Loading dashboard...</span>
      </div>
    );
  }

  if (user?.role === "admin" || user?.role === "manager") {
    return (
      <div className="w-full mx-auto py-12 px-4 md:px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-gray-500 text-sm mb-1">Total Users</div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{stats.users}</span>
                <span className="ml-2 bg-blue-100 text-blue-600 rounded-full p-2">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="7"
                      r="4"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
              <div className="text-green-500 text-xs mt-1">
                ↑ 12% from last month
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-gray-500 text-sm mb-1">Departments</div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{stats.departments}</span>
                <span className="ml-2 bg-purple-100 text-purple-600 rounded-full p-2">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <rect
                      x="3"
                      y="7"
                      width="18"
                      height="13"
                      rx="2"
                      stroke="#a21caf"
                      strokeWidth="2"
                    />
                    <path
                      d="M16 3v4M8 3v4"
                      stroke="#a21caf"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </div>
              <div className="text-green-500 text-xs mt-1">
                ↑ 3% from last month
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-gray-500 text-sm mb-1">Targets Created</div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{stats.targets}</span>
                <span className="ml-2 bg-orange-100 text-orange-600 rounded-full p-2">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="#f59e42"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 8v4l3 3"
                      stroke="#f59e42"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </div>
              <div className="text-red-500 text-xs mt-1">
                ↓ 5% from last month
              </div>
            </div>
          </div>
        </div>
        <SupervisorProductivity />
      </div>
    );
  }

  if (user?.role === "staff") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <h1 className="text-3xl font-bold mb-2">Welcome!</h1>
        <p className="text-lg text-gray-600 text-center max-w-md">
          Please ask your admin or manager to assign you a role.
        </p>
      </div>
    );
  }

  if (user?.role === "supervisor") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-bold">{stats.myTargets}</span>
          <span className="text-gray-600">Targets assigned to you</span>
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh]">
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      <p className="text-lg text-gray-600">Welcome to your dashboard! 🚀</p>
    </div>
  );
}
