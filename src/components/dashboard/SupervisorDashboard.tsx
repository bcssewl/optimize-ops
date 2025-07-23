import { useAuth } from "@/src/context/AuthContext";
import { createClient } from "@/src/lib/supabase/client";
import {
  faCheckCircle,
  faDollarSign,
  faEnvelope,
  faFilter,
  faHeart,
  faSpinner,
  faStar,
  faUsers,
  faUserShield,
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

interface Target {
  id: number;
  target_name: string;
  target_value: string;
  user_uuid: string;
  created_at: string;
  analysis?: AnalysisData[];
}

interface Recording {
  id: number;
  user_uuid: string;
  analysis?: AnalysisData[];
  status: string;
  created_at: string;
}

const targetsOverview = [
  {
    label: "Sales Target",
    value: "$125K",
    color: "bg-blue-600",
    icon: <FontAwesomeIcon icon={faDollarSign} width={24} height={24} />,
  },
  {
    label: "Customer Satisfaction",
    value: "95%",
    color: "bg-green-600",
    icon: <FontAwesomeIcon icon={faHeart} width={24} height={24} />,
  },
  {
    label: "Team Productivity",
    value: "88%",
    color: "bg-orange-500",
    icon: <FontAwesomeIcon icon={faUsers} width={24} height={24} />,
  },
  {
    label: "Quality Score",
    value: "92%",
    color: "bg-purple-600",
    icon: <FontAwesomeIcon icon={faStar} width={24} height={24} />,
  },
];

const targets = [
  {
    name: "Monthly Sales",
    icon: (
      <FontAwesomeIcon
        icon={faDollarSign}
        width={20}
        height={20}
        className="text-blue-600"
      />
    ),
    current: "$98,500",
    target: "$125,000",
    progress: 78.8,
    color: "bg-blue-600",
    status: "In Progress",
    statusColor: "bg-yellow-100 text-yellow-700",
  },
  {
    name: "Customer Satisfaction",
    icon: (
      <FontAwesomeIcon
        icon={faHeart}
        width={20}
        height={20}
        className="text-green-600"
      />
    ),
    current: "95.2%",
    target: "95.0%",
    progress: 100.2,
    color: "bg-green-600",
    status: "Achieved",
    statusColor: "bg-green-100 text-green-700",
  },
  {
    name: "Team Productivity",
    icon: (
      <FontAwesomeIcon
        icon={faUsers}
        width={20}
        height={20}
        className="text-orange-500"
      />
    ),
    current: "88.3%",
    target: "90.0%",
    progress: 98.1,
    color: "bg-orange-500",
    status: "In Progress",
    statusColor: "bg-yellow-100 text-yellow-700",
  },
  {
    name: "Quality Score",
    icon: (
      <FontAwesomeIcon
        icon={faStar}
        width={20}
        height={20}
        className="text-purple-600"
      />
    ),
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
  const [targets, setTargets] = useState<Target[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user || loading) return;
    fetchDashboardData();
  }, [user, loading]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoadingData(true);
    const supabase = createClient();

    try {
      // Fetch user's targets
      const { data: targetsData } = await supabase
        .from("targets")
        .select("*")
        .eq("user_uuid", user.id)
        .order("created_at", { ascending: false });

      // Fetch user's recordings with analysis
      const { data: recordingsData } = await supabase
        .from("recordings")
        .select("*")
        .eq("user_uuid", user.id)
        .eq("status", "success")
        .not("analysis", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);

      setTargets(targetsData || []);
      setRecordings(recordingsData || []);

      // Extract analysis data from recordings
      const allAnalysis: AnalysisData[] = [];
      recordingsData?.forEach((recording) => {
        if (recording.analysis && Array.isArray(recording.analysis)) {
          allAnalysis.push(...recording.analysis);
        }
      });
      setAnalysisData(allAnalysis);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }

    setLoadingData(false);
  };

  // Calculate dynamic stats from analysis data
  const getTargetStats = () => {
    if (analysisData.length === 0) {
      return {
        totalTargets: targets.length,
        completedTargets: 0,
        exceededTargets: 0,
        inProgressTargets: targets.length,
        averageAchievement: 0,
      };
    }

    const exceededTargets = analysisData.filter((item) =>
      (item.status || "").toLowerCase().includes("exceeded")
    ).length;

    const completedTargets = analysisData.filter(
      (item) =>
        (item.status || "").toLowerCase().includes("exceeded") ||
        (item.status || "").toLowerCase().includes("completed")
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
      totalTargets: targets.length, // Use actual assigned targets count
      completedTargets,
      exceededTargets,
      inProgressTargets,
      averageAchievement,
    };
  };

  const stats = getTargetStats();

  // Generate dynamic targets overview based on analysis
  const dynamicTargetsOverview = [
    {
      label: "Total Targets",
      value: stats.totalTargets.toString(),
      color: "bg-blue-600",
      icon: <FontAwesomeIcon icon={faDollarSign} width={24} height={24} />,
    },
    {
      label: "Exceeded Targets",
      value: stats.exceededTargets.toString(),
      color: "bg-green-600",
      icon: <FontAwesomeIcon icon={faCheckCircle} width={24} height={24} />,
    },
    {
      label: "In Progress",
      value: stats.inProgressTargets.toString(),
      color: "bg-orange-500",
      icon: <FontAwesomeIcon icon={faSpinner} width={24} height={24} />,
    },
    {
      label: "Average Achievement",
      value: `${stats.averageAchievement}%`,
      color: "bg-purple-600",
      icon: <FontAwesomeIcon icon={faStar} width={24} height={24} />,
    },
  ];

  // Generate dynamic targets list from analysis data
  const dynamicTargets = analysisData.slice(0, 5).map((item, index) => {
    const getStatusColor = (status: string) => {
      if (status.toLowerCase().includes("exceeded")) {
        return {
          status: "Exceeded",
          statusColor: "bg-green-100 text-green-700",
          color: "bg-green-500",
        };
      } else if (
        status.toLowerCase().includes("progress") ||
        status.toLowerCase().includes("started")
      ) {
        return {
          status: "In Progress",
          statusColor: "bg-yellow-100 text-yellow-700",
          color: "bg-orange-500",
        };
      } else {
        return {
          status: "Completed",
          statusColor: "bg-blue-100 text-blue-700",
          color: "bg-blue-500",
        };
      }
    };

    const statusInfo = getStatusColor(item.status || "");
    const progressPercentage =
      typeof item.percentage_achieve === "number"
        ? Math.min(item.percentage_achieve, 100)
        : 0;

    return {
      name:
        (item.target_name || "").length > 40
          ? `${(item.target_name || "").substring(0, 40)}...`
          : item.target_name || "N/A",
      icon: (
        <FontAwesomeIcon
          icon={
            statusInfo.status === "Exceeded"
              ? faCheckCircle
              : statusInfo.status === "In Progress"
              ? faSpinner
              : faStar
          }
          width={20}
          height={20}
          className={
            statusInfo.status === "Exceeded"
              ? "text-green-600"
              : statusInfo.status === "In Progress"
              ? "text-orange-500"
              : "text-blue-600"
          }
        />
      ),
      current:
        (item.ahcieved_result || "").length > 30
          ? `${(item.ahcieved_result || "").substring(0, 30)}...`
          : item.ahcieved_result || "N/A",
      target:
        (item.target_value || "").length > 30
          ? `${(item.target_value || "").substring(0, 30)}...`
          : item.target_value || "N/A",
      progress: progressPercentage,
      color: statusInfo.color,
      status: statusInfo.status,
      statusColor: statusInfo.statusColor,
    };
  });

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="animate-spin text-2xl mb-2"
          />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

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
                <FontAwesomeIcon icon={faEnvelope} width={20} height={20} />
              </span>
              <span className="text-gray-700">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 bg-green-50 rounded-lg px-4 py-2 min-w-[180px]">
              <span className="bg-green-100 p-2 rounded-full">
                <FontAwesomeIcon icon={faUserShield} width={20} height={20} />
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
          <div className="font-semibold text-lg">
            {analysisData.length > 0
              ? "Live Target Analysis"
              : "Targets Overview"}
          </div>
          <div className="text-blue-600 bg-blue-50 rounded-full px-3 py-1 text-sm font-medium">
            Total: {stats.totalTargets} Targets
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {dynamicTargetsOverview.map((t) => (
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

      {/* Target Analysis Results */}
      {analysisData.length > 0 ? (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-lg">Live Target Analysis</div>
            <span className="text-sm text-gray-500">
              Based on latest voice recordings
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left">
                  <th className="py-2 px-2 font-medium">Target Name</th>
                  <th className="py-2 px-2 font-medium">Target Value</th>
                  <th className="py-2 px-2 font-medium">Achievement</th>
                  <th className="py-2 px-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {dynamicTargets.map((t, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="py-2 px-2 flex items-center gap-2 font-medium">
                      {t.icon}
                      <span title={analysisData[index]?.target_name}>
                        {t.name}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span title={analysisData[index]?.target_value}>
                        {t.target}
                      </span>
                    </td>
                    <td className="py-2 px-2 w-48">
                      <div className="w-full h-2 bg-gray-200 rounded">
                        <div
                          className="h-2 rounded transition-all duration-300"
                          style={{
                            width: `${Math.min(t.progress, 100)}%`,
                            background: t.color
                              .replace("bg-", "")
                              .includes("green")
                              ? "#22c55e"
                              : t.color.replace("bg-", "").includes("orange")
                              ? "#f97316"
                              : "#3b82f6",
                          }}
                        />
                      </div>
                      <span
                        className="ml-2 font-semibold text-xs mt-1 block"
                        style={{
                          color: t.color.replace("bg-", "").includes("green")
                            ? "#22c55e"
                            : t.color.replace("bg-", "").includes("orange")
                            ? "#f97316"
                            : "#3b82f6",
                        }}
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
      ) : (
        /* Static Target Display */
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-lg">My Targets</div>
            <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded px-3 py-1 text-sm font-medium">
              <FontAwesomeIcon icon={faFilter} width={16} height={16} />
              Filter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left">
                  <th className="py-2 px-2 font-medium">Target Name</th>
                  <th className="py-2 px-2 font-medium">Target Value</th>
                  <th className="py-2 px-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {targets.length > 0 ? (
                  targets.map((t) => (
                    <tr key={t.id} className="border-t border-gray-100">
                      <td className="py-2 px-2 flex items-center gap-2 font-medium">
                        <FontAwesomeIcon
                          icon={faStar}
                          width={20}
                          height={20}
                          className="text-gray-400"
                        />
                        {t.target_name}
                      </td>
                      <td className="py-2 px-2">{t.target_value}</td>
                      <td className="py-2 px-2">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                          Pending Analysis
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      No targets assigned yet. Contact your manager to get
                      started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Action Buttons */}
    </div>
  );
}
