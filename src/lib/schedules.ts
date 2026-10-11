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
