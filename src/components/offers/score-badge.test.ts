import { describe, expect, it } from "vitest";
import { getScoreBadgeProps } from "./score-badge";

describe("getScoreBadgeProps", () => {
  it("returns info 'Profil requis' when score is null", () => {
    expect(getScoreBadgeProps(null)).toEqual({
      color: "info",
      label: "Profil requis",
    });
  });

  it("returns success when score is >= 75", () => {
    expect(getScoreBadgeProps(75)).toEqual({ color: "success", label: "75 %" });
    expect(getScoreBadgeProps(92)).toEqual({ color: "success", label: "92 %" });
    expect(getScoreBadgeProps(100)).toEqual({
      color: "success",
      label: "100 %",
    });
  });

  it("returns warning when score is >= 50 and < 75", () => {
    expect(getScoreBadgeProps(50)).toEqual({ color: "warning", label: "50 %" });
    expect(getScoreBadgeProps(64)).toEqual({ color: "warning", label: "64 %" });
    expect(getScoreBadgeProps(74)).toEqual({ color: "warning", label: "74 %" });
  });

  it("returns gray when score is < 50", () => {
    expect(getScoreBadgeProps(0)).toEqual({ color: "gray", label: "0 %" });
    expect(getScoreBadgeProps(32)).toEqual({ color: "gray", label: "32 %" });
    expect(getScoreBadgeProps(49)).toEqual({ color: "gray", label: "49 %" });
  });
});
