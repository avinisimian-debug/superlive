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
  /** Optional exact Waze search string (overrides the auto-generated one). */
  wazeQuery?: string;
  /**
   * true only when the opening hours were confirmed for this specific branch.
   * Otherwise `scheduleIdx` is a chain-typical estimate and must be shown as one.
   */
  hoursVerified?: boolean;
  /** How far the map pin can be trusted (see data-quality.ts). */
  locationTrust?: "verified" | "consistent" | "unverified";
  isCustom?: boolean;
  addedBy?: string;
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

export type UserRole = "admin" | "user";

/** A registered Zerem account (the public shape — no password material). */
export interface AuthUser {
  /** Stable account id (present on accounts created with a password). */
  id?: string;
  email: string;
  /** Full name supplied at signup (optional for existing accounts). */
  name?: string;
  /** ISO timestamp of first registration. */
  createdAt: string;
  /** ISO timestamp of the most recent successful login. */
  lastLoginAt: string;
  role: UserRole;
}

export type ActivityType = "login" | "otp" | "report";

/** A single row in the admin activity feed (data/activity.json). */
export interface ActivityEvent {
  at: string;
  type: ActivityType;
  email?: string;
  text: string;
}

export interface AdminStats {
  totalUsers: number;
  loginsToday: number;
  totalReports: number;
  landingViews?: number;
  apkDownloads?: number;
}

export interface AdminOverview {
  stats: AdminStats;
  users: AuthUser[];
  activity: ActivityEvent[];
}
