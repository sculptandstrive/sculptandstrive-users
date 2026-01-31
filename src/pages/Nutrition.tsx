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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FoodSearch } from "@/components/nutrition/FoodSearch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

const mealIcons = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: UtensilsCrossed,
};

const mealTimes = {
  breakfast: "8:00 AM",
  lunch: "1:00 PM",
  dinner: "7:00 PM",
  snack: "Throughout day",
};

export default function Nutrition() {
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [waterIntake, setWaterIntake] = useState<WaterIntake[]>([]);
  const [searchMealType, setSearchMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const today = new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const [logsResult, waterResult] = await Promise.all([
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
      ]);

      if (logsResult.error) throw logsResult.error;
      if (waterResult.error) throw waterResult.error;

      setNutritionLogs(logsResult.data || []);
      setWaterIntake(waterResult.data || []);
    } catch (error) {
      console.error("Error fetching nutrition data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addWater = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from("water_intake").insert({
        user_id: user.id,
        amount_ml: 250,
        log_date: today,
      });

      if (error) throw error;
      fetchData();
      toast({ title: "Water logged!", description: "Keep hydrating! 💧" });
    } catch (error) {
      console.error("Error adding water:", error);
    }
  };

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

  // Calculate totals
  const totals = nutritionLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein_g,
      carbs: acc.carbs + log.carbs_g,
      fats: acc.fats + log.fats_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const nutritionGoals = {
    calories: { current: totals.calories, target: 2200 },
    protein: { current: totals.protein, target: 150 },
    carbs: { current: totals.carbs, target: 250 },
    fats: { current: totals.fats, target: 75 },
    water: { current: waterIntake.length, target: 8 },
  };

  // Group logs by meal type
  const mealTypes: Array<"breakfast" | "lunch" | "dinner" | "snack"> = ["breakfast", "lunch", "dinner", "snack"];
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
          <p className="text-muted-foreground">
            Monitor your diet and stay on track with your goals
          </p>
        </div>
        <Button
          onClick={() => setSearchMealType("snack")}
          className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Meal
        </Button>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Calories & Macros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Apple className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-lg">Daily Summary</h3>
          </div>

          {/* Calorie Circle */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-44 h-44">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="76"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="14"
                />
                <motion.circle
                  cx="88"
                  cy="88"
                  r="76"
                  fill="none"
                  stroke="url(#calorieGradient)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 478" }}
                  animate={{
                    strokeDasharray: `${
                      Math.min((nutritionGoals.calories.current / nutritionGoals.calories.target) * 478, 478)
                    } 478`,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--info))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-display font-bold">
                  {Math.round(nutritionGoals.calories.current)}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {nutritionGoals.calories.target} kcal
                </span>
              </div>
            </div>
          </div>

          {/* Macros */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  Protein
                </span>
                <span>
                  {Math.round(nutritionGoals.protein.current)}g / {nutritionGoals.protein.target}g
                </span>
              </div>
              <Progress
                value={Math.min((nutritionGoals.protein.current / nutritionGoals.protein.target) * 100, 100)}
                className="h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-info" />
                  Carbs
                </span>
                <span>
                  {Math.round(nutritionGoals.carbs.current)}g / {nutritionGoals.carbs.target}g
                </span>
              </div>
              <Progress
                value={Math.min((nutritionGoals.carbs.current / nutritionGoals.carbs.target) * 100, 100)}
                className="h-2 [&>div]:bg-info"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-accent" />
                  Fats
                </span>
                <span>
                  {Math.round(nutritionGoals.fats.current)}g / {nutritionGoals.fats.target}g
                </span>
              </div>
              <Progress
                value={Math.min((nutritionGoals.fats.current / nutritionGoals.fats.target) * 100, 100)}
                className="h-2 [&>div]:bg-accent"
              />
            </div>
          </div>

          {/* Water Tracker */}
          <div className="mt-6 p-4 rounded-lg bg-info/10 border border-info/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-info" />
                <span className="font-medium">Hydration</span>
              </div>
              <Button variant="ghost" size="sm" className="text-info h-auto p-0" onClick={addWater}>
                + Add
              </Button>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: nutritionGoals.water.target }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex-1 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    i < nutritionGoals.water.current
                      ? "bg-info text-info-foreground"
                      : "bg-muted hover:bg-info/20"
                  }`}
                  onClick={i >= nutritionGoals.water.current ? addWater : undefined}
                >
                  <Droplets className="w-4 h-4" />
                </motion.div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              {nutritionGoals.water.current} of {nutritionGoals.water.target} glasses
            </p>
          </div>
        </motion.div>

        {/* Right - Meals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-4"
        >
          {mealGroups.map((meal, mealIndex) => {
            const MealIcon = meal.icon;
            const mealCalories = meal.items.reduce((acc, item) => acc + item.calories, 0);
            const mealProtein = meal.items.reduce((acc, item) => acc + item.protein_g, 0);
            const mealCarbs = meal.items.reduce((acc, item) => acc + item.carbs_g, 0);
            const mealFats = meal.items.reduce((acc, item) => acc + item.fats_g, 0);

            return (
              <motion.div
                key={meal.type}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: mealIndex * 0.1 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MealIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold capitalize">{meal.type}</h3>
                      <p className="text-sm text-muted-foreground">{meal.time}</p>
                    </div>
                  </div>
                  {meal.items.length > 0 && (
                    <div className="text-right">
                      <p className="font-semibold">{Math.round(mealCalories)} kcal</p>
                      <p className="text-xs text-muted-foreground">
                        P: {Math.round(mealProtein)}g | C: {Math.round(mealCarbs)}g | F: {Math.round(mealFats)}g
                      </p>
                    </div>
                  )}
                </div>

                {meal.items.length > 0 ? (
                  <div className="space-y-2">
                    {meal.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group"
                      >
                        <span className="truncate flex-1">{item.meal_name}</span>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{item.calories} kcal</span>
                          <Badge variant="secondary" className="text-xs">
                            P {Math.round(item.protein_g)}g
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            onClick={() => deleteFood(item.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No foods logged yet
                  </p>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 text-primary"
                  onClick={() => setSearchMealType(meal.type)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Food
                </Button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Food Search Modal */}
      <AnimatePresence>
        {searchMealType && (
          <FoodSearch
            mealType={searchMealType}
            onFoodLogged={fetchData}
            onClose={() => setSearchMealType(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
