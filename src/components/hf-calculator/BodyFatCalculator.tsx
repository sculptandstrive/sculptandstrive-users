import { useState, useMemo } from "react";
import CalculatorLayout, { StaggerItem } from "@/components/CalculatorLayout";
import InstrumentInput from "@/components/InstrumentInput";
import SegmentedControl from "@/components/SegmentedControl";
import ReadoutCard from "@/components/ReadoutCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const BodyFatCalculator = () => {
  const [gender, setGender] = useState("male");
  const [units, setUnits] = useState("metric");
  const [weight, setWeight] = useState("70");
  const [waist, setWaist] = useState("80");
  const [neck, setNeck] = useState("38");
  const [height, setHeight] = useState("175");
  const [hip, setHip] = useState("95");
  // Imperial
  const [weightLbs, setWeightLbs] = useState("154");
  const [waistIn, setWaistIn] = useState("31.5");
  const [neckIn, setNeckIn] = useState("15");
  const [heightIn, setHeightIn] = useState("69");
  const [hipIn, setHipIn] = useState("37.5");

const {user} = useAuth();

  const bodyFat = useMemo(() => {
    let w: number, wa: number, n: number, h: number, hi: number;

    if (units === "metric") {
      wa = parseFloat(waist);
      n = parseFloat(neck);
      h = parseFloat(height);
      hi = parseFloat(hip);
    } else {
      // Convert inches to cm
      wa = parseFloat(waistIn) * 2.54;
      n = parseFloat(neckIn) * 2.54;
      h = parseFloat(heightIn) * 2.54;
      hi = parseFloat(hipIn) * 2.54;
    }

    if (!wa || !n || !h) return null;

    // US Navy method
    if (gender === "male") {
      const bf = 495 / (1.0324 - 0.19077 * Math.log10(wa - n) + 0.15456 * Math.log10(h)) - 450;
      return Math.max(0, bf);
    } else {
      if (!hi) return null;
      const bf = 495 / (1.29579 - 0.35004 * Math.log10(wa + hi - n) + 0.22100 * Math.log10(h)) - 450;
      return Math.max(0, bf);
    }
  }, [gender, units, waist, neck, height, hip, waistIn, neckIn, heightIn, hipIn]);

  const category = useMemo(() => {
    if (!bodyFat) return "";
    if (gender === "male") {
      if (bodyFat < 6) return "Essential fat";
      if (bodyFat < 14) return "Athletic";
      if (bodyFat < 18) return "Fitness";
      if (bodyFat < 25) return "Average";
      return "Above average";
    } else {
      if (bodyFat < 14) return "Essential fat";
      if (bodyFat < 21) return "Athletic";
      if (bodyFat < 25) return "Fitness";
      if (bodyFat < 32) return "Average";
      return "Above average";
    }
  }, [bodyFat, gender]);

  const handleBodyFatSave = async() => {
    const {error} = await supabase.from('hf_data').upsert({body_fat: bodyFat, body_fat_type: category, user_id: user.id}, {onConflict: "user_id"});

    if (error) {
      toast({
        title: "Failed to update Body Fat",
        description: "Server error",
        variant: "destructive",
      });
      console.error(error);
      return;
    }

    toast({
      title: "Saved Body Fat Percentage Successfully",
    });
  }

  return (
    <CalculatorLayout
      title="Body Fat Calculator"
      subtitle="Estimate body fat percentage using the U.S. Navy circumference method."
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
            <>
              <InstrumentInput
                label="Height"
                value={height}
                onChange={setHeight}
                unit="cm"
              />
              <InstrumentInput
                label="Neck circumference"
                value={neck}
                onChange={setNeck}
                unit="cm"
              />
              <InstrumentInput
                label="Waist circumference"
                value={waist}
                onChange={setWaist}
                unit="cm"
              />
              {gender === "female" && (
                <InstrumentInput
                  label="Hip circumference"
                  value={hip}
                  onChange={setHip}
                  unit="cm"
                />
              )}
            </>
          ) : (
            <>
              <InstrumentInput
                label="Height"
                value={heightIn}
                onChange={setHeightIn}
                unit="in"
              />
              <InstrumentInput
                label="Neck circumference"
                value={neckIn}
                onChange={setNeckIn}
                unit="in"
              />
              <InstrumentInput
                label="Waist circumference"
                value={waistIn}
                onChange={setWaistIn}
                unit="in"
              />
              {gender === "female" && (
                <InstrumentInput
                  label="Hip circumference"
                  value={hipIn}
                  onChange={setHipIn}
                  unit="in"
                />
              )}
            </>
          )}
        </div>
      </StaggerItem>

      <StaggerItem>
        <ReadoutCard
          label="Estimated Body Fat"
          value={bodyFat ? bodyFat.toFixed(1) : "—"}
          unit="%"
          description={
            bodyFat
              ? `${category}. U.S. Navy method is an estimate; DEXA or hydrostatic weighing provides higher accuracy.`
              : "Enter your measurements above."
          }
          handleDBSave={handleBodyFatSave}
          showSave={true}
        />
      </StaggerItem>
    </CalculatorLayout>
  );
};

export default BodyFatCalculator;
