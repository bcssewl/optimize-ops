"use client";
import { SupervisorDashboard } from "@/src/components/dashboard/SupervisorDashboard";
import { SupervisorProductivity } from "@/src/components/dashboard/SupervisorProductivity";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
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

type DateFilter =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "alltime";

// Helper function to get date range based on filter
const getDateRange = (filter: DateFilter) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  switch (filter) {
    case "today":
      return {
        start: today.toISOString().split("T")[0],
        end: today.toISOString().split("T")[0],
      };
    case "yesterday":
      return {
        start: yesterday.toISOString().split("T")[0],
        end: yesterday.toISOString().split("T")[0],
      };
    case "last7days":
      const last7Days = new Date(today);
      last7Days.setDate(last7Days.getDate() - 7);
      return {
        start: last7Days.toISOString().split("T")[0],
        end: today.toISOString().split("T")[0],
      };
    case "last30days":
      const last30Days = new Date(today);
      last30Days.setDate(last30Days.getDate() - 30);
      return {
        start: last30Days.toISOString().split("T")[0],
        end: today.toISOString().split("T")[0],
      };
    case "alltime":
    default:
      return null; // No date filter
  }
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateFilter>("alltime");
  const [stats, setStats] = useState({
    users: 0,
    departments: 0,
    targets: 0,
    myTargets: 0,
    recordings: 0,
  });
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!user || loading) return;
    const supabase = createClient();
    const fetchStats = async () => {
      setStatsLoading(true);
      const dateRange = getDateRange(dateFilter);

      if (user.role === "admin" || user.role === "manager") {
        // Build queries with date filtering
        let recordingsQuery = supabase
          .from("recordings")
          .select("id, analysis, status, created_at, user_uuid")
          .eq("status", "success")
          .not("analysis", "is", null)
          .order("created_at", { ascending: false });

        let recordingsCountQuery = supabase
          .from("recordings")
          .select("id", { count: "exact", head: true });

        let targetsCountQuery = supabase
          .from("targets")
          .select("id", { count: "exact", head: true });

        // Apply date filtering if specified
        if (dateRange) {
          recordingsQuery = recordingsQuery
            .gte("created_at", `${dateRange.start}T00:00:00`)
            .lte("created_at", `${dateRange.end}T23:59:59`)
            .limit(20);

          recordingsCountQuery = recordingsCountQuery
            .gte("created_at", `${dateRange.start}T00:00:00`)
            .lte("created_at", `${dateRange.end}T23:59:59`);

          targetsCountQuery = targetsCountQuery
            .gte("date", dateRange.start)
            .lte("date", dateRange.end);
        } else {
          recordingsQuery = recordingsQuery.limit(20);
        }

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
          targetsCountQuery,
          recordingsCountQuery,
          recordingsQuery,
        ]);

        const users = typeof usersRaw === "number" ? usersRaw : 0;
        const departments =
          typeof departmentsRaw === "number" ? departmentsRaw : 0;
        const targets = typeof targetsRaw === "number" ? targetsRaw : 0;
        const recordings =
          typeof recordingsRaw === "number" ? recordingsRaw : 0;

        setStats({ users, departments, targets, myTargets: 0, recordings });

        // Store the recordings data for organized display
        setRecordings(recordingsData || []);

        // Extract analysis data from recordings
        const allAnalysis: AnalysisData[] = [];
        recordingsData?.forEach((recording) => {
          if (recording.analysis && Array.isArray(recording.analysis)) {
            allAnalysis.push(...recording.analysis);
          }
        });
        setAnalysisData(allAnalysis);
      } else if (user.role === "supervisor" || user.role === "staff") {
        // Count targets assigned to this supervisor/staff member with date filtering
        let myTargetsQuery = supabase
          .from("targets")
          .select("id", { count: "exact", head: true })
          .eq("user_uuid", user.id);

        if (dateRange) {
          myTargetsQuery = myTargetsQuery
            .gte("date", dateRange.start)
            .lte("date", dateRange.end);
        }

        const { count: myTargetsRaw } = await myTargetsQuery;
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
  }, [user, loading, dateFilter]); // Added dateFilter as dependency

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
      (item.status || "").toLowerCase().includes("exceeded")
    ).length;

    const inProgressTargets = analysisData.filter(
      (item) =>
        (item.status || "").toLowerCase().includes("progress") ||
        (item.status || "").toLowerCase().includes("started")
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
        {/* Date Filter Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Overview of system analytics and performance
            </p>
          </div>
          <Select
            value={dateFilter}
            onValueChange={(value: DateFilter) => setDateFilter(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="alltime">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
            </div>
          </div>
        </div>

        {/* Analysis Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-blue-100 text-sm">Total Analyzed</div>
              <FontAwesomeIcon icon={faChartLine} width={20} height={20} />
            </div>
            <div className="text-3xl font-bold">{analytics.totalAnalyzed}</div>
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
        <SupervisorProductivity />

        {/* Recent Analysis Results */}
        <div className="bg-white rounded-xl shadow p-6 my-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Target Analysis</h2>
            <span className="text-sm text-gray-500">
              Based on latest voice recordings
            </span>
          </div>
          {recordings.length > 0 ? (
            <div className="space-y-6">
              {recordings.slice(0, 10).map((recording, recordingIndex) => {
                const analysisArray = recording.analysis as AnalysisData[];
                const recordingDate = new Date(
                  recording.created_at
                ).toLocaleDateString();
                const recordingTime = new Date(
                  recording.created_at
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={recording.id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    {/* Recording Header */}
                    <div
                      className="flex items-center justify-between mb-3 cursor-pointer"
                      title={`Recording ID: ${recording.id} | Date: ${recordingDate} ${recordingTime}`}
                    >
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faSpinner}
                          width={16}
                          height={16}
                          className="text-blue-600"
                        />
                        <span className="font-medium text-gray-800">
                          Recording {recordingIndex + 1}
                        </span>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                          {recordingDate} {recordingTime}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {analysisArray.length} target
                        {analysisArray.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Targets Table for this Recording */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm table-fixed">
                        <thead>
                          <tr className="text-left text-gray-500 border-b">
                            <th className="py-3 px-4 font-medium w-1/4">
                              Target Name
                            </th>
                            <th className="py-3 px-4 font-medium w-1/4">
                              Target Value
                            </th>
                            <th className="py-3 px-4 font-medium w-1/4">
                              Achievement
                            </th>
                            <th className="py-3 px-4 font-medium w-1/4">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysisArray.map((item, targetIndex) => {
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
                                key={targetIndex}
                                className="border-b border-gray-100 hover:bg-gray-50 bg-white"
                              >
                                <td className="py-3 px-4 border-l-4 border-blue-200 w-1/4">
                                  <div
                                    className="font-medium break-words"
                                    title={item.target_name || "N/A"}
                                  >
                                    {item.target_name || "N/A"}
                                  </div>
                                </td>
                                <td className="py-3 px-4 w-1/4">
                                  <div
                                    className="text-gray-600 break-words"
                                    title={item.target_value || "N/A"}
                                  >
                                    {item.target_value || "N/A"}
                                  </div>
                                </td>
                                <td className="py-3 px-4 w-1/4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 bg-gray-200 rounded overflow-hidden">
                                      <div
                                        className="h-2 rounded transition-all duration-300"
                                        style={{
                                          width: `${Math.min(
                                            achievement,
                                            100
                                          )}%`,
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
                                <td className="py-3 px-4 w-1/4">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-semibold break-words ${getStatusColor(
                                      item.status || ""
                                    )}`}
                                  >
                                    {item.status || "Unknown"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No analysis data available for the selected period</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (user?.role === "supervisor" || user?.role === "staff") {
    return (
      <div className="flex flex-col items-start justify-start py-8 px-8 min-h-[40vh] w-full">
        <SupervisorDashboard />
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
                  Record Audio
                </a>
              </div>
            </div>
          </div>
        </div>
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
