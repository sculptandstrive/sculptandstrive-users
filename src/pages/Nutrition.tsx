import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Apple,
  Plus,
  Droplets,
  Coffee,
  UtensilsCrossed,
  Moon,
  Sun,
  Trash2,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FoodSearch } from "@/components/nutrition/FoodSearch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import WaterLog from "@/components/nutrition/WaterLog";

// IMPORT DYNAMIC UTILS
import { calculateNutritionTotals, getNutritionGoals } from "@/utils/nutritionCalculations";

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

interface NutritionRequirement {
  calories_requirement: number;
  water_requirement: number;
}

interface AssignedPlan {
  name: string;
  calories: number;
  protein: number;
  carbs_g?: number;
  fats_g?: number;
  recommendations?: any[];
}

const mealIcons = {
  breakfast: Coffee,
  mid_morning_snack: UtensilsCrossed,
  lunch: Sun,
  evening_snack: UtensilsCrossed,
  dinner: Moon,
};

const mealTimes = {
  breakfast: "8:00 AM",
  mid_morning_snack: '11:00 AM',
  lunch: "1:00 PM",
  evening_snack: "4:00 PM",
  dinner: "7:00 PM",
};

export default function Nutrition() {
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [waterIntake, setWaterIntake] = useState<WaterIntake[]>([]);
  const [nutritionRequirement, setNutritionRequirement] = useState<NutritionRequirement | null>(null);
  const [assignedPlan, setAssignedPlan] = useState<AssignedPlan | null>(null);
  const [searchMealType, setSearchMealType] = useState<string | null>(null);
  const [waterBar, setWaterBar] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const today = new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    if (!user) {
      console.log("Nutrition: No user session, skipping fetch.");
      return;
    }

    try {
      console.log(`Nutrition: Fetching data for user ${user.id} on ${today}`);
      
      const [logsResult, waterResult, nutritionRequired, planResult] = await Promise.all([
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
          .from('nutrition_requirements')
          .select('calories_requirement, water_requirement')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_meal_plans')
          .select(`
            meal_plans (
              name,
              calories,
              protein,
              carbs,
              fats
            )
          `)
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      // Debugging Logs
      console.log("DB Logs:", logsResult.data?.length || 0, "items found.");
      console.log("DB Plan:", planResult.data?.meal_plans ? "Found assigned plan" : "No assigned plan");

      setNutritionLogs(logsResult.data || []);
      setWaterIntake(waterResult.data || []);
      setNutritionRequirement(nutritionRequired.data || null);

      if (planResult.data && (planResult.data as any).meal_plans) {
        const p = (planResult.data as any).meal_plans;
        setAssignedPlan({
          name: p.name,
          calories: Number(p.calories),
          protein: Number(p.protein),
          carbs_g: Number(p.carbs),
          fats_g: Number(p.fats),
        });
      } else {
        setAssignedPlan(null);
      }
      
    } catch (error) {
      console.error("Error fetching nutrition data:", error);
    }
  }, [user, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData, waterBar]);


  const totals = calculateNutritionTotals(nutritionLogs);
  const dynamicGoals = getNutritionGoals(assignedPlan, nutritionRequirement);

  const totalWaterMl = waterIntake.reduce((sum, w) => sum + w.amount_ml, 0);
  const totalLitres = (totalWaterMl / 1000).toFixed(2);
  const waterTargetMl = nutritionRequirement?.water_requirement || 3000;
  const waterProgress = Math.min((totalWaterMl / waterTargetMl) * 100, 100);

  const deleteFood = async (id: string) => {
    try {
      const { error } = await supabase.from("nutrition_logs").delete().eq("id", id);
      if (error) throw error;
      fetchData();
      toast({ title: "Food removed" });
    } catch (error) {
      console.error("Error deleting food:", error);
    }
  };

  
  const nutritionGoals = {
    calories: { current: totals.calories, target: dynamicGoals.calories },
    protein: { current: totals.protein, target: dynamicGoals.protein },
    carbs: { current: totals.carbs, target: dynamicGoals.carbs },
    fats: { current: totals.fats, target: dynamicGoals.fats },
  };

  const mealTypes = ["breakfast", "mid_morning_snack", "lunch", "evening_snack", "dinner"] as const;
  
  const mealGroups = mealTypes.map((type) => ({
    type,
    icon: mealIcons[type],
    time: mealTimes[type],
    items: nutritionLogs.filter((log) => log.meal_type === type),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold mb-1">Nutrition Tracking</h1>
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground">Monitor your diet and stay on track</p>
            {assignedPlan && (
              <Badge className="bg-primary/10 text-primary border-primary/20">
                <Target className="w-3 h-3 mr-1" />
                Plan: {assignedPlan.name}
              </Badge>
            )}
          </div>
        </div>
        <Button
          onClick={() => setSearchMealType("breakfast")}
          className="bg-gradient-primary hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Quick Log
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Daily Summary Circle & Macros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 h-fit"
        >
          <div className="flex items-center gap-2 mb-6">
            <Apple className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-lg">Daily Summary</h3>
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className="relative w-44 h-44">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 176 176">
                <circle cx="88" cy="88" r="76" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                <motion.circle
                  cx="88" cy="88" r="76" fill="none" stroke="url(#calorieGradient)" strokeWidth="12" strokeLinecap="round"
                  initial={{ strokeDashoffset: 478 }}
                  animate={{ 
                    strokeDashoffset: 478 - (Math.min(nutritionGoals.calories.current / (nutritionGoals.calories.target || 1), 1) * 478) 
                  }}
                  style={{ strokeDasharray: 478 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--info))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-display font-bold tabular-nums">
                  {Math.round(nutritionGoals.calories.current)}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                  / {nutritionGoals.calories.target} kcal
                </span>
              </div>
            </div>
          </div>

          {/* Macro Progress Bars */}
          <div className="space-y-5">
            {['protein', 'carbs', 'fats'].map((macro) => {
              const m = nutritionGoals[macro as keyof typeof nutritionGoals];
              const percentage = Math.min((m.current / (m.target || 1)) * 100, 100);
              
              return (
                <div key={macro}>
                  <div className="flex justify-between text-xs mb-2 uppercase font-bold tracking-tight">
                    <span className="text-muted-foreground">{macro}</span>
                    <span className="tabular-nums">
                      {Math.round(m.current)}g <span className="text-muted-foreground font-normal">/ {m.target}g</span>
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={`h-1.5 ${macro === 'carbs' ? '[&>div]:bg-info' : macro === 'fats' ? '[&>div]:bg-accent' : ''}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Hydration Widget */}
          <div className="mt-8 p-4 rounded-xl bg-info/5 border border-info/10">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-info" />
                <span className="text-xs font-bold uppercase">Hydration</span>
              </div>
              <span className="text-xs font-bold font-mono">{totalLitres}L / {waterTargetMl/1000}L</span>
            </div>
            <Progress value={waterProgress} className="h-1.5 mb-4" />
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-[10px] font-bold uppercase tracking-widest" 
              onClick={() => setWaterBar(true)}
            >
              Add Water
            </Button>
          </div>
        </motion.div>

        {/* Right - Meals Sections */}
        <div className="lg:col-span-2 space-y-4">
          {mealGroups.map((meal, idx) => {
            const MealIcon = meal.icon;
            const mealCals = meal.items.reduce((sum, item) => sum + item.calories, 0);

            return (
              <motion.div
                key={meal.type}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <MealIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold capitalize text-sm">{meal.type.replace(/_/g, ' ')}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">{meal.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{Math.round(mealCals)}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">kcal</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {meal.items.length > 0 ? (
                    meal.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 group border border-transparent hover:border-border transition-all">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{item.meal_name}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {item.calories} kcal • P: {item.protein_g}g • C: {item.carbs_g}g
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteFood(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">No items logged</p>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-4 text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/5 border border-primary/5"
                  onClick={() => setSearchMealType(meal.type)}
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Log {meal.type.replace(/_/g, ' ')}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {searchMealType && (
          <FoodSearch
            mealType={searchMealType as any}
            onFoodLogged={fetchData}
            onClose={() => setSearchMealType(null)}
            nutritionGoals={nutritionGoals}
          />
        )}
        {waterBar && (
          <WaterLog 
            onWaterLogged={fetchData}
            onClose={() => setWaterBar(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}