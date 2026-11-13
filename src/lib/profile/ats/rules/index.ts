import type { AtsRule } from "../types";
import { contactRules } from "./contact";
import { contentRules } from "./content";
import { dateRules } from "./dates";
import { formatRules } from "./format";
import { keywordRules } from "./keywords";
import { structureRules } from "./structure";

export const allAtsRules: AtsRule[] = [
  ...contactRules,
  ...contentRules,
  ...structureRules,
  ...keywordRules,
  ...dateRules,
  ...formatRules,
];
