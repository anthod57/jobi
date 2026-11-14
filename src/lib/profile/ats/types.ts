import type { CvLayoutMeta, StructuredCv } from "../cv-sections";

export type AtsSeverity = "error" | "warning" | "info";
export type AtsCategory =
  | "contact"
  | "structure"
  | "keywords"
  | "format"
  | "content"
  | "dates";

export type AtsFinding = {
  code: string;
  severity: AtsSeverity;
  category: AtsCategory;
  message: string;
  pointsDeducted: number;
};

export type AtsResult = {
  score: number;
  findings: AtsFinding[];
};

export type AtsContext = {
  profileSkills: string[];
  profileEmail: string;
  profilePhone: string;
  structured?: StructuredCv;
  layout?: CvLayoutMeta;
};

export type AtsRule = (text: string, ctx: AtsContext) => AtsFinding[];
