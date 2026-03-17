import { useState, useMemo } from "react";
import CalculatorLayout, { StaggerItem } from "@/components/CalculatorLayout";
import InstrumentInput from "@/components/InstrumentInput";
import SegmentedControl from "@/components/SegmentedControl";
import ReadoutCard from "@/components/ReadoutCard";

const MacroCalculator = () => {
  const [units, setUnits] = useState("metric");
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState("25");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("175");
  const [weightLbs, setWeightLbs] = useState("154");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");
  const [activity, setActivity] = useState("1.55");
  const [goal, setGoal] = useState("maintain");

  const tdee = useMemo(() => {
    const a = parseFloat(age);
    let w: number, h: number;
    if (units === "metric") {
      w = parseFloat(weight);
      h = parseFloat(height);
    } else {
      w = parseFloat(weightLbs) * 0.453592;
      h = (parseFloat(heightFt) * 12 + parseFloat(heightIn)) * 2.54;
    }
    if (!a || !w || !h) return null;
    const bmr = gender === "male"
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;
    return bmr * parseFloat(activity);
  }, [units, gender, age, weight, height, weightLbs, heightFt, heightIn, activity]);

  const macros = useMemo(() => {
    if (!tdee) return null;
    const calories = goal === "lose" ? tdee - 500 : goal === "gain" ? tdee + 500 : tdee;
    // Standard split: 30% protein, 35% carbs, 35% fat
    const protein = Math.round((calories * 0.30) / 4);
    const carbs = Math.round((calories * 0.35) / 4);
    const fat = Math.round((calories * 0.35) / 9);
    return { calories: Math.round(calories), protein, carbs, fat };
  }, [tdee, goal]);

  return (
    <CalculatorLayout
      title="Macro Calculator"
      subtitle="Calculate your daily macronutrient targets based on your goals."
    >
      <StaggerItem>
        <SegmentedControl
          options={[
            { label: "Metric", value: "metric" },
            { label: "Imperial", value: "imperial" },
          ]}
          value={units}
          onChange={setUnits}
        />
      </StaggerItem>

      <StaggerItem>
        <SegmentedControl
          options={[
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
          ]}
          value={gender}
          onChange={setGender}
        />
      </StaggerItem>

      <StaggerItem>
        <div className="surface p-6 rounded-xl space-y-4">
          <InstrumentInput label="Age" value={age} onChange={setAge} unit="years" />
          {units === "metric" ? (
            <>
              <InstrumentInput label="Weight" value={weight} onChange={setWeight} unit="kg" />
              <InstrumentInput label="Height" value={height} onChange={setHeight} unit="cm" />
            </>
          ) : (
            <>
              <InstrumentInput label="Weight" value={weightLbs} onChange={setWeightLbs} unit="lbs" />
              <div className="grid grid-cols-2 gap-4">
                <InstrumentInput label="Height (ft)" value={heightFt} onChange={setHeightFt} unit="ft" />
                <InstrumentInput label="Height (in)" value={heightIn} onChange={setHeightIn} unit="in" />
              </div>
            </>
          )}
        </div>
      </StaggerItem>

      <StaggerItem>
        <SegmentedControl
          options={[
            { label: "Lose", value: "lose" },
            { label: "Maintain", value: "maintain" },
            { label: "Gain", value: "gain" },
          ]}
          value={goal}
          onChange={setGoal}
        />
      </StaggerItem>

      {macros && (
        <StaggerItem>
          <div className="grid grid-cols-2 gap-4">
            <ReadoutCard
              label="Daily Calories"
              value={macros.calories.toLocaleString()}
              unit="kcal"
            />
            <ReadoutCard
              label="Protein"
              value={String(macros.protein)}
              unit="g"
              colorClass="text-primary"
            />
            <ReadoutCard
              label="Carbohydrates"
              value={String(macros.carbs)}
              unit="g"
              colorClass="text-success"
            />
            <ReadoutCard
              label="Fat"
              value={String(macros.fat)}
              unit="g"
              colorClass="text-warning"
            />
          </div>
        </StaggerItem>
      )}
    </CalculatorLayout>
  );
};

export default MacroCalculator;
