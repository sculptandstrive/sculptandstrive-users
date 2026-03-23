import { useState, useMemo } from "react";
import CalculatorLayout, { StaggerItem } from "@/components/CalculatorLayout";
import InstrumentInput from "@/components/InstrumentInput";
import SegmentedControl from "@/components/SegmentedControl";
import ReadoutCard from "@/components/ReadoutCard";


const BMRCalculator = () => {
  const [units, setUnits] = useState("metric");
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState("25");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("175");
  const [weightLbs, setWeightLbs] = useState("154");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");


  const bmr = useMemo(() => {
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

    // Mifflin-St Jeor
    if (gender === "male") {
      return 10 * w + 6.25 * h - 5 * a + 5;
    }
    return 10 * w + 6.25 * h - 5 * a - 161;
  }, [units, gender, age, weight, height, weightLbs, heightFt, heightIn]);

  return (
    <CalculatorLayout
      title="BMR Calculator"
      subtitle="Basal Metabolic Rate — the number of calories your body needs at complete rest."
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
          <InstrumentInput
            label="Age"
            value={age}
            onChange={setAge}
            unit="years"
            min={1}
            max={120}
          />
          {units === "metric" ? (
            <>
              <InstrumentInput
                label="Weight"
                value={weight}
                onChange={setWeight}
                unit="kg"
                min={1}
                max={500}
              />
              <InstrumentInput
                label="Height"
                value={height}
                onChange={setHeight}
                unit="cm"
                min={1}
                max={300}
              />
            </>
          ) : (
            <>
              <InstrumentInput
                label="Weight"
                value={weightLbs}
                onChange={setWeightLbs}
                unit="lbs"
                min={1}
                max={1000}
              />
              <div className="grid grid-cols-2 gap-4">
                <InstrumentInput
                  label="Height (ft)"
                  value={heightFt}
                  onChange={setHeightFt}
                  unit="ft"
                  min={0}
                  max={8}
                />
                <InstrumentInput
                  label="Height (in)"
                  value={heightIn}
                  onChange={setHeightIn}
                  unit="in"
                  min={0}
                  max={11}
                />
              </div>
            </>
          )}
        </div>
      </StaggerItem>

      <StaggerItem>
        <ReadoutCard
          label="Basal Metabolic Rate"
          value={bmr ? Math.round(bmr).toLocaleString() : "—"}
          unit="kcal/day"
          description={
            bmr
              ? "Mifflin-St Jeor equation. This is the energy your body expends at complete rest over 24 hours."
              : "Enter your measurements above."
          }
          showSave={false}
        />
      </StaggerItem>
    </CalculatorLayout>
  );
};

export default BMRCalculator;
