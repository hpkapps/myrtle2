import type { RunwayConfig } from "./supabase";

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export type Runway = "27L" | "27R" | "09L" | "09R";
export type RunwayPeriod = "day" | "late-day" | "night";

export type ProgrammeStatus = {
  runway: Runway;
  period: RunwayPeriod;
  source: "Heathrow 2026 programme" | "Spotter update" | "Estimate";
  weekStart: string;
  note: string;
};

// Official Heathrow 2026 daytime landing programme from the supplied PDF.
// The programme changes weekly and has a 15:00 handover on operating days.
const DAY_PROGRAMME: Record<string, Runway> = {
  "2026-01-05": "27L", "2026-01-12": "27R", "2026-01-19": "27L", "2026-01-26": "27R",
  "2026-02-02": "27R", "2026-02-09": "27L", "2026-02-16": "27R", "2026-02-23": "27L",
  "2026-03-02": "27R", "2026-03-09": "09R", "2026-03-16": "27L", "2026-03-23": "09R",
  "2026-03-30": "27R", "2026-04-06": "09R", "2026-04-13": "27L", "2026-04-20": "09L",
  "2026-04-27": "27R", "2026-05-04": "27R", "2026-05-11": "27L", "2026-05-18": "09L",
  "2026-05-25": "27R", "2026-06-01": "09L", "2026-06-08": "27L", "2026-06-15": "27R",
  "2026-06-22": "27L", "2026-06-29": "27R", "2026-07-06": "27L", "2026-07-13": "27R",
  "2026-07-20": "27R", "2026-07-27": "27L", "2026-08-03": "27R", "2026-08-10": "09L",
  "2026-08-17": "27R", "2026-08-24": "27L", "2026-08-31": "27R", "2026-09-07": "09L",
  "2026-09-14": "27R", "2026-09-21": "27L", "2026-09-28": "27R", "2026-10-05": "09L",
  "2026-10-12": "27R", "2026-10-19": "27L", "2026-10-26": "27R", "2026-11-02": "27L",
  "2026-11-09": "27L", "2026-11-16": "27R", "2026-11-23": "27L", "2026-11-30": "27R",
  "2026-12-07": "27L", "2026-12-14": "27R", "2026-12-21": "27L", "2026-12-28": "27R",
};

// Official Heathrow 2026 nighttime primary landing runway from the supplied PDF.
const NIGHT_PROGRAMME: Record<string, Runway> = {
  "2026-01-05": "27R", "2026-01-12": "09R", "2026-01-19": "27L", "2026-01-26": "09L",
  "2026-02-02": "27R", "2026-02-09": "09R", "2026-02-16": "27L", "2026-02-23": "09R",
  "2026-03-02": "27R", "2026-03-09": "09R", "2026-03-16": "27L", "2026-03-23": "09R",
  "2026-03-30": "27R", "2026-04-06": "09R", "2026-04-13": "27L", "2026-04-20": "09R",
  "2026-04-27": "27R", "2026-05-04": "09R", "2026-05-11": "27L", "2026-05-18": "09R",
  "2026-05-25": "27R", "2026-06-01": "09R", "2026-06-08": "27L", "2026-06-15": "09R",
  "2026-06-22": "27L", "2026-06-29": "09R", "2026-07-06": "27L", "2026-07-13": "09L",
  "2026-07-20": "27R", "2026-07-27": "09R", "2026-08-03": "27L", "2026-08-10": "09L",
  "2026-08-17": "27R", "2026-08-24": "09R", "2026-08-31": "27L", "2026-09-07": "09R",
  "2026-09-14": "27R", "2026-09-21": "09L", "2026-09-28": "27R", "2026-10-05": "09L",
  "2026-10-12": "27R", "2026-10-19": "09R", "2026-10-26": "27R", "2026-11-02": "09L",
  "2026-11-09": "27R", "2026-11-16": "09L", "2026-11-23": "27R", "2026-11-30": "09L",
  "2026-12-07": "27R", "2026-12-14": "09L", "2026-12-21": "27R", "2026-12-28": "09L",
};

export function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function currentRunwayConfig(rows: RunwayConfig[], today = new Date()): RunwayConfig | null {
  const weekStart = isoDate(startOfWeek(today));
  return rows.find((r) => r.week_start === weekStart) ?? null;
}

export function fallbackLandingRunway(today = new Date()): Runway {
  return DAY_PROGRAMME[isoDate(startOfWeek(today))] ?? "27L";
}

export function programmeStatus(today = new Date(), manual?: RunwayConfig | null): ProgrammeStatus {
  const weekStart = isoDate(startOfWeek(today));
  const hour = today.getHours() + today.getMinutes() / 60;
  const period: RunwayPeriod = hour < 6 ? "night" : hour < 15 ? "day" : "late-day";
  if (manual) {
    return {
      runway: manual.landing_runway,
      period,
      source: "Spotter update",
      weekStart,
      note: manual.note ?? "Community-confirmed runway update.",
    };
  }
  const runway = period === "night" ? NIGHT_PROGRAMME[weekStart] : DAY_PROGRAMME[weekStart];
  return {
    runway: runway ?? fallbackLandingRunway(today),
    period,
    source: runway ? "Heathrow 2026 programme" : "Estimate",
    weekStart,
    note: runway ? "From Heathrow's supplied 2026 runway alternation programme." : "No official programme row found for this date.",
  };
}

export function isGoodForMyrtle(runway: string | undefined | null): boolean {
  return runway === "27L";
}

export function runwayLabel(runway: string): string {
  const map: Record<string, string> = {
    "27L": "27L — landing toward Myrtle",
    "27R": "27R — southside, far side",
    "09L": "09L — easterly, departures side",
    "09R": "09R — easterly, far side",
  };
  return map[runway] ?? runway;
}

export function todayDayCode(today = new Date()): string {
  return DAYS[today.getDay()];
}

export function operatesToday(days: string[], today = new Date()): boolean {
  return days.includes(todayDayCode(today));
}
