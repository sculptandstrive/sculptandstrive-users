import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const weightData = [
  { week: "Week 1", weight: 85 },
  { week: "Week 2", weight: 84.2 },
  { week: "Week 3", weight: 83.8 },
  { week: "Week 4", weight: 83.1 },
  { week: "Week 5", weight: 82.5 },
  { week: "Week 6", weight: 81.8 },
  { week: "Week 7", weight: 81.2 },
  { week: "Week 8", weight: 80.5 },
];

export function ProgressChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Weight Progress</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-display font-bold gradient-text">
            -4.5 kg
          </span>
          <span className="text-sm text-muted-foreground">in 8 weeks</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weightData}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(174 72% 46%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(174 72% 46%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(222 20% 20%)"
              vertical={false}
            />
            <XAxis
              dataKey="week"
              stroke="hsl(215 20% 55%)"
              tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(215 20% 55%)"
              tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
              domain={["dataMin - 2", "dataMax + 2"]}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222 25% 12%)",
                border: "1px solid hsl(222 20% 20%)",
                borderRadius: "8px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              }}
              labelStyle={{ color: "hsl(210 40% 96%)" }}
              itemStyle={{ color: "hsl(174 72% 46%)" }}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="hsl(174 72% 46%)"
              strokeWidth={3}
              fill="url(#weightGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
