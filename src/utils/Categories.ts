import {
  Scale,
  Flame,
  Percent,
  Zap,
  Target,
  Timer,
  Baby,
  Apple,
  Heart,
} from "lucide-react";

export const CATEGORIES = [
  {
    title: "Fitness",
    calculators: [
      { name: "BMI Calculator", path: "/hf-calculator/bmi", icon: Scale, desc: "Body Mass Index" },
      { name: "Calorie / TDEE", path: "/hf-calculator/tdee", icon: Flame, desc: "Daily energy expenditure" },
      { name: "Body Fat", path: "/hf-calculator/body-fat", icon: Percent, desc: "U.S. Navy method" },
      { name: "BMR Calculator", path: "/hf-calculator/bmr", icon: Zap, desc: "Basal Metabolic Rate" },
      { name: "Ideal Weight", path: "/hf-calculator/ideal-weight", icon: Target, desc: "Multiple formulas" },
      { name: "Pace Calculator", path: "/hf-calculator/pace", icon: Timer, desc: "Run/cycle pace & time" },
    ],
  },
  {
    title: "Pregnancy",
    calculators: [
      { name: "Pregnancy Calculator", path: "/hf-calculator/pregnancy", icon: Baby, desc: "Due date & progress" },
    ],
  },
  {
    title: "Nutrition",
    calculators: [
      { name: "Macro Calculator", path: "/hf-calculator/macros", icon: Apple, desc: "Protein, carbs & fat" },
    ],
  },
];
