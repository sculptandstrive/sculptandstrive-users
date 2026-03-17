import { useState, useMemo } from "react";
import CalculatorLayout, { StaggerItem } from "@/components/CalculatorLayout";
import InstrumentInput from "@/components/InstrumentInput";
import SegmentedControl from "@/components/SegmentedControl";
import ReadoutCard from "@/components/ReadoutCard";

const IdealWeightCalculator = () => {
  const [units, setUnits] = useState("metric");
  const [gender, setGender] = useState("male");
  const [height, setHeight] = useState("175");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");

  const results = useMemo(() => {
    let hCm: number;
    if (units === "metric") {
      hCm = parseFloat(height);
    } else {
      hCm = (parseFloat(heightFt) * 12 + parseFloat(heightIn)) * 2.54;
    }
    if (!hCm || hCm < 100) return null;

    const hIn = hCm / 2.54;
    const over60 = hIn - 60;
    if (over60 < 0) return null;

    const isMale = gender === "male";

    // Robinson (1983)
    const robinson = isMale ? 52 + 1.9 * over60 : 49 + 1.7 * over60;
    // Miller (1983)
    const miller = isMale ? 56.2 + 1.41 * over60 : 53.1 + 1.36 * over60;
    // Devine (1974)
    const devine = isMale ? 50 + 2.3 * over60 : 45.5 + 2.3 * over60;
    // Hamwi (1964)
    const hamwi = isMale ? 48 + 2.7 * over60 : 45.5 + 2.2 * over60;

    return { robinson, miller, devine, hamwi };
  }, [units, gender, height, heightFt, heightIn]);

  const avg = results ? Math.round((results.robinson + results.miller + results.devine + results.hamwi) / 4) : null;

  const displayUnit = units === "metric" ? "kg" : "lbs";
  const convert = (v: number) => {
    const val = units === "imperial" ? v * 2.20462 : v;
    return Math.round(val);
  };

  return (
    <CalculatorLayout
      title="Ideal Weight Calculator"
      subtitle="Estimate your ideal body weight using multiple established formulas."
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
          {units === "metric" ? (
            <InstrumentInput label="Height" value={height} onChange={setHeight} unit="cm" min={100} max={250} />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <InstrumentInput label="Height (ft)" value={heightFt} onChange={setHeightFt} unit="ft" />
              <InstrumentInput label="Height (in)" value={heightIn} onChange={setHeightIn} unit="in" />
            </div>
          )}
        </div>
      </StaggerItem>

      <StaggerItem>
        <ReadoutCard
          label="Average Ideal Weight"
          value={avg ? convert(avg).toLocaleString() : "—"}
          unit={displayUnit}
          description={results ? "Average across Robinson, Miller, Devine, and Hamwi formulas." : "Enter your height above."}
        />
      </StaggerItem>

      {results && (
        <StaggerItem>
          <div className="surface p-6 rounded-xl">
            <span className="label-instrument mb-4 block">By Formula</span>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "Robinson", val: results.robinson },
                { name: "Miller", val: results.miller },
                { name: "Devine", val: results.devine },
                { name: "Hamwi", val: results.hamwi },
              ].map((f) => (
                <div key={f.name} className="text-center p-3 bg-background rounded-lg">
                  <span className="text-xs text-muted-foreground">{f.name}</span>
                  <p className="text-xl font-mono font-bold tracking-tighter text-foreground mt-1">
                    {convert(f.val)} <span className="text-sm text-muted-foreground font-normal">{displayUnit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </StaggerItem>
      )}
    </CalculatorLayout>
  );
};

export default IdealWeightCalculator;
