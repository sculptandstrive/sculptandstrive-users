import { AnimatePresence, motion } from "framer-motion";
import {
  Flame,
  Target,
  Clock,
  TrendingUp,
  Bell,
  ChevronRight,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { UpcomingSessions } from "@/components/dashboard/UpcomingSessions";
import { NutritionWidget } from "@/components/dashboard/NutritionWidget";
import WorkoutProgress from "@/components/dashboard/WorkoutProgress";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { NavLink } from "react-router-dom";
import { Notification } from "@/components/dashboard/Notification";
import MacroData from "@/components/MacroData";
import ReadoutCard from "@/components/ReadoutCard";
import ProgressBar from "@/components/ProgressBar";
import BMRData from "@/components/BMRData";
import  CalculatorLayout, { StaggerItem } from '@/components/CalculatorLayout'
import { addDays, addWeeks, differenceInDays, format } from "date-fns";

const BMI_SEGMENTS = [
  { label: "Underweight", color: "hsl(190, 90%, 50%)", threshold: 18.5 },
  { label: "Normal", color: "hsl(150, 60%, 45%)", threshold: 25 },
  { label: "Overweight", color: "hsl(40, 90%, 55%)", threshold: 30 },
  { label: "Obese", color: "hsl(0, 84%, 60%)", threshold: 40 },
];

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
  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";
  const [notificationWindow, setNotificationWindow] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notifications[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [waterIntake, setWaterIntake] = useState<WaterIntake[]>([]);
  const [nutritionRequirement, setNutritionRequirement] = useState<any>(null);
  const [assignedPlan, setAssignedPlan] = useState<any>(null);
  const [macroResult, setMacroResult] = useState<any>(null);
  const [bmi, setbmi] = useState<number>(null);
  const [bmr, setbmr] = useState<number>(null);
  const [bmrUnit, setBmrUnit] = useState<string>(null);
  const [tdee, settdee] = useState<number>(null);
  const [bodyFat, setBodyFat] = useState<number>(null);
  const [bodyFatType, setBodyFatType] = useState<string>(null);
  const [idealWeight, setIdealWeight] = useState<string>(null);
  const [idealWeightType, setIdealWeightType] = useState<string>(null);

  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    caloriesBurned: 0,
    workoutsCompleted: 0,
    totalWorkouts: 0,
    activeMinutes: 0,
    streak: 0,
  });
  const [dailyWaterGoal, setWaterGoal] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [lmpDate, setLmpDate] = useState<string | null>(null);

  const now = new Date();
  const dayOfWeek = now.getDay();

  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  const pad = (n) => String(n).padStart(2, "0");
  const toLocalDate = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  const startOfWeek = toLocalDate(monday);
  const endOfWeek = toLocalDate(sunday);

  const today = new Date().toISOString().split("T")[0];

  const fetchNotifications = async () => {
    if (!user) return;

    const { data: prefs, error: prefError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (prefs.live_session_alerts === false) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("notification_date", today)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch notifications error:", error);
      return;
    }

    setNotifications(data || []);
  };

  const fetchUserReport = async () => {
    if (!user) return;
    try {
      const [
        logsResult,
        waterResult,
        workoutsResult,
        nutritionRequired,
        planResult,
        macroData,
        hfData,
      ] = await Promise.all([
        supabase
          .from("nutrition_logs")
          .select("*")
          .eq("user_id", user.id)
          .eq("log_date", today)
          .order("created_at", { ascending: true }),
        supabase
          .from("water_intake")
          .select("*")
          .eq("user_id", user.id)
          .eq("log_date", today),
        supabase
          .from("workouts")
          .select("*")
          .eq("user_id", user.id)
          .gte("workout_date", startOfWeek)
          .lte("workout_date", endOfWeek)
          .order("order_index", { ascending: true }),
        supabase
          .from("nutrition_requirements")
          .select(
            "calories_requirement, protein_requirement, carbs_requirement, water_requirement, fats_requirement",
          )
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_meal_plans")
          .select(
            `
            meal_plans!user_meal_plans_plan_id_fkey(
              name,
              calories,
              protein,
              carbs,
              water,
              fats
            )
          `,
          )
          .eq("user_id", user.id),
        supabase
          .from("macro_result")
          .select("result")
          .eq("user_id", user.id)
          .single(),
        supabase.from("hf_data").select("*").eq("user_id", user.id).single(),
      ]);

      if (logsResult.error) throw logsResult.error;
      if (waterResult.error) throw waterResult.error;
      if (workoutsResult.error) throw workoutsResult.error;

      setNutritionLogs(logsResult.data || []);
      setWaterIntake(waterResult.data || []);
      setNutritionRequirement(nutritionRequired?.data);
      setMacroResult(macroData?.data?.result || null);
      setbmi(hfData?.data?.bmi);
      setbmr(hfData?.data?.bmr);
      setBmrUnit(hfData?.data?.bmr_unit);
      setBodyFat(hfData?.data?.body_fat);
      setBodyFatType(hfData?.data?.body_fat_type);
      setLmpDate(hfData?.data?.lmp_date)
      if(hfData?.data.ideal_weight !== null){
        setIdealWeight(hfData.data.ideal_weight.split(' ')[0] || null);
        setIdealWeightType(hfData?.data?.ideal_weight.split(' ')[1] || null)
      }
      settdee(hfData?.data?.tdee_maintain);

      if (planResult.data && (planResult.data as any)?.[0]?.meal_plans) {
        const p = (planResult.data as any)[0].meal_plans;
        setAssignedPlan({
          name: p.name,
          calories: Number(p.calories),
          protein: Number(p.protein),
          carbs: Number(p.carbs),
          fats: Number(p.fats),
          water: Number(p.water),
        });
      } else {
        setAssignedPlan(null);
      }

      const normalizedData = workoutsResult.data.reduce(
        (acc: any[], current: any) => {
          const exists = acc.find((item) => item.day_name === current.day_name);
          if (!exists) {
            return [...acc, current];
          }
          return acc;
        },
        [],
      );

      const allWorkouts = workoutsResult.data || [];
      const completedWorkouts = allWorkouts.filter((w) => w.completed);

      const totalCalories = normalizedData.reduce(
        (sum, w) => sum + (w.calories_burned || 0),
        0,
      );
      const totalMinutes = completedWorkouts.reduce(
        (sum, w) => sum + (w.duration_minutes || 0),
        0,
      );

      setWeeklyData(normalizedData);
      setWaterGoal(nutritionRequired.data.water_requirement);

      setStats({
        caloriesBurned: totalCalories,
        workoutsCompleted: completedWorkouts.length,
        totalWorkouts: allWorkouts.length,
        activeMinutes: totalMinutes,
        streak: completedWorkouts.length > 0 ? 7 : 0,
      });

      const { data } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);
    } catch (err: any) {
      toast({
        title: "Failed to fetch user data",
        description: err.message || "Unknown error",
      });
    }
  };

  const results = useMemo(()=>{
    if(!lmpDate) return null;
    const lmp = new Date(lmpDate);

    if(isNaN(lmp.getTime())) return null;
    const daysSinceLmp = differenceInDays(today, lmp);
    if(daysSinceLmp < 0 || daysSinceLmp > 280) return null;

    const dueDate = addDays(lmp, 280);

    const conceptionDate = addDays(lmp, 14)
    const weeksPregnant = Math.floor(daysSinceLmp/ 7);
    const daysExtra = daysSinceLmp % 7;
    const daysUntilDue = differenceInDays(dueDate, today);
    const trimester = weeksPregnant < 13 ? 1 : weeksPregnant < 27 ? 2 : 3;
    const progressPercent = Math.min((daysSinceLmp / 280) * 100, 100);

    return {
      dueDate,
      conceptionDate,
      weeksPregnant,
      daysExtra,
      daysUntilDue,
      trimester,
      progressPercent,
      firstTrimesterEnd: addWeeks(lmp, 13),
      secondTrimesterEnd: addWeeks(lmp, 27)
    }
  },[lmpDate])


  const colorClass = useMemo(() => {
    if (!bmi) return "text-primary";
    if (bmi < 18.5) return "text-primary";
    if (bmi < 25) return "text-success";
    if (bmi < 30) return "text-warning";
    return "text-destructive";
  }, [bmi]);

  const weightCategory = useMemo(() => {
    if (!bmi) return "";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obese";
  }, [bmi]);

  useEffect(() => {
    fetchUserReport();
    fetchNotifications();

    const expiry = new Date(user.user_metadata.expiry_at).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft(`0d 0h 0m 0s`);
        clearInterval(interval);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

        {user?.user_metadata?.signup_source === "trial_user" &&
          user?.user_metadata?.expiry_at && (
            <div className="bg-primary/15 px-4 py-2 rounded-md text-base font-semibold">
              Your Trial ends in:{" "}
              <span className="font-bold gradient-text">{timeLeft}</span>
            </div>
          )}

        <div className="flex items-center gap-3">
          {user?.user_metadata?.plan_role === "user" ? (
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={() => setNotificationWindow(true)}
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="relative cursor-not-allowed"
            >
              <Bell className="w-5 h-5" />
            </Button>
          )}

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
          // trend={{ value: 12, positive: true }}
          variant={stats.caloriesBurned > 0 ? "primary" : "default"}
        />
        <StatCard
          title="Workouts Completed"
          value={`${stats.workoutsCompleted}/${stats.totalWorkouts}`}
          subtitle="Weekly target"
          icon={Target}
          // trend={{ value: 8, positive: true }}
        />
        <StatCard
          title="Active Minutes"
          value={stats.activeMinutes.toString()}
          subtitle="This week"
          icon={Clock}
          // trend={{ value: 5, positive: true }}
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
            assignedPlan={assignedPlan}
            userRequirements={nutritionRequirement}
          />
        </div>
      </div>

      <WorkoutProgress
        weeklyData={weeklyData}
        setWeeklyData={setWeeklyData}
        fetchUserReport={fetchUserReport}
      />

      <div className="flex flex-col gap-8 space-y-6">
        <div className="flex flex-col gap-8 md:gap-0 md:flex-row justify-around">
          {macroResult && <MacroData result={macroResult} />}
          {bmr && <BMRData bmr={bmr} resultUnit={bmrUnit} />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 justify-between gap-4">
          {bmi && (
            <ReadoutCard
              label="Your BMI"
              value={bmi ? bmi.toFixed(1) : "-"}
              unit="kg/m²"
              colorClass={colorClass}
              description={
                bmi
                  ? `${weightCategory}. BMI is a screening tool and does not diagnose body fatness or health.`
                  : "Enter your measurements above."
              }
              showSave={false}
            >
              {bmi && (
                <ProgressBar
                  value={0}
                  segments={BMI_SEGMENTS}
                  max={40}
                  currentValue={bmi}
                />
              )}
            </ReadoutCard>
          )}
          {bodyFat && (
            <ReadoutCard
              label="Estimated Body Fat"
              value={bodyFat ? bodyFat.toFixed(1) : "—"}
              unit="%"
              description={
                bodyFat
                  ? `${bodyFatType}. U.S. Navy method is an estimate; DEXA or hydrostatic weighing provides higher accuracy.`
                  : "Enter your measurements above."
              }
              showSave={false}
            />
          )}

          {tdee && (
            <ReadoutCard
              label="Total Daily Energy Expenditure"
              value={tdee ? Math.round(tdee).toLocaleString() : "—"}
              unit="kcal/day"
              description={
                tdee
                  ? `Based on a your selected activity level. To lose weight, consume fewer calories; to gain, consume more.`
                  : "Enter your measurements above."
              }
              showSave={false}
            />
          )}

          {idealWeight && (
            <ReadoutCard
              label="Average Ideal Weight"
              value={idealWeight ? idealWeight : "—"}
              unit={idealWeightType}
              showSave={false}
              description="Average across Robinson, Miller, Devine, and Hamwi formulas."
            />
          )}
        </div>

        <div>
          {results && (
            <div className="rounded-xl border p-3 md:p-6 ">
              <CalculatorLayout title="Pregnancy Calculator" showBack={false}>
                <StaggerItem>
                  <ReadoutCard
                    label="Estimated Due Date"
                    value={format(results.dueDate, "MMM d, yyyy")}
                    colorClass="text-accent"
                    description={`${results.daysUntilDue > 0 ? results.daysUntilDue + " days remaining" : "Past due date"}. Currently in trimester ${results.trimester}.`}
                  >
                    <ProgressBar value={results.progressPercent} />
                  </ReadoutCard>
                </StaggerItem>

                <StaggerItem>
                  <div className="grid grid-cols-2 gap-4">
                    <ReadoutCard
                      label="Current Week"
                      value={`${results.weeksPregnant}w ${results.daysExtra}d`}
                      colorClass="text-accent"
                    />
                    <ReadoutCard
                      label="Trimester"
                      value={String(results.trimester)}
                      colorClass="text-accent"
                    />
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <div className="surface p-3 md:p-6 rounded-xl">
                    <span className="label-instrument mb-4 block">
                      Key Dates
                    </span>
                    <div className="space-y-3">
                      {[
                        {
                          label: "Estimated Conception",
                          date: results.conceptionDate,
                        },
                        {
                          label: "End of First Trimester",
                          date: results.firstTrimesterEnd,
                        },
                        {
                          label: "End of Second Trimester",
                          date: results.secondTrimesterEnd,
                        },
                        { label: "Due Date", date: results.dueDate },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between py-2 border-b border-border last:border-0"
                        >
                          <span className="text-sm text-muted-foreground">
                            {item.label}
                          </span>
                          <span className="text-sm font-medium text-foreground font-mono">
                            {format(item.date, "MMM d, yyyy")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              </CalculatorLayout>
            </div>
          )}
        </div>
      </div>

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
