import { useEffect, useMemo, useState } from "react";
import {
  birthDateFromParts,
  birthYearOptions,
  daysInMonth,
  MONTHS,
  parseBirthDate,
} from "@/lib/birthDate";

const selectClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type BirthDateInputProps = {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function BirthDateInput({ id, value = "", onChange, disabled }: BirthDateInputProps) {
  const parsed = parseBirthDate(value);
  const [day, setDay] = useState(parsed.day);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  useEffect(() => {
    const p = parseBirthDate(value);
    setDay(p.day);
    setMonth(p.month);
    setYear(p.year);
  }, [value]);

  const years = useMemo(() => birthYearOptions(), []);
  const maxDay = useMemo(() => {
    if (!month || !year) return 31;
    return daysInMonth(Number(month), Number(year));
  }, [month, year]);

  const update = (nextDay: string, nextMonth: string, nextYear: string) => {
    setDay(nextDay);
    setMonth(nextMonth);
    setYear(nextYear);
    const iso = birthDateFromParts(nextDay, nextMonth, nextYear);
    onChange(iso ?? "");
  };

  const dayOptions = Array.from({ length: maxDay }, (_, i) => String(i + 1));

  return (
    <div id={id} className="grid grid-cols-3 gap-2">
      <select
        aria-label="Day"
        className={selectClass}
        value={day}
        disabled={disabled}
        onChange={(e) => update(e.target.value, month, year)}
      >
        <option value="">Day</option>
        {dayOptions.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        aria-label="Month"
        className={selectClass}
        value={month}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          const max = year ? daysInMonth(Number(v), Number(year)) : 31;
          const nextDay = day && Number(day) > max ? String(max) : day;
          update(nextDay, v, year);
        }}
      >
        <option value="">Month</option>
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Year"
        className={selectClass}
        value={year}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          const max = month ? daysInMonth(Number(month), Number(v)) : 31;
          const nextDay = day && Number(day) > max ? String(max) : day;
          update(nextDay, month, v);
        }}
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
