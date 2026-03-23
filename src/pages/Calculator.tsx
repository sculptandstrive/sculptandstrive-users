import { useState } from "react";
import { motion } from "framer-motion";
import MacroCalculator from "@/components/calculator/MacroCalculator";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type UnitSystem = "us" | "metric";
type Gender = "male" | "female";
type Formula = "mifflin" | "harris" | "katch";
type FormErrors = Partial<Record<string, string>>;

const ACTIVITY_LEVELS = [
  { label: "Sedentary: little or no exercise", factor: 1.2 },
  { label: "Exercise 1-3 times/week", factor: 1.375 },
  { label: "Exercise 4-5 times/week", factor: 1.465 },
  { label: "Daily exercise or intense exercise 3-4 times/week", factor: 1.55 },
  { label: "Intense exercise 6-7 times/week", factor: 1.725 },
  { label: "Very intense exercise daily, or physical job", factor: 1.9 },
];

function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  formula: Formula,
  bodyFatPct?: number,
): number {
  switch (formula) {
    case "mifflin":
      return gender === "male"
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    case "harris":
      return gender === "male"
        ? 13.397 * weightKg + 4.799 * heightCm - 5.677 * age + 88.362
        : 9.247 * weightKg + 3.098 * heightCm - 4.33 * age + 447.593;
    case "katch":
      if (bodyFatPct === undefined) return 0;
      const leanMass = weightKg * (1 - bodyFatPct / 100);
      return 370 + 21.6 * leanMass;
    default:
      return 0;
  }
}

