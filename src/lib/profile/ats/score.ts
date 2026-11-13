import type { AtsFinding } from "./types";

export function scoreFromFindings(findings: AtsFinding[]): number {
  const deducted = findings.reduce((sum, f) => sum + f.pointsDeducted, 0);
  return Math.max(0, Math.min(100, 100 - deducted));
}
