import { useState, useMemo } from "react";
import { addDays, addWeeks, format, differenceInDays, differenceInWeeks } from "date-fns";
import CalculatorLayout, { StaggerItem } from "@/components/CalculatorLayout";
import InstrumentInput from "@/components/InstrumentInput";
import ReadoutCard from "@/components/ReadoutCard";
import ProgressBar from "@/components/ProgressBar";

const PregnancyCalculator = () => {
  const [lmpDate, setLmpDate] = useState("");

  const results = useMemo(() => {
    if (!lmpDate) return null;
    const lmp = new Date(lmpDate);
    if (isNaN(lmp.getTime())) return null;

    const today = new Date();
    const dueDate = addDays(lmp, 280);
    const conceptionDate = addDays(lmp, 14);
    const daysSinceLmp = differenceInDays(today, lmp);
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
  }, [lmpDate]);

  return (
    <CalculatorLayout
      title="Pregnancy Calculator"
      subtitle="Estimate your due date and track pregnancy progress based on your last menstrual period."
    >
      <StaggerItem>
        <div className="surface p-6 rounded-xl">
          <InstrumentInput
            label="Last Menstrual Period (LMP)"
            value={lmpDate}
            onChange={setLmpDate}
            type="date"
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
                  { label: "Estimated Conception", date: results.conceptionDate },
                  { label: "End of First Trimester", date: results.firstTrimesterEnd },
                  { label: "End of Second Trimester", date: results.secondTrimesterEnd },
                  { label: "Due Date", date: results.dueDate },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
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
