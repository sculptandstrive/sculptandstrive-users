import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PostQuestion() {
  const [measurements, setMeasurements] = useState({
    weight_kg: "",
    height_cm: "",
    chest_cm: "",
    waist_cm: "",
    hips_cm: "",
    arms_cm: "",
    thighs_cm: "",
  });

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { user } = useAuth();

  const inputRefs = useRef([]);

  const [weightType, setWeightType] = useState<"pound" | "kg">("kg");
  const [measurementOption, setMeasurementOption] = useState<"cm" | "inch">(
    "cm",
  );

  // Validation limits for each field (same as PreQuestion)
  const validationRules = {
    weight_kg: {
      min_primary: 30,
      max_primary: 300,
      min_secondary: 66,
      max_secondary: 660,
      label: "Weight",
      maxDecimals: 2,
      maxDigits: 3,
    },
    height_cm: {
      min_primary: 100,
      max_primary: 250,
      min_secondary: 39,
      max_secondary: 99,
      label: "Height",
      maxDecimals: 2,
      maxDigits: 3,
    },
    chest_cm: {
      min_primary: 50,
      max_primary: 200,
      min_secondary: 20,
      max_secondary: 79,
      label: "Chest",
      maxDecimals: 2,
      maxDigits: 3,
    },
    waist_cm: {
      min_primary: 40,
      max_primary: 200,
      min_secondary: 16,
      max_secondary: 79,
      label: "Waist",
      maxDecimals: 2,
      maxDigits: 3,
    },
    hips_cm: {
      min_primary: 50,
      max_primary: 200,
      min_secondary: 20,
      max_secondary: 79,
      label: "Hips",
      maxDecimals: 2,
      maxDigits: 3,
    },
    arms_cm: {
      min: 15,
      max: 100,
      min_secondary: 6,
      max_secondary: 40,
      label: "Arms",
      maxDecimals: 2,
      maxDigits: 3,
    },
    thighs_cm: {
      min_primary: 30,
      max_primary: 150,
      min_secondary: 12,
      max_secondary: 59,
      label: "Thighs",
      maxDecimals: 2,
      maxDigits: 3,
    },
  };

  const handleChange = (field, value) => {
    const sanitized = value.replace(/[^0-9.]/g, "");

    const decimalCount = (sanitized.match(/\./g) || []).length;
    if (decimalCount > 1) {
      toast({
        title: "Invalid Input",
        description: "Only one decimal point is allowed",
        variant: "destructive",
      });
      return;
    }

    const parts = sanitized.split(".");
    const beforeDecimal = parts[0];

    if (beforeDecimal.length > validationRules[field].maxDigits) {
      toast({
        title: "Invalid Input",
        description: `Maximum ${validationRules[field].maxDigits} digits allowed before decimal`,
        variant: "destructive",
      });
      return;
    }

    if (parts.length === 2) {
      const afterDecimal = parts[1];
      const maxDecimals = validationRules[field].maxDecimals;

      if (afterDecimal.length > maxDecimals) {
        if (maxDecimals === 0) {
          toast({
            title: "Invalid Input",
            description: `${validationRules[field].label} cannot have decimal values`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Invalid Input",
            description: `Maximum ${maxDecimals} digits allowed after decimal`,
            variant: "destructive",
          });
        }
        return;
      }
    }

    setMeasurements({ ...measurements, [field]: sanitized });
  };

  // Fetch previous measurements on component mount
  useEffect(() => {
    const fetchMeasurement = async () => {
      if (!user) return;

      try {
        const { data: previousMeasurement, error: fetchError } = await supabase
          .from("current_measurements")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error fetching previous measurements:", fetchError);
        }

        // Pre-populate fields with previous measurements if they exist
        if (previousMeasurement) {
          setMeasurements({
            weight_kg:
              previousMeasurement.weight_kg !== 500
                ? previousMeasurement.weight_kg.toString()
                : "",
            height_cm:
              previousMeasurement.height_cm !== 500
                ? previousMeasurement.height_cm.toString()
                : "",
            chest_cm:
              previousMeasurement.chest_cm !== 500
                ? previousMeasurement.chest_cm.toString()
                : "",
            waist_cm:
              previousMeasurement.waist_cm !== 500
                ? previousMeasurement.waist_cm.toString()
                : "",
            hips_cm:
              previousMeasurement.hips_cm !== 500
                ? previousMeasurement.hips_cm.toString()
                : "",
            arms_cm:
              previousMeasurement.arms_cm !== 500
                ? previousMeasurement.arms_cm.toString()
                : "",
            thighs_cm:
              previousMeasurement.thighs_cm !== 500
                ? previousMeasurement.thighs_cm.toString()
                : "",
          });
        }
      } catch (error) {
        console.error("Unexpected error fetching measurements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeasurement();
  }, [user]);

  const validateMeasurements = () => {
    // Check if at least one field is filled
   const allEmpty = Object.values(measurements).every((val) => val === "");
   if (allEmpty) {
     toast({
       title: "Validation Error",
       description: "Please fill all the fields",
       variant: "destructive",
     });
     return false;
   }

    const fieldOrder = [
      { key: "weight_kg", label: "Weight" },
      { key: "height_cm", label: "Height" },
      { key: "chest_cm", label: "Chest" },
      { key: "waist_cm", label: "Waist" },
      { key: "hips_cm", label: "Hips" },
      { key: "arms_cm", label: "Arms" },
      { key: "thighs_cm", label: "Thighs" },
    ];

    for (const field of fieldOrder) {
      if (measurements[field.key] === "") {
        toast({
          title: "Validation Error",
          description: `${field.label} is empty, please fill first`,
          variant: "destructive",
        });
        return false;
      }
    }

    // Validate each filled field against min/max limits
    for (const [field, value] of Object.entries(measurements)) {
      if (value === "") continue; // Skip empty fields

      let numValue = Number(value);
      const rules = validationRules[field];
      let fieldType = field.split("_")[1];

      if (!rules) continue; // Skip fields without validation rules

      if (field.includes("kg") && weightType === "pound") {
        fieldType = "pound";
      } else if (field.includes("cm") && measurementOption === "inch") {
        fieldType = "inch";
      }

      if (fieldType === "pound" || fieldType === "inch") {
        // console.log(numValue);
        if (numValue < rules.min_secondary) {
          toast({
            title: "Validation Error",
            description: `${rules.label} must be at least ${rules.min_secondary} ${fieldType}`,
            variant: "destructive",
          });
          return false;
        } else if (numValue > rules.max_secondary) {
          toast({
            title: "Validation Error",
            description: `${rules.label} cannot exceed ${rules.max_secondary} ${fieldType}`,
            variant: "destructive",
          });
          return false;
        }
      } else {
        if (numValue < rules.min_primary) {
          toast({
            title: "Validation Error",
            description: `${rules.label} must be at least ${rules.min_primary} ${fieldType}`,
            variant: "destructive",
          });
          return false;
        } else if (numValue > rules.max_primary) {
          toast({
            title: "Validation Error",
            description: `${rules.label} cannot exceed ${rules.max_primary} ${fieldType}`,
            variant: "destructive",
          });
          return false;
        }
      }

      if (field.includes("kg") && weightType === "pound") {
        numValue *= 0.45;
      } else if (field.includes("cm") && measurementOption === "inch") {
        numValue *= 2.54;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validate before submitting
    if (!validateMeasurements()) {
      return;
    }

    try {
      // Fetch the most recent measurement entry for this user
      const { data: previousMeasurement, error: fetchError } = await supabase
        .from("current_measurements")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is fine for first entry
        console.error("Error fetching previous measurements:", fetchError);
      }

      // Fetch starting measurements to check which fields need to be updated
      const { data: startingMeasurement, error: startingFetchError } =
        await supabase
          .from("starting_measurements")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

      if (startingFetchError && startingFetchError.code !== "PGRST116") {
        console.error(
          "Error fetching starting measurements:",
          startingFetchError,
        );
      }

      const newMeasurement = {
        user_id: user.id,
        weight_kg:
          weightType === "kg"
            ? Number(measurements.weight_kg)
            : Number(measurements.weight_kg) * 0.453,
        height_cm:
          measurementOption === "cm"
            ? Number(measurements.height_cm)
            : Number(measurements.height_cm) * 2.54,
        chest_cm: measurements.chest_cm
          ? Number(measurements.chest_cm)
          : Number(measurements.chest_cm) * 2.54,
        waist_cm: measurements.waist_cm
          ? Number(measurements.waist_cm)
          : Number(measurements.waist_cm) * 2.54,
        hips_cm: measurements.hips_cm
          ? Number(measurements.hips_cm)
          : Number(measurements.hips_cm) * 2.54,
        arms_cm: measurements.arms_cm
          ? Number(measurements.arms_cm)
          : Number(measurements.arms_cm) * 2.54,
        thighs_cm: measurements.thighs_cm
          ? Number(measurements.thighs_cm)
          : Number(measurements.thighs_cm) * 2.54,
        age: previousMeasurement?.age || 500,
      };

      // Determine which fields to update in starting_measurements
      // Only update if the previous value was 500 and new value is not 500
      const startingUpdates = {};
      const measurementFields = [
        "weight_kg",
        "height_cm",
        "chest_cm",
        "waist_cm",
        "hips_cm",
        "arms_cm",
        "thighs_cm",
      ];

      measurementFields.forEach((field) => {
        const previousValue = previousMeasurement?.[field] || 500;
        const newValue = newMeasurement[field];

        // If this is the first time a real value (not 500) is being entered
        if (previousValue === 500 && newValue !== 500) {
          startingUpdates[field] = newValue;
        }
      });

      // Insert the new measurement into current_measurements
      const { error: insertError } = await supabase
        .from("current_measurements")
        .insert([newMeasurement]);

      if (insertError) {
        console.error("Error inserting measurements:", insertError);
        toast({
          description: "Failed to save measurements. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update starting_measurements if there are fields to update
      if (Object.keys(startingUpdates).length > 0) {
        if (startingMeasurement) {
          // Update existing starting measurement
          const { error: updateError } = await supabase
            .from("starting_measurements")
            .update(startingUpdates)
            .eq("user_id", user.id)
            .eq("id", startingMeasurement.id);

          if (updateError) {
            console.error("Error updating starting measurements:", updateError);
          }
        } else {
          // Create new starting measurement with all values
          const newStartingMeasurement = {
            user_id: user.id,
            ...startingUpdates,
            // Fill remaining fields with 500 if not in updates
            ...measurementFields.reduce((acc, field) => {
              if (!startingUpdates[field]) {
                acc[field] = 500;
              }
              return acc;
            }, {}),
            age: 500,
          };

          const { error: insertStartingError } = await supabase
            .from("starting_measurements")
            .insert([newStartingMeasurement]);

          if (insertStartingError) {
            console.error(
              "Error inserting starting measurements:",
              insertStartingError,
            );
          }
        }
      }

      toast({ description: "Measurements saved successfully!" });
      navigate("/");
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleSkip = () => {
    navigate("/");
  };

   const handleEnter = (e, index) => {
     if (e.key === "Enter") {
       e.preventDefault();
       inputRefs.current[index + 1]?.focus();
     }
   };



  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className=" rounded-2xl shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold"> Measurements</h2>
              <div className="flex justify-between gap-2">
                <Select
                  value={measurementOption}
                  onValueChange={(value: "cm" | "inch") => {
                    setMeasurementOption(value);
                  }}
                >
                  <SelectTrigger className="bg-primary text-black font-medium border-border mb-4 px-2 rounded-lg">
                    <SelectValue placeholder="Select Dimension Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="inch">inch</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={weightType}
                  onValueChange={(value: "kg" | "pound") => {
                    setWeightType(value);
                  }}
                >
                  <SelectTrigger className="bg-primary text-black font-medium border-border mb-4 px-4 rounded-lg">
                    <SelectValue placeholder="Select Dimension Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="pound">pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Weight and Height */}
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 items-center">
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Weight ({weightType}) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  ref={(el) => (inputRefs.current[0] = el)}
                  onKeyDown={(e) => handleEnter(e, 0)}
                  placeholder="e.g., 75.5"
                  value={measurements.weight_kg}
                  onChange={(e) => handleChange("weight_kg", e.target.value)}
                />
                {weightType === "kg" ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: 30-300 kg
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: 66-660 pounds
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Height ({measurementOption}){" "}
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  ref={(el) => (inputRefs.current[1] = el)}
                  onKeyDown={(e) => handleEnter(e, 1)}
                  placeholder="e.g., 175"
                  value={measurements.height_cm}
                  onChange={(e) => handleChange("height_cm", e.target.value)}
                />
                {measurementOption === "cm" ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: 100-250 cm
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: 39-99 inch
                  </p>
                )}
              </div>
            </div>

            {/* Body Measurements */}
            <div className="pt-2 ">
              <h3 className="text-sm font-medium mb-3">
                Body Measurements (cm)
              </h3>
              <div className=" grid sm:grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Chest
                  </label>
                  <Input
                    type="text"
                    ref={(el) => (inputRefs.current[2] = el)}
                    onKeyDown={(e) => handleEnter(e, 2)}
                    placeholder="e.g., 95"
                    value={measurements.chest_cm}
                    onChange={(e) => handleChange("chest_cm", e.target.value)}
                  />
                  {measurementOption === "cm" ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: 50-200 cm
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: 20-79 inch
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Waist
                  </label>
                  <Input
                    type="text"
                    ref={(el) => (inputRefs.current[3] = el)}
                    onKeyDown={(e) => handleEnter(e, 3)}
                    placeholder="e.g., 85"
                    value={measurements.waist_cm}
                    onChange={(e) => handleChange("waist_cm", e.target.value)}
                  />
                  {measurementOption === "cm" ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: 40-200 cm
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: 16-79 inch
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Hips
                  </label>
                  <Input
                    type="text"
                    ref={(el) => (inputRefs.current[4] = el)}
                    onKeyDown={(e) => handleEnter(e, 4)}
                    placeholder="e.g., 100"
                    value={measurements.hips_cm}
                    onChange={(e) => handleChange("hips_cm", e.target.value)}
                  />
                  {measurementOption === "cm" ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: 50-200 cm
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: 20-79 inch
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Arms
                  </label>
                  <Input
                    type="text"
                    ref={(el) => (inputRefs.current[5] = el)}
                    onKeyDown={(e) => handleEnter(e, 5)}
                    placeholder="e.g., 35"
                    value={measurements.arms_cm}
                    onChange={(e) => handleChange("arms_cm", e.target.value)}
                  />
                  {measurementOption === "cm" ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: 15-100 cm
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: 6-40 inch
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Thighs
                  </label>
                  <Input
                    type="text"
                    ref={(el) => (inputRefs.current[6] = el)}
                    onKeyDown={(e) => handleEnter(e, 6)}
                    placeholder="e.g., 60"
                    value={measurements.thighs_cm}
                    onChange={(e) => handleChange("thighs_cm", e.target.value)}
                  />
                  {measurementOption === "cm" ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: 30-150 cm
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: 12-59 inch
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              ref={(el) => (inputRefs.current[7] = el)}
              onClick={handleSubmit}
            >
              Save Measurements
            </Button>
            <Button className="w-full" variant="ghost" onClick={handleSkip}>
              Skip
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
