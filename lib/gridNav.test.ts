import { describe, expect, it } from "vitest";
import { nextGridIndex } from "./gridNav";

describe("grid keyboard navigation", () => {
  it("moves left and right without leaving the row", () => {
    const columns = 4;
    expect(nextGridIndex(1, "ArrowLeft", 12, columns)).toBe(0);
    expect(nextGridIndex(0, "ArrowLeft", 12, columns)).toBeNull();
    expect(nextGridIndex(2, "ArrowRight", 12, columns)).toBe(3);
    expect(nextGridIndex(3, "ArrowRight", 12, columns)).toBeNull();
  });

  it("moves by a full row up and down", () => {
    const columns = 4;
    expect(nextGridIndex(5, "ArrowUp", 12, columns)).toBe(1);
    expect(nextGridIndex(1, "ArrowUp", 12, columns)).toBeNull();
    expect(nextGridIndex(5, "ArrowDown", 12, columns)).toBe(9);
    expect(nextGridIndex(9, "ArrowDown", 12, columns)).toBeNull();
  });

  it("does not jump to the next row across the last column", () => {
    expect(nextGridIndex(3, "ArrowRight", 12, 4)).toBeNull();
    expect(nextGridIndex(7, "ArrowRight", 12, 4)).toBeNull();
  });

  it("handles Home and End", () => {
    expect(nextGridIndex(7, "Home", 12, 4)).toBe(0);
    expect(nextGridIndex(7, "End", 12, 4)).toBe(11);
  });

  it("treats a row as one line", () => {
    expect(nextGridIndex(2, "ArrowRight", 5, 5)).toBe(3);
    expect(nextGridIndex(4, "ArrowRight", 5, 5)).toBeNull();
    expect(nextGridIndex(2, "ArrowUp", 5, 5)).toBeNull();
    expect(nextGridIndex(2, "ArrowDown", 5, 5)).toBeNull();
  });

  it("ignores unrelated keys and empty grids", () => {
    expect(nextGridIndex(1, "Enter", 12, 4)).toBeNull();
    expect(nextGridIndex(1, "ArrowRight", 0, 4)).toBeNull();
    expect(nextGridIndex(-1, "ArrowRight", 12, 4)).toBeNull();
  });
});
