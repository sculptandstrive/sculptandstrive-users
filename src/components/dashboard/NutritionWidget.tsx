import { motion } from "framer-motion";
import { Apple, Droplets } from "lucide-react";

const macros = [
  { name: "Protein", value: 120, target: 150, color: "bg-primary" },
  { name: "Carbs", value: 180, target: 250, color: "bg-info" },
  { name: "Fats", value: 55, target: 70, color: "bg-accent" },
];

export function NutritionWidget() {
  const caloriesConsumed = 1650;
  const caloriesTarget = 2200;
  const caloriesPercent = (caloriesConsumed / caloriesTarget) * 100;

  const waterIntake = 6;
  const waterTarget = 8;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Apple className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">Today's Nutrition</h3>
      </div>

      {/* Calories Circle */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90">
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
              initial={{ strokeDasharray: "0 440" }}
              animate={{ strokeDasharray: `${caloriesPercent * 4.4} 440` }}
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
            <span className="text-3xl font-display font-bold">{caloriesConsumed}</span>
            <span className="text-sm text-muted-foreground">/ {caloriesTarget} kcal</span>
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="space-y-4 mb-6">
        {macros.map((macro) => (
          <div key={macro.name}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">{macro.name}</span>
              <span className="font-medium">{macro.value}g / {macro.target}g</span>
            </div>
            <div className="progress-bar">
              <motion.div
                className={`progress-fill ${macro.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${(macro.value / macro.target) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ background: undefined }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Water Intake */}
      <div className="p-4 rounded-lg bg-info/10 border border-info/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-info" />
            <span className="font-medium">Hydration</span>
          </div>
          <span className="text-sm text-muted-foreground">{waterIntake}/{waterTarget} glasses</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: waterTarget }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className={`flex-1 h-3 rounded-full ${
                i < waterIntake ? "bg-info" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
