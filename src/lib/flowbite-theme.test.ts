import { describe, expect, it } from "vitest";

import { flowbiteTheme } from "./flowbite-theme";

describe("flowbiteTheme", () => {
  it("exposes semantic button, alert, and badge color keys", () => {
    expect(flowbiteTheme.button?.color?.primary).toBeTruthy();
    expect(flowbiteTheme.alert?.color?.failure).toBeTruthy();
    expect(flowbiteTheme.badge?.root?.color?.success).toBeTruthy();
  });
});
