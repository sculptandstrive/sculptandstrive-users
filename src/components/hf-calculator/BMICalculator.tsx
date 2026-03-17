import { useState, useMemo } from "react";
import CalculatorLayout, { StaggerItem } from "@/components/CalculatorLayout";
import InstrumentInput from "@/components/InstrumentInput";
import SegmentedControl from "@/components/SegmentedControl";
import ReadoutCard from "@/components/ReadoutCard";
import ProgressBar from "@/components/ProgressBar";

const BMI_SEGMENTS = [
  { label: "Underweight", color: "hsl(190, 90%, 50%)", threshold: 18.5 },
  { label: "Normal", color: "hsl(150, 60%, 45%)", threshold: 25 },
  { label: "Overweight", color: "hsl(40, 90%, 55%)", threshold: 30 },
  { label: "Obese", color: "hsl(0, 84%, 60%)", threshold: 40 },
];

const BMICalculator = () => {
  const [units, setUnits] = useState("metric");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("175");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");
  const [weightLbs, setWeightLbs] = useState("154");

  const bmi = useMemo(() => {
    if (units === "metric") {
      const w = parseFloat(weight);
      const h = parseFloat(height) / 100;
      if (!w || !h) return null;
      return w / (h * h);
    } else {
      const w = parseFloat(weightLbs);
      const ft = parseFloat(heightFt);
      const inches = parseFloat(heightIn);
      if (!w || isNaN(ft) || isNaN(inches)) return null;
      const totalInches = ft * 12 + inches;
      return (w / (totalInches * totalInches)) * 703;
    }
  }, [units, weight, height, heightFt, heightIn, weightLbs]);

  const category = useMemo(() => {
    if (!bmi) return "";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obese";
  }, [bmi]);

  const colorClass = useMemo(() => {
    if (!bmi) return "text-primary";
    if (bmi < 18.5) return "text-primary";
    if (bmi < 25) return "text-success";
    if (bmi < 30) return "text-warning";
    return "text-destructive";
  }, [bmi]);

  return (
    <CalculatorLayout
      title="BMI Calculator"
      subtitle="Calculate your Body Mass Index — a measure of body fat based on height and weight."
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
        <div className="surface p-6 rounded-xl space-y-4">
          {units === "metric" ? (
            <>
              <InstrumentInput label="Weight" value={weight} onChange={setWeight} unit="kg" min={1} max={500} />
              <InstrumentInput label="Height" value={height} onChange={setHeight} unit="cm" min={1} max={300} />
            </>
          ) : (
            <>
              <InstrumentInput label="Weight" value={weightLbs} onChange={setWeightLbs} unit="lbs" min={1} max={1000} />
              <div className="grid grid-cols-2 gap-4">
                <InstrumentInput label="Height (ft)" value={heightFt} onChange={setHeightFt} unit="ft" min={0} max={8} />
                <InstrumentInput label="Height (in)" value={heightIn} onChange={setHeightIn} unit="in" min={0} max={11} />
              </div>
            </>
          )}
        </div>
      </StaggerItem>

      <StaggerItem>
        <ReadoutCard
          label="Your BMI"
          value={bmi ? bmi.toFixed(1) : "—"}
          unit="kg/m²"
          description={bmi ? `${category}. BMI is a screening tool and does not diagnose body fatness or health.` : "Enter your measurements above."}
          colorClass={colorClass}
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
      </StaggerItem>
    </CalculatorLayout>
  );
};

export default BMICalculator;
