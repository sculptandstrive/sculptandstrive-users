import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import CalculatorLayout, { StaggerItem } from "@/components/CalculatorLayout";
import InstrumentInput from "@/components/InstrumentInput";
import SegmentedControl from "@/components/SegmentedControl";
import ReadoutCard from "@/components/ReadoutCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type FormValues = {
  units: "metric" | "imperial";
  gender: "male" | "female";
  // metric
  height: string;
  neck: string;
  waist: string;
  hip: string;
  // imperial
  heightIn: string;
  neckIn: string;
  waistIn: string;
  hipIn: string;
};

const BodyFatCalculator = () => {
  const { user } = useAuth();

  const {
    control,
    watch,
    reset,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      units: "metric",
      gender: "male",
      height: "175",
      neck: "38",
      waist: "80",
      hip: "95",
      heightIn: "69",
      neckIn: "15",
      waistIn: "31.5",
      hipIn: "37.5",
    },
  });

  const units = watch("units");
  const gender = watch("gender");
  const height = watch("height");
  const neck = watch("neck");
  const waist = watch("waist");
  const hip = watch("hip");
  const heightIn = watch("heightIn");
  const neckIn = watch("neckIn");
  const waistIn = watch("waistIn");
  const hipIn = watch("hipIn");

  const handleUnitsChange = (newUnits: string) => {
    reset({
      units: newUnits as "metric" | "imperial",
      gender,
      height: "175",
      neck: "38",
      waist: "80",
      hip: "95",
      heightIn: "69",
      neckIn: "15",
      waistIn: "31.5",
      hipIn: "37.5",
    });
  };

  const handleGenderChange = (newGender: string) => {
    reset({ ...watch(), gender: newGender as "male" | "female" });
  };

  const bodyFat = useMemo(() => {
    if (!isValid) return null;

    let wa: number, n: number, h: number, hi: number;

    if (units === "metric") {
      wa = parseFloat(waist);
      n = parseFloat(neck);
      h = parseFloat(height);
      hi = parseFloat(hip);
    } else {
      wa = parseFloat(waistIn) * 2.54;
      n = parseFloat(neckIn) * 2.54;
      h = parseFloat(heightIn) * 2.54;
      hi = parseFloat(hipIn) * 2.54;
    }

    if (!wa || !n || !h) return null;

    if (gender === "male") {
      const bf =
        495 /
          (1.0324 - 0.19077 * Math.log10(wa - n) + 0.15456 * Math.log10(h)) -
        450;
      return Math.max(0, bf);
    } else {
      if (!hi) return null;
      const bf =
        495 /
          (1.29579 -
            0.35004 * Math.log10(wa + hi - n) +
            0.221 * Math.log10(h)) -
        450;
      return Math.max(0, bf);
    }
  }, [
    gender,
    units,
    waist,
    neck,
    height,
    hip,
    waistIn,
    neckIn,
    heightIn,
    hipIn,
    isValid,
  ]);

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

  const handleBodyFatSave = handleSubmit(async () => {
    if (!bodyFat) {
      toast({
        title: "Cannot Save",
        description: "Please enter valid measurements to calculate body fat.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your body fat.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("hf_data")
      .upsert(
        { body_fat: bodyFat, body_fat_type: category, user_id: user.id },
        { onConflict: "user_id" },
      );

    if (error) {
      toast({
        title: "Failed to update Body Fat",
        description: "Server error",
        variant: "destructive",
      });
      console.error(error);
      return;
    }

    toast({ title: "Saved Body Fat Percentage Successfully" });
  });

  // Reusable cm rules
  const cmRules = (label: string, min: number, max: number) => ({
    required: `${label} is required.`,
    validate: (v: string) => {
      const n = parseFloat(v);
      if (isNaN(n)) return `${label} must be a valid number.`;
      if (n < min) return `${label} must be at least ${min} cm.`;
      if (n > max) return `${label} must be no more than ${max} cm.`;
      return true;
    },
  });

  // Reusable inch rules
  const inRules = (label: string, min: number, max: number) => ({
    required: `${label} is required.`,
    validate: (v: string) => {
      const n = parseFloat(v);
      if (isNaN(n)) return `${label} must be a valid number.`;
      if (n < min) return `${label} must be at least ${min} in.`;
      if (n > max) return `${label} must be no more than ${max} in.`;
      return true;
    },
  });

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
          onChange={handleUnitsChange}
        />
      </StaggerItem>

      <StaggerItem>
        <SegmentedControl
          options={[
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
          ]}
          value={gender}
          onChange={handleGenderChange}
        />
      </StaggerItem>

      <StaggerItem>
        <div className="surface p-6 rounded-xl space-y-4">
          {units === "metric" ? (
            <>
              <Controller
                name="height"
                control={control}
                shouldUnregister
                rules={cmRules("Height", 50, 300)}
                render={({ field }) => (
                  <InstrumentInput
                    label="Height"
                    value={field.value}
                    onChange={field.onChange}
                    unit="cm"
                    error={errors.height?.message}
                  />
                )}
              />
              <Controller
                name="neck"
                control={control}
                shouldUnregister
                rules={cmRules("Neck circumference", 20, 80)}
                render={({ field }) => (
                  <InstrumentInput
                    label="Neck circumference"
                    value={field.value}
                    onChange={field.onChange}
                    unit="cm"
                    error={errors.neck?.message}
                  />
                )}
              />
              <Controller
                name="waist"
                control={control}
                shouldUnregister
                rules={cmRules("Waist circumference", 40, 200)}
                render={({ field }) => (
                  <InstrumentInput
                    label="Waist circumference"
                    value={field.value}
                    onChange={field.onChange}
                    unit="cm"
                    
                    error={errors.waist?.message}
                  />
                )}
              />
              {gender === "female" && (
                <Controller
                  name="hip"
                  control={control}
                  shouldUnregister
                  rules={cmRules("Hip circumference", 40, 200)}
                  render={({ field }) => (
                    <InstrumentInput
                      label="Hip circumference"
                      value={field.value}
                      onChange={field.onChange}
                      unit="cm"
                      error={errors.hip?.message}
                    />
                  )}
                />
              )}
            </>
          ) : (
            <>
              <Controller
                name="heightIn"
                control={control}
                shouldUnregister
                rules={inRules("Height", 20, 120)}
                render={({ field }) => (
                  <InstrumentInput
                    label="Height"
                    value={field.value}
                    onChange={field.onChange}
                    unit="in"
                    error={errors.heightIn?.message}
                  />
                )}
              />
              <Controller
                name="neckIn"
                control={control}
                shouldUnregister
                rules={inRules("Neck circumference", 8, 32)}
                render={({ field }) => (
                  <InstrumentInput
                    label="Neck circumference"
                    value={field.value}
                    onChange={field.onChange}
                    unit="in"
                    error={errors.neckIn?.message}
                  />
                )}
              />
              <Controller
                name="waistIn"
                control={control}
                shouldUnregister
                rules={inRules("Waist circumference", 16, 80)}
                render={({ field }) => (
                  <InstrumentInput
                    label="Waist circumference"
                    value={field.value}
                    onChange={field.onChange}
                    unit="in"
                    error={errors.waistIn?.message}
                  />
                )}
              />
              {gender === "female" && (
                <Controller
                  name="hipIn"
                  control={control}
                  shouldUnregister
                  rules={inRules("Hip circumference", 16, 80)}
                  render={({ field }) => (
                    <InstrumentInput
                      label="Hip circumference"
                      value={field.value}
                      onChange={field.onChange}
                      unit="in"
                      error={errors.hipIn?.message}
                    />
                  )}
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
          // disabled={!isValid}
        />
      </StaggerItem>
    </CalculatorLayout>
  );
};

export default BodyFatCalculator;
