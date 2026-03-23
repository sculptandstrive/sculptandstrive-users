import React, { useState } from 'react'


const ACTIVITY_LEVELS = [
  { label: "Sedentary: little or no exercise", factor: 1.2 },
  { label: "Exercise 1-3 times/week", factor: 1.375 },
  { label: "Exercise 4-5 times/week", factor: 1.465 },
  { label: "Daily exercise or intense exercise 3-4 times/week", factor: 1.55 },
  { label: "Intense exercise 6-7 times/week", factor: 1.725 },
  { label: "Very intense exercise daily, or physical job", factor: 1.9 },
];

interface BMRProps {
    bmr: number;
    resultUnit: string
}


const BMRData = ({bmr, resultUnit}: BMRProps) => {
  const displayValue = (val: number) => {
    const converted = resultUnit === "kj" ? Math.round(val * 4.184) : val;
    return converted.toLocaleString();
  };

  const unitLabel = resultUnit === "kj" ? "kJ/day" : "Calories/day";

  return (
    <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6 shadow-sm fade-in-up">
      {bmr !== null ? (
        <div className="animate-fade-in space-y-6">
          <div>
            <div className="flex flex-row justify-between">
              <h2 className="text-xl font-display font-bold text-foreground mb-3">
                BMR Result
              </h2>
            </div>
            <div className="result-card">
              <p className="text-muted-foreground text-sm">
                Your Basal Metabolic Rate
              </p>
              <p className="text-4xl font-display font-bold text-primary mt-1">
                {displayValue(bmr)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{unitLabel}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-3">
              Daily calorie needs based on activity level
            </h3>
            <div className="bg-card rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-4 py-3 font-semibold text-foreground">
                      Activity Level
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-foreground">
                      {resultUnit === "kj" ? "kJ" : "Calorie"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ACTIVITY_LEVELS.map((level, i) => (
                    <tr key={i} className={i % 2 === 1 ? "table-stripe" : ""}>
                      <td className="px-4 py-3 text-foreground">
                        {level.label}
                      </td>
                      <td className="px-4 py-3 text-right font-display font-semibold text-foreground">
                        {displayValue(Math.round(bmr * level.factor))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p>
                <strong className="text-foreground">Exercise:</strong> 15-30
                minutes of elevated heart rate activity.
              </p>
              <p>
                <strong className="text-foreground">Intense exercise:</strong>{" "}
                45-120 minutes of elevated heart rate activity.
              </p>
              <p>
                <strong className="text-foreground">
                  Very intense exercise:
                </strong>{" "}
                2+ hours of elevated heart rate activity.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full min-h-[300px] bg-card rounded-lg border">
          <p className="text-muted-foreground text-sm">
            Enter your details and click Calculate to see results.
          </p>
        </div>
      )}
    </div>
  );
}

export default BMRData