function validateInputs(
  unitSystem: UnitSystem,
  formula: Formula,
  age: string,
  heightFeet: string,
  heightInches: string,
  weightLbs: string,
  heightCm: string,
  weightKg: string,
  bodyFatPct: string,
): FormErrors {
  const errors: FormErrors = {};

  const ageNum = parseInt(age);
  if (!age.trim()) {
    errors.age = "Age is required.";
  } else if (isNaN(ageNum) || ageNum < 15 || ageNum > 80) {
    errors.age = "Age must be between 15 and 80.";
  }

  if (unitSystem === "us") {
    const feet = parseInt(heightFeet);
    if (!heightFeet.trim()) {
      errors.heightFeet = "Feet is required.";
    } else if (isNaN(feet) || feet < 1 || feet > 8) {
      errors.heightFeet = "Enter a valid feet value (1–8).";
    }

    const inches = parseInt(heightInches);
    if (!heightInches.trim()) {
      errors.heightInches = "Inches is required.";
    } else if (isNaN(inches) || inches < 0 || inches > 11) {
      errors.heightInches = "Inches must be 0–11.";
    }

    const lbs = parseFloat(weightLbs);
    if (!weightLbs.trim()) {
      errors.weightLbs = "Weight is required.";
    } else if (isNaN(lbs) || lbs < 50 || lbs > 1000) {
      errors.weightLbs = "Enter a valid weight (50–1000 lbs).";
    }
  } else {
    const cm = parseFloat(heightCm);
    if (!heightCm.trim()) {
      errors.heightCm = "Height is required.";
    } else if (isNaN(cm) || cm < 50 || cm > 300) {
      errors.heightCm = "Enter a valid height (50–300 cm).";
    }

    const kg = parseFloat(weightKg);
    if (!weightKg.trim()) {
      errors.weightKg = "Weight is required.";
    } else if (isNaN(kg) || kg < 20 || kg > 500) {
      errors.weightKg = "Enter a valid weight (20–500 kg).";
    }
  }

  if (formula === "katch") {
    const bf = parseFloat(bodyFatPct);
    if (!bodyFatPct.trim()) {
      errors.bodyFatPct = "Body fat % is required for this formula.";
    } else if (isNaN(bf) || bf < 1 || bf > 70) {
      errors.bodyFatPct = "Body fat % must be between 1 and 70.";
    }
  }

  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

export default function Calculator() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("us");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState("30");
  const [heightFeet, setHeightFeet] = useState("5");
  const [heightInches, setHeightInches] = useState("6");
  const [weightLbs, setWeightLbs] = useState("170");
  const [heightCm, setHeightCm] = useState("168");
  const [weightKg, setWeightKg] = useState("77");
  const [formula, setFormula] = useState<Formula>("mifflin");
  const [bodyFatPct, setBodyFatPct] = useState("");
  const [resultUnit, setResultUnit] = useState<"cal" | "kj">("cal");
  const [bmr, setBmr] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false); // ← key: tracks first submit

  const { user } = useAuth();

  // Runs full validation and updates errors, but ONLY after first submit
  const revalidate = (
    overrides: Partial<{
      unitSystem: UnitSystem;
      formula: Formula;
      age: string;
      heightFeet: string;
      heightInches: string;
      weightLbs: string;
      heightCm: string;
      weightKg: string;
      bodyFatPct: string;
    }> = {},
  ) => {
    if (!submitted) return; // no errors before first submit
    setErrors(
      validateInputs(
        overrides.unitSystem ?? unitSystem,
        overrides.formula ?? formula,
        overrides.age ?? age,
        overrides.heightFeet ?? heightFeet,
        overrides.heightInches ?? heightInches,
        overrides.weightLbs ?? weightLbs,
        overrides.heightCm ?? heightCm,
        overrides.weightKg ?? weightKg,
        overrides.bodyFatPct ?? bodyFatPct,
      ),
    );
  };

  const handleCalculate = () => {
    setSubmitted(true); // first submit — turn on live validation from here

    const validationErrors = validateInputs(
      unitSystem,
      formula,
      age,
      heightFeet,
      heightInches,
      weightLbs,
      heightCm,
      weightKg,
      bodyFatPct,
    );

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const ageNum = parseInt(age);
    let wKg: number, hCm: number;

    if (unitSystem === "us") {
      wKg = parseFloat(weightLbs) * 0.453592;
      hCm = (parseInt(heightFeet) * 12 + parseInt(heightInches)) * 2.54;
    } else {
      wKg = parseFloat(weightKg);
      hCm = parseFloat(heightCm);
    }

    const result = calculateBMR(
      wKg,
      hCm,
      ageNum,
      gender,
      formula,
      bodyFatPct ? parseFloat(bodyFatPct) : undefined,
    );

    setBmr(Math.round(result));
  };

  const displayValue = (val: number) => {
    const converted = resultUnit === "kj" ? Math.round(val * 4.184) : val;
    return converted.toLocaleString();
  };

  const handleBMRSave = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to save your results.",
        variant: "destructive",
      });
      return;
    }
    if (bmr === null) {
      toast({
        title: "Nothing to save",
        description: "Calculate your BMR first.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("hf_data")
      .upsert(
        { bmr, bmr_unit: resultUnit, user_id: user.id },
        { onConflict: "user_id" },
      );

    if (error) {
      toast({
        title: "Failed to update BMR",
        description: "Server error",
        variant: "destructive",
      });
      console.error(error);
      return;
    }

    toast({ title: "Saved BMR Successfully" });
  };

  const unitLabel = resultUnit === "kj" ? "kJ/day" : "Calories/day";

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
            BMR Calculator
          </h1>
          <p className="text-muted-foreground mb-8 max-w-full leading-relaxed">
            The Basal Metabolic Rate (BMR) Calculator estimates your basal
            metabolic rate—the amount of energy expended while at rest in a
            neutrally temperate environment, and in a post-absorptive state
            (meaning that the digestive system is inactive, which requires about
            12 hours of fasting).
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border p-6 space-y-5">
                {/* Unit Toggle */}
                <div className="flex rounded-lg border overflow-hidden">
                  {(["us", "metric"] as UnitSystem[]).map((u) => (
                    <button
                      key={u}
                      onClick={() => {
                        setUnitSystem(u);
                        revalidate({ unitSystem: u });
                      }}
                      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                        unitSystem === u
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {u === "us" ? "US Units" : "Metric Units"}
                    </button>
                  ))}
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Age
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={15}
                      max={80}
                      value={age}
                      onChange={(e) => {
                        setAge(e.target.value);
                        revalidate({ age: e.target.value });
                      }}
                      className={`w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.age ? "border-destructive" : ""}`}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      ages 15-80
                    </span>
                  </div>
                  <FieldError message={errors.age} />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Gender
                  </label>
                  <div className="flex rounded-lg border overflow-hidden">
                    {(["male", "female"] as Gender[]).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                          gender === g
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Height & Weight — US */}
                {unitSystem === "us" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Height
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={heightFeet}
                              onChange={(e) => {
                                setHeightFeet(e.target.value);
                                revalidate({ heightFeet: e.target.value });
                              }}
                              className={`w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.heightFeet ? "border-destructive" : ""}`}
                            />
                            <span className="text-sm text-muted-foreground">
                              ft
                            </span>
                          </div>
                          <FieldError message={errors.heightFeet} />
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={heightInches}
                              onChange={(e) => {
                                setHeightInches(e.target.value);
                                revalidate({ heightInches: e.target.value });
                              }}
                              className={`w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.heightInches ? "border-destructive" : ""}`}
                            />
                            <span className="text-sm text-muted-foreground">
                              in
                            </span>
                          </div>
                          <FieldError message={errors.heightInches} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Weight
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={weightLbs}
                          onChange={(e) => {
                            setWeightLbs(e.target.value);
                            revalidate({ weightLbs: e.target.value });
                          }}
                          className={`w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.weightLbs ? "border-destructive" : ""}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          lbs
                        </span>
                      </div>
                      <FieldError message={errors.weightLbs} />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Height
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={heightCm}
                          onChange={(e) => {
                            setHeightCm(e.target.value);
                            revalidate({ heightCm: e.target.value });
                          }}
                          className={`w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.heightCm ? "border-destructive" : ""}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          cm
                        </span>
                      </div>
                      <FieldError message={errors.heightCm} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Weight
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={weightKg}
                          onChange={(e) => {
                            setWeightKg(e.target.value);
                            revalidate({ weightKg: e.target.value });
                          }}
                          className={`w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.weightKg ? "border-destructive" : ""}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          kg
                        </span>
                      </div>
                      <FieldError message={errors.weightKg} />
                    </div>
                  </>
                )}

                {/* Settings */}
                <div>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {showSettings ? "− Settings" : "+ Settings"}
                  </button>
                  {showSettings && (
                    <div className="mt-3 space-y-4 border-t pt-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Results unit
                        </label>
                        <div className="flex gap-4">
                          {(["cal", "kj"] as const).map((u) => (
                            <label
                              key={u}
                              className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer"
                            >
                              <input
                                type="radio"
                                checked={resultUnit === u}
                                onChange={() => setResultUnit(u)}
                                className="accent-primary"
                              />
                              {u === "cal" ? "Calories" : "Kilojoules"}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          BMR estimation formula
                        </label>
                        <div className="space-y-1.5">
                          {(["mifflin", "harris", "katch"] as Formula[]).map(
                            (f) => (
                              <label
                                key={f}
                                className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  checked={formula === f}
                                  onChange={() => {
                                    setFormula(f);
                                    revalidate({ formula: f });
                                  }}
                                  className="accent-primary"
                                />
                                {f === "mifflin"
                                  ? "Mifflin-St Jeor"
                                  : f === "harris"
                                    ? "Revised Harris-Benedict"
                                    : "Katch-McArdle"}
                              </label>
                            ),
                          )}
                        </div>
                      </div>
                      {formula === "katch" && (
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">
                            Body Fat %
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={bodyFatPct}
                              onChange={(e) => {
                                setBodyFatPct(e.target.value);
                                revalidate({ bodyFatPct: e.target.value });
                              }}
                              placeholder="e.g. 20"
                              className={`w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.bodyFatPct ? "border-destructive" : ""}`}
                            />
                            <span className="text-sm text-muted-foreground">
                              %
                            </span>
                          </div>
                          <FieldError message={errors.bodyFatPct} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Calculate Button */}
                <button
                  onClick={handleCalculate}
                  className="w-full bg-accent text-accent-foreground font-display font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Calculate
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              {bmr !== null ? (
                <div className="animate-fade-in space-y-6">
                  <div>
                    <div className="flex flex-row justify-between">
                      <h2 className="text-xl font-display font-bold text-foreground mb-3">
                        Result
                      </h2>
                      <Button onClick={handleBMRSave}>Save</Button>
                    </div>
                    <div className="result-card">
                      <p className="text-muted-foreground text-sm">
                        Your Basal Metabolic Rate
                      </p>
                      <p className="text-4xl font-display font-bold text-primary mt-1">
                        {displayValue(bmr)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {unitLabel}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-display font-semibold text-foreground mb-3">
                      Daily calorie needs based on activity level
                    </h3>
                    <div className="bg-card rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left px-4 py-3 font-semibold text-foreground">
                              Activity Level
                            </th>
                            <th className="text-right px-4 py-3 font-semibold text-foreground">
                              {resultUnit === "kj" ? "kJ" : "Calorie"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {ACTIVITY_LEVELS.map((level, i) => (
                            <tr
                              key={i}
                              className={i % 2 === 1 ? "table-stripe" : ""}
                            >
                              <td className="px-4 py-3 text-foreground">
                                {level.label}
                              </td>
                              <td className="px-4 py-3 text-right font-display font-semibold text-foreground">
                                {displayValue(Math.round(bmr * level.factor))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Exercise:</strong>{" "}
                        15-30 minutes of elevated heart rate activity.
                      </p>
                      <p>
                        <strong className="text-foreground">
                          Intense exercise:
                        </strong>{" "}
                        45-120 minutes of elevated heart rate activity.
                      </p>
                      <p>
                        <strong className="text-foreground">
                          Very intense exercise:
                        </strong>{" "}
                        2+ hours of elevated heart rate activity.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[300px] bg-card rounded-lg border">
                  <p className="text-muted-foreground text-sm">
                    Enter your details and click Calculate to see results.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto">
          <MacroCalculator />
        </div>
      </motion.div>
    </div>
  );
}
