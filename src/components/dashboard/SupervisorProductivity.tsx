import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const supervisorData = [
  {
    name: "Supervisor A",
    productivity: 92,
    avatar: "/avatars/supervisor-a.jpg",
    user: "John Smith",
    color: "#22c55e",
  },
  {
    name: "Supervisor B",
    productivity: 87,
    avatar: "/avatars/supervisor-b.jpg",
    user: "Sarah Johnson",
    color: "#3b82f6",
  },
  {
    name: "Supervisor C",
    productivity: 78,
    avatar: "/avatars/supervisor-c.jpg",
    user: "Mike Davis",
    color: "#f97316",
  },
];

export function SupervisorProductivity() {
  const chartData = useMemo(
    () => ({
      labels: supervisorData.map((sup) => sup.name),
      datasets: [
        {
          label: "Productivity",
          data: supervisorData.map((sup) => sup.productivity),
          backgroundColor: supervisorData.map((sup) => sup.color),
          borderColor: supervisorData.map((sup) => sup.color),
          borderWidth: 1,
          borderRadius: 8,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        },
      ],
    }),
    []
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: { enabled: true },
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
    []
  );

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 mt-8">
      <h2 className="text-lg md:text-xl font-bold mb-1">
        Supervisor Productivity
      </h2>
      <p className="text-gray-500 mb-6 text-sm md:text-base">
        Performance metrics across supervisors
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
              key={sup.name}
              className="flex items-center gap-4 bg-gray-50 rounded-lg p-4 shadow-sm"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={sup.avatar} alt={sup.user} />
                <AvatarFallback>{sup.user[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-base">
                  {sup.user}
                </div>
                <div className="text-gray-500 text-sm mb-2">{sup.name}</div>
                <div className="w-full h-2 bg-gray-200 rounded">
                  <div
                    className="h-2 rounded transition-all duration-500"
                    style={{
                      width: `${sup.productivity}%`,
                      background: sup.color,
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-end min-w-[60px]">
                <span
                  className="text-2xl font-bold leading-none"
                  style={{ color: sup.color }}
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
