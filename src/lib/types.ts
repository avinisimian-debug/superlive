export const CHAINS = [
  "שופרסל",
  "שופרסל שלי",
  "שופרסל דיל",
  "שופרסל אקספרס",
  "יש (שופרסל)",
  "רמי לוי",
  "קרפור",
  "מגה",
  "יינות ביתן",
  "ויקטורי",
  "יוחננוף",
  "אושר עד",
  "טיב טעם",
  "פרשמרקט",
  "חצי חינם",
  "מחסני השוק",
  "סופר יודה",
  "קשת טעמים",
  "אלונית / דור אלון",
  "קופיקס",
  "am:pm",
  "yellow",
  "סוגוד",
  "מנטה",
  "אלונית",
  "זול ובגדול",
  "קואופ",
  "סיטי מרקט",
  "סטופ מרקט",
  "נתיב החסד",
  "שוק העיר",
  "סופר ברקת",
  "פוליצר",
  "סופרמרקט שכונתי",
  "מכולת שכונתית",
  "סופר ספיר",
  "מעיין 2000",
  "סלאח דבאח",
] as const;

export type Chain = (typeof CHAINS)[number];

export type Congestion = "free" | "medium" | "heavy";
export type Parking = "plenty" | "partial" | "none";
export type BranchSize = "express" | "standard" | "hyper";

export interface Branch {
  id: string;
  name: string;
  chain: Chain;
  city: string;
  address: string;
  lat: number;
  lng: number;
  /** Index into SCHEDULES — defines opening hours per weekday. */
  scheduleIdx: number;
  /** Human-readable Hebrew opening hours (derived from scheduleIdx). */
  hours: string;
  size: BranchSize;
}

export type ReportSource = "user" | "community";

export interface Report {
  congestion: Congestion;
  parking: Parking;
  /** epoch ms */
  at: number;
  source: ReportSource;
}

export interface LiveState {
  congestion: Congestion;
  parking: Parking;
  lastReportAt: number | null;
  reportCount: number;
  /** true when there is no fresh community signal and we show the baseline. */
  estimated: boolean;
}

export interface UserLocation {
  lat: number;
  lng: number;
  label: string;
}
