import React from "react";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}

export function MetricCard({ icon, label, value, hint }: MetricCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-zinc-200">
          {icon}
        </div>
        
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
          <p className="mt-1 text-xs text-zinc-400">{hint}</p>
        </div>
      </div>
    </div>
  );
}