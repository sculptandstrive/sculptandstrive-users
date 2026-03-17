import { useState } from "react";
import { motion } from "framer-motion";
import MacroCalculator from "@/components/calculator/MacroCalculator";

type UnitSystem = "us" | "metric";
type Gender = "male" | "female";
type Formula = "mifflin" | "harris" | "katch";

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

  const handleCalculate = () => {
    const ageNum = parseInt(age);
    let wKg: number, hCm: number;

    if (unitSystem === "us") {
      wKg = parseFloat(weightLbs) * 0.453592;
      hCm = (parseInt(heightFeet) * 12 + parseInt(heightInches)) * 2.54;
    } else {
      wKg = parseFloat(weightKg);
      hCm = parseFloat(heightCm);
    }

    if (isNaN(ageNum) || isNaN(wKg) || isNaN(hCm) || ageNum < 15 || ageNum > 80)
      return;
    if (formula === "katch" && !bodyFatPct) return;

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

  const unitLabel = resultUnit === "kj" ? "kJ/day" : "Calories/day";

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3 text-center">
            BMR Calculator
          </h1>
          <p className="text-muted-foreground mb-8 max-w-full leading-relaxed text-center">
            The Basal Metabolic Rate (BMR) Calculator estimates your basal
            metabolic rate—the amount of energy expended while at rest in a
            neutrally temperate environment, and in a post-absorptive state
            (meaning that the digestive system is inactive, which requires about
            12 hours of fasting).
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Input Form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border p-6 space-y-5">
                {/* Unit Toggle */}
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    onClick={() => setUnitSystem("us")}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      unitSystem === "us"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    US Units
                  </button>
                  <button
                    onClick={() => setUnitSystem("metric")}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      unitSystem === "metric"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    Metric Units
                  </button>
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
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      ages 15-80
                    </span>
                  </div>
                </div>

                {/* Gender Toggle */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Gender
                  </label>
                  <div className="flex rounded-lg border overflow-hidden">
                    <button
                      onClick={() => setGender("male")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        gender === "male"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      Male
                    </button>
                    <button
                      onClick={() => setGender("female")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        gender === "female"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>

                {/* Height & Weight */}
                {unitSystem === "us" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Height
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-1.5">
                          <input
                            type="number"
                            value={heightFeet}
                            onChange={(e) => setHeightFeet(e.target.value)}
                            className="w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <span className="text-sm text-muted-foreground">
                            ft
                          </span>
                        </div>
                        <div className="flex-1 flex items-center gap-1.5">
                          <input
                            type="number"
                            value={heightInches}
                            onChange={(e) => setHeightInches(e.target.value)}
                            className="w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <span className="text-sm text-muted-foreground">
                            in
                          </span>
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
                          onChange={(e) => setWeightLbs(e.target.value)}
                          className="w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <span className="text-sm text-muted-foreground">
                          lbs
                        </span>
                      </div>
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
                          onChange={(e) => setHeightCm(e.target.value)}
                          className="w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <span className="text-sm text-muted-foreground">
                          cm
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Weight
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={weightKg}
                          onChange={(e) => setWeightKg(e.target.value)}
                          className="w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <span className="text-sm text-muted-foreground">
                          kg
                        </span>
                      </div>
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
                          <label className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
                            <input
                              type="radio"
                              checked={resultUnit === "cal"}
                              onChange={() => setResultUnit("cal")}
                              className="accent-primary"
                            />
                            Calories
                          </label>
                          <label className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
                            <input
                              type="radio"
                              checked={resultUnit === "kj"}
                              onChange={() => setResultUnit("kj")}
                              className="accent-primary"
                            />
                            Kilojoules
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          BMR estimation formula
                        </label>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
                            <input
                              type="radio"
                              checked={formula === "mifflin"}
                              onChange={() => setFormula("mifflin")}
                              className="accent-primary"
                            />
                            Mifflin-St Jeor
                          </label>
                          <label className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
                            <input
                              type="radio"
                              checked={formula === "harris"}
                              onChange={() => setFormula("harris")}
                              className="accent-primary"
                            />
                            Revised Harris-Benedict
                          </label>
                          <label className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
                            <input
                              type="radio"
                              checked={formula === "katch"}
                              onChange={() => setFormula("katch")}
                              className="accent-primary"
                            />
                            Katch-McArdle
                          </label>
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
                              onChange={(e) => setBodyFatPct(e.target.value)}
                              placeholder="e.g. 20"
                              className="w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <span className="text-sm text-muted-foreground">
                              %
                            </span>
                          </div>
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
                    <h2 className="text-xl font-display font-bold text-foreground mb-3">
                      Result
                    </h2>
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

          {/* Info Section */}
          {/* <div className="mt-12 max-w-3xl space-y-6 text-sm text-muted-foreground leading-relaxed">
            <p>
              The basal metabolic rate (BMR) is the amount of energy needed
              while resting in a temperate environment when the digestive system
              is inactive. For most people, upwards of ~70% of total energy
              burned each day is due to upkeep. Physical activity makes up ~20%
              of expenditure and ~10% is used for the digestion of food, also
              known as thermogenesis.
            </p>

            <div>
              <h3 className="text-base font-display font-bold text-foreground mb-2">
                Formulas Used
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-foreground">
                    Mifflin-St Jeor Equation:
                  </p>
                  <p>Men: BMR = 10W + 6.25H − 5A + 5</p>
                  <p>Women: BMR = 10W + 6.25H − 5A − 161</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Revised Harris-Benedict Equation:
                  </p>
                  <p>Men: BMR = 13.397W + 4.799H − 5.677A + 88.362</p>
                  <p>Women: BMR = 9.247W + 3.098H − 4.330A + 447.593</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Katch-McArdle Formula:
                  </p>
                  <p>BMR = 370 + 21.6(1 − F)W</p>
                </div>
                <p className="text-xs">
                  W = weight (kg), H = height (cm), A = age, F = body fat (%)
                </p>
              </div>
            </div>
          </div> */}
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
