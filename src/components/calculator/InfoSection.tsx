import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function InfoSection() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Learn More</h2>
      <Accordion type="multiple" className="space-y-0">
        <AccordionItem value="macros" className="border-border">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            What are Macronutrients?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>Macronutrients are the chemical compounds that humans consume in large quantities that provide bulk energy — specifically carbohydrates, proteins, and fats.</p>
            <p>Micronutrients consist of vitamins and dietary minerals and are typically needed in amounts fewer than 100 milligrams per day.</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="protein" className="border-border">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            Protein
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>Proteins are organic compounds comprised of amino acids. Essential amino acids can only be obtained through diet from sources like meat, dairy, beans, legumes, nuts, and seeds.</p>
            <p><strong>Healthier sources:</strong> Soy, beans, nuts, fish, skinless poultry, lean beef, low-fat dairy.</p>
            <p><strong>Less healthy sources:</strong> Fried meats, processed meats, high-sugar yogurts, processed protein bars.</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="carbs" className="border-border">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            Carbohydrates
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>Carbohydrates are classified as sugar, starch, or fiber. Complex carbohydrates from vegetables, fruits, and whole grains are beneficial, while excess simple sugars from processed foods can have negative health effects.</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="fat" className="border-border">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            Fat
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>Fats are essential for structural and metabolic functions. Monounsaturated, polyunsaturated, and omega-3 fatty acids are healthier choices. The Dietary Guidelines recommend limiting saturated fat to less than 10% of daily calories and avoiding trans fats.</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="calories" className="border-border">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            Daily Calorie Needs
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>Daily calorie needs depend on height, weight, age, activity level, and goals. An average person may need 1,600–3,000 calories per day. This calculator uses the Mifflin-St Jeor Equation to estimate BMR.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
