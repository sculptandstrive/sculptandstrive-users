import { motion } from "framer-motion";
import { 
  Flame, 
  Target, 
  Clock, 
  TrendingUp, 
  Bell,
  ChevronRight 
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { UpcomingSessions } from "@/components/dashboard/UpcomingSessions";
import { NutritionWidget } from "@/components/dashboard/NutritionWidget";
import { WorkoutProgress } from "@/components/dashboard/WorkoutProgress";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold mb-1">
            Welcome back, <span className="gradient-text">{firstName}</span> 💪
          </h1>
          <p className="text-muted-foreground">
            Track your fitness journey and stay motivated
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
            Start Workout
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Calories Burned"
          value="1,850"
          subtitle="This week"
          icon={Flame}
          trend={{ value: 12, positive: true }}
          variant="primary"
        />
        <StatCard
          title="Workouts Completed"
          value="4/7"
          subtitle="This week"
          icon={Target}
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          title="Active Minutes"
          value="285"
          subtitle="This week"
          icon={Clock}
          trend={{ value: 5, positive: true }}
        />
        <StatCard
          title="Current Streak"
          value="7 days"
          subtitle="Personal best!"
          icon={TrendingUp}
          variant="accent"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Sessions & Progress Chart */}
        <div className="lg:col-span-2 space-y-6">
          <UpcomingSessions />
          <ProgressChart />
        </div>

        {/* Right Column - Nutrition */}
        <div className="space-y-6">
          <NutritionWidget />
        </div>
      </div>

      {/* Workout Progress */}
      <WorkoutProgress />
    </div>
  );
}
