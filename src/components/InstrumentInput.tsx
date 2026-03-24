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
  error?: string;
}

const InstrumentInput = ({
  label,
  value,
  onChange,
  unit,
  type = "number",
  // min and max are intentionally NOT spread onto the input element —
  // they are only used for display/context. Validation is handled by RHF.
  min: _min,
  max: _max,
  step,
  error,
}: InstrumentInputProps) => {
  const id = useId();

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="absolute top-2 left-4 label-instrument pointer-events-none"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        className={`input-instrument ${error ? "border-destructive" : ""}`}
      />
      {unit && (
        <span className="absolute right-12 bottom-2.5 text-sm text-muted-foreground font-medium">
          {unit}
        </span>
      )}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
};

export default InstrumentInput;
