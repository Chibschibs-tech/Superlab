import type {
  RevenueStream,
  RevenueSource,
  RevenueEntry,
  RevenueTarget,
  RevenueMetrics,
  StreamMetrics,
  RiskMetrics,
  ForecastMetrics,
} from "@/types";

// ============================================
// MOCK DATA FOR DEVELOPMENT
// ============================================

const USE_MOCK_DATA = process.env.NODE_ENV === "development";

export const mockStreams: RevenueStream[] = [
  {
    id: "stream-1",
    name: "Abonnements Premium",
    category: "Recurring",
    description: "Abonnements mensuels et annuels",
    owner_id: "d0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "stream-2",
    name: "Publicité Display",
    category: "Transactional",
    description: "Revenus publicitaires display et native",
    owner_id: "d0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "stream-3",
    name: "Licensing Content",
    category: "Partnership",
    description: "Syndication et licensing de contenus",
    owner_id: "d0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "stream-4",
    name: "Événements & Webinars",
    category: "Transactional",
    description: "Billetterie et sponsoring événements",
    owner_id: "d0d54b3e-8b1a-4f5c-9c5d-1a2b3c4d5e6f",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockSources: RevenueSource[] = [
  {
    id: "source-1",
    name: "Stripe",
    type: "API",
    config_json: {},
    is_active: true,
    last_sync_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "source-2",
    name: "Google Ads",
    type: "API",
    config_json: {},
    is_active: true,
    last_sync_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "source-3",
    name: "Import Manuel",
    type: "Manual",
    config_json: {},
    is_active: true,
    last_sync_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Generate mock entries for the last 90 days
function generateMockEntries(): RevenueEntry[] {
  const entries: RevenueEntry[] = [];
  const now = new Date();
  
  for (let i = 0; i < 90; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    
    // Subscriptions - daily recurring
    entries.push({
      id: `entry-sub-${i}`,
      date: dateStr,
      amount: 800 + Math.random() * 400,
      currency: "EUR",
      stream_id: "stream-1",
      source_id: "source-1",
      entry_type: "Subscription",
      status: "Confirmed",
      reference_type: "subscription",
      reference_id: `sub-${i}`,
      notes: null,
      metadata: {},
      created_by: null,
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
    });
    
    // Ads - variable daily
    entries.push({
      id: `entry-ad-${i}`,
      date: dateStr,
      amount: 500 + Math.random() * 1000,
      currency: "EUR",
      stream_id: "stream-2",
      source_id: "source-2",
      entry_type: "AdRevenue",
      status: "Confirmed",
      reference_type: "payout",
      reference_id: `ad-${i}`,
      notes: null,
      metadata: {},
      created_by: null,
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
    });
    
    // Licensing - weekly
    if (i % 7 === 0) {
      entries.push({
        id: `entry-lic-${i}`,
        date: dateStr,
        amount: 2000 + Math.random() * 3000,
        currency: "EUR",
        stream_id: "stream-3",
        source_id: "source-3",
        entry_type: "License",
        status: "Confirmed",
        reference_type: "invoice",
        reference_id: `inv-${i}`,
        notes: null,
        metadata: {},
        created_by: null,
        created_at: date.toISOString(),
        updated_at: date.toISOString(),
      });
    }
    
    // Events - occasional
    if (i % 14 === 0) {
      entries.push({
        id: `entry-evt-${i}`,
        date: dateStr,
        amount: 5000 + Math.random() * 5000,
        currency: "EUR",
        stream_id: "stream-4",
        source_id: "source-3",
        entry_type: "Sale",
        status: "Confirmed",
        reference_type: "ticket",
        reference_id: `tkt-${i}`,
        notes: null,
        metadata: {},
        created_by: null,
        created_at: date.toISOString(),
        updated_at: date.toISOString(),
      });
    }
    
    // Some refunds (5% of days)
    if (Math.random() < 0.05) {
      entries.push({
        id: `entry-ref-${i}`,
        date: dateStr,
        amount: -(50 + Math.random() * 150),
        currency: "EUR",
        stream_id: "stream-1",
        source_id: "source-1",
        entry_type: "Refund",
        status: "Confirmed",
        reference_type: "refund",
        reference_id: `ref-${i}`,
        notes: "Remboursement client",
        metadata: {},
        created_by: null,
        created_at: date.toISOString(),
        updated_at: date.toISOString(),
      });
    }
  }
  
  return entries;
}

export const mockEntries = generateMockEntries();

export const mockTargets: RevenueTarget[] = [
  {
    id: "target-1",
    stream_id: "stream-1",
    month_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    target_amount: 30000,
    currency: "EUR",
    notes: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "target-2",
    stream_id: "stream-2",
    month_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    target_amount: 25000,
    currency: "EUR",
    notes: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "target-3",
    stream_id: "stream-3",
    month_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    target_amount: 15000,
    currency: "EUR",
    notes: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "target-4",
    stream_id: "stream-4",
    month_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    target_amount: 10000,
    currency: "EUR",
    notes: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

export async function getRevenueStreams(): Promise<RevenueStream[]> {
  if (USE_MOCK_DATA) {
    return mockStreams;
  }
  // TODO: Implement Supabase fetch
  return mockStreams;
}

export async function getRevenueSources(): Promise<RevenueSource[]> {
  if (USE_MOCK_DATA) {
    return mockSources;
  }
  // TODO: Implement Supabase fetch
  return mockSources;
}

export async function getRevenueEntries(
  startDate?: string,
  endDate?: string
): Promise<RevenueEntry[]> {
  if (USE_MOCK_DATA) {
    let entries = mockEntries;
    if (startDate) {
      entries = entries.filter((e) => e.date >= startDate);
    }
    if (endDate) {
      entries = entries.filter((e) => e.date <= endDate);
    }
    return entries;
  }
  // TODO: Implement Supabase fetch
  return mockEntries;
}

export async function getRevenueTargets(month?: string): Promise<RevenueTarget[]> {
  if (USE_MOCK_DATA) {
    if (month) {
      return mockTargets.filter((t) => t.month_date === month);
    }
    return mockTargets;
  }
  // TODO: Implement Supabase fetch
  return mockTargets;
}

// ============================================
// ANALYTICS CALCULATIONS
// ============================================

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getStartOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getDayOfMonth(date: Date): number {
  return date.getDate();
}

export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const entries = await getRevenueEntries();
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const startOfWeek = getStartOfWeek(now).toISOString().split("T")[0];
  const startOfMonth = getStartOfMonth(now).toISOString().split("T")[0];
  const startOfYear = getStartOfYear(now).toISOString().split("T")[0];
  
  // Last month
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStart = lastMonth.toISOString().split("T")[0];
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
  
  const confirmedEntries = entries.filter((e) => e.status === "Confirmed");
  
  const todayTotal = confirmedEntries
    .filter((e) => e.date === today)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const wtdTotal = confirmedEntries
    .filter((e) => e.date >= startOfWeek && e.date <= today)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const mtdTotal = confirmedEntries
    .filter((e) => e.date >= startOfMonth && e.date <= today)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const ytdTotal = confirmedEntries
    .filter((e) => e.date >= startOfYear && e.date <= today)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const lastMonthTotal = confirmedEntries
    .filter((e) => e.date >= lastMonthStart && e.date <= lastMonthEnd)
    .reduce((sum, e) => sum + e.amount, 0);
  
  // Run rate: MTD / days elapsed * days in month
  const daysElapsed = getDayOfMonth(now);
  const daysInMonth = getDaysInMonth(now);
  const runRate = daysElapsed > 0 ? (mtdTotal / daysElapsed) * daysInMonth : 0;
  
  // MoM change
  const momChange = lastMonthTotal > 0 
    ? ((mtdTotal - lastMonthTotal) / lastMonthTotal) * 100 
    : 0;
  
  return {
    today: Math.round(todayTotal * 100) / 100,
    wtd: Math.round(wtdTotal * 100) / 100,
    mtd: Math.round(mtdTotal * 100) / 100,
    ytd: Math.round(ytdTotal * 100) / 100,
    runRate: Math.round(runRate * 100) / 100,
    momChange: Math.round(momChange * 10) / 10,
    lastMonthTotal: Math.round(lastMonthTotal * 100) / 100,
  };
}

export async function getStreamMetrics(): Promise<StreamMetrics[]> {
  const streams = await getRevenueStreams();
  const entries = await getRevenueEntries();
  const targets = await getRevenueTargets();
  
  const now = new Date();
  const startOfMonth = getStartOfMonth(now).toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  return streams.map((stream) => {
    const streamEntries = entries.filter(
      (e) => e.stream_id === stream.id && e.status === "Confirmed"
    );
    
    const mtdActual = streamEntries
      .filter((e) => e.date >= startOfMonth && e.date <= today)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const target = targets.find((t) => t.stream_id === stream.id);
    const mtdTarget = target?.target_amount || 0;
    
    const percentAchieved = mtdTarget > 0 ? (mtdActual / mtdTarget) * 100 : 0;
    
    // Trend: last 30 days grouped by date
    const trendMap = new Map<string, number>();
    streamEntries
      .filter((e) => e.date >= thirtyDaysAgo && e.date <= today)
      .forEach((e) => {
        const current = trendMap.get(e.date) || 0;
        trendMap.set(e.date, current + e.amount);
      });
    
    const trend = Array.from(trendMap.entries())
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      stream,
      mtdActual: Math.round(mtdActual * 100) / 100,
      mtdTarget: Math.round(mtdTarget * 100) / 100,
      percentAchieved: Math.round(percentAchieved * 10) / 10,
      trend,
    };
  });
}

export async function getRiskMetrics(): Promise<RiskMetrics> {
  const streams = await getRevenueStreams();
  const entries = await getRevenueEntries();
  
  const now = new Date();
  const startOfMonth = getStartOfMonth(now).toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];
  
  const mtdEntries = entries.filter((e) => e.date >= startOfMonth && e.date <= today);
  
  const refunds = mtdEntries.filter((e) => e.entry_type === "Refund");
  const sales = mtdEntries.filter((e) => e.entry_type !== "Refund" && e.amount > 0);
  
  const refundAmount = Math.abs(refunds.reduce((sum, e) => sum + e.amount, 0));
  const saleAmount = sales.reduce((sum, e) => sum + e.amount, 0);
  
  const refundRate = saleAmount > 0 ? (refundAmount / (saleAmount + refundAmount)) * 100 : 0;
  
  // Streams with missing data (no entries in last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const streamsWithMissingData = streams
    .map((stream) => {
      const streamEntries = entries.filter((e) => e.stream_id === stream.id);
      const lastEntry = streamEntries.sort((a, b) => b.date.localeCompare(a.date))[0];
      const lastEntryDate = lastEntry ? new Date(lastEntry.date) : new Date(0);
      const daysSince = Math.floor((now.getTime() - lastEntryDate.getTime()) / (24 * 60 * 60 * 1000));
      return { stream, daysSinceLastEntry: daysSince };
    })
    .filter((s) => s.daysSinceLastEntry > 7);
  
  const pendingCount = mtdEntries.filter((e) => e.status === "Pending").length;
  const cancelledCount = mtdEntries.filter((e) => e.status === "Cancelled").length;
  
  return {
    refundRate: Math.round(refundRate * 10) / 10,
    refundCount: refunds.length,
    saleCount: sales.length,
    streamsWithMissingData,
    pendingCount,
    cancelledCount,
  };
}

export async function getForecastMetrics(): Promise<ForecastMetrics> {
  const entries = await getRevenueEntries();
  const targets = await getRevenueTargets();
  
  const now = new Date();
  const startOfMonth = getStartOfMonth(now).toISOString().split("T")[0];
  const startOfYear = getStartOfYear(now).toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];
  
  const confirmedEntries = entries.filter((e) => e.status === "Confirmed");
  
  const mtdTotal = confirmedEntries
    .filter((e) => e.date >= startOfMonth && e.date <= today)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const ytdTotal = confirmedEntries
    .filter((e) => e.date >= startOfYear && e.date <= today)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const mtdTarget = targets.reduce((sum, t) => sum + t.target_amount, 0);
  const ytdTarget = mtdTarget * 12; // Simple annualization
  
  const daysElapsed = getDayOfMonth(now);
  const daysInMonth = getDaysInMonth(now);
  const daysRemaining = daysInMonth - daysElapsed;
  
  // Run rate projection for EOY
  const dayOfYear = Math.floor((now.getTime() - getStartOfYear(now).getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const dailyAverage = ytdTotal / dayOfYear;
  const runRateProjection = dailyAverage * 365;
  
  const mtdRemaining = Math.max(0, mtdTarget - mtdTotal);
  const gapToTarget = ytdTarget - ytdTotal;
  
  return {
    runRateProjection: Math.round(runRateProjection * 100) / 100,
    mtdRemaining: Math.round(mtdRemaining * 100) / 100,
    daysRemainingInMonth: daysRemaining,
    ytdActual: Math.round(ytdTotal * 100) / 100,
    ytdTarget: Math.round(ytdTarget * 100) / 100,
    gapToTarget: Math.round(gapToTarget * 100) / 100,
  };
}

