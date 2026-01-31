import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Ruler,
  Activity,
  Camera,
  Calendar,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

const weightData = [
  { date: "Jan 1", weight: 85 },
  { date: "Jan 8", weight: 84.5 },
  { date: "Jan 15", weight: 84 },
  { date: "Jan 22", weight: 83.5 },
  { date: "Jan 29", weight: 83 },
  { date: "Feb 5", weight: 82.5 },
  { date: "Feb 12", weight: 82 },
  { date: "Feb 19", weight: 81.5 },
  { date: "Feb 26", weight: 81 },
  { date: "Mar 5", weight: 80.5 },
];

const bodyFatData = [
  { date: "Jan 1", value: 22 },
  { date: "Jan 15", value: 21.5 },
  { date: "Feb 1", value: 20.8 },
  { date: "Feb 15", value: 20.2 },
  { date: "Mar 1", value: 19.5 },
  { date: "Mar 15", value: 18.8 },
];

const workoutData = [
  { week: "Week 1", workouts: 4, duration: 180 },
  { week: "Week 2", workouts: 5, duration: 225 },
  { week: "Week 3", workouts: 4, duration: 200 },
  { week: "Week 4", workouts: 6, duration: 300 },
  { week: "Week 5", workouts: 5, duration: 250 },
  { week: "Week 6", workouts: 5, duration: 275 },
];

const progressPhotos = [
  { date: "Jan 1", label: "Start" },
  { date: "Feb 1", label: "Month 1" },
  { date: "Mar 1", label: "Month 2" },
];

const stats = [
  { label: "Starting Weight", value: "85 kg", icon: Scale },
  { label: "Current Weight", value: "80.5 kg", icon: Scale },
  { label: "Weight Lost", value: "-4.5 kg", icon: TrendingDown, highlight: true },
  { label: "Body Fat", value: "18.8%", icon: Activity },
];

const measurements = [
  { label: "Chest", current: 102, previous: 104, unit: "cm" },
  { label: "Waist", current: 82, previous: 88, unit: "cm" },
  { label: "Hips", current: 98, previous: 100, unit: "cm" },
  { label: "Arms", current: 38, previous: 36, unit: "cm" },
  { label: "Thighs", current: 58, previous: 56, unit: "cm" },
];

export default function Progress() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold mb-1">Progress Tracking</h1>
          <p className="text-muted-foreground">
            Visualize your fitness journey and celebrate your wins
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
            <Camera className="w-4 h-4 mr-2" />
            Add Photo
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-card border rounded-xl p-4 ${
              stat.highlight
                ? "border-success/50 bg-success/5 shadow-glow"
                : "border-border"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon
                className={`w-4 h-4 ${
                  stat.highlight ? "text-success" : "text-muted-foreground"
                }`}
              />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p
              className={`text-2xl font-display font-bold ${
                stat.highlight ? "text-success" : ""
              }`}
            >
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="weight" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="weight" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Scale className="w-4 h-4 mr-2" />
            Weight
          </TabsTrigger>
          <TabsTrigger value="body" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Ruler className="w-4 h-4 mr-2" />
            Measurements
          </TabsTrigger>
          <TabsTrigger value="workouts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Activity className="w-4 h-4 mr-2" />
            Workouts
          </TabsTrigger>
          <TabsTrigger value="photos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Camera className="w-4 h-4 mr-2" />
            Photos
          </TabsTrigger>
        </TabsList>

        {/* Weight Tab */}
        <TabsContent value="weight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold text-lg">Weight Trend</h3>
                <Badge className="bg-success/10 text-success">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -4.5 kg
                </Badge>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightData}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(174 72% 46%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(174 72% 46%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 20%)" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(215 20% 55%)" tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} />
                    <YAxis stroke="hsl(215 20% 55%)" tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} domain={["dataMin - 2", "dataMax + 2"]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(222 25% 12%)",
                        border: "1px solid hsl(222 20% 20%)",
                        borderRadius: "8px",
                      }}
                    />
                    <Area type="monotone" dataKey="weight" stroke="hsl(174 72% 46%)" strokeWidth={3} fill="url(#weightGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-semibold text-lg mb-6">Body Fat %</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bodyFatData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 20%)" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(215 20% 55%)" tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }} />
                    <YAxis stroke="hsl(215 20% 55%)" tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} domain={["dataMin - 2", "dataMax + 2"]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(222 25% 12%)",
                        border: "1px solid hsl(222 20% 20%)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(38 92% 55%)" strokeWidth={3} dot={{ fill: "hsl(38 92% 55%)", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Measurements Tab */}
        <TabsContent value="body">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h3 className="font-display font-semibold text-lg mb-6">Body Measurements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {measurements.map((m, index) => {
                const change = m.current - m.previous;
                const isPositive = m.label === "Arms" || m.label === "Thighs" ? change > 0 : change < 0;
                return (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl bg-muted/50 text-center"
                  >
                    <Ruler className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground mb-1">{m.label}</p>
                    <p className="text-2xl font-display font-bold">
                      {m.current} {m.unit}
                    </p>
                    <span className={`text-xs ${isPositive ? "text-success" : "text-destructive"}`}>
                      {change > 0 ? "+" : ""}{change} {m.unit}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </TabsContent>

        {/* Workouts Tab */}
        <TabsContent value="workouts">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h3 className="font-display font-semibold text-lg mb-6">Weekly Workout Summary</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workoutData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 20%)" vertical={false} />
                  <XAxis dataKey="week" stroke="hsl(215 20% 55%)" tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} />
                  <YAxis stroke="hsl(215 20% 55%)" tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222 25% 12%)",
                      border: "1px solid hsl(222 20% 20%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="workouts" fill="hsl(174 72% 46%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h3 className="font-display font-semibold text-lg mb-6">Progress Photos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {progressPhotos.map((photo, index) => (
                <motion.div
                  key={photo.date}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="aspect-[3/4] rounded-xl bg-muted/50 border border-dashed border-border flex flex-col items-center justify-center"
                >
                  <Camera className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="font-medium">{photo.label}</p>
                  <p className="text-sm text-muted-foreground">{photo.date}</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Add Photo
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
