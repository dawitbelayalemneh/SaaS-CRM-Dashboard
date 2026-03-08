import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ title, value, change, icon: Icon, trend = "neutral" }: StatCardProps) {
  return (
    <div className="stat-card group">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent rounded-xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 ring-1 ring-primary/10 transition-all duration-200 group-hover:bg-primary/12 group-hover:ring-primary/20">
            <Icon className="h-[18px] w-[18px] text-primary" />
          </div>
        </div>

        {change && (
          <div className="mt-3 flex items-center gap-1.5">
            {trend === "up" && <ArrowUpRight className="h-3.5 w-3.5 text-success" />}
            {trend === "down" && <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />}
            <p className={`text-xs font-medium ${
              trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
            }`}>
              {change}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
