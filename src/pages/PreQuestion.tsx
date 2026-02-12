import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";

export default function PreQuestion() {
  const [measurements, setMeasurements] = useState({
    weight_kg: "",
    height_cm: "",
    chest_cm: "",
    waist_cm: "",
    hips_cm: "",
    arms_cm: "",
    thighs_cm: "",
    age: "",
  });

  const navigate = useNavigate();
  const { user } = useAuth();

  // Validation limits for each field
  const validationRules = {
    weight_kg: {
      min: 30,
      max: 300,
      label: "Weight",
      maxDecimals: 2,
      maxDigits: 3,
    },
    height_cm: {
      min: 100,
      max: 250,
      label: "Height",
      maxDecimals: 2,
      maxDigits: 3,
    },
    chest_cm: {
      min: 50,
      max: 200,
      label: "Chest",
      maxDecimals: 2,
      maxDigits: 3,
    },
    waist_cm: {
      min: 40,
      max: 200,
      label: "Waist",
      maxDecimals: 2,
      maxDigits: 3,
    },
    hips_cm: { min: 50, max: 200, label: "Hips", maxDecimals: 2, maxDigits: 3 },
    arms_cm: { min: 15, max: 100, label: "Arms", maxDecimals: 2, maxDigits: 3 },
    thighs_cm: {
      min: 30,
      max: 150,
      label: "Thighs",
      maxDecimals: 2,
      maxDigits: 3,
    },
    age: { min: 10, max: 120, label: "Age", maxDecimals: 0, maxDigits: 3 },
  };

  const handleChange = (field, value) => {
    // Only allow numbers and one decimal point
    const sanitized = value.replace(/[^0-9.]/g, "");

    // Check for multiple decimal points (Row 37: only one decimal accepted)
    const decimalCount = (sanitized.match(/\./g) || []).length;
    if (decimalCount > 1) {
      toast({
        title: "Invalid Input",
        description: "Only one decimal point is allowed",
        variant: "destructive",
      });
      return;
    }

    // Row 35: Maximum 3 digits before decimal
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

    // Row 36: Maximum 2 digits after decimal (except age which is 0)
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

  const validateMeasurements = () => {
    // Only Weight, Height, and Age are mandatory
    const mandatoryFields = ["weight_kg", "height_cm", "age"];
    const optionalFields = [
      "chest_cm",
      "waist_cm",
      "hips_cm",
      "arms_cm",
      "thighs_cm",
    ];

    // Check mandatory fields
    for (const field of mandatoryFields) {
      if (!measurements[field] || measurements[field] === "") {
        toast({
          title: "Validation Error",
          description: `${validationRules[field].label} is required`,
          variant: "destructive",
        });
        return false;
      }
    }

    // Validate each field (both mandatory and filled optional fields)
    for (const [field, value] of Object.entries(measurements)) {
      // Skip empty optional fields
      if (optionalFields.includes(field) && (!value || value === "")) {
        continue;
      }

      const numValue = Number(value);
      const rules = validationRules[field];

      // Row 27, 28, 29: Zero value check (though we accept 0)
      // Based on the sheet, zero values are accepted, so we skip this

      // Row 33, 34: Min/Max validation
      if (numValue < rules.min) {
        toast({
          title: "Validation Error",
          description: `${rules.label} must be at least ${rules.min}`,
          variant: "destructive",
        });
        return false;
      }

      if (numValue > rules.max) {
        toast({
          title: "Validation Error",
          description: `${rules.label} cannot exceed ${rules.max}`,
          variant: "destructive",
        });
        return false;
      }

      // Validate decimal places one more time on submit
      const parts = value.split(".");
      if (parts.length === 2 && parts[1].length > rules.maxDecimals) {
        toast({
          title: "Validation Error",
          description: `${rules.label} can have maximum ${rules.maxDecimals} decimal places`,
          variant: "destructive",
        });
        return false;
      }

      // Validate that age doesn't have decimals
      if (field === "age" && value.includes(".")) {
        toast({
          title: "Validation Error",
          description: "Age cannot have decimal values",
          variant: "destructive",
        });
        return false;
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
      const { error } = await supabase.from("starting_measurements").insert([
        {
          user_id: user.id,
          weight_kg: Number(measurements.weight_kg),
          height_cm: Number(measurements.height_cm),
          chest_cm: measurements.chest_cm
            ? Number(measurements.chest_cm)
            : null,
          waist_cm: measurements.waist_cm
            ? Number(measurements.waist_cm)
            : null,
          hips_cm: measurements.hips_cm ? Number(measurements.hips_cm) : null,
          arms_cm: measurements.arms_cm ? Number(measurements.arms_cm) : null,
          thighs_cm: measurements.thighs_cm
            ? Number(measurements.thighs_cm)
            : null,
          age: Number(measurements.age),
        },
      ]);

      if (error) throw error;

      await supabase.from("current_measurements").insert([
        {
          user_id: user.id,
          weight_kg: Number(measurements.weight_kg),
          height_cm: Number(measurements.height_cm),
          chest_cm: measurements.chest_cm
            ? Number(measurements.chest_cm)
            : null,
          waist_cm: measurements.waist_cm
            ? Number(measurements.waist_cm)
            : null,
          hips_cm: measurements.hips_cm ? Number(measurements.hips_cm) : null,
          arms_cm: measurements.arms_cm ? Number(measurements.arms_cm) : null,
          thighs_cm: measurements.thighs_cm
            ? Number(measurements.thighs_cm)
            : null,
          age: Number(measurements.age),
        },
      ]);

      toast({
        title: "Success",
        description: "Measurements saved successfully",
      });

      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className=" rounded-2xl shadow-md">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold"> Measurements</h2>

            {/* Weight and Height */}
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 items-center">
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Weight (kg) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 75.5"
                  value={measurements.weight_kg}
                  onChange={(e) => handleChange("weight_kg", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Range: 30-300 kg 
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Height (cm) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 175"
                  value={measurements.height_cm}
                  onChange={(e) => handleChange("height_cm", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Range: 100-250 cm 
                </p>
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
                    placeholder="e.g., 95"
                    value={measurements.chest_cm}
                    onChange={(e) => handleChange("chest_cm", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: 50-200 cm 
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Waist
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., 85"
                    value={measurements.waist_cm}
                    onChange={(e) => handleChange("waist_cm", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: 40-200 cm 
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Hips
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., 100"
                    value={measurements.hips_cm}
                    onChange={(e) => handleChange("hips_cm", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: 50-200 cm 
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Arms
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., 35"
                    value={measurements.arms_cm}
                    onChange={(e) => handleChange("arms_cm", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: 15-100 cm 
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Thighs
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., 60"
                    value={measurements.thighs_cm}
                    onChange={(e) => handleChange("thighs_cm", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: 30-150 cm 
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., 25"
                    value={measurements.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: 10-120 years 
                  </p>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={handleSubmit}>
              Save Measurements
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
