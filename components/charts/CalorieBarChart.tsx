"use client";

import "@/components/charts/init";
import { Bar } from "react-chartjs-2";

export function CalorieBarChart({ requiredCalories, actualCalories }: { requiredCalories: number; actualCalories: number }) {
  const data = {
    labels: ["Required", "Planned"],
    datasets: [
      {
        label: "Energy (kcal)",
        data: [requiredCalories, actualCalories],
        backgroundColor: ["#94a3b8", "#0f766e"],
        borderRadius: 8,
        barPercentage: 0.7
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        grid: { color: "#e2e8f0" }
      }
    }
  };

  return (
    <div className="h-64 w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
