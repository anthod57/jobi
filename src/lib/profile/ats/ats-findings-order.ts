import type { AtsFinding } from "./types";

export const ATS_SEVERITY_ORDER: AtsFinding["severity"][] = [
  "error",
  "warning",
  "info",
];

export function compareFindingsBySeverity(a: AtsFinding, b: AtsFinding): number {
  return ATS_SEVERITY_ORDER.indexOf(a.severity) - ATS_SEVERITY_ORDER.indexOf(b.severity);
}

export function severityToAlertVariant(
  severity: AtsFinding["severity"],
): "failure" | "warning" | "info" {
  if (severity === "error") return "failure";
  if (severity === "warning") return "warning";
  return "info";
}
