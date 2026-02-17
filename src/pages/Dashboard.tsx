import { AnimatePresence, motion } from "framer-motion";
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
import WorkoutProgress from "@/components/dashboard/WorkoutProgress";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { NavLink } from "react-router-dom";
import { Notification } from "@/components/dashboard/Notification";

// --- INTERFACES ---

interface Notifications {
  id: string;
  title: string;
  description: string;
  is_completed?: boolean;
}

interface NutritionLog {
  id: string;
  meal_type: string;
  meal_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

interface WaterIntake {
  id: string;
  amount_ml: number;
}

interface Workout {
  id: string;
  name: string;
  completed: boolean; 
  calories_burned: number;
  duration_minutes: number;
  user_id: string;
  workout_date: string;
}

interface DashboardStats {
  caloriesBurned: number;
  workoutsCompleted: number;
  totalWorkouts: number;
  activeMinutes: number;
  streak: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const [notificationWindow, setNotificationWindow] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notifications[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [waterIntake, setWaterIntake] = useState<WaterIntake[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    caloriesBurned: 0,
    workoutsCompleted: 0,
    totalWorkouts: 0,
    activeMinutes: 0,
    streak: 0
  });
  const [dailyWaterGoal, setWaterGoal] = useState<number>(3);

  const today = new Date().toISOString().split('T')[0];

  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq('notification_date', today)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch notifications error:", error);
      return;
    }
    setNotifications(data || []);
  };

  const fetchDailyNotifications = async () => {
    const { data: existing, error: checkError } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("notification_date", today)
      .limit(1);

      if (checkError) {
        console.error("Check error:", checkError);
        return;
      }

      if (existing && existing.length > 0){
        return;
      } 

      const { data: prefs, error: prefError } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (prefError) {
        console.error("Preference fetch error:", prefError);
        return;
      }
      const notificationsToInsert: any[] = [];

      // if (prefs.workout_reminders) {
      //   notificationsToInsert.push({
      //     user_id: user.id,
      //     title: "Workout Reminder",
      //     description: "Complete your workout today 💪",
      //     notification_date: today,
      //   });
      // }

      if (prefs.diet_meal_reminders) {
        notificationsToInsert.push({
          user_id: user.id,
          title: "Nutrition Reminder",
          description: "Track your meals today 🥗",
          notification_date: today,
        });
      }

      // if (prefs.water_intake_alerts) {
      //   notificationsToInsert.push({
      //     user_id: user.id,
      //     title: "Water Intake",
      //     description: "Stay hydrated and meet your goal 🚰",
      //     notification_date: today,
      //   });
      // }

      if (prefs.live_session_alerts) {
        notificationsToInsert.push({
          user_id: user.id,
          title: "Live Session",
          description: "Check today’s live training session 🎯",
          notification_date: today,
        });
      }

      if (notificationsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("notifications")
          .insert(notificationsToInsert);

        if (insertError) {
          console.error("Insert error:", insertError);
        }
      }
  }

  const fetchUserReport = async() => {
    if(!user) return;
    try {
      const [logsResult, waterResult, workoutsResult, waterRequirement] = await Promise.all([
        supabase
          .from('nutrition_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('log_date', today)
          .order('created_at', {ascending: true}),
        supabase
          .from('water_intake')
          .select('*')
          .eq('user_id', user.id)
          .eq('log_date', today),
        supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .returns<Workout[]>(),
        supabase.from('nutrition_requirements').select('water_requirement').eq('user_id', user.id).single()
      ]);

      if(logsResult.error) throw logsResult.error;
      if(waterResult.error) throw waterResult.error;
      if(workoutsResult.error) throw workoutsResult.error;

      // console.log(workoutsResult);

      setNutritionLogs(logsResult.data || []);
      setWaterIntake(waterResult.data || []);

      const allWorkouts = workoutsResult.data || [];
      const completedWorkouts = allWorkouts.filter(w => w.completed);

      // Calculate calories and minutes from completed workouts
      const totalCalories = completedWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
      const totalMinutes = completedWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);

      setWaterGoal(waterRequirement.data.water_requirement); 

      setStats({
        caloriesBurned: totalCalories,
        workoutsCompleted: completedWorkouts.length,
        totalWorkouts: allWorkouts.length,
        activeMinutes: totalMinutes,
        streak: completedWorkouts.length > 0 ? 7 : 0 
      });

    } catch(err: any) {
      toast({
        title: 'Failed to fetch user data',
        description: err.message || 'Unknown error'
      });
    }
  }

  useEffect(() => {
    fetchUserReport();
    fetchDailyNotifications();
    fetchNotifications();
  }, [user, today]);

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
            Welcome back, <span className="gradient-text">{firstName}</span>
          </h1>
          <p className="text-muted-foreground">
            Track your fitness journey and stay motivated
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="relative"
            onClick={() => setNotificationWindow(true)}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
          </Button>
          <NavLink to="/fitness">
            <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
              Start Workout
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </NavLink>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Calories Burned"
          value={
            stats.caloriesBurned > 0
              ? stats.caloriesBurned.toLocaleString()
              : "0"
          }
          subtitle="This week"
          icon={Flame}
          trend={{ value: 12, positive: true }}
          variant="primary"
        />
        <StatCard
          title="Workouts Completed"
          value={`${stats.workoutsCompleted}/${stats.totalWorkouts}`}
          subtitle="Weekly target"
          icon={Target}
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          title="Active Minutes"
          value={stats.activeMinutes.toString()}
          subtitle="This week"
          icon={Clock}
          trend={{ value: 5, positive: true }}
        />
        <StatCard
          title="Current Streak"
          value={`${stats.streak} days`}
          subtitle="Personal best!"
          icon={TrendingUp}
          variant="accent"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <UpcomingSessions />
          <ProgressChart />
        </div>

        <div className="space-y-6">
          <NutritionWidget
            nutritionLogs={nutritionLogs}
            waterIntake={waterIntake}
            waterRequirement={dailyWaterGoal}
          />
        </div>
      </div>

      <WorkoutProgress />
      <AnimatePresence>
        {notificationWindow && (
          <Notification
            setNotificationWindow={setNotificationWindow}
            notifications={notifications}
          />
        )}
      </AnimatePresence>
    </div>
  );
}