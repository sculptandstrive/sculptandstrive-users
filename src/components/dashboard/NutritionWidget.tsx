import { motion } from "framer-motion";
import { Apple, Droplets } from "lucide-react";

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

//  Targets interface 
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
  targets?: NutritionTargets; // Optional dynamic targets
}

const DEFAULT_TARGETS: NutritionTargets = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fats: 70,
  waterGlasses: 8,
};

export function NutritionWidget({ 
  nutritionLogs = [], 
  waterIntake = [], 
  targets = DEFAULT_TARGETS 
}: NutritionWidgetProps) {

  //  Totals Calculation
  const caloriesConsumed = nutritionLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
  const protein = nutritionLogs.reduce((s, l) => s + (l.protein_g || 0), 0);
  const carbs = nutritionLogs.reduce((s, l) => s + (l.carbs_g || 0), 0);
  const fats = nutritionLogs.reduce((s, l) => s + (l.fats_g || 0), 0);

  //  Percentage Calculation 
  const caloriesPercent = targets.calories > 0 
    ? Math.min((caloriesConsumed / targets.calories) * 100, 100) 
    : 0;

  const macros = [
    { name: "Protein", value: protein, target: targets.protein, color: "bg-primary" },
    { name: "Carbs", value: carbs, target: targets.carbs, color: "bg-info" },
    { name: "Fats", value: fats, target: targets.fats, color: "bg-accent" },
  ];

  const GLASS_ML = 250;
  const totalWaterMl = waterIntake.reduce((sum, w) => sum + (w.amount_ml || 0), 0);
  const waterConsumed = Math.floor(totalWaterMl / GLASS_ML);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-xl border border-border p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-6">
        <Apple className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">Today's Nutrition</h3>
      </div>

      {/* Calories Circle */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
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
              stroke="url(#calorieGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              initial={{ strokeDashoffset: 440 }}
              animate={{ strokeDashoffset: 440 - (caloriesPercent / 100) * 440 }}
              style={{ strokeDasharray: 440 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--info))" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-display font-bold tabular-nums">
              {Math.round(caloriesConsumed)}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              / {targets.calories} kcal
            </span>
          </div>
        </div>
      </div>

      {/* Macros   */}
      <div className="space-y-4 mb-6">
        {macros.map((macro) => {
          const percent = macro.target > 0 ? Math.min((macro.value / macro.target) * 100, 100) : 0;
          return (
            <div key={macro.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground font-medium">{macro.name}</span>
                <span className="font-medium tabular-nums">
                  {Math.round(macro.value)}g <span className="text-muted-foreground text-xs">/ {macro.target}g</span>
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

      {/* Water Intake  */}
      <div className="p-4 rounded-lg bg-info/5 border border-info/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-info" />
            <span className="text-sm font-semibold">Hydration</span>
          </div>
          <span className="text-xs font-medium text-info">
            {waterConsumed} / {targets.waterGlasses} glasses
          </span>
        </div>

        <div className="flex gap-1.5">
          {Array.from({ length: targets.waterGlasses }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-colors duration-500 ${
                i < waterConsumed ? "bg-info shadow-[0_0_8px_rgba(var(--info),0.4)]" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}