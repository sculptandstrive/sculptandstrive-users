import { useState, useMemo } from "react";
import CalculatorLayout, { StaggerItem } from "@/components/CalculatorLayout";
import InstrumentInput from "@/components/InstrumentInput";
import SegmentedControl from "@/components/SegmentedControl";
import ReadoutCard from "@/components/ReadoutCard";

const PaceCalculator = () => {
  const [mode, setMode] = useState("pace");
  const [distance, setDistance] = useState("5");
  const [distanceUnit, setDistanceUnit] = useState("km");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("25");
  const [seconds, setSeconds] = useState("0");
  const [paceMin, setPaceMin] = useState("5");
  const [paceSec, setPaceSec] = useState("0");

  const result = useMemo(() => {
    const d = parseFloat(distance);
    if (!d) return null;

    const distKm = distanceUnit === "mi" ? d * 1.60934 : d;

    if (mode === "pace") {
      // Calculate pace from distance and time
      const totalSec = parseFloat(hours) * 3600 + parseFloat(minutes) * 60 + parseFloat(seconds);
      if (!totalSec) return null;
      const pacePerKm = totalSec / distKm;
      const pacePerMi = totalSec / (distKm / 1.60934);
      return {
        paceKm: { min: Math.floor(pacePerKm / 60), sec: Math.round(pacePerKm % 60) },
        paceMi: { min: Math.floor(pacePerMi / 60), sec: Math.round(pacePerMi % 60) },
        speed: (distKm / (totalSec / 3600)).toFixed(1),
      };
    } else {
      // Calculate time from distance and pace
      const paceSecPerKm = (parseFloat(paceMin) * 60 + parseFloat(paceSec));
      if (!paceSecPerKm) return null;
      const totalSec = paceSecPerKm * distKm;
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = Math.round(totalSec % 60);
      return {
        time: { h, m, s },
        speed: (distKm / (totalSec / 3600)).toFixed(1),
      };
    }
  }, [mode, distance, distanceUnit, hours, minutes, seconds, paceMin, paceSec]);

  return (
    <CalculatorLayout
      title="Pace Calculator"
      subtitle="Calculate running or cycling pace, time, or speed."
    >
      <StaggerItem>
        <SegmentedControl
          options={[
            { label: "Find Pace", value: "pace" },
            { label: "Find Time", value: "time" },
          ]}
          value={mode}
          onChange={setMode}
        />
      </StaggerItem>

      <StaggerItem>
        <div className="surface p-6 rounded-xl space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <InstrumentInput label="Distance" value={distance} onChange={setDistance} step={0.1} />
            </div>
            <div className="w-32 self-end">
              <SegmentedControl
                options={[
                  { label: "km", value: "km" },
                  { label: "mi", value: "mi" },
                ]}
                value={distanceUnit}
                onChange={setDistanceUnit}
              />
            </div>
          </div>

          {mode === "pace" ? (
            <>
              <span className="label-instrument block mt-2">Time</span>
              <div className="grid grid-cols-3 gap-3">
                <InstrumentInput label="Hours" value={hours} onChange={setHours} min={0} />
                <InstrumentInput label="Min" value={minutes} onChange={setMinutes} min={0} max={59} />
                <InstrumentInput label="Sec" value={seconds} onChange={setSeconds} min={0} max={59} />
              </div>
            </>
          ) : (
            <>
              <span className="label-instrument block mt-2">Pace (per km)</span>
              <div className="grid grid-cols-2 gap-3">
                <InstrumentInput label="Min" value={paceMin} onChange={setPaceMin} min={0} />
                <InstrumentInput label="Sec" value={paceSec} onChange={setPaceSec} min={0} max={59} />
              </div>
            </>
          )}
        </div>
      </StaggerItem>

      <StaggerItem>
        {mode === "pace" && result && "paceKm" in result ? (
          <div className="grid grid-cols-2 gap-4">
            <ReadoutCard
              label="Pace (per km)"
              value={`${result.paceKm.min}:${String(result.paceKm.sec).padStart(2, "0")}`}
              unit="min/km"
            />
            <ReadoutCard
              label="Pace (per mile)"
              value={`${result.paceMi.min}:${String(result.paceMi.sec).padStart(2, "0")}`}
              unit="min/mi"
            />
          </div>
        ) : mode === "time" && result && "time" in result ? (
          <ReadoutCard
            label="Total Time"
            value={`${result.time.h}:${String(result.time.m).padStart(2, "0")}:${String(result.time.s).padStart(2, "0")}`}
          />
        ) : (
          <ReadoutCard label="Result" value="—" description="Enter your values above." />
        )}
      </StaggerItem>

      {result && (
        <StaggerItem>
          <ReadoutCard
            label="Average Speed"
            value={result.speed}
            unit="km/h"
            colorClass="text-foreground"
          />
        </StaggerItem>
      )}
    </CalculatorLayout>
  );
};

export default PaceCalculator;
