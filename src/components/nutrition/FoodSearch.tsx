import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Loader2, X, Apple } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Food {
  id: string;
  name: string;
  brand: string;
  image: string | null;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

interface FoodSearchProps {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  onFoodLogged: () => void;
  onClose: () => void;
}

export function FoodSearch({ mealType, onFoodLogged, onClose }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLogging, setIsLogging] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const searchFoods = useCallback(async () => {
    if (query.trim().length < 2) {
      toast({
        title: "Search too short",
        description: "Please enter at least 2 characters",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-foods", {
        body: { query: query.trim() },
      });

      if (error) throw error;
      setFoods(data.foods || []);
      
      if (data.foods?.length === 0) {
        toast({
          title: "No results",
          description: "Try a different search term",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Could not search foods. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [query, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchFoods();
    }
  };

  const logFood = async (food: Food) => {
    if (!user) return;

    setIsLogging(food.id);
    try {
      const { error } = await supabase.from("nutrition_logs").insert({
        user_id: user.id,
        meal_type: mealType,
        meal_name: food.brand ? `${food.name} (${food.brand})` : food.name,
        calories: food.calories,
        protein_g: food.protein,
        carbs_g: food.carbs,
        fats_g: food.fats,
        log_date: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      toast({
        title: "Food logged!",
        description: `${food.name} added to ${mealType}`,
      });
      onFoodLogged();
    } catch (error) {
      console.error("Log error:", error);
      toast({
        title: "Failed to log food",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLogging(null);
    }
  };

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
        className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Apple className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold">Add to {mealType}</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search foods (e.g., chicken, apple, rice)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
                autoFocus
              />
            </div>
            <Button
              onClick={searchFoods}
              disabled={isSearching}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {foods.length === 0 && !isSearching && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Search for foods to log</p>
              <p className="text-sm mt-1">Try "chicken breast", "banana", or "oatmeal"</p>
            </div>
          )}

          <AnimatePresence>
            <div className="space-y-2">
              {foods.map((food, index) => (
                <motion.div
                  key={food.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  {/* Food Image */}
                  {food.image ? (
                    <img
                      src={food.image}
                      alt={food.name}
                      className="w-12 h-12 rounded-lg object-cover bg-background"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Apple className="w-6 h-6 text-primary" />
                    </div>
                  )}

                  {/* Food Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{food.name}</p>
                    {food.brand && (
                      <p className="text-xs text-muted-foreground truncate">{food.brand}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {food.calories} kcal
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        P: {food.protein}g • C: {food.carbs}g • F: {food.fats}g
                      </span>
                    </div>
                  </div>

                  {/* Add Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => logFood(food)}
                    disabled={isLogging === food.id}
                    className="shrink-0"
                  >
                    {isLogging === food.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
