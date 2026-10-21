import { shabbatTimes } from "./shabbat";
import type { Branch } from "./types";

/**
 * Opening-hours profiles. Each profile holds a Hebrew label plus, for every
 * weekday (index 0 = Sunday … 6 = Saturday), a list of [open, close] intervals
 * (or null when closed). A day may hold more than one interval to express a
 * mid-day break (e.g. 06:30–14:00 and 16:30–19:00).
 *
 * Times are minutes since midnight. A close time above 1440 runs past midnight
 * into the next day. Israeli stores often tie Friday closing and Saturday-night
 * opening to Shabbat, so a time can also be relative to it.
 * The SCHEDULES indices must stay in sync with the generated data.
 */
export type TimeRef = number | { beforeShabbat: number } | { afterShabbat: number };
export type RawSlot = [TimeRef, TimeRef];
export type Slot = [number, number];

export interface ScheduleProfile {
  label: string;
  days: (RawSlot[] | null)[];
}

/** A weekday with a single opening interval. */
const d = (o: number, c: number): Slot[] => [[o, c]];
/** A weekday with two opening intervals (split hours around a mid-day break). */
const s = (o1: number, c1: number, o2: number, c2: number): Slot[] => [
  [o1, c1],
  [o2, c2],
];

export const SCHEDULES: ScheduleProfile[] = [
  {
    label: "א׳–ה׳ 8:00–21:00 · ו׳ 8:00–14:00 · ש׳ סגור",
    days: [d(480, 1260), d(480, 1260), d(480, 1260), d(480, 1260), d(480, 1260), d(480, 840), null],
  },
  {
    label: "א׳–ה׳ 8:00–22:00 · ו׳ 8:00–15:00 · ש׳ סגור",
    days: [d(480, 1320), d(480, 1320), d(480, 1320), d(480, 1320), d(480, 1320), d(480, 900), null],
  },
  {
    label: "א׳–ה׳ 7:00–23:00 · ו׳ 7:00–15:30 · ש׳ 8:00–21:00",
    days: [d(420, 1380), d(420, 1380), d(420, 1380), d(420, 1380), d(420, 1380), d(420, 930), d(480, 1260)],
  },
  {
    label: "א׳–ה׳ 8:00–23:00 · ו׳ 7:00–16:00 · ש׳ סגור",
    days: [d(480, 1380), d(480, 1380), d(480, 1380), d(480, 1380), d(480, 1380), d(420, 960), null],
  },
  {
    label: "פתוח 24/7",
    days: [d(0, 1440), d(0, 1440), d(0, 1440), d(0, 1440), d(0, 1440), d(0, 1440), d(0, 1440)],
  },
  {
    label: "א׳–ה׳ 8:00–22:00 · ו׳ 8:00–15:00 · ש׳ 20:30–23:30",
    days: [d(480, 1320), d(480, 1320), d(480, 1320), d(480, 1320), d(480, 1320), d(480, 900), d(1230, 1410)],
  },
  {
    label: "א׳–ה׳ 7:00–22:00 · ו׳ 7:00–14:00 · ש׳ 9:00–20:00",
    days: [d(420, 1320), d(420, 1320), d(420, 1320), d(420, 1320), d(420, 1320), d(420, 840), d(540, 1200)],
  },
  {
    label: "א׳–ה׳ 06:30–19:00 · ו׳ 06:30–14:00 · ש׳ סגור",
    days: [d(390, 1140), d(390, 1140), d(390, 1140), d(390, 1140), d(390, 1140), d(390, 840), null],
  },
];

/** A branch's schedule: its own published hours when known, else the chain-typical profile. */
export type ScheduleRef = number | ScheduleProfile | undefined;

/** The schedule to use for a branch: its published hours first, else its chain-typical profile. */
export function scheduleOf(branch: Pick<Branch, "schedule" | "scheduleIdx">): ScheduleRef {
  return branch.schedule ?? branch.scheduleIdx;
}

function profileOf(ref: ScheduleRef): ScheduleProfile | undefined {
  return typeof ref === "number" ? SCHEDULES[ref] : ref;
}

