import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
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
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export function ProgressChart() {
  const { user } = useAuth();
  const [weightData, setWeightData] = useState<any[]>([]);
  const [weightLost, setWeightLost] = useState<number>(0);
  const [daysCount, setDaysCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeightData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch all measurements ordered by date
        const { data: allMeasurements, error: measurementsError } =
          await supabase
            .from("current_measurements")
            .select("weight_kg, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });

        if (measurementsError) {
          console.error("Error fetching measurements:", measurementsError);
          setLoading(false);
          return;
        }

        if (!allMeasurements || allMeasurements.length === 0) {
          setLoading(false);
          return;
        }

        // Calculate weight lost
        const startingWeight = allMeasurements[0].weight_kg;
        const currentWeight = allMeasurements[allMeasurements.length - 1].weight_kg;
        const totalWeightLost = startingWeight - currentWeight;
        setWeightLost(totalWeightLost);

        // Calculate weeks elapsed
        const startDate = new Date(allMeasurements[0].created_at);
        const endDate = new Date(allMeasurements[allMeasurements.length - 1].created_at);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        setDaysCount(days || 1); // At least 1 day

        // Format data for chart
        const chartData = allMeasurements.map((m, index) => ({
          week: `Day ${index + 1}`,
          weight: m.weight_kg,
          date: new Date(m.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        }));

        setWeightData(chartData);
        setLoading(false);
      } catch (error) {
        console.error("Error in fetchWeightData:", error);
        setLoading(false);
      }
    };

    fetchWeightData();
  }, [user]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-card rounded-xl border border-border p-6"
      >
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Loading weight data...</p>
        </div>
      </motion.div>
    );
  }

  if (weightData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-card rounded-xl border border-border p-6"
      >
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No weight data available</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {weightLost > 0 ? (
            <TrendingDown className="w-5 h-5 text-success" />
          ) : (
            <TrendingUp className="w-5 h-5 text-warning" />
          )}
          <h3 className="font-display font-semibold text-lg">Weight Progress</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-2xl font-display font-bold ${
              weightLost > 0 ? "text-success" : "text-warning"
            }`}
          >
            {weightLost > 0 ? "-" : "+"}
            {Math.abs(weightLost).toFixed(1)} kg
          </span>
          <span className="text-sm text-muted-foreground">
            in {daysCount} {daysCount === 1 ? "day" : "days"}
          </span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weightData}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(174 72% 46%)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(174 72% 46%)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(222 20% 20%)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
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