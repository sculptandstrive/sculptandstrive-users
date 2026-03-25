import { useState, useEffect, useCallback, useMemo } from "react";
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
  Goal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FoodSearch } from "@/components/nutrition/FoodSearch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import WaterLog from "@/components/nutrition/WaterLog";
import MacroData from "@/components/MacroData";
import BMRData from "@/components/BMRData";
import ReadoutCard from "@/components/ReadoutCard";
import ProgressBar from "@/components/ProgressBar";

// IMPORT DYNAMIC UTILS
import {
  calculateNutritionTotals,
  getNutritionGoals,
} from "@/utils/nutritionCalculations";
import { Input } from "@/components/ui/input";

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
  protein_requirement: number;
  carbs_requirement: number;
  fats_requirement: number;
  water_requirement: number;
}

interface AssignedPlan {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  water: number;
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
  mid_morning_snack: "11:00 AM",
  lunch: "1:00 PM",
  evening_snack: "4:00 PM",
  dinner: "7:00 PM",
};

const BMI_SEGMENTS = [
  { label: "Underweight", color: "hsl(190, 90%, 50%)", threshold: 18.5 },
  { label: "Normal", color: "hsl(150, 60%, 45%)", threshold: 25 },
  { label: "Overweight", color: "hsl(40, 90%, 55%)", threshold: 30 },
  { label: "Obese", color: "hsl(0, 84%, 60%)", threshold: 40 },
];

