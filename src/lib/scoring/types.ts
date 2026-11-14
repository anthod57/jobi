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

export interface ScoredOfferSource {
  source: "france_travail" | "adzuna";
  url: string;
}

export interface ScoredOfferItem {
  id: number;
  title: string;
  company: string;
  locationLabel: string;
  department: string | null;
  contractType:
    | "cdi"
    | "cdd"
    | "alternance"
    | "freelance"
    | "interim"
    | "stage"
    | null;
  remoteMode: "onsite" | "hybrid" | "remote" | "flexible" | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryText: string | null;
  publishedAt: Date | null;
  lastSeenAt: Date;
  score: number | null;
  breakdown: ScoreBreakdown | null;
  sources: ScoredOfferSource[];
}

export interface ScoredOfferDetail extends ScoredOfferItem {
  description: string;
  computedAt: Date | null;
}

export interface ListScoredOffersResult {
  items: ScoredOfferItem[];
  total: number;
  page: number;
  pageSize: number;
}
