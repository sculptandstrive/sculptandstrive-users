import { useState, useMemo } from "react";
import CalculatorLayout, { StaggerItem } from "@/components/CalculatorLayout";
import InstrumentInput from "@/components/InstrumentInput";
import SegmentedControl from "@/components/SegmentedControl";
import ReadoutCard from "@/components/ReadoutCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const ACTIVITY_LEVELS = [
  { label: "Sedentary", value: "1.2", desc: "Little or no exercise" },
  { label: "Light", value: "1.375", desc: "Exercise 1-3 days/week" },
  { label: "Moderate", value: "1.55", desc: "Exercise 3-5 days/week" },
  { label: "Active", value: "1.725", desc: "Exercise 6-7 days/week" },
  { label: "Very Active", value: "1.9", desc: "Hard exercise + physical job" },
];

const TDEECalculator = () => {
  const [units, setUnits] = useState("metric");
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState("25");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("175");
  const [weightLbs, setWeightLbs] = useState("154");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");
  const [activity, setActivity] = useState("1.2");

  const {user} = useAuth();

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

    if (gender === "male") {
      return 10 * w + 6.25 * h - 5 * a + 5;
    }
    return 10 * w + 6.25 * h - 5 * a - 161;
  }, [units, gender, age, weight, height, weightLbs, heightFt, heightIn]);

  const tdee = useMemo(() => {
    if (!bmr) return null;
    return bmr * parseFloat(activity);
  }, [bmr, activity]);

  const handleTDEESave = async() => {
    const {error} = await supabase.from('hf_data').upsert({tdee_maintain: tdee, user_id: user.id}, {onConflict: "user_id"})

    // console.log(error)
     if(error){
        toast({
          title: "Failed to update TDEE Values",
          description: "Server error",
          variant: "destructive"
        })
        console.error(error);
        return;
      }
    
    toast({
      title: "Saved BMI Successfully"
    });
  }

  return (
    <CalculatorLayout
      title="Calorie / TDEE Calculator"
      subtitle="Total Daily Energy Expenditure — the total calories you burn per day including activity."
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
        <div className="surface p-6 rounded-xl">
          <span className="label-instrument mb-3 block">Activity Level</span>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setActivity(level.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
                  activity === level.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <span
                  className={`text-sm font-medium ${activity === level.value ? "text-primary" : "text-foreground"}`}
                >
                  {level.label}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {level.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      </StaggerItem>

      <StaggerItem>
        <ReadoutCard
          label="Total Daily Energy Expenditure"
          value={tdee ? Math.round(tdee).toLocaleString() : "—"}
          unit="kcal/day"
          description={
            tdee
              ? `Based on a ${ACTIVITY_LEVELS.find((l) => l.value === activity)?.label.toLowerCase()} activity level. To lose weight, consume fewer calories; to gain, consume more.`
              : "Enter your measurements above."
          }
          handleDBSave={handleTDEESave}
          showSave={true}
        />
      </StaggerItem>

      {tdee && (
        <StaggerItem>
          <div className="surface p-6 rounded-xl">
            <span className="label-instrument mb-4 block">Daily Targets</span>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Lose weight", delta: -500, color: "text-primary" },
                { label: "Maintain", delta: 0, color: "text-success" },
                { label: "Gain weight", delta: 500, color: "text-accent" },
              ].map((goal) => (
                <div key={goal.label} className="text-center">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    {goal.label}
                  </span>
                  <p
                    className={`text-xl font-mono font-bold tracking-tighter mt-1 ${goal.color}`}
                  >
                    {Math.round(tdee + goal.delta).toLocaleString()}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    kcal/day
                  </span>
                </div>
              ))}
            </div>
          </div>
        </StaggerItem>
      )}
    </CalculatorLayout>
  );
};

export default TDEECalculator;
