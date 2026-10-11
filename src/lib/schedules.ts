/**
 * Opening-hours profiles. Each profile holds a Hebrew label plus, for every
 * weekday (index 0 = Sunday … 6 = Saturday), a list of [open, close] intervals
 * in minutes since midnight (or null when closed). A day may hold more than one
 * interval to express a mid-day break (e.g. 06:30–14:00 and 16:30–19:00).
 * Indices must stay in sync with the generated data (build_data.py).
 */
export type Slot = [number, number];

export interface ScheduleProfile {
  label: string;
  days: (Slot[] | null)[];
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
    label: "א׳–ה׳ 06:30–14:00, 16:30–19:00 · ו׳ 06:30–14:00 · מוצ״ש סגור",
    days: [s(390, 840, 990, 1140), s(390, 840, 990, 1140), s(390, 840, 990, 1140), s(390, 840, 990, 1140), s(390, 840, 990, 1140), d(390, 840), null],
  },
];

/** Whether a branch with this schedule is open at the given moment. */
export function isOpenAt(scheduleIdx: number, date: Date): boolean {
  const profile = SCHEDULES[scheduleIdx];
  if (!profile) return true;
  const slots = profile.days[date.getDay()];
  if (!slots || slots.length === 0) return false;
  const minutes = date.getHours() * 60 + date.getMinutes();
  return slots.some(([o, c]) => minutes >= o && minutes < c);
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

/** Format minutes since midnight as a 24-hour "HH:MM" label. */
export function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function slotsLabel(slots: Slot[] | null | undefined): string {
  if (!slots || slots.length === 0) return "סגור";
  return slots.map(([o, c]) => `${minutesToLabel(o)}–${minutesToLabel(c)}`).join(" · ");
}

export interface WeeklyHoursRow {
  key: string;
  label: string;
  value: string;
}

/**
 * Human-readable weekly opening-hours rows for a schedule profile, grouped the
 * way Israeli shoppers think about them: Sun–Wed, Thu (extended eve), Fri &
 * holiday eve, and Saturday night (מוצ״ש).
 */
export function weeklyHours(scheduleIdx: number): WeeklyHoursRow[] {
  const profile = SCHEDULES[scheduleIdx];
  const days = profile?.days ?? [];
  return [
    { key: "sun-wed", label: "א׳–ד׳", value: slotsLabel(days[0]) },
    { key: "thu", label: "ה׳", value: slotsLabel(days[4]) },
    { key: "fri", label: "ו׳ וערב חג", value: slotsLabel(days[5]) },
    { key: "sat", label: "מוצ״ש", value: slotsLabel(days[6]) },
  ];
}

export interface OpenStatus {
  open: boolean;
  text: string;
}

/** Rich open/closed label with the next closing or opening time. */
export function openStatus(scheduleIdx: number, date: Date): OpenStatus {
  const profile = SCHEDULES[scheduleIdx];
  if (!profile) return { open: true, text: "פתוח 24/7" };
  const minutes = date.getHours() * 60 + date.getMinutes();
  const today = profile.days[date.getDay()];

  const current = today?.find(([o, c]) => minutes >= o && minutes < c);
  if (current) {
    return {
      open: true,
      text: `פתוח עכשיו · נסגר ב-${minutesToLabel(current[1])}`,
    };
  }

  const laterToday = today?.find(([o]) => o > minutes);
  if (laterToday) {
    return {
      open: false,
      text: `סגור · נפתח היום ב-${minutesToLabel(laterToday[0])}`,
    };
  }

  for (let i = 1; i <= 7; i++) {
    const day = (date.getDay() + i) % 7;
    const slots = profile.days[day];
    if (slots && slots.length > 0) {
      const first = minutesToLabel(slots[0][0]);
      if (i === 1) return { open: false, text: `סגור · נפתח מחר ב-${first}` };
      return {
        open: false,
        text: `סגור · נפתח ביום ${DAY_NAMES[day]} ב-${first}`,
      };
    }
  }
  return { open: false, text: "סגור" };
}

/** Short "closing soon / opens at" hint, or null when not applicable. */
export function scheduleHint(scheduleIdx: number, date: Date): string | null {
  const profile = SCHEDULES[scheduleIdx];
  if (!profile) return null;
  const slots = profile.days[date.getDay()];
  if (!slots || slots.length === 0) return null;
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
