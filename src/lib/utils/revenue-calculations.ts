/**
 * Revenue Calculation Utilities
 * Consistent calculations for MTD/WTD/YTD, run-rate, refund rate, MoM growth.
 * All dates are treated as UTC to avoid timezone issues.
 */

import type { RevenueEntry } from "@/types";

// ============================================
// DATE UTILITIES (UTC-based)
// ============================================

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get start of current week (Monday) in YYYY-MM-DD format
 */
export function getStartOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().split("T")[0];
}

/**
 * Get start of current month in YYYY-MM-DD format
 */
export function getStartOfMonth(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  return d.toISOString().split("T")[0];
}

/**
 * Get start of current year in YYYY-MM-DD format
 */
export function getStartOfYear(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return d.toISOString().split("T")[0];
}

/**
 * Get start of previous month in YYYY-MM-DD format
 */
export function getStartOfPreviousMonth(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
  return d.toISOString().split("T")[0];
}

/**
 * Get end of previous month in YYYY-MM-DD format
 */
export function getEndOfPreviousMonth(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 0));
  return d.toISOString().split("T")[0];
}

/**
 * Get days in month
 */
export function getDaysInMonth(date: Date = new Date()): number {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

/**
 * Get current day of month (1-31)
 */
export function getDayOfMonth(date: Date = new Date()): number {
  return date.getUTCDate();
}

/**
 * Get days remaining in month
 */
export function getDaysRemainingInMonth(date: Date = new Date()): number {
  return getDaysInMonth(date) - getDayOfMonth(date);
}

/**
 * Get day of year (1-365/366)
 */
export function getDayOfYear(date: Date = new Date()): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
}

// ============================================
// REVENUE CALCULATION UTILITIES
// ============================================

interface RevenueSum {
  total: number;
  sales: number;
  refunds: number;
  count: number;
}

/**
 * Sum revenue entries with breakdown
 */
export function sumRevenue(entries: RevenueEntry[]): RevenueSum {
  return entries.reduce(
    (acc, entry) => {
      if (entry.status !== "Confirmed") return acc;
      
      acc.total += entry.amount;
      acc.count++;
      
      if (entry.entry_type === "Refund" || entry.amount < 0) {
        acc.refunds += Math.abs(entry.amount);
      } else {
        acc.sales += entry.amount;
      }
      
      return acc;
    },
    { total: 0, sales: 0, refunds: 0, count: 0 }
  );
}

/**
 * Filter entries by date range
 */
export function filterByDateRange(
  entries: RevenueEntry[],
  startDate: string,
  endDate: string
): RevenueEntry[] {
  return entries.filter((e) => e.date >= startDate && e.date <= endDate);
}

/**
 * Filter entries by stream
 */
export function filterByStream(
  entries: RevenueEntry[],
  streamId: string
): RevenueEntry[] {
  return entries.filter((e) => e.stream_id === streamId);
}

/**
 * Calculate Today's revenue
 */
export function calculateToday(entries: RevenueEntry[]): number {
  const today = getToday();
  const filtered = entries.filter((e) => e.date === today && e.status === "Confirmed");
  return sumRevenue(filtered).total;
}

/**
 * Calculate Week-to-Date revenue
 */
export function calculateWTD(entries: RevenueEntry[]): number {
  const startOfWeek = getStartOfWeek();
  const today = getToday();
  const filtered = filterByDateRange(entries, startOfWeek, today);
  return sumRevenue(filtered).total;
}

/**
 * Calculate Month-to-Date revenue
 */
export function calculateMTD(entries: RevenueEntry[]): number {
  const startOfMonth = getStartOfMonth();
  const today = getToday();
  const filtered = filterByDateRange(entries, startOfMonth, today);
  return sumRevenue(filtered).total;
}

/**
 * Calculate Year-to-Date revenue
 */
export function calculateYTD(entries: RevenueEntry[]): number {
  const startOfYear = getStartOfYear();
  const today = getToday();
  const filtered = filterByDateRange(entries, startOfYear, today);
  return sumRevenue(filtered).total;
}

/**
 * Calculate run-rate projection for end of month
 * Formula: MTD / days_elapsed * days_in_month
 */
export function calculateRunRate(entries: RevenueEntry[]): number {
  const mtd = calculateMTD(entries);
  const daysElapsed = getDayOfMonth();
  const daysInMonth = getDaysInMonth();
  
  if (daysElapsed === 0) return 0;
  
  return (mtd / daysElapsed) * daysInMonth;
}

/**
 * Calculate Month-over-Month growth percentage
 * Formula: ((MTD - LastMonthTotal) / LastMonthTotal) * 100
 */
export function calculateMoMGrowth(entries: RevenueEntry[]): number {
  const mtd = calculateMTD(entries);
  const lastMonthStart = getStartOfPreviousMonth();
  const lastMonthEnd = getEndOfPreviousMonth();
  const lastMonthTotal = sumRevenue(filterByDateRange(entries, lastMonthStart, lastMonthEnd)).total;
  
  if (lastMonthTotal === 0) return 0;
  
  return ((mtd - lastMonthTotal) / Math.abs(lastMonthTotal)) * 100;
}

/**
 * Calculate refund rate
 * Formula: refunds / (sales + refunds) * 100
 */
export function calculateRefundRate(entries: RevenueEntry[]): number {
  const startOfMonth = getStartOfMonth();
  const today = getToday();
  const filtered = filterByDateRange(entries, startOfMonth, today);
  const { sales, refunds } = sumRevenue(filtered);
  
  const total = sales + refunds;
  if (total === 0) return 0;
  
  return (refunds / total) * 100;
}

/**
 * Calculate run-rate projection for end of year
 * Formula: YTD / days_elapsed_in_year * 365
 */
export function calculateAnnualRunRate(entries: RevenueEntry[]): number {
  const ytd = calculateYTD(entries);
  const dayOfYear = getDayOfYear();
  
  if (dayOfYear === 0) return 0;
  
  return (ytd / dayOfYear) * 365;
}

// ============================================
// DEV ASSERTIONS
// ============================================

/**
 * Runtime assertion for development
 */
export function assertRevenue(condition: boolean, message: string): void {
  if (process.env.NODE_ENV === "development" && !condition) {
    console.error(`[Revenue Assertion Failed]: ${message}`);
  }
}

/**
 * Validate revenue metrics are reasonable
 */
export function validateMetrics(metrics: {
  today: number;
  wtd: number;
  mtd: number;
  ytd: number;
  runRate: number;
}): boolean {
  // WTD should be >= today (unless it's Monday and no data)
  assertRevenue(
    metrics.wtd >= metrics.today || metrics.today === 0,
    `WTD (${metrics.wtd}) should be >= today (${metrics.today})`
  );
  
  // MTD should be >= WTD
  assertRevenue(
    metrics.mtd >= metrics.wtd,
    `MTD (${metrics.mtd}) should be >= WTD (${metrics.wtd})`
  );
  
  // YTD should be >= MTD
  assertRevenue(
    metrics.ytd >= metrics.mtd,
    `YTD (${metrics.ytd}) should be >= MTD (${metrics.mtd})`
  );
  
  // Run rate should be >= MTD (projecting to end of month)
  assertRevenue(
    metrics.runRate >= metrics.mtd || metrics.mtd === 0,
    `RunRate (${metrics.runRate}) should be >= MTD (${metrics.mtd})`
  );
  
  return true;
}

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, includeSign: boolean = true): string {
  const prefix = includeSign && value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

/**
 * Round to 2 decimal places
 */
export function roundAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

