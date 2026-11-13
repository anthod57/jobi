export type AtsScoreBand = {
  label: string;
  color: "failure" | "warning" | "success" | "primary";
};

/** Contract M3-03: 0–49 Insuffisant … 90–100 Excellent */
export function scoreBand(score: number): AtsScoreBand {
  if (score < 50) {
    return { label: "Insuffisant", color: "failure" };
  }
  if (score < 75) {
    return { label: "Moyen", color: "warning" };
  }
  if (score < 90) {
    return { label: "Bon", color: "success" };
  }
  return { label: "Excellent", color: "primary" };
}
