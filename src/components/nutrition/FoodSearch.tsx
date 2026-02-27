import React, { useState } from "react";
import { Search, Plus, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface FoodSearchProps {
  mealType: string;
  onFoodLogged: () => void;
  onClose: () => void;

  nutritionGoals?: any;
}

export function FoodSearch({ mealType, onFoodLogged, onClose, nutritionGoals }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {

      const { data, error } = await supabase.functions.invoke("search-foods", {
        body: { query },
      });

      if (error) throw error;

      setResults(data?.foods || []);
    } catch (err: any) {
      console.error("Search error:", err);
      toast({
        title: "Search failed",
        variant: "destructive",
        description: err.message || "Could not connect to nutrition database."
      });
    } finally {
      setLoading(false);
    }
  };

  const logFood = async (food: any) => {
    // Get weight (default to 100g)
    const weight = customWeights[food.id] || 100;
    const multiplier = weight / 100;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const foodData = {
        user_id: user.id,
        meal_type: mealType,
        meal_name: food.name,
        calories: Math.round(food.calories * multiplier),
        protein_g: Number((food.protein * multiplier).toFixed(1)),
        carbs_g: Number((food.carbs * multiplier).toFixed(1)),
        fats_g: Number((food.fats * multiplier).toFixed(1)),
        log_date: new Date().toISOString().split("T")[0],
      };

      const { error } = await supabase.from("nutrition_logs").insert(foodData);

      if (error) throw error;

      toast({
        title: "Food Logged",
        description: `${food.name} (${weight}g) added to ${mealType.replace('_', ' ')}`
      });

      onFoodLogged();
      onClose();
    } catch (err: any) {
      console.error("Log error:", err);
      toast({
        title: "Error",
        variant: "destructive",
        description: "Failed to save to your log."
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1A1F2C] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#222831]">
          <h2 className="text-lg font-semibold capitalize text-white">Add to {mealType.replace(/_/g, ' ')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  if (val.trim() === "") {
                    setResults([]); 
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-gray-600"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="bg-[#00D1B2] hover:bg-[#00BFA5] text-white">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Search"}
            </Button>
          </div>

          {/* Results Area */}
          <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
            
            {results.map((food) => {
              const weight = customWeights[food.id] || 100;
              const ratio = weight / 100;

              return (
                <div key={food.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#00D1B2]/30 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-gray-100 line-clamp-1">{food.name}</h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                        {food.brand || 'Standard Reference'}
                      </p>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <span className="text-lg font-bold text-[#00D1B2]">
                        {Math.round(food.calories * ratio)}
                      </span>
                      <span className="text-[10px] ml-1 text-gray-400">kcal</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    {/* Weight Input */}
                    <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                      <input
                        type="number"
                        min="1"
                        defaultValue="100"
                        className="w-12 bg-transparent border-none text-center text-xs text-white focus:outline-none"
                        onChange={(e) => setCustomWeights({
                          ...customWeights,
                          [food.id]: Number(e.target.value) || 0
                        })}
                      />
                      <span className="text-[10px] font-bold text-gray-500">G</span>
                    </div>

                    {/* Macros Display */}
                    <div className="flex gap-3 text-[11px] text-gray-300">
                      <span>P: <b>{(food.protein * ratio).toFixed(1)}g</b></span>
                      <span>C: <b>{(food.carbs * ratio).toFixed(1)}g</b></span>
                      <span>F: <b>{(food.fats * ratio).toFixed(1)}g</b></span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => logFood(food)}
                      className="h-8 w-8 rounded-full p-0 bg-[#00D1B2] hover:bg-[#00BFA5] shrink-0"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
