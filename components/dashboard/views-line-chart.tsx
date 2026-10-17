"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
);

export interface LineDatum {
  label: string;
  value: number;
}

const PINK = "#ec4899";
const PINK_DEEP = "#db2777";

export default function ViewsLineChart({
  data,
  height = 300,
}: {
  data: LineDatum[];
  height?: number;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const max = Math.max(...data.map((d) => d.value), 0);
  const avg = data.length > 0 ? total / data.length : 0;

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#181818",
        borderColor: "rgba(236,72,153,0.4)",
        borderWidth: 1,
        titleColor: "#fafafa",
        bodyColor: "#f9a8d4",
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (item) =>
            ` ${Number(item.raw).toLocaleString()} view${Number(item.raw) === 1 ? "" : "s"}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#71717a",
          font: { size: 11 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#1c1c1c" },
        border: { display: false },
        ticks: {
          color: "#71717a",
          font: { size: 11 },
          precision: 0,
          maxTicksLimit: 5,
        },
      },
    },
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="m-0 text-[26px] font-bold tabular-nums text-white">
          {total.toLocaleString()}
          <span className="ml-2 align-middle text-[12px] font-medium text-[#71717a]">
            total views
          </span>
        </p>
        <p className="m-0 text-[12px] tabular-nums text-[#71717a]">
          avg {avg.toFixed(1)} · peak {max.toLocaleString()}
        </p>
      </div>
      <div className="relative w-full" style={{ height }}>
        <Line
          data={{
            labels: data.map((d) => d.label),
            datasets: [
              {
                label: "Views",
                data: data.map((d) => d.value),
                borderColor: PINK,
                borderWidth: 2.5,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: PINK,
                pointHoverBorderColor: "#fff",
                tension: 0.4,
                fill: true,
                backgroundColor: (ctx) => {
                  const { chart } = ctx;
                  const { ctx: c, chartArea } = chart;
                  if (!chartArea) return "rgba(236,72,153,0.15)";
                  const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                  g.addColorStop(0, "rgba(219,39,119,0.45)");
                  g.addColorStop(1, "rgba(219,39,119,0)");
                  return g;
                },
              },
            ],
          }}
          options={options}
        />
      </div>
    </div>
  );
}

export { PINK_DEEP };
