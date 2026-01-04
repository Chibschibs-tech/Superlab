"use server";

import type { RevenueEntry, RevenueStream, RevenueSource, RevenueTarget, SyncRun } from "@/types";

// ============================================
// SERVER ACTIONS FOR REVENUE OPERATIONS
// ============================================

const USE_MOCK_DATA = process.env.NODE_ENV === "development";

// ============================================
// IMPORT SUMMARY TYPE
// ============================================

export interface ImportSummary {
  success: boolean;
  inserted_count: number;
  skipped_duplicates_count: number;
  failed_count: number;
  total_amount: number;
  sales_amount: number;
  refunds_amount: number;
  date_range_start: string | null;
  date_range_end: string | null;
  sync_run_id: string | null;
  errors: string[];
}

// ============================================
// SYNC RUN LOGGING
// ============================================

async function createSyncRun(
  sourceId: string,
  initiatedBy: string | null
): Promise<string> {
  if (USE_MOCK_DATA) {
    return `sync-${Date.now()}`;
  }
  
  // TODO: Implement actual Supabase insert
  // const { data, error } = await supabase
  //   .from("sync_runs")
  //   .insert({ source_id: sourceId, initiated_by: initiatedBy, status: "Running" })
  //   .select("id")
  //   .single();
  
  return `sync-${Date.now()}`;
}

async function completeSyncRun(
  syncRunId: string,
  summary: Omit<ImportSummary, "success" | "sync_run_id" | "errors">
): Promise<void> {
  if (USE_MOCK_DATA) {
    console.log(`[Sync Run ${syncRunId}] Completed:`, summary);
    return;
  }
  
  // TODO: Implement actual Supabase update
  // const { error } = await supabase
  //   .from("sync_runs")
  //   .update({
  //     ended_at: new Date().toISOString(),
  //     status: "Success",
  //     rows_imported: summary.inserted_count,
  //     rows_skipped: summary.skipped_duplicates_count,
  //     rows_failed: summary.failed_count,
  //     total_amount: summary.total_amount,
  //     sales_amount: summary.sales_amount,
  //     refunds_amount: summary.refunds_amount,
  //     date_range_start: summary.date_range_start,
  //     date_range_end: summary.date_range_end,
  //   })
  //   .eq("id", syncRunId);
}

async function failSyncRun(syncRunId: string, errorLog: string): Promise<void> {
  if (USE_MOCK_DATA) {
    console.error(`[Sync Run ${syncRunId}] Failed:`, errorLog);
    return;
  }
  
  // TODO: Implement actual Supabase update
  // const { error } = await supabase
  //   .from("sync_runs")
  //   .update({
  //     ended_at: new Date().toISOString(),
  //     status: "Failed",
  //     error_log: errorLog,
  //   })
  //   .eq("id", syncRunId);
}

// ============================================
// MAIN IMPORT FUNCTION WITH DEDUPLICATION
// ============================================

export async function importRevenueEntriesWithSummary(
  entries: Omit<RevenueEntry, "id" | "created_at" | "updated_at">[],
  sourceId: string,
  initiatedBy: string | null = null
): Promise<ImportSummary> {
  // Create sync run record
  const syncRunId = await createSyncRun(sourceId, initiatedBy);
  
  const summary: ImportSummary = {
    success: false,
    inserted_count: 0,
    skipped_duplicates_count: 0,
    failed_count: 0,
    total_amount: 0,
    sales_amount: 0,
    refunds_amount: 0,
    date_range_start: null,
    date_range_end: null,
    sync_run_id: syncRunId,
    errors: [],
  };

  if (entries.length === 0) {
    summary.success = true;
    summary.errors.push("Aucune entrée à importer");
    await completeSyncRun(syncRunId, summary);
    return summary;
  }

  try {
    // Calculate date range
    const dates = entries.map((e) => e.date).sort();
    summary.date_range_start = dates[0];
    summary.date_range_end = dates[dates.length - 1];

    if (USE_MOCK_DATA) {
      // Simulate import with deduplication
      const existingRefs = new Set<string>();
      
      for (const entry of entries) {
        // Create unique key for deduplication
        const refKey = entry.reference_id 
          ? `${entry.source_id}:${entry.reference_type}:${entry.reference_id}`
          : null;
        
        if (refKey && existingRefs.has(refKey)) {
          summary.skipped_duplicates_count++;
          continue;
        }
        
        if (refKey) {
          existingRefs.add(refKey);
        }
        
        // Simulate insert
        summary.inserted_count++;
        summary.total_amount += entry.amount;
        
        if (entry.entry_type === "Refund" || entry.amount < 0) {
          summary.refunds_amount += Math.abs(entry.amount);
        } else {
          summary.sales_amount += entry.amount;
        }
      }
      
      summary.success = true;
    } else {
      // TODO: Implement actual Supabase upsert with ON CONFLICT
      // const { data, error } = await supabase
      //   .from("revenue_entries")
      //   .upsert(entries, {
      //     onConflict: "source_id,reference_type,reference_id",
      //     ignoreDuplicates: true,
      //   })
      //   .select();
      
      // For now, simulate success
      summary.inserted_count = entries.length;
      summary.success = true;
    }

    // Round amounts
    summary.total_amount = Math.round(summary.total_amount * 100) / 100;
    summary.sales_amount = Math.round(summary.sales_amount * 100) / 100;
    summary.refunds_amount = Math.round(summary.refunds_amount * 100) / 100;

    await completeSyncRun(syncRunId, summary);
    return summary;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    summary.errors.push(errorMessage);
    await failSyncRun(syncRunId, errorMessage);
    return summary;
  }
}

