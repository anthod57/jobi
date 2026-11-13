import { scoreFromFindings } from "./score";
import { allAtsRules } from "./rules";
import type { AtsContext, AtsResult } from "./types";

export function runAtsAnalysis(text: string, ctx: AtsContext): AtsResult {
  const findings = allAtsRules.flatMap((rule) => rule(text, ctx));
  const score = scoreFromFindings(findings);
  return { score, findings };
}
