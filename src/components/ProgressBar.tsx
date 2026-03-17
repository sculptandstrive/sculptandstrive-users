import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max?: number;
  segments?: { label: string; color: string; threshold: number }[];
  currentValue?: number;
}

const ProgressBar = ({ value, max = 100, segments, currentValue }: ProgressBarProps) => {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);

  if (segments && currentValue !== undefined) {
    return (
      <div className="mt-6">
        <div className="h-2.5 w-full bg-background rounded-full overflow-hidden flex">
          {segments.map((seg, i) => {
            const prevThreshold = i > 0 ? segments[i - 1].threshold : 0;
            const width = ((seg.threshold - prevThreshold) / max) * 100;
            return (
              <div
                key={seg.label}
                className="h-full transition-all duration-300"
                style={{
                  width: `${width}%`,
                  backgroundColor: seg.color,
                  opacity: currentValue >= prevThreshold && currentValue < seg.threshold ? 1 : 0.3,
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          {segments.map((seg) => (
            <span key={seg.label} className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {seg.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 h-2 w-full bg-background rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ type: "spring", bounce: 0, duration: 0.6 }}
        className="h-full bg-primary rounded-full"
      />
    </div>
  );
};

export default ProgressBar;
