export type BiomarkerStatus = "normal" | "elevated" | "low" | "borderline" | "unknown";

export interface Biomarker {
  name: string;
  value: string;
  unit: string;
  reference: string;
  status: BiomarkerStatus;
}

// Regex patterns to try in order of specificity
const PATTERNS = [
  // **Name**: 14.2 g/dL (Normal: 12.0–16.0 g/dL)
  /\*\*([^*]+)\*\*:\s*([\d.]+)\s*([\w/%³µ×^]+(?:\s*[/×]\s*[\w³µ]+)*)\s*\((?:Normal|Ref|Reference):\s*([^)]+)\)/gi,
  // **Name**: 14.2 g/dL — Normal (Ref: 12–16)
  /\*\*([^*]+)\*\*:\s*([\d.]+)\s*([\w/%³µ×^]+)\s*[—–-]\s*\w+\s*\((?:Ref|Reference):\s*([^)]+)\)/gi,
  // | Name | 14.2 | g/dL | 12–16 | Normal |  (markdown table)
  /\|\s*([A-Za-z][\w\s]+?)\s*\|\s*([\d.]+)\s*\|\s*([\w/%³µ×^]*)\s*\|\s*([\d.]+\s*[–-]\s*[\d.]+)\s*\|\s*(\w+)\s*\|/gi,
];

function resolveStatus(value: string, reference: string, raw?: string): BiomarkerStatus {
  if (raw) {
    const r = raw.toLowerCase();
    if (r.includes("normal") || r.includes("within")) return "normal";
    if (r.includes("high") || r.includes("elevated") || r.includes("above")) return "elevated";
    if (r.includes("low") || r.includes("below")) return "low";
    if (r.includes("borderline") || r.includes("caution")) return "borderline";
  }
  // Try numeric range comparison
  const rangeMatch = reference.match(/([\d.]+)\s*[–\-]\s*([\d.]+)/);
  if (rangeMatch) {
    const num = parseFloat(value);
    const lo  = parseFloat(rangeMatch[1]);
    const hi  = parseFloat(rangeMatch[2]);
    if (!isNaN(num) && !isNaN(lo) && !isNaN(hi)) {
      if (num < lo) return "low";
      if (num > hi) return "elevated";
      return "normal";
    }
  }
  return "unknown";
}

export function parseBiomarkers(summary: string): Biomarker[] {
  if (!summary) return [];
  const results: Biomarker[] = [];
  const seen = new Set<string>();

  // Pattern 1 & 2: bold name patterns
  for (const pattern of PATTERNS.slice(0, 2)) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(summary)) !== null) {
      const name = m[1].trim();
      if (seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      const [, , value, unit, reference] = m;
      results.push({ name, value: value.trim(), unit: unit.trim(), reference: reference.trim(), status: resolveStatus(value, reference) });
      if (results.length >= 8) break;
    }
    if (results.length > 0) break;
  }

  // Pattern 3: markdown table
  if (results.length === 0) {
    const tablePattern = PATTERNS[2];
    tablePattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = tablePattern.exec(summary)) !== null) {
      const name = m[1].trim();
      if (seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      const [, , value, unit, reference, rawStatus] = m;
      results.push({
        name,
        value: value.trim(),
        unit:  unit.trim(),
        reference: reference.trim(),
        status: resolveStatus(value, reference, rawStatus),
      });
      if (results.length >= 8) break;
    }
  }

  // Fallback: simple "Name: value unit" patterns from prose
  if (results.length === 0) {
    const prose = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:\(CBC\))?\s*(?:level|count|was|is|of)?\s*(?:was|is|of)?\s*([\d.]+)\s*(g\/dL|g\/L|mmol\/L|µmol\/L|IU\/L|mg\/dL|×10³|10³\/µL|%|k\/µL)\b/g;
    let m: RegExpExecArray | null;
    while ((m = prose.exec(summary)) !== null) {
      const name = m[1].trim();
      if (seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      results.push({ name, value: m[2], unit: m[3], reference: "", status: "unknown" });
      if (results.length >= 6) break;
    }
  }

  return results;
}

export function getStatusColor(status: BiomarkerStatus): string {
  switch (status) {
    case "normal":     return "text-success bg-success-50 border-success/20";
    case "elevated":   return "text-warning bg-warning-50 border-warning/20";
    case "low":        return "text-info-500 bg-info-50 border-info-500/20";
    case "borderline": return "text-orange-600 bg-orange-50 border-orange-200";
    default:           return "text-slate-500 bg-slate-50 border-slate-200";
  }
}

export function getStatusLabel(status: BiomarkerStatus): string {
  switch (status) {
    case "normal":     return "Normal";
    case "elevated":   return "Elevated";
    case "low":        return "Low";
    case "borderline": return "Borderline";
    default:           return "—";
  }
}

export function getStatusDot(status: BiomarkerStatus): string {
  switch (status) {
    case "normal":     return "bg-success";
    case "elevated":   return "bg-warning";
    case "low":        return "bg-info-500";
    case "borderline": return "bg-orange-500";
    default:           return "bg-slate-300";
  }
}

export function computeOverallStatus(biomarkers: Biomarker[]): "all_normal" | "attention" | "unknown" {
  if (!biomarkers.length) return "unknown";
  const abnormal = biomarkers.filter((b) => b.status === "elevated" || b.status === "low" || b.status === "borderline");
  if (abnormal.length === 0) return "all_normal";
  return "attention";
}
