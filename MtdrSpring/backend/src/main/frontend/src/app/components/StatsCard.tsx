import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

export default function StatsCard({ title, value, icon: Icon, iconColor, iconBgColor, }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 mb-1">{title}</p>
          <p className="text-2xl text-slate-900">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${iconBgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
