import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import CalculatorLayout, { StaggerItem } from "@/components/CalculatorLayout";
import InstrumentInput from "@/components/InstrumentInput";
import SegmentedControl from "@/components/SegmentedControl";
import ReadoutCard from "@/components/ReadoutCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type FormValues = {
  units: "metric" | "imperial";
  gender: "male" | "female";
  height: string;
  heightFt: string;
  heightIn: string;
};

const IdealWeightCalculator = () => {
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
      heightFt: "5",
      heightIn: "9",
    },
  });

  const units = watch("units");
  const gender = watch("gender");
  const height = watch("height");
  const heightFt = watch("heightFt");
  const heightIn = watch("heightIn");

  const handleUnitsChange = (newUnits: string) => {
    reset({
      units: newUnits as "metric" | "imperial",
      gender,
      height: "175",
      heightFt: "5",
      heightIn: "9",
    });
  };

  const handleGenderChange = (newGender: string) => {
    reset({ ...watch(), gender: newGender as "male" | "female" });
  };

  const results = useMemo(() => {
    if (!isValid) return null;

    let hCm: number;
    if (units === "metric") {
      hCm = parseFloat(height);
    } else {
      hCm = (parseFloat(heightFt) * 12 + parseFloat(heightIn)) * 2.54;
    }

    if (!hCm || hCm < 100) return null;

    const hIn = hCm / 2.54;
    const over60 = hIn - 60;
    // if (over60 < 0) return null;

    const isMale = gender === "male";

    const robinson = isMale ? 52 + 1.9 * over60 : 49 + 1.7 * over60;
    const miller = isMale ? 56.2 + 1.41 * over60 : 53.1 + 1.36 * over60;
    const devine = isMale ? 50 + 2.3 * over60 : 45.5 + 2.3 * over60;
    const hamwi = isMale ? 48 + 2.7 * over60 : 45.5 + 2.2 * over60;

    return { robinson, miller, devine, hamwi };
  }, [units, gender, height, heightFt, heightIn, isValid]);

  const avg = results
    ? Math.round(
        (results.robinson + results.miller + results.devine + results.hamwi) /
          4,
      )
    : null;

  const displayUnit = units === "metric" ? "kg" : "lbs";
  const convert = (v: number) =>
    Math.round(units === "imperial" ? v * 2.20462 : v);

  const handleAverageWeight = handleSubmit(async () => {
    if (!avg) {
      toast({
        title: "Cannot Save",
        description: "Please enter a valid height to calculate ideal weight.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your ideal weight.",
        variant: "destructive",
      });
      return;
    }

    const weight = `${avg} ${displayUnit}`;

    const { error } = await supabase
      .from("hf_data")
      .upsert(
        { ideal_weight: weight, user_id: user.id },
        { onConflict: "user_id" },
      );

    if (error) {
      toast({
        title: "Failed to update Ideal Weight",
        description: "Server error",
        variant: "destructive",
      });
      console.error(error);
      return;
    }

    toast({ title: "Saved Ideal Weight Successfully" });
  });

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
                  error={errors.height?.message}
                />
              )}
            />
          ) : (
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
                    if (n < 0) return "Height must be at least 0 ft.";
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
                    error={errors.heightIn?.message}
                  />
                )}
              />
            </div>
          )}
        </div>
      </StaggerItem>

      <StaggerItem>
        <ReadoutCard
          label="Average Ideal Weight"
          value={avg ? convert(avg).toLocaleString() : "—"}
          unit={displayUnit}
          description={
            results
              ? "Average across Robinson, Miller, Devine, and Hamwi formulas."
              : "Enter your height above."
          }
          handleDBSave={handleAverageWeight}
          showSave={true}
          // disabled={!isValid}
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
                <div
                  key={f.name}
                  className="text-center p-3 bg-background rounded-lg"
                >
                  <span className="text-xs text-muted-foreground">
                    {f.name}
                  </span>
                  <p className="text-xl font-mono font-bold tracking-tighter text-foreground mt-1">
                    {convert(f.val)}{" "}
                    <span className="text-sm text-muted-foreground font-normal">
                      {displayUnit}
                    </span>
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
