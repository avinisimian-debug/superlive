/**
 * Opening-hours profiles. Each profile holds a Hebrew label plus, for every
 * weekday (index 0 = Sunday … 6 = Saturday), an [open, close] pair in minutes
 * since midnight (or null when closed). Indices must stay in sync with the
 * generated data (build_data.py).
 */
export interface ScheduleProfile {
  label: string;
  days: ([number, number] | null)[];
}

const w = (o: number, c: number): [number, number] => [o, c];
const shabbat = (o: number, c: number): [number, number] => [o, c];

export const SCHEDULES: ScheduleProfile[] = [
  {
    label: "א׳–ה׳ 8:00–21:00 · ו׳ 8:00–14:00 · ש׳ סגור",
    days: [w(480, 1260), w(480, 1260), w(480, 1260), w(480, 1260), w(480, 1260), w(480, 840), null],
  },
  {
    label: "א׳–ה׳ 8:00–22:00 · ו׳ 8:00–15:00 · ש׳ סגור",
    days: [w(480, 1320), w(480, 1320), w(480, 1320), w(480, 1320), w(480, 1320), w(480, 900), null],
  },
  {
    label: "א׳–ה׳ 7:00–23:00 · ו׳ 7:00–15:30 · ש׳ 8:00–21:00",
    days: [w(420, 1380), w(420, 1380), w(420, 1380), w(420, 1380), w(420, 1380), w(420, 930), w(480, 1260)],
  },
  {
    label: "א׳–ה׳ 8:00–23:00 · ו׳ 7:00–16:00 · ש׳ סגור",
    days: [w(480, 1380), w(480, 1380), w(480, 1380), w(480, 1380), w(480, 1380), w(420, 960), null],
  },
  {
    label: "פתוח 24/7",
    days: [w(0, 1440), w(0, 1440), w(0, 1440), w(0, 1440), w(0, 1440), w(0, 1440), w(0, 1440)],
  },
  {
    label: "א׳–ה׳ 8:00–22:00 · ו׳ 8:00–15:00 · ש׳ 20:30–23:30",
    days: [w(480, 1320), w(480, 1320), w(480, 1320), w(480, 1320), w(480, 1320), w(480, 900), shabbat(1230, 1410)],
  },
  {
    label: "א׳–ה׳ 7:00–22:00 · ו׳ 7:00–14:00 · ש׳ 9:00–20:00",
    days: [w(420, 1320), w(420, 1320), w(420, 1320), w(420, 1320), w(420, 1320), w(420, 840), w(540, 1200)],
  },
];

/** Whether a branch with this schedule is open at the given moment. */
export function isOpenAt(scheduleIdx: number, date: Date): boolean {
  const profile = SCHEDULES[scheduleIdx];
  if (!profile) return true;
  const slot = profile.days[date.getDay()];
  if (!slot) return false;
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= slot[0] && minutes < slot[1];
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

function slotLabel(slot: [number, number] | null | undefined): string {
  if (!slot) return "סגור";
  return `${minutesToLabel(slot[0])}–${minutesToLabel(slot[1])}`;
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
    { key: "sun-wed", label: "א׳–ד׳", value: slotLabel(days[0]) },
    { key: "thu", label: "ה׳", value: slotLabel(days[4]) },
    { key: "fri", label: "ו׳ וערב חג", value: slotLabel(days[5]) },
    { key: "sat", label: "מוצ״ש", value: slotLabel(days[6]) },
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
  if (today && minutes >= today[0] && minutes < today[1]) {
    return {
      open: true,
      text: `פתוח עכשיו · נסגר ב-${minutesToLabel(today[1])}`,
    };
  }
  const tomorrow = profile.days[(date.getDay() + 1) % 7];
  if (today && minutes < today[0]) {
    return {
      open: false,
      text: `סגור · נפתח היום ב-${minutesToLabel(today[0])}`,
    };
  }
  if (tomorrow) {
    return {
      open: false,
      text: `סגור · נפתח מחר ב-${minutesToLabel(tomorrow[0])}`,
    };
  }
  for (let i = 2; i < 7; i++) {
    const day = (date.getDay() + i) % 7;
    const slot = profile.days[day];
    if (slot) {
      return {
        open: false,
        text: `סגור · נפתח ביום ${DAY_NAMES[day]} ב-${minutesToLabel(slot[0])}`,
      };
    }
  }
  return { open: false, text: "סגור" };
}

/** Short "closing soon / opens at" hint, or null when not applicable. */
export function scheduleHint(scheduleIdx: number, date: Date): string | null {
  const profile = SCHEDULES[scheduleIdx];
  if (!profile) return null;
  const slot = profile.days[date.getDay()];
  if (!slot) return null;
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes >= slot[0] && minutes < slot[1]) {
    const left = slot[1] - minutes;
    if (left <= 60) return `נסגר בעוד ${left} דק׳`;
    return null;
  }
  if (slot[0] - minutes > 0 && slot[0] - minutes <= 90) {
    const mins = slot[0] - minutes;
    return `נפתח בעוד ${mins} דק׳`;
  }
  return null;
}