// ============================================
// LEGACY IMPORT FUNCTION (for backwards compatibility)
// ============================================

export async function importRevenueEntries(
  entries: Omit<RevenueEntry, "id" | "created_at" | "updated_at">[]
): Promise<{ success: boolean; imported: number; skipped: number; errors: string[] }> {
  if (entries.length === 0) {
    return { success: true, imported: 0, skipped: 0, errors: [] };
  }
  
  const sourceId = entries[0].source_id;
  const summary = await importRevenueEntriesWithSummary(entries, sourceId);
  
  return {
    success: summary.success,
    imported: summary.inserted_count,
    skipped: summary.skipped_duplicates_count,
    errors: summary.errors,
  };
}

// ============================================
// CRUD OPERATIONS
// ============================================

export async function createRevenueStream(
  stream: Omit<RevenueStream, "id" | "created_at" | "updated_at">
): Promise<{ success: boolean; data?: RevenueStream; error?: string }> {
  if (USE_MOCK_DATA) {
    const newStream: RevenueStream = {
      ...stream,
      id: `stream-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { success: true, data: newStream };
  }

  // TODO: Implement Supabase insert
  return { success: false, error: "Not implemented" };
}

export async function createRevenueSource(
  source: Omit<RevenueSource, "id" | "created_at" | "updated_at">
): Promise<{ success: boolean; data?: RevenueSource; error?: string }> {
  if (USE_MOCK_DATA) {
    const newSource: RevenueSource = {
      ...source,
      id: `source-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { success: true, data: newSource };
  }

  // TODO: Implement Supabase insert
  return { success: false, error: "Not implemented" };
}

export async function upsertRevenueTarget(
  target: Omit<RevenueTarget, "id" | "created_at" | "updated_at">
): Promise<{ success: boolean; data?: RevenueTarget; error?: string }> {
  if (USE_MOCK_DATA) {
    const newTarget: RevenueTarget = {
      ...target,
      id: `target-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { success: true, data: newTarget };
  }

  // TODO: Implement Supabase upsert
  return { success: false, error: "Not implemented" };
}

export async function deleteRevenueEntry(
  entryId: string
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK_DATA) {
    return { success: true };
  }

  // TODO: Implement Supabase delete
  return { success: false, error: "Not implemented" };
}

// ============================================
// CSV VALIDATION
// ============================================

export interface CSVValidationResult {
  valid: boolean;
  rows: number;
  errors: { row: number; message: string }[];
  preview: Partial<RevenueEntry>[];
}

export async function validateCSVData(
  data: Record<string, string>[],
  columnMapping: Record<string, string>,
  streamId: string,
  sourceId: string
): Promise<CSVValidationResult> {
  const errors: { row: number; message: string }[] = [];
  const preview: Partial<RevenueEntry>[] = [];
  const validCurrencies = ["EUR", "USD", "GBP", "CHF", "CAD", "AUD", "JPY", "CNY"];

  data.forEach((row, index) => {
    const rowNum = index + 2; // Account for header row

    const dateValue = row[columnMapping.date];
    const amountValue = row[columnMapping.amount];
    const currencyValue = row[columnMapping.currency] || "EUR";

    // Validate date
    if (!dateValue) {
      errors.push({ row: rowNum, message: "Date manquante" });
    } else {
      const parsedDate = new Date(dateValue);
      if (isNaN(parsedDate.getTime())) {
        errors.push({ row: rowNum, message: `Date invalide: ${dateValue}` });
      }
    }

    // Validate amount
    if (!amountValue) {
      errors.push({ row: rowNum, message: "Montant manquant" });
    } else {
      const parsedAmount = parseFloat(amountValue.replace(",", ".").replace(/[^0-9.-]/g, ""));
      if (isNaN(parsedAmount)) {
        errors.push({ row: rowNum, message: `Montant invalide: ${amountValue}` });
      } else if (parsedAmount < -1000000000 || parsedAmount > 1000000000) {
        errors.push({ row: rowNum, message: `Montant hors limites: ${amountValue}` });
      }
    }

    // Validate currency
    if (currencyValue && !validCurrencies.includes(currencyValue.toUpperCase())) {
      errors.push({ row: rowNum, message: `Devise non supportée: ${currencyValue}` });
    }

    // Build preview entry (first 5 rows only)
    if (index < 5 && errors.filter((e) => e.row === rowNum).length === 0) {
      preview.push({
        date: dateValue ? new Date(dateValue).toISOString().split("T")[0] : undefined,
        amount: amountValue 
          ? parseFloat(amountValue.replace(",", ".").replace(/[^0-9.-]/g, "")) 
          : undefined,
        currency: currencyValue?.toUpperCase() || "EUR",
        stream_id: streamId,
        source_id: sourceId,
        entry_type: (row[columnMapping.entry_type] as RevenueEntry["entry_type"]) || "Sale",
        status: "Confirmed",
        reference_type: row[columnMapping.reference_type] || undefined,
        reference_id: row[columnMapping.reference_id] || undefined,
        notes: row[columnMapping.notes] || undefined,
      });
    }
  });

  return {
    valid: errors.length === 0,
    rows: data.length,
    errors: errors.slice(0, 20), // Limit to first 20 errors
    preview,
  };
}

// ============================================
// PREPARE CSV FOR IMPORT
// ============================================

export async function prepareCSVImport(
  data: Record<string, string>[],
  columnMapping: Record<string, string>,
  streamId: string,
  sourceId: string
): Promise<Omit<RevenueEntry, "id" | "created_at" | "updated_at">[]> {
  return data
    .map((row) => {
      const dateValue = row[columnMapping.date];
      const amountValue = row[columnMapping.amount];

      if (!dateValue || !amountValue) return null;

      const parsedDate = new Date(dateValue);
      const parsedAmount = parseFloat(amountValue.replace(",", ".").replace(/[^0-9.-]/g, ""));

      if (isNaN(parsedDate.getTime()) || isNaN(parsedAmount)) return null;

      return {
        date: parsedDate.toISOString().split("T")[0],
        amount: parsedAmount,
        currency: (row[columnMapping.currency] || "EUR").toUpperCase(),
        stream_id: streamId,
        source_id: sourceId,
        entry_type: (row[columnMapping.entry_type] as RevenueEntry["entry_type"]) || "Sale",
        status: "Confirmed" as const,
        reference_type: row[columnMapping.reference_type] || null,
        reference_id: row[columnMapping.reference_id] || null,
        notes: row[columnMapping.notes] || null,
        metadata: {},
        created_by: null,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

// ============================================
// GET LAST SYNC INFO PER SOURCE
// ============================================

export interface SourceFreshness {
  source_id: string;
  source_name: string;
  last_sync_at: string | null;
  last_entry_date: string | null;
  days_since_last_entry: number | null;
  status: "fresh" | "stale" | "warning" | "unknown";
}

export async function getSourceFreshness(): Promise<SourceFreshness[]> {
  if (USE_MOCK_DATA) {
    const now = new Date();
    return [
      {
        source_id: "source-1",
        source_name: "Stripe",
        last_sync_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        last_entry_date: now.toISOString().split("T")[0],
        days_since_last_entry: 0,
        status: "fresh",
      },
      {
        source_id: "source-2",
        source_name: "Google Ads",
        last_sync_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        last_entry_date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        days_since_last_entry: 1,
        status: "fresh",
      },
      {
        source_id: "source-3",
        source_name: "Import Manuel",
        last_sync_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        last_entry_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        days_since_last_entry: 5,
        status: "warning",
      },
    ];
  }

  // TODO: Implement actual Supabase query
  return [];
}
