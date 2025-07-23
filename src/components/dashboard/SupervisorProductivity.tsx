import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { createClient } from "@/src/lib/supabase/client";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AnalysisData {
  status: string;
  target_name: string;
  target_value: string;
  ahcieved_result: string;
  percentage_achieve: number | string;
}

interface UserProductivity {
  user_uuid: string;
  email: string;
  role: string;
  productivity: number;
  targetsCount: number;
  averageAchievement: number;
  exceededCount: number;
}

const getColorByProductivity = (productivity: number) => {
  if (productivity >= 85) return "#22c55e"; // Green
  if (productivity >= 70) return "#3b82f6"; // Blue
  if (productivity >= 50) return "#f97316"; // Orange
  return "#ef4444"; // Red
};

const getInitials = (email: string) => {
  return email.substring(0, 2).toUpperCase();
};

export function SupervisorProductivity() {
  const [supervisorData, setSupervisorData] = useState<UserProductivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupervisorProductivity = async () => {
      try {
        const supabase = createClient();

        // Fetch all supervisors and staff
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("uuid, email, role")
          .in("role", ["supervisor", "staff"]);

        if (usersError) {
          console.error("Error fetching users:", usersError);
          return;
        }

        if (!users || users.length === 0) {
          setSupervisorData([]);
          setLoading(false);
          return;
        }

        // Fetch recordings with analysis for all supervisors/staff
        const { data: recordings, error: recordingsError } = await supabase
          .from("recordings")
          .select("user_uuid, analysis, status")
          .in(
            "user_uuid",
            users.map((u) => u.uuid)
          )
          .eq("status", "success")
          .not("analysis", "is", null);

        // Fetch actual targets assigned to all supervisors/staff
        const { data: targets, error: targetsError } = await supabase
          .from("targets")
          .select("user_uuid, id")
          .in(
            "user_uuid",
            users.map((u) => u.uuid)
          );

        if (recordingsError) {
          console.error("Error fetching recordings:", recordingsError);
          return;
        }

        if (targetsError) {
          console.error("Error fetching targets:", targetsError);
          return;
        }

        // Calculate productivity for each user
        const userProductivityMap: Record<string, UserProductivity> = {};

        users.forEach((user) => {
          userProductivityMap[user.uuid] = {
            user_uuid: user.uuid,
            email: user.email,
            role: user.role,
            productivity: 0,
            targetsCount: 0,
            averageAchievement: 0,
            exceededCount: 0,
          };
        });

        // Count actual assigned targets for each user
        targets?.forEach((target) => {
          const userData = userProductivityMap[target.user_uuid];
          if (userData) {
            userData.targetsCount++;
          }
        });

        // Process recordings and analysis data for achievements and exceeded counts
        // Track analysis count separately for average calculation
        const userAnalysisCount: Record<string, number> = {};

        recordings?.forEach((recording) => {
          if (recording.analysis && Array.isArray(recording.analysis)) {
            const analysisArray = recording.analysis as AnalysisData[];

            analysisArray.forEach((analysis) => {
              const userData = userProductivityMap[recording.user_uuid];
              if (userData) {
                // Track analysis count for this user
                userAnalysisCount[recording.user_uuid] =
                  (userAnalysisCount[recording.user_uuid] || 0) + 1;
                const analysisCount = userAnalysisCount[recording.user_uuid];

                // Count exceeded targets
                if (
                  (analysis.status || "").toLowerCase().includes("exceeded")
                ) {
                  userData.exceededCount++;
                }

                // Add to average achievement calculation
                const achievement =
                  typeof analysis.percentage_achieve === "number"
                    ? analysis.percentage_achieve
                    : 0;

                userData.averageAchievement =
                  (userData.averageAchievement * (analysisCount - 1) +
                    achievement) /
                  analysisCount;
              }
            });
          }
        });

        // Calculate final productivity scores and prepare data
        const productivityData = Object.values(userProductivityMap)
          .filter((user) => user.targetsCount > 0) // Only include users with assigned targets
          .map((user) => {
            // Simplified productivity formula: just average achievement percentage
            // If no analysis data, productivity is 0
            const productivity =
              user.averageAchievement > 0
                ? Math.min(Math.round(user.averageAchievement), 100)
                : 0;

            return {
              ...user,
              productivity,
              averageAchievement: Math.round(user.averageAchievement),
            };
          })
          .sort((a, b) => b.productivity - a.productivity) // Sort by productivity descending
          .slice(0, 5); // Show top 5

        setSupervisorData(productivityData);
      } catch (error) {
        console.error("Error calculating supervisor productivity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupervisorProductivity();
  }, []);

  const chartData = useMemo(
    () => ({
      labels: supervisorData.map((sup) => sup.email.split("@")[0]),
      datasets: [
        {
          label: "Productivity",
          data: supervisorData.map((sup) => sup.productivity),
          backgroundColor: supervisorData.map((sup) =>
            getColorByProductivity(sup.productivity)
          ),
          borderColor: supervisorData.map((sup) =>
            getColorByProductivity(sup.productivity)
          ),
          borderWidth: 1,
          borderRadius: 8,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        },
      ],
    }),
    [supervisorData]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            title: (context: any) => {
              const index = context[0].dataIndex;
              return supervisorData[index]?.email || "";
            },
            label: (context: any) => {
              const index = context.dataIndex;
              const user = supervisorData[index];
              return [
                `Productivity: ${context.parsed.y}%`,
                `Assigned Targets: ${user?.targetsCount || 0}`,
                `Exceeded: ${user?.exceededCount || 0}`,
                `Avg Achievement: ${user?.averageAchievement || 0}%`,
              ];
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 25 },
          grid: { color: "#e5e7eb" },
        },
        x: {
          grid: { display: false },
        },
      },
      maintainAspectRatio: false,
    }),
    [supervisorData]
  );

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 mt-8">
        <h2 className="text-lg md:text-xl font-bold mb-1">
          Supervisor Productivity
        </h2>
        <p className="text-gray-500 mb-6 text-sm md:text-base">
          Performance metrics across supervisors
        </p>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading productivity data...</div>
        </div>
      </div>
    );
  }

  if (supervisorData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 mt-8">
        <h2 className="text-lg md:text-xl font-bold mb-1">
          Supervisor Productivity
        </h2>
        <p className="text-gray-500 mb-6 text-sm md:text-base">
          Performance metrics across supervisors
        </p>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No productivity data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 mt-8">
      <h2 className="text-lg md:text-xl font-bold mb-1">
        Supervisor Productivity
      </h2>
      <p className="text-gray-500 mb-6 text-sm md:text-base">
        Performance metrics across supervisors and staff
      </p>
      <div className="flex flex-col md:flex-row gap-8">
        {/* ChartJS Bar Chart */}
        <div className="flex-1 min-w-[300px] flex items-center justify-center">
          <div className="w-full h-64">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
        {/* Detailed Metrics */}
        <div className="flex-1 min-w-[300px] flex flex-col gap-4">
          {supervisorData.map((sup) => (
            <div
              key={sup.user_uuid}
              className="flex items-center gap-4 bg-gray-50 rounded-lg p-4 shadow-sm"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={`/avatars/${sup.email.split("@")[0]}.jpg`}
                  alt={sup.email}
                />
                <AvatarFallback>{getInitials(sup.email)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-base">
                  {sup.email.split("@")[0]}
                </div>
                <div className="text-gray-500 text-sm mb-2 capitalize">
                  {sup.role}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {sup.targetsCount} assigned • {sup.exceededCount} exceeded
                </div>
                <div className="w-full h-2 bg-gray-200 rounded">
                  <div
                    className="h-2 rounded transition-all duration-500"
                    style={{
                      width: `${sup.productivity}%`,
                      background: getColorByProductivity(sup.productivity),
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-end min-w-[60px]">
                <span
                  className="text-2xl font-bold leading-none"
                  style={{ color: getColorByProductivity(sup.productivity) }}
                >
                  {sup.productivity}%
                </span>
                <span className="text-xs text-gray-500">Productivity</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
