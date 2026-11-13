export type ScoreCriterionKey =
  | "skills"
  | "title"
  | "contract"
  | "remote"
  | "salary"
  | "location";

export type CriterionStatus = "matched" | "partial" | "mismatch" | "neutral";

export interface CriterionBreakdown {
  key: ScoreCriterionKey;
  weight: number;
  score: number | null;
  status: CriterionStatus;
  detail: string;
}

export interface ScoreBreakdown {
  isEmptyProfile: boolean;
  matchedSkills: string[];
  missingSkills: string[];
  criteria: CriterionBreakdown[];
}

export interface ScoreResult {
  score: number | null;
  breakdown: ScoreBreakdown;
}
