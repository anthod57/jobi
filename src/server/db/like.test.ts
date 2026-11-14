import { describe, expect, it } from "vitest";

import { escapeLikePattern } from "./like";

describe("escapeLikePattern", () => {
  it("escapes %, _, and backslash characters for ILIKE queries", () => {
    expect(escapeLikePattern("100%")).toBe("100\\%");
    expect(escapeLikePattern("foo_bar")).toBe("foo\\_bar");
    expect(escapeLikePattern("a\\b%c_d")).toBe("a\\\\b\\%c\\_d");
    expect(escapeLikePattern("TypeScript")).toBe("TypeScript");
  });
});
