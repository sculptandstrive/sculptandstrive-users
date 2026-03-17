import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface ReadoutCardProps {
  label: string;
  value: string;
  unit?: string;
  description?: string;
  children?: ReactNode;
  colorClass?: string;
}

const ReadoutCard = ({ label, value, unit, description, children, colorClass = "text-primary" }: ReadoutCardProps) => {
  return (
    <motion.div
      layout
      className="surface-elevated p-6 rounded-xl"
    >
      <span className="label-instrument">{label}</span>
      <div className="flex items-baseline gap-2 mt-2">
        <AnimatePresence mode="popLayout">
          <motion.h2
            key={value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`text-5xl sm:text-6xl font-mono font-bold tracking-tighter ${colorClass}`}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {value}
          </motion.h2>
        </AnimatePresence>
        {unit && (
          <span className="text-lg font-medium text-muted-foreground">{unit}</span>
        )}
      </div>
      {description && (
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-[60ch]">
          {description}
        </p>
      )}
      {children}
    </motion.div>
  );
};

export default ReadoutCard;
