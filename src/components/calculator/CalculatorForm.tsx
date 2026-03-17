import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface FormData {
  unit: "us" | "metric";
  age: number;
  gender: "male" | "female";
  heightFt: number;
  heightIn: number;
  weight: number;
  activity: string;
  goal: string;
}

interface Props {
  onCalculate: (data: FormData) => void;
}

export function CalculatorForm({ onCalculate }: Props) {
  const [unit, setUnit] = useState<"us" | "metric">("us");
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [heightFt, setHeightFt] = useState(unit === "us" ? 5 : 170);
  const [heightIn, setHeightIn] = useState(10);
  const [weight, setWeight] = useState(unit === "us" ? 160 : 73);
  const [activity, setActivity] = useState("moderate");
  const [goal, setGoal] = useState("maintain");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate({ unit, age, gender, heightFt, heightIn, weight, activity, goal });
  };

  const activityOptions = [
    { value: "bmr", label: "BMR", desc: "Basal Metabolic Rate" },
    { value: "sedentary", label: "Sedentary", desc: "Little or no exercise" },
    { value: "light", label: "Light", desc: "Exercise 1-3 times/week" },
    { value: "moderate", label: "Moderate", desc: "Exercise 4-5 times/week" },
    { value: "active", label: "Active", desc: "Daily exercise or intense 3-4x/week" },
    { value: "veryActive", label: "Very Active", desc: "Intense exercise 6-7 times/week" },
    { value: "extraActive", label: "Extra Active", desc: "Very intense daily, or physical job" },
  ];

  const goalOptions = [
    { value: "maintain", label: "Maintain weight" },
    { value: "mildLoss", label: "Mild weight loss (0.5 lb/week)" },
    { value: "loss", label: "Weight loss (1 lb/week)" },
    { value: "extremeLoss", label: "Extreme weight loss (2 lb/week)" },
    { value: "mildGain", label: "Mild weight gain (0.5 lb/week)" },
    { value: "gain", label: "Weight gain (1 lb/week)" },
    { value: "extremeGain", label: "Extreme weight gain (2 lb/week)" },
  ];

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
      {/* Unit Toggle */}
      <div className="flex rounded-full bg-muted p-1 gap-1">
        {(["us", "metric"] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => {
              setUnit(u);
              if (u === "us") { setHeightFt(5); setHeightIn(10); setWeight(160); }
              else { setHeightFt(170); setHeightIn(0); setWeight(73); }
            }}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition-all ${
              unit === u ? "bg-primary shadow-sm text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {u === "us" ? "US Units" : "Metric"}
          </button>
        ))}
      </div>

      {/* Age */}
      <div>
        <label className="text-sm font-medium text-foreground">Age</label>
        <input type="number" min={18} max={80} value={age} onChange={(e) => setAge(+e.target.value)} className={inputClass} />
        <p className="mt-1 text-xs text-muted-foreground">Ages 18–80</p>
      </div>

      {/* Gender */}
      <div>
        <label className="text-sm font-medium text-foreground">Gender</label>
        <div className="mt-1.5 flex rounded-full bg-muted p-1 gap-1">
          {(["male", "female"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition-all capitalize ${
                gender === g ? "bg-primary shadow-sm text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Height */}
      <div>
        <label className="text-sm font-medium text-foreground">Height</label>
        {unit === "us" ? (
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            <div>
              <input type="number" min={1} max={8} value={heightFt} onChange={(e) => setHeightFt(+e.target.value)} className={inputClass} />
              <span className="text-xs text-muted-foreground">feet</span>
            </div>
            <div>
              <input type="number" min={0} max={11} value={heightIn} onChange={(e) => setHeightIn(+e.target.value)} className={inputClass} />
              <span className="text-xs text-muted-foreground">inches</span>
            </div>
          </div>
        ) : (
          <div className="mt-1.5">
            <input type="number" min={100} max={250} value={heightFt} onChange={(e) => setHeightFt(+e.target.value)} className={inputClass} />
            <span className="text-xs text-muted-foreground">cm</span>
          </div>
        )}
      </div>

      {/* Weight */}
      <div>
        <label className="text-sm font-medium text-foreground">Weight</label>
        <input
          type="number"
          min={1}
          value={weight}
          onChange={(e) => setWeight(+e.target.value)}
          className={`mt-1.5 ${inputClass}`}
        />
        <span className="text-xs text-muted-foreground">{unit === "us" ? "pounds" : "kg"}</span>
      </div>

      {/* Activity */}
      <div>
        <label className="text-sm font-medium text-foreground">Activity Level</label>
        <select value={activity} onChange={(e) => setActivity(e.target.value)} className={`mt-1.5 ${inputClass}`}>
          {activityOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}: {o.desc}
            </option>
          ))}
        </select>
      </div>

      {/* Goal */}
      <div>
        <label className="text-sm font-medium text-foreground">Your Goal</label>
        <select value={goal} onChange={(e) => setGoal(e.target.value)} className={`mt-1.5 ${inputClass}`}>
          {goalOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" size="lg" className="w-full text-base font-semibold">
        Calculate
      </Button>
    </form>
  );
}
