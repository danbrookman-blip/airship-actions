import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "accent" | "success" | "warning";
}

const variantStyles = {
  default: "bg-card",
  accent: "bg-card border-l-4 border-l-accent",
  success: "bg-card border-l-4 border-l-success",
  warning: "bg-card border-l-4 border-l-warning",
};

const iconVariantStyles = {
  default: "bg-secondary text-foreground",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export default function StatCard({ title, value, subtitle, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <div className={cn("rounded-xl p-5 shadow-card transition-shadow hover:shadow-card-hover", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[12.5px] font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && <p className="text-[12px] text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("text-[12px] font-medium", trend.value >= 0 ? "text-success" : "text-destructive")}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconVariantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
