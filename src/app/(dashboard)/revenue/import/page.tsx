"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  validateCSVData,
  prepareCSVImport,
  importRevenueEntriesWithSummary,
  type CSVValidationResult,
  type ImportSummary,
} from "@/lib/actions/revenue";
import { mockStreams, mockSources } from "@/lib/data/revenue";
import type { RevenueEntry } from "@/types";

const MAPPING_STORAGE_KEY = "superlab-csv-mapping";

interface ColumnMapping {
  date: string;
  amount: string;
  currency: string;
  entry_type: string;
  reference_type: string;
  reference_id: string;
  notes: string;
  [key: string]: string; // Index signature for Record<string, string> compatibility
}

const DEFAULT_MAPPING: ColumnMapping = {
  date: "",
  amount: "",
  currency: "",
  entry_type: "",
  reference_type: "",
  reference_id: "",
  notes: "",
};

const REQUIRED_FIELDS = ["date", "amount"];

function parseCSV(text: string): { headers: string[]; data: Record<string, string>[] } {
  const lines = text.trim().split("\n");
  if (lines.length < 2) {
    return { headers: [], data: [] };
  }

  // Parse header
  const headers = lines[0].split(/[,;\t]/).map((h) => h.trim().replace(/^"|"$/g, ""));

  // Parse data rows
  const data = lines.slice(1).map((line) => {
    const values = line.split(/[,;\t]/).map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || "";
    });
    return row;
  });

  return { headers, data };
}

