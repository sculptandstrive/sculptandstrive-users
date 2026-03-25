import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { addDays, addWeeks, format, differenceInDays } from "date-fns";
import CalculatorLayout, { StaggerItem } from "@/components/CalculatorLayout";
import InstrumentInput from "@/components/InstrumentInput";
import ReadoutCard from "@/components/ReadoutCard";
import ProgressBar from "@/components/ProgressBar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type FormValues = {
  lmpDate: string;
};

const PregnancyCalculator = () => {
  const today = new Date();
  const minDate = format(addDays(today, -280), "yyyy-MM-dd");
  const maxDate = format(today, "yyyy-MM-dd");
  const {user} = useAuth();

  const {
    control,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: { lmpDate: "" },
  });

  const lmpDate = watch("lmpDate");

  const results = useMemo(() => {
    if (!lmpDate || !isValid) return null;
    // console.log(lmpDate);
    const lmp = new Date(lmpDate);
    // console.log(lmp)
    if (isNaN(lmp.getTime())) return null;

    const daysSinceLmp = differenceInDays(today, lmp);
    if (daysSinceLmp < 0 || daysSinceLmp > 280) return null;

    const dueDate = addDays(lmp, 280);
    // console.log(dueDate);
    const conceptionDate = addDays(lmp, 14);
    const weeksPregnant = Math.floor(daysSinceLmp / 7);
    const daysExtra = daysSinceLmp % 7;
    const daysUntilDue = differenceInDays(dueDate, today);
    const trimester = weeksPregnant < 13 ? 1 : weeksPregnant < 27 ? 2 : 3;
    const progressPercent = Math.min((daysSinceLmp / 280) * 100, 100);

    return {
      dueDate,
      conceptionDate,
      weeksPregnant,
      daysExtra,
      daysUntilDue,
      trimester,
      progressPercent,
      firstTrimesterEnd: addWeeks(lmp, 13),
      secondTrimesterEnd: addWeeks(lmp, 27),
    };
  }, [lmpDate, isValid]);

  const handlePregnancyCalc = async() => {
    if(!lmpDate){
       toast({
         title: "Cannot Save",
         description: "Please enter valid LMP Range",
         variant: "destructive",
       });
       return;
    }
    const {error} = await supabase.from('hf_data').upsert({lmp_date: lmpDate, user_id: user.id}, {onConflict: "user_id"})

    if(error){
      toast({
        title: "Failed to save Pregnancy Data",
        description: "Server error. Please try again.",
        variant: "destructive",
      });
      console.error(error);
      return;
    }
    toast({ title: "Saved LMP Successfully" });
  }

  return (
    <CalculatorLayout
      title="Pregnancy Calculator"
      subtitle="Estimate your due date and track pregnancy progress based on your last menstrual period."
    >
      <StaggerItem>
        <div className="surface p-6 rounded-xl">
          <Controller
            name="lmpDate"
            control={control}
            rules={{
              required: "Please select a date.",
              validate: (v) => {
                if (v > maxDate) return "Last Menstrual Period date cannot be in the future.";
                if (v < minDate)
                  return "Last Menstrual Period date cannot be more than 280 days ago.";
                return true;
              },
            }}
            render={({ field }) => (
              <InstrumentInput
                label="Last Menstrual Period (LMP)"
                value={field.value}
                onChange={field.onChange}
                type="date"
                min={minDate}
                max={maxDate}
                error={errors.lmpDate?.message}
              />
            )}
          />
        </div>
      </StaggerItem>

      {results && (
        <>
          <StaggerItem>
            <ReadoutCard
              label="Estimated Due Date"
              value={format(results.dueDate, "MMM d, yyyy")}
              colorClass="text-accent"
              showSave = {true}
              handleDBSave={handlePregnancyCalc}
              description={`${results.daysUntilDue > 0 ? results.daysUntilDue + " days remaining" : "Past due date"}. Currently in trimester ${results.trimester}.`}
            >
              <ProgressBar value={results.progressPercent} />
            </ReadoutCard>
          </StaggerItem>

          <StaggerItem>
            <div className="grid grid-cols-2 gap-4">
              <ReadoutCard
                label="Current Week"
                value={`${results.weeksPregnant}w ${results.daysExtra}d`}
                colorClass="text-accent"
              />
              <ReadoutCard
                label="Trimester"
                value={String(results.trimester)}
                colorClass="text-accent"
              />
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="surface p-6 rounded-xl">
              <span className="label-instrument mb-4 block">Key Dates</span>
              <div className="space-y-3">
                {[
                  {
                    label: "Estimated Conception",
                    date: results.conceptionDate,
                  },
                  {
                    label: "End of First Trimester",
                    date: results.firstTrimesterEnd,
                  },
                  {
                    label: "End of Second Trimester",
                    date: results.secondTrimesterEnd,
                  },
                  { label: "Due Date", date: results.dueDate },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="text-sm font-medium text-foreground font-mono">
                      {format(item.date, "MMM d, yyyy")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </StaggerItem>
        </>
      )}
    </CalculatorLayout>
  );
};

export default PregnancyCalculator;
