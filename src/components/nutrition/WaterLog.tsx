import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Toast } from "../ui/toast";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WaterLogProps {
  onWaterLogged: () => void;
  onClose: () => void;
}

export default function WaterLog({ onWaterLogged, onClose }: WaterLogProps) {
  const { user } = useAuth();
  const [totalMl, setTotalMl] = useState(0);
  const [goalLitres, setGoalLitres] = useState(3);

  const glassSizes = [150, 200, 250, 300, 500];

  const today = new Date().toISOString().split("T")[0];

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const addWater = async (ml: number) => {
    if (!user) return;

    try {
      if (totalMl >= goalLitres*1000) {
        // console.log(totalMl, goalLitres);
        throw new Error("Daily safe limit reached");
      }

      const { error } = await supabase.from("water_intake").insert({
        user_id: user.id,
        amount_ml: ml,
        log_date: today,
      });

      if (error) throw error;
      setTotalMl(totalMl + ml);
      onWaterLogged();
      toast({ title: "Water logged!", description: `${ml}ml added 💧` });
    } catch (error: any) {
      toast({
        title: "Max Limit Reached",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetWater = async () => {
    if (totalMl === 0) {
      toast({
        title: "Water Consumtion is 0ml",
        variant: "destructive",
      });
      return;
    }
    const { error } = await supabase
      .from("water_intake")
      .delete()
      .eq("user_id", user.id)
      .eq("log_date", today);

    if (error) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTotalMl(0);
      onWaterLogged();
      toast({
        title: "Deleted Water Log Successfully",
      });
    }
  };

  const updateWaterRequirement = async (litres: number) => {
    if (!user) return;

    const waterMl = Math.round(litres * 1000);

    const { error } = await supabase
      .from("nutrition_requirements")
      .update({ water_requirement: waterMl })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Water Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setGoalLitres(waterMl / 1000);
      toast({
        title: "Water Requirements Updated Successfully",
      });
    }
  };

  const fetchWaterRequirement = async () => {
    if (!user) return;

    const [waterRequired, waterConsumed] = await Promise.all([
      supabase
        .from("nutrition_requirements")
        .select("water_requirement")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("water_intake")
        .select("amount_ml")
        .eq("user_id", user.id)
        .eq("log_date", today),
    ]);

    if (waterRequired.error)
      console.log(
        // "Error while fetching water goals",
        waterRequired.error.message,
      );
    if (waterConsumed.error)
      console.error(
        "Error while fetching water Current Requirements",
        waterConsumed.error.message,
      );
    else {
      setGoalLitres(waterRequired.data.water_requirement / 1000);
      // Calculate total water consumed today
      const totalConsumed = waterConsumed.data.reduce(
        (sum, entry) => sum + entry.amount_ml,
        0,
      );
      setTotalMl(totalConsumed);
    }
  };

  useEffect(() => {
    fetchWaterRequirement();
  }, []);

  const totalLitres = (totalMl / 1000).toFixed(2);
  const goalMl = goalLitres * 1000;
  const progress = Math.min((totalMl / goalMl) * 100, 100).toFixed(0);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md p-6 bg-card border border-border rounded-xl shadow-sm"
      >
        <div className="flex justify-between">
          <h1 className="text-2xl font-semibold mb-4 text-foreground">
            💧 Water Hydration
          </h1>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        {/* Goal Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-foreground">
            Daily Goal (litres)
          </label>
          <input
            type="number"
            step="0.1"
            value={goalMl / 1000}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (debounceTimer.current) clearTimeout(debounceTimer.current);

              debounceTimer.current = setTimeout(() => {
                updateWaterRequirement(val);
              }, 300);
            }}
            className="w-full border border-border bg-background rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1 text-muted-foreground">
            <span>{totalLitres} L consumed</span>
            <span>{goalMl / 1000} L goal</span>
          </div>

          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-xs mt-1 text-muted-foreground">
            {progress}% completed
          </p>
        </div>

        {/* Glass Sizes */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2 text-foreground">
            Add water (glass size)
          </p>

          <div className="grid grid-cols-3 gap-2">
            {glassSizes.map((ml) => (
              <button
                key={ml}
                onClick={() => addWater(ml)}
                className="border border-border bg-muted/50 rounded-lg py-2 text-sm hover:bg-muted transition-colors"
              >
                {ml} ml
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={resetWater}
            className="flex-1 bg-muted text-foreground rounded-lg py-2 text-sm hover:bg-muted/80 transition"
          >
            Reset
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
