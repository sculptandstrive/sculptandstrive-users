import { useId } from "react";

interface InstrumentInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
}

const InstrumentInput = ({ label, value, onChange, unit, type = "number", min, max, step }: InstrumentInputProps) => {
  const id = useId();

  return (
    <div className="relative">
      <label htmlFor={id} className="absolute top-2 left-4 label-instrument pointer-events-none">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        className="input-instrument"
      />
      {unit && (
        <span className="absolute right-12 bottom-2.5 text-sm text-muted-foreground font-medium">
          {unit}
        </span>
      )}
    </div>
  );
};

export default InstrumentInput;
