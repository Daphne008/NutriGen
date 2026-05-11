"use client";

import "@/components/charts/init";
import type { DietEvaluationTotals } from "@/lib/types";
import { macroPercentsFromTotals } from "@/lib/macros";
import { Pie } from "react-chartjs-2";

export function MacroPieChart({ totals }: { totals: DietEvaluationTotals }) {
  const { proteinPercent, carbsPercent, fatPercent } = macroPercentsFromTotals(totals);

  const data = {
    labels: ["Protein", "Carbohydrates", "Fat"],
    datasets: [
      {
        data: [proteinPercent, carbsPercent, fatPercent],
        backgroundColor: ["#0f766e", "#2563eb", "#d97706"],
        borderWidth: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label?: string; parsed: number }) => `${ctx.label ?? ""}: ${ctx.parsed.toFixed(1)}%`
        }
      }
    }
  };

  return (
    <div className="h-64 w-full">
      <Pie data={data} options={options} />
    </div>
  );
}
