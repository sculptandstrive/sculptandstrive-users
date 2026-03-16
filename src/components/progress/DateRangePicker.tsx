// DateRangePicker.jsx
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export default function DateRangePicker({
  value, // { from: Date, to: Date }
  onChange,
  availableDates, // optional Set<"YYYY-M-D">
  minRangeDays = 3,
}) {
  const [open, setOpen] = useState(false);
  const now = startOfDay(new Date());

  const initialDate = value?.from ?? now;
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [hovered, setHovered] = useState(null);
  const [selecting, setSelecting] = useState(null); // first click pending

  const from = value?.from ? startOfDay(value.from) : null;
  const to = value?.to ? startOfDay(value.to) : null;

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  function handleDayClick(day) {
    if (!selecting) {
      // First click — anchor start
      setSelecting(day);
    } else {
      // Second click — finalize range
      let start = selecting;
      let end = day;
      if (end < start) [start, end] = [end, start];

      // Enforce minimum range
      const diff = Math.round((end - start) / 86400000);
      if (diff < minRangeDays - 1) {
        end = addDays(start, minRangeDays - 1);
      }

      onChange({ from: start, to: end });
      setSelecting(null);
      setHovered(null);
      setOpen(false);
    }
  }

  function isInRange(day) {
    const anchor = selecting;
    if (!anchor) {
      return from && to && day > from && day < to;
    }
    // Live preview while hovering
    if (!hovered) return false;
    let s = anchor,
      e = hovered;
    if (e < s) [s, e] = [e, s];
    // Stretch to min range
    if (Math.round((e - s) / 86400000) < minRangeDays - 1) {
      e = addDays(s, minRangeDays - 1);
    }
    return day > s && day < e;
  }

  function isRangeStart(day) {
    if (selecting) {
      let s = selecting,
        e = hovered ?? selecting;
      if (e < s) [s, e] = [e, s];
      if (Math.round((e - s) / 86400000) < minRangeDays - 1)
        e = addDays(s, minRangeDays - 1);
      return day.getTime() === s.getTime();
    }
    return from && day.getTime() === from.getTime();
  }

  function isRangeEnd(day) {
    if (selecting) {
      let s = selecting,
        e = hovered ?? selecting;
      if (e < s) [s, e] = [e, s];
      if (Math.round((e - s) / 86400000) < minRangeDays - 1)
        e = addDays(s, minRangeDays - 1);
      return day.getTime() === e.getTime();
    }
    return to && day.getTime() === to.getTime();
  }

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const cells = [];

  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewYear, viewMonth, d));
  }

  const label =
    from && to ? `${formatDate(from)} – ${formatDate(to)}` : "Select range";

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSelecting(null);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-56 mb-4">
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-72 p-3"
        onMouseLeave={() => setHovered(null)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextMonth}
            disabled={
              viewYear === now.getFullYear() && viewMonth >= now.getMonth()
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-xs text-muted-foreground py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} />;

            const isFuture = day > now;
            const hasData =
              !availableDates ||
              availableDates.size === 0 ||
              availableDates.has(
                `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`,
              );
            const disabled = isFuture || !hasData;
            const inRange = isInRange(day);
            const rangeStart = isRangeStart(day);
            const rangeEnd = isRangeEnd(day);
            const isToday = day.getTime() === now.getTime();

            return (
              <div
                key={day.toISOString()}
                className={`
                  relative flex items-center justify-center h-8 text-sm cursor-pointer select-none
                  ${disabled ? "opacity-30 cursor-not-allowed pointer-events-none" : "hover:bg-accent"}
                  ${inRange ? "bg-accent" : ""}
                  ${rangeStart ? "bg-primary text-primary-foreground rounded-l-full hover:bg-primary" : ""}
                  ${rangeEnd ? "bg-primary text-primary-foreground rounded-r-full hover:bg-primary" : ""}
                  ${rangeStart && rangeEnd ? "rounded-full" : ""}
                  ${isToday && !rangeStart && !rangeEnd ? "font-bold underline" : ""}
                `}
                onClick={() => !disabled && handleDayClick(day)}
                onMouseEnter={() => !disabled && selecting && setHovered(day)}
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>

        {selecting && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Now pick an end date (min {minRangeDays} days)
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
