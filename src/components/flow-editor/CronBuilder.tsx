"use client";

import { useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
export type CronFrequency = "interval" | "daily" | "weekly" | "monthly";
export type IntervalUnit = "minutes" | "hours";

export interface CronState {
  frequency: CronFrequency;
  intervalValue: number; // used when frequency = "interval"
  intervalUnit: IntervalUnit;
  minute: number; // 0-59
  hour: number; // 0-23
  dom: number; // 1-31
  weekdays: number[]; // 0-6 (0=Sun)
}

// ── Parse cron → CronState ────────────────────────────────────────────────────
export function parseCron(expr: string): CronState | null {
  if (!expr?.trim()) return null;
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [min, hr, dom, month, dow] = parts;

  const numMin = parseInt(min, 10);
  const numHr = parseInt(hr, 10);
  const numDom = parseInt(dom, 10);

  const base: Pick<CronState, "intervalValue" | "intervalUnit"> = {
    intervalValue: 30,
    intervalUnit: "minutes",
  };

  // */X * * * * → every X minutes
  if (
    /^\*\/(\d+)$/.test(min) &&
    hr === "*" &&
    dom === "*" &&
    month === "*" &&
    dow === "*"
  ) {
    const v = parseInt(min.slice(2), 10);
    return {
      frequency: "interval",
      intervalValue: v,
      intervalUnit: "minutes",
      minute: 0,
      hour: 8,
      dom: 1,
      weekdays: [1],
    };
  }

  // 0 */X * * * → every X hours
  if (
    min === "0" &&
    /^\*\/(\d+)$/.test(hr) &&
    dom === "*" &&
    month === "*" &&
    dow === "*"
  ) {
    const v = parseInt(hr.slice(2), 10);
    return {
      frequency: "interval",
      intervalValue: v,
      intervalUnit: "hours",
      minute: 0,
      hour: 8,
      dom: 1,
      weekdays: [1],
    };
  }

  // {m} {h} * * {dows} → weekly
  if (
    !isNaN(numMin) &&
    !isNaN(numHr) &&
    dom === "*" &&
    month === "*" &&
    dow !== "*"
  ) {
    const weekdays = dow
      .split(",")
      .map((d) => parseInt(d, 10))
      .filter((n) => !isNaN(n));
    return {
      ...base,
      frequency: "weekly",
      minute: numMin,
      hour: numHr,
      dom: 1,
      weekdays,
    };
  }

  // {m} {h} * * * → daily
  if (
    !isNaN(numMin) &&
    !isNaN(numHr) &&
    dom === "*" &&
    month === "*" &&
    dow === "*"
  ) {
    return {
      ...base,
      frequency: "daily",
      minute: numMin,
      hour: numHr,
      dom: 1,
      weekdays: [1],
    };
  }

  // {m} {h} {d} * * → monthly
  if (
    !isNaN(numMin) &&
    !isNaN(numHr) &&
    !isNaN(numDom) &&
    month === "*" &&
    dow === "*"
  ) {
    return {
      ...base,
      frequency: "monthly",
      minute: numMin,
      hour: numHr,
      dom: numDom,
      weekdays: [1],
    };
  }

  return null;
}

// ── Build cron expression from CronState ──────────────────────────────────────
export function buildCron(state: CronState): string {
  const {
    frequency,
    intervalValue,
    intervalUnit,
    minute,
    hour,
    dom,
    weekdays,
  } = state;
  const m = String(minute);
  const h = String(hour);
  switch (frequency) {
    case "interval":
      return intervalUnit === "minutes"
        ? `*/${intervalValue} * * * *`
        : `0 */${intervalValue} * * *`;
    case "daily":
      return `${m} ${h} * * *`;
    case "weekly":
      return `${m} ${h} * * ${(weekdays.length ? weekdays : [1]).sort().join(",")}`;
    case "monthly":
      return `${m} ${h} ${dom} * *`;
    default:
      return "";
  }
}

// ── Human description ──────────────────────────────────────────────────────────
const DOW_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DOW_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

export function describeState(state: CronState): string {
  const time = `${String(state.hour).padStart(2, "0")}:${String(state.minute).padStart(2, "0")}`;
  switch (state.frequency) {
    case "interval": {
      const unit = state.intervalUnit === "minutes" ? "minuto(s)" : "hora(s)";
      return `Executar a cada ${state.intervalValue} ${unit}`;
    }
    case "daily":
      return `Executar todo dia às ${time}`;
    case "weekly": {
      const days = (state.weekdays.length ? state.weekdays : [1])
        .sort()
        .map((d) => DOW_NAMES[d])
        .join(", ");
      return `Executar toda semana (${days}) às ${time}`;
    }
    case "monthly":
      return `Executar todo mês, no dia ${state.dom} às ${time}`;
    default:
      return "";
  }
}

// ── Preset values per unit ─────────────────────────────────────────────────────
const MINUTE_OPTIONS = [1, 2, 5, 10, 15, 20, 30];
const HOUR_OPTIONS = [1, 2, 3, 4, 6, 8, 12];

// ── Sub-components ─────────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
      {children}
    </label>
  );
}

function TimeSelect({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
    >
      {Array.from({ length: max }, (_, i) => (
        <option key={i} value={i}>
          {String(i).padStart(2, "0")}
        </option>
      ))}
    </select>
  );
}

