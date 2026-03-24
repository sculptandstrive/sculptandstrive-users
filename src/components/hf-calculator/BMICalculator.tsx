import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
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

type FormValues = {
  units: "metric" | "imperial";
  weight: string;
  height: string;
  heightFt: string;
  heightIn: string;
  weightLbs: string;
};

const BMICalculator = () => {
  const { user } = useAuth();

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      units: "metric",
      weight: "70",
      height: "175",
      heightFt: "5",
      heightIn: "9",
      weightLbs: "154",
    },
  });

  const units = watch("units");
  const weight = watch("weight");
  const height = watch("height");
  const heightFt = watch("heightFt");
  const heightIn = watch("heightIn");
  const weightLbs = watch("weightLbs");

  const handleUnitsChange = (newUnits: string) => {
    reset(
      newUnits === "metric"
        ? {
            units: "metric",
            weight: "70",
            height: "175",
            heightFt: "5",
            heightIn: "9",
            weightLbs: "154",
          }
        : {
            units: "imperial",
            weight: "70",
            height: "175",
            heightFt: "5",
            heightIn: "9",
            weightLbs: "154",
          },
    );
  };

  const bmi = useMemo(() => {
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

  const handleBMISave = handleSubmit(async () => {
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
      .upsert({ bmi, user_id: user.id }, { onConflict: "user_id" });

    if (error) {
      toast({
        title: "Failed to update BMI",
        description: "Server error. Please try again.",
        variant: "destructive",
      });
      console.error(error);
      return;
    }

    toast({ title: "Saved BMI Successfully" });
  });

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
              <Controller
                name="weight"
                control={control}
                shouldUnregister
                rules={{
                  required: "Weight is required.",
                  validate: (v) => {
                    const n = parseFloat(v);
                    if (isNaN(n)) return "Weight must be a valid number.";
                    if (n < 20) return "Weight must be at least 20 kg.";
                    if (n > 300) return "Weight must be no more than 300 kg.";
                    return true;
                  },
                }}
                render={({ field }) => (
                  <InstrumentInput
                    label="Weight"
                    value={field.value}
                    onChange={field.onChange}
                    unit="kg"
                    min={20}
                    max={300}
                    error={errors.weight?.message}
                  />
                )}
              />
              <Controller
                name="height"
                control={control}
                shouldUnregister
                rules={{
                  required: "Height is required.",
                  validate: (v) => {
                    const n = parseFloat(v);
                    if (isNaN(n)) return "Height must be a valid number.";
                    if (n < 100) return "Height must be at least 100 cm.";
                    if (n > 250) return "Height must be no more than 250 cm.";
                    return true;
                  },
                }}
                render={({ field }) => (
                  <InstrumentInput
                    label="Height"
                    value={field.value}
                    onChange={field.onChange}
                    unit="cm"
                    min={100}
                    max={250}
                    error={errors.height?.message}
                  />
                )}
              />
            </>
          ) : (
            <>
              <Controller
                name="weightLbs"
                control={control}
                shouldUnregister
                rules={{
                  required: "Weight is required.",
                  validate: (v) => {
                    const n = parseFloat(v);
                    if (isNaN(n)) return "Weight must be a valid number.";
                    if (n < 44) return "Weight must be at least 44 lbs.";
                    if (n > 660) return "Weight must be no more than 660 lbs.";
                    return true;
                  },
                }}
                render={({ field }) => (
                  <InstrumentInput
                    label="Weight"
                    value={field.value}
                    onChange={field.onChange}
                    unit="lbs"
                    min={44}
                    max={660}
                    error={errors.weightLbs?.message}
                  />
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="heightFt"
                  control={control}
                  shouldUnregister
                  rules={{
                    required: "Feet is required.",
                    validate: (v) => {
                      const n = parseFloat(v);
                      if (isNaN(n)) return "Must be a valid number.";
                      if (n < 3) return "Height must be at least 3 ft.";
                      if (n > 8) return "Height must be no more than 8 ft.";
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <InstrumentInput
                      label="Height (ft)"
                      value={field.value}
                      onChange={field.onChange}
                      unit="ft"
                      min={3}
                      max={8}
                      error={errors.heightFt?.message}
                    />
                  )}
                />
                <Controller
                  name="heightIn"
                  control={control}
                  shouldUnregister
                  rules={{
                    required: "Inches is required.",
                    validate: (v) => {
                      const n = parseFloat(v);
                      if (isNaN(n)) return "Must be a valid number.";
                      if (n < 0) return "Inches must be at least 0.";
                      if (n > 11) return "Inches must be no more than 11.";
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <InstrumentInput
                      label="Height (in)"
                      value={field.value}
                      onChange={field.onChange}
                      unit="in"
                      min={0}
                      max={11}
                      error={errors.heightIn?.message}
                    />
                  )}
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
