import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FoodItem {
  name: string;
  serving: string;
  protein: string;
  carbs: string;
  fat: string;
}

const foodData: Record<string, FoodItem[]> = {
  Fruit: [
    { name: "Apple", serving: "1 (4 oz.)", protein: "0.27g", carbs: "14.36g", fat: "0.18g" },
    { name: "Banana", serving: "1 (6 oz.)", protein: "1.85g", carbs: "38.85g", fat: "0.56g" },
    { name: "Grapes", serving: "1 cup", protein: "1.15g", carbs: "28.96g", fat: "0.26g" },
    { name: "Orange", serving: "1 (4 oz.)", protein: "0.79g", carbs: "11.79g", fat: "0.23g" },
    { name: "Pear", serving: "1 (5 oz.)", protein: "0.54g", carbs: "21.91g", fat: "0.17g" },
    { name: "Peach", serving: "1 (6 oz.)", protein: "1.2g", carbs: "12.59g", fat: "0.33g" },
    { name: "Pineapple", serving: "1 cup", protein: "0.84g", carbs: "19.58g", fat: "0.19g" },
    { name: "Strawberry", serving: "1 cup", protein: "1.11g", carbs: "12.75g", fat: "0.5g" },
    { name: "Watermelon", serving: "1 cup", protein: "0.93g", carbs: "11.48g", fat: "0.23g" },
  ],
  Vegetables: [
    { name: "Asparagus", serving: "1 cup", protein: "2.95g", carbs: "5.2g", fat: "0.16g" },
    { name: "Broccoli", serving: "1 cup", protein: "2.57g", carbs: "6.04g", fat: "0.34g" },
    { name: "Carrots", serving: "1 cup", protein: "1.19g", carbs: "12.26g", fat: "0.31g" },
    { name: "Cucumber", serving: "4 oz.", protein: "0.67g", carbs: "2.45g", fat: "0.18g" },
    { name: "Eggplant", serving: "1 cup", protein: "0.98g", carbs: "5.88g", fat: "0.18g" },
    { name: "Lettuce", serving: "1 cup", protein: "0.5g", carbs: "1.63g", fat: "0.08g" },
    { name: "Tomato", serving: "1 cup", protein: "1.58g", carbs: "7.06g", fat: "0.36g" },
  ],
  Proteins: [
    { name: "Beef, regular, cooked", serving: "2 oz.", protein: "14.2g", carbs: "0g", fat: "10.4g" },
    { name: "Chicken, cooked", serving: "2 oz.", protein: "16g", carbs: "0g", fat: "1.84g" },
    { name: "Tofu", serving: "4 oz.", protein: "7.82g", carbs: "2.72g", fat: "3.06g" },
    { name: "Egg", serving: "1 large", protein: "6.29g", carbs: "0.38g", fat: "4.97g" },
    { name: "Fish, Catfish, cooked", serving: "2 oz.", protein: "9.96g", carbs: "4.84g", fat: "8.24g" },
    { name: "Pork, cooked", serving: "2 oz.", protein: "15.82g", carbs: "0g", fat: "8.26g" },
    { name: "Shrimp, cooked", serving: "2 oz.", protein: "15.45g", carbs: "0.69g", fat: "1.32g" },
  ],
  "Common Meals/Snacks": [
    { name: "Bread, white", serving: "1 slice (1 oz.)", protein: "1.91g", carbs: "12.65g", fat: "0.82g" },
    { name: "Butter", serving: "1 tbsp", protein: "0.12g", carbs: "0.01g", fat: "11.52g" },
    { name: "Caesar salad", serving: "3 cups", protein: "16.3g", carbs: "21.12g", fat: "45.91g" },
    { name: "Cheeseburger", serving: "1 sandwich", protein: "14.77g", carbs: "31.75g", fat: "15.15g" },
    { name: "Dark Chocolate", serving: "1 oz.", protein: "1.57g", carbs: "16.84g", fat: "9.19g" },
    { name: "Pizza", serving: "1 slice (14\")", protein: "13.32g", carbs: "33.98g", fat: "12.13g" },
    { name: "Rice", serving: "1 cup cooked", protein: "4.2g", carbs: "44.08g", fat: "0.44g" },
  ],
  "Beverages/Dairy": [
    { name: "Beer", serving: "1 can", protein: "1.64g", carbs: "12.64g", fat: "0g" },
    { name: "Coca-Cola Classic", serving: "1 can", protein: "0g", carbs: "39g", fat: "0g" },
    { name: "Milk (Whole)", serving: "1 cup", protein: "7.86g", carbs: "11.03g", fat: "7.93g" },
    { name: "Orange Juice", serving: "1 cup", protein: "1.74g", carbs: "25.79g", fat: "0.5g" },
    { name: "Yogurt (low-fat)", serving: "1 cup", protein: "12.86g", carbs: "17.25g", fat: "3.8g" },
  ],
};

export function FoodTable() {
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Macronutrients in Common Foods</h2>
      <Accordion type="multiple" value={openCategories} onValueChange={setOpenCategories}>
        {Object.entries(foodData).map(([category, foods]) => (
          <AccordionItem key={category} value={category} className="border-border">
            <AccordionTrigger className="text-base font-semibold hover:no-underline">
              {category}
            </AccordionTrigger>
            <AccordionContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Food</th>
                      <th className="py-2 pr-4 font-medium">Serving</th>
                      <th className="py-2 pr-4 font-medium text-protein">Protein</th>
                      <th className="py-2 pr-4 font-medium text-carbs">Carbs</th>
                      <th className="py-2 font-medium text-fat">Fat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foods.map((food, i) => (
                      <tr key={food.name} className={i % 2 === 1 ? "bg-stripe" : ""}>
                        <td className="py-2 pr-4 font-medium">{food.name}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{food.serving}</td>
                        <td className="py-2 pr-4">{food.protein}</td>
                        <td className="py-2 pr-4">{food.carbs}</td>
                        <td className="py-2">{food.fat}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