export default function ImportPage() {
  const [step, setStep] = useState<"upload" | "map" | "preview" | "importing" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(DEFAULT_MAPPING);
  const [streamId, setStreamId] = useState<string>("");
  const [sourceId, setSourceId] = useState<string>("");
  const [validation, setValidation] = useState<CSVValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);

  // Load saved mapping from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(MAPPING_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMapping((prev) => ({ ...prev, ...parsed }));
      } catch {
        // Ignore invalid JSON
      }
    }
  }, []);

  // Save mapping to localStorage
  const saveMapping = useCallback(() => {
    localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(mapping));
    toast.success("Mapping sauvegardé");
  }, [mapping]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFile = e.target.files?.[0];
      if (!uploadedFile) return;

      if (!uploadedFile.name.endsWith(".csv")) {
        toast.error("Veuillez sélectionner un fichier CSV");
        return;
      }

      setFile(uploadedFile);

      try {
        const text = await uploadedFile.text();
        const { headers, data } = parseCSV(text);

        if (headers.length === 0) {
          toast.error("Le fichier CSV est vide ou invalide");
          return;
        }

        setCsvHeaders(headers);
        setCsvData(data);

        // Auto-map common column names
        const autoMapping = { ...DEFAULT_MAPPING };
        headers.forEach((header) => {
          const lower = header.toLowerCase();
          if (lower.includes("date")) autoMapping.date = header;
          else if (lower.includes("montant") || lower.includes("amount"))
            autoMapping.amount = header;
          else if (lower.includes("devise") || lower.includes("currency"))
            autoMapping.currency = header;
          else if (lower.includes("type")) autoMapping.entry_type = header;
          else if (lower.includes("ref") && lower.includes("type"))
            autoMapping.reference_type = header;
          else if (lower.includes("ref") && lower.includes("id"))
            autoMapping.reference_id = header;
          else if (lower.includes("note")) autoMapping.notes = header;
        });

        setMapping((prev) => ({ ...prev, ...autoMapping }));
        setStep("map");
        toast.success(`${data.length} lignes détectées`);
      } catch (error) {
        toast.error("Erreur lors de la lecture du fichier");
        console.error(error);
      }
    },
    []
  );

  // Handle mapping change
  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({ ...prev, [field]: value }));
  };

  // Validate and preview
  const handlePreview = async () => {
    if (!streamId || !sourceId) {
      toast.error("Veuillez sélectionner un flux et une source");
      return;
    }

    if (!mapping.date || !mapping.amount) {
      toast.error("Les champs Date et Montant sont obligatoires");
      return;
    }

    const result = await validateCSVData(csvData, mapping, streamId, sourceId);
    setValidation(result);
    setStep("preview");
  };

  // Import data
  const handleImport = async () => {
    if (!validation?.valid) {
      toast.error("Corrigez les erreurs avant d'importer");
      return;
    }

    setStep("importing");

    try {
      const entries = await prepareCSVImport(csvData, mapping, streamId, sourceId);
      const result = await importRevenueEntriesWithSummary(entries, sourceId);

      if (result.success) {
        setImportResult(result);
        setStep("done");
        toast.success(`${result.inserted_count} entrées importées`);
      } else {
        toast.error(result.errors[0] || "Erreur lors de l'import");
        setStep("preview");
      }
    } catch (error) {
      toast.error("Erreur lors de l'import");
      console.error(error);
      setStep("preview");
    }
  };

  // Reset
  const handleReset = () => {
    setStep("upload");
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setValidation(null);
    setImportResult(null);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/revenue">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Import CSV</h1>
          <p className="text-neutral-400">
            Importez vos données de revenus depuis un fichier CSV
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 flex items-center gap-4">
        {["upload", "map", "preview", "done"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === s
                  ? "bg-emerald-500 text-white"
                  : ["upload", "map", "preview", "done"].indexOf(step) > i
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/5 text-neutral-500"
              }`}
            >
              {["upload", "map", "preview", "done"].indexOf(step) > i ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-sm ${
                step === s ? "text-white" : "text-neutral-500"
              }`}
            >
              {s === "upload" && "Upload"}
              {s === "map" && "Mapping"}
              {s === "preview" && "Aperçu"}
              {s === "done" && "Terminé"}
            </span>
            {i < 3 && (
              <div className="h-px w-8 bg-white/10" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
              <FileSpreadsheet className="h-10 w-10 text-emerald-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">
              Sélectionnez un fichier CSV
            </h2>
            <p className="mb-6 text-center text-neutral-400">
              Format attendu : colonnes date, montant, et optionnellement devise,
              type, référence
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Choisir un fichier
                </span>
              </Button>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Mapping */}
      {step === "map" && (
        <div className="space-y-6">
          <Card className="border-white/5 bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span>Configuration</span>
                <Badge variant="outline" className="text-neutral-400">
                  {file?.name}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-neutral-300">Flux de revenus *</Label>
                <Select value={streamId} onValueChange={setStreamId}>
                  <SelectTrigger className="border-white/10 bg-white/5">
                    <SelectValue placeholder="Sélectionner un flux" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockStreams.map((stream) => (
                      <SelectItem key={stream.id} value={stream.id}>
                        {stream.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Source *</Label>
                <Select value={sourceId} onValueChange={setSourceId}>
                  <SelectTrigger className="border-white/10 bg-white/5">
                    <SelectValue placeholder="Sélectionner une source" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span>Mapping des colonnes</span>
                <Button variant="outline" size="sm" onClick={saveMapping}>
                  Sauvegarder le mapping
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(mapping).map(([field, value]) => (
                <div key={field} className="space-y-2">
                  <Label className="text-neutral-300">
                    {field === "date" && "Date *"}
                    {field === "amount" && "Montant *"}
                    {field === "currency" && "Devise"}
                    {field === "entry_type" && "Type"}
                    {field === "reference_type" && "Type de référence"}
                    {field === "reference_id" && "ID de référence"}
                    {field === "notes" && "Notes"}
                  </Label>
                  <Select
                    value={value}
                    onValueChange={(v) =>
                      handleMappingChange(field as keyof ColumnMapping, v)
                    }
                  >
                    <SelectTrigger className="border-white/10 bg-white/5">
                      <SelectValue placeholder="Colonne CSV" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Aucune --</SelectItem>
                      {csvHeaders.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Annuler
            </Button>
            <Button onClick={handlePreview} className="bg-emerald-600 hover:bg-emerald-700">
              Valider et aperçu
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && validation && (
        <div className="space-y-6">
          {/* Validation Status */}
          <Card
            className={`border-white/5 ${
              validation.valid ? "bg-emerald-500/5" : "bg-red-500/5"
            }`}
          >
            <CardContent className="flex items-center gap-4 p-6">
              {validation.valid ? (
                <>
                  <Check className="h-8 w-8 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-white">
                      Validation réussie
                    </p>
                    <p className="text-neutral-400">
                      {validation.rows} lignes prêtes à importer
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <div>
                    <p className="font-semibold text-white">
                      Erreurs détectées
                    </p>
                    <p className="text-neutral-400">
                      {validation.errors.length} erreur(s) à corriger
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Errors */}
          {validation.errors.length > 0 && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader>
                <CardTitle className="text-red-400">Erreurs</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {validation.errors.map((err, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-red-300"
                    >
                      <X className="h-4 w-4" />
                      Ligne {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Preview Table */}
          {validation.preview.length > 0 && (
            <Card className="border-white/5 bg-white/[0.02]">
              <CardHeader>
                <CardTitle className="text-white">
                  Aperçu (5 premières lignes)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-2 text-left text-neutral-400">
                          Date
                        </th>
                        <th className="px-4 py-2 text-right text-neutral-400">
                          Montant
                        </th>
                        <th className="px-4 py-2 text-left text-neutral-400">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-neutral-400">
                          Référence
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.preview.map((entry, i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="px-4 py-2 text-white">
                            {entry.date}
                          </td>
                          <td className="px-4 py-2 text-right text-white">
                            {entry.amount?.toFixed(2)} {entry.currency}
                          </td>
                          <td className="px-4 py-2 text-neutral-300">
                            {entry.entry_type}
                          </td>
                          <td className="px-4 py-2 text-neutral-300">
                            {entry.reference_id || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("map")}>
              Retour
            </Button>
            <Button
              onClick={handleImport}
              disabled={!validation.valid}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Importer {validation.rows} lignes
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Importing */}
      {step === "importing" && (
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-emerald-400" />
            <p className="text-lg font-medium text-white">Import en cours...</p>
            <p className="text-neutral-400">Veuillez patienter</p>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Done */}
      {step === "done" && importResult && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-10 w-10 text-emerald-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">
              Import terminé !
            </h2>
            
            {/* Import Summary */}
            <div className="mb-6 w-full max-w-md space-y-4 rounded-xl bg-white/5 p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-neutral-400">Entrées importées</div>
                <div className="text-right font-medium text-emerald-400">
                  {importResult.inserted_count}
                </div>
                
                <div className="text-neutral-400">Doublons ignorés</div>
                <div className="text-right font-medium text-amber-400">
                  {importResult.skipped_duplicates_count}
                </div>
                
                <div className="text-neutral-400">Total ventes</div>
                <div className="text-right font-medium text-white">
                  {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(importResult.sales_amount)}
                </div>
                
                <div className="text-neutral-400">Total remboursements</div>
                <div className="text-right font-medium text-red-400">
                  {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(importResult.refunds_amount)}
                </div>
                
                <div className="text-neutral-400">Montant net</div>
                <div className="text-right font-bold text-white">
                  {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(importResult.total_amount)}
                </div>
                
                {importResult.date_range_start && importResult.date_range_end && (
                  <>
                    <div className="text-neutral-400">Période</div>
                    <div className="text-right text-white">
                      {new Date(importResult.date_range_start).toLocaleDateString("fr-FR")} — {new Date(importResult.date_range_end).toLocaleDateString("fr-FR")}
                    </div>
                  </>
                )}
              </div>
              
              {importResult.sync_run_id && (
                <div className="border-t border-white/10 pt-3 text-center text-xs text-neutral-500">
                  ID Sync: {importResult.sync_run_id}
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleReset}>
                Nouvel import
              </Button>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/revenue">Voir le dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

