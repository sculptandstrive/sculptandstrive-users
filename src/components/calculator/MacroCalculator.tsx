import { useEffect, useState } from "react";
import { CalculatorForm, type FormData } from "./CalculatorForm";
import { MacroResults, type MacroResult } from "./MacroResults";
import { FoodTable } from "./FoodTable";
import { InfoSection } from "./InfoSection";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

function calculateMacros(data: FormData): MacroResult {
  const { age, gender, heightFt, heightIn, weight, activity, goal, unit } = data;

  let heightCm: number;
  let weightKg: number;

  if (unit === "us") {
    heightCm = (heightFt * 12 + heightIn) * 2.54;
    weightKg = weight * 0.453592;
  } else {
    heightCm = heightFt; // reusing heightFt as cm
    weightKg = weight;
  }

  // Mifflin-St Jeor
  let bmr: number;
  if (gender === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  const activityMultipliers: Record<string, number> = {
    bmr: 1,
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
    extraActive: 2.0,
  };

  const goalOffsets: Record<string, number> = {
    maintain: 0,
    mildLoss: -250,
    loss: -500,
    extremeLoss: -1000,
    mildGain: 250,
    gain: 500,
    extremeGain: 1000,
  };

  const tdee = bmr * (activityMultipliers[activity] || 1.2);
  const calories = Math.round(tdee + (goalOffsets[goal] || 0));

  return {
    calories,
    protein: { grams: Math.round(calories * 0.243 / 4), min: Math.round(calories * 0.118 / 4), max: Math.round(calories * 0.342 / 4) },
    carbs: { grams: Math.round(calories * 0.534 / 4), min: Math.round(calories * 0.427 / 4), max: Math.round(calories * 0.726 / 4) },
    fat: { grams: Math.round(calories * 0.253 / 9), min: Math.round(calories * 0.204 / 9), max: Math.round(calories * 0.356 / 9) },
    sugar: Math.round(calories * 0.1 / 4),
    saturatedFat: Math.round(calories * 0.1 / 9),
    kj: Math.round(calories * 4.184),
  };
}

export default function MacroCalculator() {
  const [result, setResult] = useState<MacroResult | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const {user} = useAuth();
  const handleCalculate = (data: FormData) => {
    setFormData(data);
    setResult(calculateMacros(data));
  };

   useEffect(() => {
     async function fetchSavedResult() {
       const { data, error } = await supabase
         .from("macro_result")
         .select(
           "result, unit, age, gender, height_cm, weight_kg, activity, goal",
         )
         .eq("user_id", user.id)
         .single();

       if (data && !error) {
         // Restore result from DB
         setResult(data.result as MacroResult);

         // Reconstruct formData from stored metric values
         setFormData({
           unit: data.unit,
           age: data.age,
           gender: data.gender,
           heightFt: data.height_cm, // stored as cm, metric mode uses heightFt field for cm
           heightIn: 0,
           weight: data.weight_kg,
           activity: data.activity,
           goal: data.goal,
         });
       }

       setLoading(false);
     }

     fetchSavedResult();
   }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className=" max-w-4xl py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 ">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            Macro Calculator
          </h1>
          <p className="mt-2 text-muted-foreground">
            Calculate your daily macronutrient needs based on your body metrics,
            activity level, and goals.
          </p>
        </div>

        {/* Calculator Layout */}
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <CalculatorForm
              onCalculate={handleCalculate}
              savedData={formData}
            />
          </div>
          <div className="lg:col-span-3">
            {result ? (
              <MacroResults result={result} formData={formData} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-card p-12">
                <p className="text-muted-foreground text-center">
                  Fill in your details and click <strong>Calculate</strong> to
                  see your macro breakdown.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Food Table */}
        <div className="mt-16">
          <FoodTable />
        </div>

        {/* Info */}
        <div className="mt-16">
          <InfoSection />
        </div>
      </div>
    </div>
  );
}
