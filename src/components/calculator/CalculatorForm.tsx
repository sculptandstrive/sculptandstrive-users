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

type FormErrors = Partial<Record<string, string>>;

function validateInputs(
  unit: "us" | "metric",
  age: number,
  heightFt: number,
  heightIn: number,
  weight: number,
): FormErrors {
  const errors: FormErrors = {};

  if (!age || isNaN(age) || age < 18 || age > 80) {
    errors.age = "Age must be between 18 and 80.";
  }

  if (unit === "us") {
    if (!heightFt || isNaN(heightFt) || heightFt < 1 || heightFt > 8) {
      errors.heightFt = "Feet must be between 1 and 8.";
    }
    if (isNaN(heightIn) || heightIn < 0 || heightIn > 11) {
      errors.heightIn = "Inches must be between 0 and 11.";
    }
    if (!weight || isNaN(weight) || weight < 50 || weight > 1000) {
      errors.weight = "Enter a valid weight (50–1000 lbs).";
    }
  } else {
    if (!heightFt || isNaN(heightFt) || heightFt < 100 || heightFt > 250) {
      errors.heightFt = "Height must be between 100 and 250 cm.";
    }
    if (!weight || isNaN(weight) || weight < 20 || weight > 500) {
      errors.weight = "Enter a valid weight (20–500 kg).";
    }
  }

  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

export function CalculatorForm({ onCalculate }: Props) {
  const [unit, setUnit] = useState<"us" | "metric">("us");
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(10);
  const [weight, setWeight] = useState(160);
  const [activity, setActivity] = useState("moderate");
  const [goal, setGoal] = useState("maintain");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false); // ← tracks first submit

  // Re-runs full validation — only after first submit
  const revalidate = (
    overrides: Partial<{
      unit: "us" | "metric";
      age: number;
      heightFt: number;
      heightIn: number;
      weight: number;
    }> = {},
  ) => {
    if (!submitted) return;
    setErrors(
      validateInputs(
        overrides.unit ?? unit,
        overrides.age ?? age,
        overrides.heightFt ?? heightFt,
        overrides.heightIn ?? heightIn,
        overrides.weight ?? weight,
      ),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true); // turn on live validation from here

    const validationErrors = validateInputs(
      unit,
      age,
      heightFt,
      heightIn,
      weight,
    );
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    onCalculate({
      unit,
      age,
      gender,
      heightFt,
      heightIn,
      weight,
      activity,
      goal,
    });
  };

  const handleUnitSwitch = (u: "us" | "metric") => {
    setUnit(u);
    if (u === "us") {
      setHeightFt(5);
      setHeightIn(10);
      setWeight(160);
    } else {
      setHeightFt(170);
      setHeightIn(0);
      setWeight(73);
    }
    revalidate({ unit: u });
  };

  const activityOptions = [
    { value: "bmr", label: "BMR", desc: "Basal Metabolic Rate" },
    { value: "sedentary", label: "Sedentary", desc: "Little or no exercise" },
    { value: "light", label: "Light", desc: "Exercise 1-3 times/week" },
    { value: "moderate", label: "Moderate", desc: "Exercise 4-5 times/week" },
    {
      value: "active",
      label: "Active",
      desc: "Daily exercise or intense 3-4x/week",
    },
    {
      value: "veryActive",
      label: "Very Active",
      desc: "Intense exercise 6-7 times/week",
    },
    {
      value: "extraActive",
      label: "Extra Active",
      desc: "Very intense daily, or physical job",
    },
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

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary ${
      hasError ? "border-destructive" : "border-input"
    }`;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5"
    >
      {/* Unit Toggle */}
      <div className="flex rounded-full bg-muted p-1 gap-1">
        {(["us", "metric"] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => handleUnitSwitch(u)}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition-all ${
              unit === u
                ? "bg-primary shadow-sm text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            {u === "us" ? "US Units" : "Metric"}
          </button>
        ))}
      </div>

      {/* Age */}
      <div>
        <label className="text-sm font-medium text-foreground">Age</label>
        <input
          type="number"
          min={18}
          max={80}
          value={age}
          onChange={(e) => {
            const val = +e.target.value;
            setAge(val);
            revalidate({ age: val });
          }}
          className={inputClass(!!errors.age)}
        />
        <FieldError message={errors.age} />
        {!errors.age && (
          <p className="mt-1 text-xs text-muted-foreground">Ages 18–80</p>
        )}
      </div>

      {/* Gender — no validation needed, always has a value */}
      <div>
        <label className="text-sm font-medium text-foreground">Gender</label>
        <div className="mt-1.5 flex rounded-full bg-muted p-1 gap-1">
          {(["male", "female"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition-all capitalize ${
                gender === g
                  ? "bg-primary shadow-sm text-primary-foreground"
                  : "text-muted-foreground"
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
              <input
                type="number"
                min={1}
                max={8}
                value={heightFt}
                onChange={(e) => {
                  const val = +e.target.value;
                  setHeightFt(val);
                  revalidate({ heightFt: val });
                }}
                className={inputClass(!!errors.heightFt)}
              />
              <span className="text-xs text-muted-foreground">feet</span>
              <FieldError message={errors.heightFt} />
            </div>
            <div>
              <input
                type="number"
                min={0}
                max={11}
                value={heightIn}
                onChange={(e) => {
                  const val = +e.target.value;
                  setHeightIn(val);
                  revalidate({ heightIn: val });
                }}
                className={inputClass(!!errors.heightIn)}
              />
              <span className="text-xs text-muted-foreground">inches</span>
              <FieldError message={errors.heightIn} />
            </div>
          </div>
        ) : (
          <div className="mt-1.5">
            <input
              type="number"
              min={100}
              max={250}
              value={heightFt}
              onChange={(e) => {
                const val = +e.target.value;
                setHeightFt(val);
                revalidate({ heightFt: val });
              }}
              className={inputClass(!!errors.heightFt)}
            />
            <span className="text-xs text-muted-foreground">cm</span>
            <FieldError message={errors.heightFt} />
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
          onChange={(e) => {
            const val = +e.target.value;
            setWeight(val);
            revalidate({ weight: val });
          }}
          className={`mt-1.5 ${inputClass(!!errors.weight)}`}
        />
        <span className="text-xs text-muted-foreground">
          {unit === "us" ? "pounds" : "kg"}
        </span>
        <FieldError message={errors.weight} />
      </div>

      {/* Activity — select, always has a value, no validation needed */}
      <div>
        <label className="text-sm font-medium text-foreground">
          Activity Level
        </label>
        <select
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          className={`mt-1.5 ${inputClass()}`}
        >
          {activityOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}: {o.desc}
            </option>
          ))}
        </select>
      </div>

      {/* Goal — select, always has a value, no validation needed */}
      <div>
        <label className="text-sm font-medium text-foreground">Your Goal</label>
        <select
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className={`mt-1.5 ${inputClass()}`}
        >
          {goalOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full text-base font-semibold"
      >
        Calculate
      </Button>
    </form>
  );
}