function TimePicker({
  hour,
  minute,
  onChangeHour,
  onChangeMinute,
}: {
  hour: number;
  minute: number;
  onChangeHour: (v: number) => void;
  onChangeMinute: (v: number) => void;
}) {
  return (
    <div>
      <FieldLabel>Horário</FieldLabel>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <p className="text-[10px] text-gray-400 mb-1">Hora</p>
          <TimeSelect value={hour} max={24} onChange={onChangeHour} />
        </div>
        <span className="text-gray-400 font-bold mt-4">:</span>
        <div className="flex-1">
          <p className="text-[10px] text-gray-400 mb-1">Minuto</p>
          <TimeSelect value={minute} max={60} onChange={onChangeMinute} />
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface CronBuilderProps {
  value: string;
  onChange: (expr: string) => void;
}

const FREQUENCY_OPTIONS: {
  value: CronFrequency;
  label: string;
  icon: string;
}[] = [
  { value: "interval", label: "A cada...", icon: "⏱️" },
  { value: "daily", label: "Todo dia", icon: "📅" },
  { value: "weekly", label: "Toda semana", icon: "📆" },
  { value: "monthly", label: "Todo mês", icon: "🗓️" },
];

const DEFAULT_STATE: CronState = {
  frequency: "daily",
  intervalValue: 30,
  intervalUnit: "minutes",
  minute: 0,
  hour: 8,
  dom: 1,
  weekdays: [1],
};

export default function CronBuilder({ value, onChange }: CronBuilderProps) {
  const parsed = useMemo(() => parseCron(value), [value]);
  const state: CronState = parsed ?? DEFAULT_STATE;

  const update = useCallback(
    (patch: Partial<CronState>) => {
      const next = { ...state, ...patch };
      onChange(buildCron(next));
    },
    [state, onChange],
  );

  const toggleWeekday = useCallback(
    (day: number) => {
      const current = state.weekdays;
      const next = current.includes(day)
        ? current.filter((d) => d !== day).length
          ? current.filter((d) => d !== day)
          : current
        : [...current, day];
      update({ weekdays: next });
    },
    [state.weekdays, update],
  );

  const intervalOptions =
    state.intervalUnit === "minutes" ? MINUTE_OPTIONS : HOUR_OPTIONS;

  const safeIntervalValue = intervalOptions.includes(state.intervalValue)
    ? state.intervalValue
    : intervalOptions[intervalOptions.length - 1];

  return (
    <div className="space-y-4">
      {/* ── Frequency selector ── */}
      <div>
        <FieldLabel>Frequência</FieldLabel>
        <div className="grid grid-cols-4 gap-1.5">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ frequency: opt.value })}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border-2 text-center transition-all text-xs font-semibold",
                state.frequency === opt.value
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50",
              )}
            >
              <span className="text-base leading-none">{opt.icon}</span>
              <span className="leading-tight">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Interval: unit toggle + value pills ── */}
      {state.frequency === "interval" && (
        <div>
          <FieldLabel>Repetir a cada</FieldLabel>
          {/* Unit toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-3 text-xs font-semibold">
            {(["minutes", "hours"] as IntervalUnit[]).map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => {
                  const defaultVal = unit === "minutes" ? 30 : 1;
                  update({ intervalUnit: unit, intervalValue: defaultVal });
                }}
                className={cn(
                  "flex-1 py-1.5 transition-colors",
                  state.intervalUnit === unit
                    ? "bg-emerald-500 text-white"
                    : "text-gray-500 hover:bg-gray-50",
                )}
              >
                {unit === "minutes" ? "Minutos" : "Horas"}
              </button>
            ))}
          </div>
          {/* Value pills */}
          <div className="flex flex-wrap gap-1.5">
            {intervalOptions.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => update({ intervalValue: v })}
                className={cn(
                  "px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all",
                  safeIntervalValue === v
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Daily + Monthly: time picker ── */}
      {(state.frequency === "daily" || state.frequency === "monthly") && (
        <TimePicker
          hour={state.hour}
          minute={state.minute}
          onChangeHour={(v) => update({ hour: v })}
          onChangeMinute={(v) => update({ minute: v })}
        />
      )}

      {/* ── Weekly: weekday toggles + time ── */}
      {state.frequency === "weekly" && (
        <>
          <div>
            <FieldLabel>Dias da semana</FieldLabel>
            <div className="flex gap-1.5">
              {DOW_SHORT.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleWeekday(i)}
                  className={cn(
                    "flex-1 h-8 rounded-lg text-xs font-bold border-2 transition-all",
                    state.weekdays.includes(i)
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-400 hover:border-gray-300",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <TimePicker
            hour={state.hour}
            minute={state.minute}
            onChangeHour={(v) => update({ hour: v })}
            onChangeMinute={(v) => update({ minute: v })}
          />
        </>
      )}

      {/* ── Monthly: day of month ── */}
      {state.frequency === "monthly" && (
        <div>
          <FieldLabel>Dia do mês</FieldLabel>
          <select
            value={state.dom}
            onChange={(e) => update({ dom: parseInt(e.target.value, 10) })}
            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Dia {i + 1}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Human-readable preview ── */}
      <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-xs text-emerald-700">
        <span className="text-base leading-none mt-0.5">🔔</span>
        <span className="font-medium leading-snug">{describeState(state)}</span>
      </div>
    </div>
  );
}
