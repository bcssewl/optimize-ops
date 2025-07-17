"use client";
import { SupervisorDashboard } from "@/src/components/dashboard/SupervisorDashboard";
import { SupervisorProductivity } from "@/src/components/dashboard/SupervisorProductivity";
import { useAuth } from "@/src/context/AuthContext";
import { createClient } from "@/src/lib/supabase/client";
import {
  faBuilding,
  faBullseye,
  faChartLine,
  faCheckCircle,
  faSpinner,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

// Types for analysis data
interface AnalysisData {
  status: string;
  target_name: string;
  target_value: string;
  ahcieved_result: string;
  percentage_achieve: number | string;
}

interface Recording {
  id: number;
  user_uuid: string;
  analysis?: AnalysisData[];
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    departments: 0,
    targets: 0,
    myTargets: 0,
    recordings: 0,
  });
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([]);
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
          { count: recordingsRaw },
          { data: recordingsData },
        ] = await Promise.all([
          supabase.from("users").select("id", { count: "exact", head: true }),
          supabase
            .from("departments")
            .select("id", { count: "exact", head: true }),
          supabase.from("targets").select("id", { count: "exact", head: true }),
          supabase
            .from("recordings")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("recordings")
            .select("analysis, status")
            .eq("status", "success")
            .not("analysis", "is", null)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        const users = typeof usersRaw === "number" ? usersRaw : 0;
        const departments =
          typeof departmentsRaw === "number" ? departmentsRaw : 0;
        const targets = typeof targetsRaw === "number" ? targetsRaw : 0;
        const recordings =
          typeof recordingsRaw === "number" ? recordingsRaw : 0;

        setStats({ users, departments, targets, myTargets: 0, recordings });

        // Extract analysis data from recordings
        const allAnalysis: AnalysisData[] = [];
        recordingsData?.forEach((recording) => {
          if (recording.analysis && Array.isArray(recording.analysis)) {
            allAnalysis.push(...recording.analysis);
          }
        });
        setAnalysisData(allAnalysis);
      } else if (user.role === "supervisor" || user.role === "staff") {
        // Count targets assigned to this supervisor/staff member
        const { count: myTargetsRaw } = await supabase
          .from("targets")
          .select("id", { count: "exact", head: true })
          .eq("user_uuid", user.id);
        const myTargets = typeof myTargetsRaw === "number" ? myTargetsRaw : 0;
        setStats({
          users: 0,
          departments: 0,
          targets: 0,
          myTargets,
          recordings: 0,
        });
      }
      setStatsLoading(false);
    };
    fetchStats();
  }, [user, loading]);

  // Calculate analytics from analysis data for admin/manager
  const getAnalytics = () => {
    if (analysisData.length === 0) {
      return {
        totalAnalyzed: 0,
        exceededTargets: 0,
        inProgressTargets: 0,
        averageAchievement: 0,
      };
    }

    const exceededTargets = analysisData.filter((item) =>
      item.status.toLowerCase().includes("exceeded")
    ).length;

    const inProgressTargets = analysisData.filter(
      (item) =>
        item.status.toLowerCase().includes("progress") ||
        item.status.toLowerCase().includes("started")
    ).length;

    // Calculate average achievement percentage
    const validPercentages = analysisData
      .filter((item) => typeof item.percentage_achieve === "number")
      .map((item) => item.percentage_achieve as number);

    const averageAchievement =
      validPercentages.length > 0
        ? Math.round(
            validPercentages.reduce((a, b) => a + b, 0) /
              validPercentages.length
          )
        : 0;

    return {
      totalAnalyzed: analysisData.length,
      exceededTargets,
      inProgressTargets,
      averageAchievement,
    };
  };

  const analytics = getAnalytics();

  if (loading || statsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] w-full">
        <span className="text-gray-500">Loading dashboard...</span>
      </div>
    );
  }

  if (user?.role === "admin" || user?.role === "manager") {
    return (
      <div className="w-full mx-auto py-12 px-4 md:px-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-gray-500 text-sm mb-1">Total Users</div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{stats.users}</span>
                <span className="ml-2 bg-blue-100 text-blue-600 rounded-full p-2">
                  <FontAwesomeIcon icon={faUsers} width={24} height={24} />
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
                  <FontAwesomeIcon icon={faBuilding} width={24} height={24} />
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
                  <FontAwesomeIcon icon={faBullseye} width={24} height={24} />
                </span>
              </div>
              <div className="text-red-500 text-xs mt-1">
                ↓ 5% from last month
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-gray-500 text-sm mb-1">Voice Recordings</div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{stats.recordings}</span>
                <span className="ml-2 bg-green-100 text-green-600 rounded-full p-2">
                  <FontAwesomeIcon icon={faChartLine} width={24} height={24} />
                </span>
              </div>
              <div className="text-green-500 text-xs mt-1">
                ↑ 18% from last month
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Overview */}
        {analysisData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-blue-100 text-sm">Total Analyzed</div>
                <FontAwesomeIcon icon={faChartLine} width={20} height={20} />
              </div>
              <div className="text-3xl font-bold">
                {analytics.totalAnalyzed}
              </div>
              <div className="text-blue-100 text-xs mt-1">
                From voice recordings
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-green-100 text-sm">Exceeded Targets</div>
                <FontAwesomeIcon icon={faCheckCircle} width={20} height={20} />
              </div>
              <div className="text-3xl font-bold">
                {analytics.exceededTargets}
              </div>
              <div className="text-green-100 text-xs mt-1">
                Outstanding performance
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-orange-100 text-sm">In Progress</div>
                <FontAwesomeIcon icon={faSpinner} width={20} height={20} />
              </div>
              <div className="text-3xl font-bold">
                {analytics.inProgressTargets}
              </div>
              <div className="text-orange-100 text-xs mt-1">
                Active work items
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-purple-100 text-sm">Avg Achievement</div>
                <FontAwesomeIcon icon={faBullseye} width={20} height={20} />
              </div>
              <div className="text-3xl font-bold">
                {analytics.averageAchievement}%
              </div>
              <div className="text-purple-100 text-xs mt-1">
                Overall performance
              </div>
            </div>
          </div>
        )}

        {/* Recent Analysis Results */}
        {analysisData.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Recent Target Analysis</h2>
              <span className="text-sm text-gray-500">
                Based on latest voice recordings
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-3 px-4 font-medium">Target Name</th>
                    <th className="py-3 px-4 font-medium">Current Result</th>
                    <th className="py-3 px-4 font-medium">Target Value</th>
                    <th className="py-3 px-4 font-medium">Achievement</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.slice(0, 10).map((item, index) => {
                    const getStatusColor = (status: string) => {
                      if (status.toLowerCase().includes("exceeded")) {
                        return "bg-green-100 text-green-700";
                      } else if (
                        status.toLowerCase().includes("progress") ||
                        status.toLowerCase().includes("started")
                      ) {
                        return "bg-yellow-100 text-yellow-700";
                      } else {
                        return "bg-blue-100 text-blue-700";
                      }
                    };

                    const achievement =
                      typeof item.percentage_achieve === "number"
                        ? item.percentage_achieve
                        : 0;

                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium">
                            {item.target_name.length > 50
                              ? `${item.target_name.substring(0, 50)}...`
                              : item.target_name}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600">
                            {item.ahcieved_result.length > 40
                              ? `${item.ahcieved_result.substring(0, 40)}...`
                              : item.ahcieved_result}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600">
                            {item.target_value.length > 30
                              ? `${item.target_value.substring(0, 30)}...`
                              : item.target_value}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded overflow-hidden">
                              <div
                                className="h-2 rounded transition-all duration-300"
                                style={{
                                  width: `${Math.min(achievement, 100)}%`,
                                  backgroundColor:
                                    achievement > 100
                                      ? "#22c55e"
                                      : achievement > 50
                                      ? "#3b82f6"
                                      : "#f97316",
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold">
                              {achievement}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {item.status.length > 20
                              ? `${item.status.substring(0, 20)}...`
                              : item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <SupervisorProductivity />
      </div>
    );
  }

  if (user?.role === "staff") {
    return (
      <div className="w-full mx-auto py-12 px-4 md:px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            My Dashboard
          </h1>
          <p className="text-gray-600">
            Track your personal targets and progress
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-gray-500 text-sm mb-1">My Targets</div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{stats.myTargets}</span>
                <span className="ml-2 bg-green-100 text-green-600 rounded-full p-2">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 1v6m0 6v6M1 12h6m6 0h6"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                  </svg>
                </span>
              </div>
              <div className="text-blue-500 text-xs mt-1">
                Goals assigned to you
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-gray-500 text-sm mb-1">Quick Actions</div>
              <div className="flex flex-col gap-2 mt-4">
                <a
                  href="/upload-record"
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a5 5 0 1110 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  Record Update
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === "supervisor") {
    return (
      <div className="flex flex-col items-start justify-start py-8 px-8 min-h-[40vh] w-full">
        <SupervisorDashboard />
      </div>
    );
  }

  // Default fallback
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] w-full">
      <h1 className="text-3xl font-bold mb-2">Welcome!</h1>
      <p className="text-lg text-gray-600 text-center max-w-md">
        Please ask your admin or manager to assign you a role.
      </p>
    </div>
  );
}
