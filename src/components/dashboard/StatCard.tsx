import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "primary" | "accent";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-xl p-6 border",
        variant === "primary" && "bg-primary/10 border-primary/20 shadow-glow",
        variant === "accent" && "bg-accent/10 border-accent/20 shadow-glow-accent",
        variant === "default" && "bg-card border-border",
        className
      )}
    >
      {/* Background gradient */}
      <div
        className={cn(
          "absolute inset-0 opacity-5",
          variant === "primary" && "bg-gradient-primary",
          variant === "accent" && "bg-gradient-accent"
        )}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "p-3 rounded-lg",
              variant === "primary" && "bg-primary/20",
              variant === "accent" && "bg-accent/20",
              variant === "default" && "bg-muted"
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5",
                variant === "primary" && "text-primary",
                variant === "accent" && "text-accent",
                variant === "default" && "text-muted-foreground"
              )}
            />
          </div>
          {trend && (
            <span
              className={cn(
                "text-sm font-medium px-2 py-1 rounded-full",
                trend.positive
                  ? "text-success bg-success/10"
                  : "text-destructive bg-destructive/10"
              )}
            >
              {trend.positive ? "+" : "-"}{Math.abs(trend.value)}%
            </span>
          )}
        </div>

        <p className="text-muted-foreground text-sm mb-1">{title}</p>
        <p className="text-3xl font-display font-bold">{value}</p>
        {subtitle && (
          <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
