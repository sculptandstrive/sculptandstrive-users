export interface NutritionLog {
  calories: number | string;
  protein_g: number | string;
  carbs_g: number | string;
  fats_g: number | string;
}

export const calculateNutritionTotals = (logs: NutritionLog[]) => {
  return logs.reduce(
    (acc, log) => ({
      calories: acc.calories + (Number(log.calories) || 0),
      protein: acc.protein + (Number(log.protein_g) || 0),
      carbs: acc.carbs + (Number(log.carbs_g) || 0),
      fats: acc.fats + (Number(log.fats_g) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
};


 
export const getNutritionGoals = (assignedPlan: any, requirement: any) => {
 
  return {
    calories: Number(assignedPlan?.calories || requirement?.calories_requirement || 2200),
    protein: Number(assignedPlan?.protein || requirement?.protein_requirement || 150),
    carbs: Number(assignedPlan?.carbs_g || requirement?.carbs_requirement || 250),
    fats: Number(assignedPlan?.fats_g || requirement?.fats_requirement || 75),
  };
};