export default function Nutrition() {
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [waterIntake, setWaterIntake] = useState<WaterIntake[]>([]);
  const [nutritionRequirement, setNutritionRequirement] =
    useState<NutritionRequirement | null>(null);
  const [draftRequirement, setDraftRequirement] =
    useState<NutritionRequirement | null>(null);
  const [assignedPlan, setAssignedPlan] = useState<AssignedPlan | null>(null);
  const [searchMealType, setSearchMealType] = useState<string | null>(null);
  const [waterBar, setWaterBar] = useState<boolean>(false);
  const [macroResult, setMacroResult] = useState<any>(null);
  const [bmi, setbmi] = useState<number>(null);
  const [bmr, setbmr] = useState<number>(null);
  const [bmrUnit, setBmrUnit] = useState<string>(null);
  const [tdee, settdee] = useState<number>(null);
  const [bodyFat, setBodyFat] = useState<number>(null);
  const [bodyFatType, setBodyFatType] = useState<string>(null);
  const [idealWeight, setIdealWeight] = useState<string>(null);
  const [idealWeightType, setIdealWeightType] = useState<string>(null);
  const { user } = useAuth();
  const { toast } = useToast();

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

  const today = new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const [
        logsResult,
        waterResult,
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

      setNutritionLogs(logsResult.data || []);
      setWaterIntake(waterResult.data || []);
      // console.log(nutritionRequired)
      const fetchedReq = nutritionRequired?.data || null;
      setNutritionRequirement(fetchedReq);
      setDraftRequirement(fetchedReq);
      setMacroResult(macroData?.data?.result || null);
      setbmi(hfData?.data?.bmi);
      setbmr(hfData?.data?.bmr);
      setBmrUnit(hfData?.data?.bmr_unit);
      setBodyFat(hfData?.data?.body_fat);
      setBodyFatType(hfData?.data?.body_fat_type);
      if (hfData?.data.ideal_weight !== null) {
        setIdealWeight(hfData.data.ideal_weight.split(" ")[0] || null);
        setIdealWeightType(hfData?.data?.ideal_weight.split(" ")[1] || null);
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
        setDraftRequirement({
          calories_requirement: p.calories,
          protein_requirement: p.protein,
          fats_requirement: p.fats,
          carbs_requirement: p.carbs,
          water_requirement: p.water,
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
  const nutritionRequirementFixed = { ...nutritionRequirement };
  const dynamicGoals = getNutritionGoals(
    assignedPlan,
    nutritionRequirementFixed,
  );

  const totalWaterMl = waterIntake.reduce((sum, w) => sum + w.amount_ml, 0);
  const totalLitres = (totalWaterMl / 1000).toFixed(2);
  const waterTargetMl =
    assignedPlan?.water || nutritionRequirement?.water_requirement || 3000;
  const waterProgress = Math.min((totalWaterMl / waterTargetMl) * 100, 100);

  const getMealTypeByTime = () => {
    const hour = new Date().getHours(); // 0–23

    if (hour >= 3 && hour < 8) {
      return "breakfast";
    }

    if (hour >= 11 && hour < 13) {
      return "mid_morning_snack";
    }

    if (hour >= 13 && hour < 16) {
      return "lunch";
    }

    if (hour >= 16 && hour < 19) {
      return "evening_snack";
    }

    if (hour >= 19 || hour < 3) {
      return "dinner";
    }

    // fallback
    return "breakfast";
  };

  const deleteFood = async (id: string) => {
    try {
      const { error } = await supabase
        .from("nutrition_logs")
        .delete()
        .eq("id", id);
      if (error) throw error;
      fetchData();
      toast({ title: "Food removed" });
    } catch (error) {
      console.error("Error deleting food:", error);
    }
  };

  const updateNutritionRequirements = async () => {
    try {
      if (assignedPlan) {
        toast({
          title: "You are not allowed",
          description: "You have been assigned with a diet plan",
          variant: "destructive",
        });
        return;
      }

      if (
        draftRequirement.calories_requirement > 6000 ||
        draftRequirement.calories_requirement < 1200
      ) {
        toast({
          title: "Validation Error",
          description: "Calories range is between 1200g to 6000g",
          variant: "destructive",
        });
        return;
      } else if (
        draftRequirement.protein_requirement > 400 ||
        draftRequirement.protein_requirement < 0
      ) {
        toast({
          title: "Validation Error",
          description: "Protein range is between 0g to 400g",
          variant: "destructive",
        });
        return;
      } else if (
        draftRequirement.fats_requirement > 400 ||
        draftRequirement.fats_requirement < 0
      ) {
        toast({
          title: "Validation Error",
          description: "Fats range is between 0 to 400",
          variant: "destructive",
        });
        return;
      } else if (
        draftRequirement.carbs_requirement > 600 ||
        draftRequirement.carbs_requirement < 100
      ) {
        toast({
          title: "Validation Error",
          description: "Carbs range is between 100g to 600g",
          variant: "destructive",
        });
        return;
      } else if (
        draftRequirement.water_requirement > 12000 ||
        draftRequirement.water_requirement < 1000
      ) {
        toast({
          title: "Validation Error",
          description: "Water range is between 1000ml to 12000ml",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("nutrition_requirements")
        .update(draftRequirement)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Diet Plan Updated",
        description: "You have updated your diet plan.",
      });
      setNutritionRequirement(draftRequirement);
    } catch (error) {
      console.error("Error while updating requirements", error);
    }
  };

  const handleNutritionChange = (field: string, value: number) => {
    if (assignedPlan) {
      toast({
        title: "You are not allowed",
        description: "You have been assigned with a diet plan",
        variant: "destructive",
      });
      return;
    }
    setDraftRequirement((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const nutritionGoals = {
    calories: { current: totals.calories, target: dynamicGoals.calories },
    protein: { current: totals.protein, target: dynamicGoals.protein },
    carbs: { current: totals.carbs, target: dynamicGoals.carbs },
    fats: { current: totals.fats, target: dynamicGoals.fats },
  };

  const mealTypes = [
    "breakfast",
    "mid_morning_snack",
    "lunch",
    "evening_snack",
    "dinner",
  ] as const;

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
          <h1 className="text-3xl font-display font-bold mb-1">
            Nutrition Tracking
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground">
              Monitor your diet and stay on track
            </p>
            {assignedPlan && (
              <Badge className="bg-primary/10 text-primary border-primary/20">
                <Target className="w-3 h-3 mr-1" />
                Plan: {assignedPlan.name}
              </Badge>
            )}
          </div>
        </div>
        <Button
          onClick={() => setSearchMealType(getMealTypeByTime())}
          className="bg-gradient-primary hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Quick Log
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Daily Summary Circle, Macros & Goals*/}
        <div className="flex flex-col gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 h-fit"
          >
            <div className="flex items-center gap-2 mb-6">
              <Apple className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-lg">
                Daily Summary
              </h3>
            </div>

            <div className="flex items-center justify-center mb-8">
              <div className="relative w-44 h-44">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 176 176"
                >
                  <circle
                    cx="88"
                    cy="88"
                    r="76"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="12"
                  />
                  <motion.circle
                    cx="88"
                    cy="88"
                    r="76"
                    fill="none"
                    stroke="url(#calorieGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 478 }}
                    animate={{
                      strokeDashoffset:
                        478 -
                        Math.min(
                          nutritionGoals.calories.current /
                            (nutritionGoals.calories.target || 1),
                          1,
                        ) *
                          478,
                    }}
                    style={{ strokeDasharray: 478 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient
                      id="calorieGradient"
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
              {["protein", "carbs", "fats"].map((macro) => {
                const m = nutritionGoals[macro as keyof typeof nutritionGoals];
                const percentage = Math.min(
                  (m.current / (m.target || 1)) * 100,
                  100,
                );

                return (
                  <div key={macro}>
                    <div className="flex justify-between text-xs mb-2 uppercase font-bold tracking-tight">
                      <span className="text-muted-foreground">{macro}</span>
                      <span className="tabular-nums">
                        {Math.round(m.current)}g{" "}
                        <span className="text-muted-foreground font-normal">
                          / {m.target}g
                        </span>
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className={`h-1.5 ${macro === "carbs" ? "[&>div]:bg-info" : macro === "fats" ? "[&>div]:bg-accent" : ""}`}
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
                <span className="text-xs font-bold font-mono">
                  {totalLitres}L / {(waterTargetMl / 1000).toFixed(2)}L
                </span>
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 h-fit"
          >
            <div className="flex items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-2">
                <Goal className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold text-lg">
                  Custom Goal Target
                </h3>
              </div>
              <Button onClick={updateNutritionRequirements}>Save</Button>
            </div>

            {/* Macro Progress Bars */}

            <div className="w-full flex flex-col gap-4 text-xs font-bold tracking-tight uppercase text-muted-foreground">
              <div className="flex justify-between">
                <p>Calories (g)</p>
                <Input
                  type="number"
                  className="h-7 w-40 md:w-12 lg:w-24 bg-[#161b22] border-slate-800 text-[11px] md:text-[12px] p-1 text-center font-bold"
                  min={1400}
                  value={draftRequirement?.calories_requirement ?? 100}
                  onChange={(e) => {
                    handleNutritionChange(
                      "calories_requirement",
                      Number(e.target.value),
                    );
                  }}
                />
              </div>
              <div className="flex justify-between">
                <p>Protein (g)</p>
                <Input
                  type="number"
                  className="h-7 w-40 md:w-12 lg:w-24 bg-[#161b22] border-slate-800 text-[11px] md:text-[12px] p-1 text-center font-bold"
                  min={24}
                  value={draftRequirement?.protein_requirement ?? 100}
                  onChange={(e) => {
                    handleNutritionChange(
                      "protein_requirement",
                      Number(e.target.value),
                    );
                  }}
                />
              </div>
              <div className="flex justify-between">
                <p>Carbs (g)</p>
                <Input
                  type="number"
                  className="h-7 w-40 md:w-12 lg:w-24 bg-[#161b22] border-slate-800 text-[11px] md:text-[12px] p-1 text-center font-bold"
                  min={130}
                  value={draftRequirement?.carbs_requirement ?? 150}
                  onChange={(e) => {
                    handleNutritionChange(
                      "carbs_requirement",
                      Number(e.target.value),
                    );
                  }}
                />
              </div>
              <div className="flex justify-between">
                <p>Fats (g)</p>
                <Input
                  type="number"
                  className="h-7 w-40 md:w-12 lg:w-24 bg-[#161b22] border-slate-800 text-[11px] md:text-[12px] p-1 text-center font-bold"
                  min={20}
                  value={draftRequirement?.fats_requirement ?? 50}
                  onChange={(e) => {
                    handleNutritionChange(
                      "fats_requirement",
                      Number(e.target.value),
                    );
                  }}
                />
              </div>
              <div className="flex justify-between">
                <p>Water (ml)</p>
                <Input
                  type="number"
                  className="h-7 w-40 md:w-12 lg:w-24 bg-[#161b22] border-slate-800 text-[11px] md:text-[12px] p-1 text-center font-bold"
                  min={20}
                  value={draftRequirement?.water_requirement ?? 50}
                  onChange={(e) => {
                    handleNutritionChange(
                      "water_requirement",
                      Number(e.target.value),
                    );
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right - Meals Sections */}
        <div className="lg:col-span-2 space-y-4">
          {mealGroups.map((meal, idx) => {
            const MealIcon = meal.icon;
            const mealCals = meal.items.reduce(
              (sum, item) => sum + item.calories,
              0,
            );

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
                      <h3 className="font-bold capitalize text-sm">
                        {meal.type.replace(/_/g, " ")}
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {meal.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">
                      {Math.round(mealCals)}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">
                      kcal
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {meal.items.length > 0 ? (
                    meal.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 group border border-transparent hover:border-border transition-all"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">
                            {item.meal_name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {item.calories} kcal • P: {item.protein_g}g • C:{" "}
                            {item.carbs_g}g
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
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                        No items logged
                      </p>
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
                  Log {meal.type.replace(/_/g, " ")}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-8 space-y-6">
        <div className="flex flex-col gap-8 md:gap-0 md:flex-row justify-around">
          {macroResult && <MacroData result={macroResult} />}
          {bmr && <BMRData bmr={bmr} resultUnit={bmrUnit} />}
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4">
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
            waterRequirement={
              assignedPlan?.water || nutritionRequirement?.water_requirement
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}
