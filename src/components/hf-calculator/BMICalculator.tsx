import { useState, useMemo, useCallback } from "react";
import CalculatorLayout, { StaggerItem } from "@/components/CalculatorLayout";
import InstrumentInput from "@/components/InstrumentInput";
import SegmentedControl from "@/components/SegmentedControl";
import ReadoutCard from "@/components/ReadoutCard";
import ProgressBar from "@/components/ProgressBar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const BMI_SEGMENTS = [
  { label: "Underweight", color: "hsl(190, 90%, 50%)", threshold: 18.5 },
  { label: "Normal", color: "hsl(150, 60%, 45%)", threshold: 25 },
  { label: "Overweight", color: "hsl(40, 90%, 55%)", threshold: 30 },
  { label: "Obese", color: "hsl(0, 84%, 60%)", threshold: 40 },
];

// Validation constraints
const VALIDATION_RULES = {
  metric: {
    weight: { min: 20, max: 300, label: "Weight" },
    height: { min: 100, max: 250, label: "Height" },
  },
  imperial: {
    weightLbs: { min: 44, max: 660, label: "Weight" },
    heightFt: { min: 3, max: 8, label: "Height (ft)" },
    heightIn: { min: 0, max: 11, label: "Height (in)" },
  },
};

type ValidationErrors = Record<string, string>;
type TouchedFields = Record<string, boolean>;

const BMICalculator = () => {
  const [units, setUnits] = useState("metric");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("175");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");
  const [weightLbs, setWeightLbs] = useState("154");

  // Validation state
  const [touched, setTouched] = useState<TouchedFields>({});
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  const { user } = useAuth();

  // Validation logic
  const validateField = useCallback(
    (field: string, value: string, unitSystem: string): string | null => {
      const rules =
        unitSystem === "metric"
          ? VALIDATION_RULES.metric
          : VALIDATION_RULES.imperial;

      const rule = rules[field as keyof typeof rules] as {
        min: number;
        max: number;
        label: string;
      } | undefined;
      if (!rule) return null;

      const numValue = parseFloat(value);

      if (value.trim() === "") {
        return `${rule.label} is required`;
      }

      if (isNaN(numValue)) {
        return `${rule.label} must be a valid number`;
      }

      if (numValue < rule.min) {
        return `${rule.label} must be at least ${rule.min}`;
      }

      if (numValue > rule.max) {
        return `${rule.label} must be no more than ${rule.max}`;
      }

      return null;
    },
    [],
  );

  // Compute all validation errors
  const errors = useMemo((): ValidationErrors => {
    const errs: ValidationErrors = {};

    if (units === "metric") {
      const weightError = validateField("weight", weight, units);
      const heightError = validateField("height", height, units);
      if (weightError) errs.weight = weightError;
      if (heightError) errs.height = heightError;
    } else {
      const weightError = validateField("weightLbs", weightLbs, units);
      const heightFtError = validateField("heightFt", heightFt, units);
      const heightInError = validateField("heightIn", heightIn, units);
      if (weightError) errs.weightLbs = weightError;
      if (heightFtError) errs.heightFt = heightFtError;
      if (heightInError) errs.heightIn = heightInError;
    }

    return errs;
  }, [units, weight, height, weightLbs, heightFt, heightIn, validateField]);

  const isValid = Object.keys(errors).length === 0;

  // Helper to check if error should be shown (hybrid approach)
  const shouldShowError = useCallback(
    (field: string): boolean => {
      return (touched[field] || hasAttemptedSave) && !!errors[field];
    },
    [touched, hasAttemptedSave, errors],
  );

  // Wrapped onChange handlers that also handle validation state
  const createChangeHandler = (
    setter: (value: string) => void,
    field: string,
  ) => {
    return (value: string) => {
      setter(value);
      // Clear the "attempted save" state when user starts correcting
      if (hasAttemptedSave && errors[field]) {
        setHasAttemptedSave(false);
      }
    };
  };

  // Reset touched state when switching units
  const handleUnitsChange = (newUnits: string) => {
    setUnits(newUnits);
    setTouched({});
    setHasAttemptedSave(false);
  };

  const bmi = useMemo(() => {
    // Only calculate if valid
    if (!isValid) return null;

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
      if (totalInches === 0) return null;
      return (w / (totalInches * totalInches)) * 703;
    }
  }, [units, weight, height, heightFt, heightIn, weightLbs, isValid]);

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

  const handleBMISave = async () => {
    // Mark as attempted save to show all errors
    setHasAttemptedSave(true);

    // Validate before saving
    if (!isValid) {
      const errorMessages = Object.values(errors);
      toast({
        title: "Validation Error",
        description: errorMessages[0], // Show first error
        variant: "destructive",
      });
      return;
    }

    if (!bmi) {
      toast({
        title: "Cannot Save",
        description: "Please enter valid measurements to calculate BMI",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your BMI",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("hf_data")
      .upsert({ bmi: bmi, user_id: user.id }, { onConflict: "user_id" });

    if (error) {
      toast({
        title: "Failed to update BMI",
        description: "Server error. Please try again.",
        variant: "destructive",
      });
      console.error(error);
      return;
    }

    toast({
      title: "Saved BMI Successfully",
    });
  };

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
          onChange={handleUnitsChange}
        />
      </StaggerItem>

      <StaggerItem>
        <div className="surface p-6 rounded-xl space-y-4">
          {units === "metric" ? (
            <>
              <InstrumentInput
                label="Weight"
                value={weight}
                onChange={createChangeHandler(setWeight, "weight")}
                unit="kg"
                min={VALIDATION_RULES.metric.weight.min}
                max={VALIDATION_RULES.metric.weight.max}
                error={shouldShowError("weight") ? errors.weight : undefined}
              />
              <InstrumentInput
                label="Height"
                value={height}
                onChange={createChangeHandler(setHeight, "height")}
                unit="cm"
                min={VALIDATION_RULES.metric.height.min}
                max={VALIDATION_RULES.metric.height.max}
                error={shouldShowError("height") ? errors.height : undefined}
              />
            </>
          ) : (
            <>
              <InstrumentInput
                label="Weight"
                value={weightLbs}
                onChange={createChangeHandler(setWeightLbs, "weightLbs")}
                unit="lbs"
                min={VALIDATION_RULES.imperial.weightLbs.min}
                max={VALIDATION_RULES.imperial.weightLbs.max}
                error={
                  shouldShowError("weightLbs") ? errors.weightLbs : undefined
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <InstrumentInput
                  label="Height (ft)"
                  value={heightFt}
                  onChange={createChangeHandler(setHeightFt, "heightFt")}
                  unit="ft"
                  min={VALIDATION_RULES.imperial.heightFt.min}
                  max={VALIDATION_RULES.imperial.heightFt.max}
                  error={
                    shouldShowError("heightFt") ? errors.heightFt : undefined
                  }
                />
                <InstrumentInput
                  label="Height (in)"
                  value={heightIn}
                  onChange={createChangeHandler(setHeightIn, "heightIn")}
                  unit="in"
                  min={VALIDATION_RULES.imperial.heightIn.min}
                  max={VALIDATION_RULES.imperial.heightIn.max}
                  error={
                    shouldShowError("heightIn") ? errors.heightIn : undefined
                  }
                />
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
          description={
            bmi
              ? `${category}. BMI is a screening tool and does not diagnose body fatness or health.`
              : "Enter your measurements above."
          }
          colorClass={colorClass}
          handleDBSave={handleBMISave}
          showSave={true}
          disabled={!isValid}
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
