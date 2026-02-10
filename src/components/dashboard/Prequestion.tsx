import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";

export default function Prequestion() {
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
  const {user} = useAuth();

  const handleChange = (field, value) => {
    // Only allow numbers and decimals
    const sanitized = value.replace(/[^0-9.]/g, "");
    setMeasurements({ ...measurements, [field]: sanitized });
  };

  const handleSubmit = async() => {
    if(!user)
        return;
    const allFilled = Object.values(measurements).every((val) => val !== "");
    if (allFilled) {
        const {error} = await supabase.from('starting_measurements').insert([
        {
        user_id: user.id, 
        weight_kg: Number(measurements.weight_kg),
        height_cm: Number(measurements.height_cm),
        chest_cm: Number(measurements.chest_cm ),
        waist_cm: Number(measurements.waist_cm), 
        hips_cm: Number(measurements.hips_cm ),
        arms_cm: Number(measurements.arms_cm ),
        thighs_cm: Number(measurements.thighs_cm) 
        }
        ])
        
         await supabase.from("current_measurements").insert([
          {
            user_id: user.id,
            weight_kg: Number(measurements.weight_kg),
            height_cm: Number(measurements.height_cm),
            chest_cm: Number(measurements.chest_cm),
            waist_cm: Number(measurements.waist_cm),
            hips_cm: Number(measurements.hips_cm),
            arms_cm: Number(measurements.arms_cm),
            thighs_cm: Number(measurements.thighs_cm),
          },
        ]);
        navigate('/');
    } else {
      toast({description: 'All Fields are required'})
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
