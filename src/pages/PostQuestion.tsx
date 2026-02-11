import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";

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

  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChange = (field, value) => {
    const sanitized = value.replace(/[^0-9.]/g, "");
    setMeasurements({ ...measurements, [field]: sanitized });
  };

  const handleSubmit = async () => {
    if (!user) return;

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

      const newMeasurement = {
        user_id: user.id,
        weight_kg: measurements.weight_kg
          ? Number(measurements.weight_kg)
          : previousMeasurement?.weight_kg || null,
        height_cm: measurements.height_cm
          ? Number(measurements.height_cm)
          : previousMeasurement?.height_cm || null,
        chest_cm: measurements.chest_cm
          ? Number(measurements.chest_cm)
          : previousMeasurement?.chest_cm || null,
        waist_cm: measurements.waist_cm
          ? Number(measurements.waist_cm)
          : previousMeasurement?.waist_cm || null,
        hips_cm: measurements.hips_cm
          ? Number(measurements.hips_cm)
          : previousMeasurement?.hips_cm || null,
        arms_cm: measurements.arms_cm
          ? Number(measurements.arms_cm)
          : previousMeasurement?.arms_cm || null,
        thighs_cm: measurements.thighs_cm
          ? Number(measurements.thighs_cm)
          : previousMeasurement?.thighs_cm || null,
        age: previousMeasurement?.age || null,
      };

      console.log(newMeasurement);

      // Insert the new measurement
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className=" rounded-2xl shadow-md">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Current Measurements</h2>

            {/* Weight and Height */}
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 items-center">
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Weight (kg)
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 75.5"
                  value={measurements.weight_kg}
                  onChange={(e) => handleChange("weight_kg", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Height (cm)
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 175"
                  value={measurements.height_cm}
                  onChange={(e) => handleChange("height_cm", e.target.value)}
                />
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
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={handleSubmit}>
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
//f