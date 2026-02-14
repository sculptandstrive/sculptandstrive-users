import { motion } from "framer-motion";
import { Apple, Droplets } from "lucide-react";
// 1. Import the utility functions to ensure consistency across the app
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

interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  waterGlasses: number;
}

interface NutritionWidgetProps {
  nutritionLogs: NutritionLog[];
  waterIntake: WaterIntake[];
  assignedPlan?: any; // Added to support admin-assigned plans
  userRequirements?: any; // Added for profile fallback
  targets?: NutritionTargets;
  waterRequirement: number; // In ml, e.g., 3000
}

export function NutritionWidget({
  nutritionLogs = [],
  waterIntake = [],
  assignedPlan = null,
  userRequirements = null,
  waterRequirement = 3000,
}: NutritionWidgetProps) {
  
  
  const totals = calculateNutritionTotals(nutritionLogs);
  const dynamicGoals = getNutritionGoals(assignedPlan, userRequirements);

  
  const caloriesPercent =
    dynamicGoals.calories > 0
      ? Math.min((totals.calories / dynamicGoals.calories) * 100, 100)
      : 0;

  const macros = [
    {
      name: "Protein",
      value: totals.protein,
      target: dynamicGoals.protein,
      color: "bg-primary",
    },
    { 
      name: "Carbs", 
      value: totals.carbs, 
      target: dynamicGoals.carbs, 
      color: "bg-info" 
    },
    { 
      name: "Fats", 
      value: totals.fats, 
      target: dynamicGoals.fats, 
      color: "bg-accent" 
    },
  ];

  // Hydration Calculations
  const totalWaterMl = waterIntake.reduce(
    (sum, w) => sum + (Number(w.amount_ml) || 0),
    0,
  );

  const totalLitres = (totalWaterMl / 1000).toFixed(2);
  const targetLitres = (waterRequirement / 1000).toFixed(1);
  const waterProgress = waterRequirement > 0 
    ? Math.min((totalWaterMl / waterRequirement) * 100, 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-xl border border-border p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-6">
        <Apple className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">
          Today's Nutrition
        </h3>
      </div>

      {/* Calories Circle */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-40 h-40">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 160 160"
          >
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="12"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="url(#calorieGradientWidget)"
              strokeWidth="12"
              strokeLinecap="round"
              initial={{ strokeDashoffset: 440 }}
              animate={{
                strokeDashoffset: 440 - (caloriesPercent / 100) * 440,
              }}
              style={{ strokeDasharray: 440 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <defs>
              <linearGradient
                id="calorieGradientWidget"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--info))" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-display font-bold tabular-nums">
              {Math.round(totals.calories)}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              / {dynamicGoals.calories} kcal
            </span>
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="space-y-4 mb-6">
        {macros.map((macro) => {
          const percent =
            macro.target > 0
              ? Math.min((macro.value / macro.target) * 100, 100)
              : 0;

          return (
            <div key={macro.name}>
              <div className="flex justify-between text-xs mb-1 uppercase font-bold tracking-tight">
                <span className="text-muted-foreground">
                  {macro.name}
                </span>
                <span className="tabular-nums">
                  {macro.value.toFixed(1)}g{" "}
                  <span className="text-muted-foreground text-[10px] font-normal">
                    / {macro.target}g
                  </span>
                </span>
              </div>

              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${macro.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Hydration Section */}
      <div className="p-4 rounded-lg bg-info/5 border border-info/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-info" />
            <span className="text-xs font-bold uppercase">Hydration</span>
          </div>

          <span className="text-xs font-bold font-mono text-info">
            {totalLitres}L / {targetLitres}L
          </span>
        </div>

        <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full bg-info"
            initial={{ width: 0 }}
            animate={{ width: `${waterProgress}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-center italic">
          Tracked via water logs
        </p>
      </div>
    </motion.div>
  );
}