function startOfDay(date: Date): Date {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

function resolveTime(t: TimeRef, day: Date): number {
  if (typeof t === "number") return t;
  const { entry, exit } = shabbatTimes(day);
  if ("beforeShabbat" in t) return entry - t.beforeShabbat;
  return exit + t.afterShabbat;
}

/** Concrete opening intervals for the calendar day of `day`, in minutes since its midnight. */
function slotsForDay(profile: ScheduleProfile, day: Date): Slot[] {
  const raw = profile.days[day.getDay()];
  if (!raw) return [];
  return raw.map(([o, c]) => [resolveTime(o, day), resolveTime(c, day)] as Slot).filter(([o, c]) => c > o);
}

/** Intervals that touch `date`'s calendar day, including yesterday's past-midnight hours. */
function slotsAround(profile: ScheduleProfile, date: Date): Slot[] {
  const today = startOfDay(date);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const carried = slotsForDay(profile, yesterday)
    .filter(([, c]) => c > 1440)
    .map(([, c]) => [0, c - 1440] as Slot);
  return [...carried, ...slotsForDay(profile, today)];
}

/** Whether a branch with this schedule is open at the given moment. */
export function isOpenAt(ref: ScheduleRef, date: Date): boolean {
  const profile = profileOf(ref);
  if (!profile) return true;
  const minutes = date.getHours() * 60 + date.getMinutes();
  return slotsAround(profile, date).some(([o, c]) => minutes >= o && minutes < c);
}

const DAY_NAMES = [
  "ראשון",
  "שני",
  "שלישי",
  "רביעי",
  "חמישי",
  "שישי",
  "שבת",
];

const DAY_LETTERS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

/** Format minutes since midnight as a 24-hour "HH:MM" label. */
export function minutesToLabel(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function amountLabel(minutes: number): string {
  if (minutes === 120) return "שעתיים";
  if (minutes === 60) return "שעה";
  if (minutes === 30) return "חצי שעה";
  if (minutes === 90) return "שעה וחצי";
  return `${minutes} דק׳`;
}

function timeRefLabel(t: TimeRef): string {
  if (typeof t === "number") return minutesToLabel(t);
  if ("beforeShabbat" in t) return `${amountLabel(t.beforeShabbat)} לפני כניסת שבת`;
  return t.afterShabbat === 0 ? "צאת שבת" : `${amountLabel(t.afterShabbat)} אחרי צאת שבת`;
}

function slotsLabel(slots: RawSlot[] | null | undefined): string {
  if (!slots || slots.length === 0) return "סגור";
  if (slots.length === 1 && slots[0][0] === 0 && slots[0][1] === 1440) return "24 שעות";
  return slots.map(([o, c]) => `${timeRefLabel(o)}–${timeRefLabel(c)}`).join(" · ");
}

export interface WeeklyHoursRow {
  key: string;
  label: string;
  value: string;
}

/**
 * Human-readable weekly opening-hours rows: consecutive weekdays with the same
 * hours are grouped (e.g. "א׳–ג׳"), Friday doubles as holiday eve and Saturday
 * is shown as מוצ״ש when the store opens only after Shabbat.
 */
export function weeklyHours(ref: ScheduleRef): WeeklyHoursRow[] {
  const profile = profileOf(ref);
  const days = profile?.days ?? [];
  const values = DAY_LETTERS.map((_, i) => slotsLabel(days[i]));
  const rows: WeeklyHoursRow[] = [];
  let start = 0;
  for (let i = 1; i <= 5; i++) {
    if (i === 5 || values[i] !== values[start]) {
      const end = i - 1;
      rows.push({
        key: `d${start}-${end}`,
        label: start === end ? DAY_LETTERS[start] : `${DAY_LETTERS[start]}–${DAY_LETTERS[end]}`,
        value: values[start],
      });
      start = i;
    }
  }
  rows.push({ key: "fri", label: "ו׳ וערב חג", value: values[5] });
  const saturday = days[6];
  const opensAfterShabbat = !!saturday?.some(([o]) => typeof o !== "number");
  rows.push({ key: "sat", label: opensAfterShabbat ? "מוצ״ש" : "שבת", value: values[6] });
  return rows;
}

export interface OpenStatus {
  open: boolean;
  text: string;
}

/**
 * Rich open/closed label with the next closing or opening time. Pass
 * `estimated` when the schedule is a chain-typical guess rather than this
 * branch's published hours, so the label never states a guess as fact.
 */
export function openStatus(ref: ScheduleRef, date: Date, estimated = false): OpenStatus {
  const openWord = estimated ? "כנראה פתוח" : "פתוח עכשיו";
  const closedWord = estimated ? "כנראה סגור" : "סגור";
  const profile = profileOf(ref);
  if (!profile) return { open: true, text: estimated ? "שעות לא ידועות" : "פתוח 24/7" };
  const minutes = date.getHours() * 60 + date.getMinutes();
  const today = slotsAround(profile, date);

  const current = today.find(([o, c]) => minutes >= o && minutes < c);
  if (current) {
    if (current[0] === 0 && current[1] >= 1440) {
      return { open: true, text: `${openWord} · 24 שעות` };
    }
    return { open: true, text: `${openWord} · נסגר ב-${minutesToLabel(current[1])}` };
  }

  const laterToday = today.find(([o]) => o > minutes);
  if (laterToday) {
    return { open: false, text: `${closedWord} · נפתח היום ב-${minutesToLabel(laterToday[0])}` };
  }

  for (let i = 1; i <= 7; i++) {
    const day = startOfDay(date);
    day.setDate(day.getDate() + i);
    const slots = slotsForDay(profile, day);
    if (slots.length > 0) {
      const first = minutesToLabel(slots[0][0]);
      if (i === 1) return { open: false, text: `${closedWord} · נפתח מחר ב-${first}` };
      return { open: false, text: `${closedWord} · נפתח ביום ${DAY_NAMES[day.getDay()]} ב-${first}` };
    }
  }
  return { open: false, text: closedWord };
}

/** Short "closing soon / opens at" hint, or null when not applicable. */
export function scheduleHint(ref: ScheduleRef, date: Date): string | null {
  const profile = profileOf(ref);
  if (!profile) return null;
  const slots = slotsAround(profile, date);
  if (slots.length === 0) return null;
  const minutes = date.getHours() * 60 + date.getMinutes();

  const current = slots.find(([o, c]) => minutes >= o && minutes < c);
  if (current) {
    const left = current[1] - minutes;
    if (left <= 60) return `נסגר בעוד ${left} דק׳`;
    return null;
  }
  const next = slots.find(([o]) => o > minutes);
  if (next && next[0] - minutes <= 90) {
    return `נפתח בעוד ${next[0] - minutes} דק׳`;
  }
  return null;
}

/** Earliest regular opening time in a schedule, in minutes (for chart ticks). */
export function earliestOpening(ref: ScheduleRef): number | null {
  const profile = profileOf(ref);
  if (!profile) return null;
  let earliest: number | null = null;
  for (const day of profile.days) {
    for (const [o] of day ?? []) {
      if (typeof o === "number" && (earliest === null || o < earliest)) earliest = o;
    }
  }
  return earliest;
}
