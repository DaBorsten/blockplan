import { describe, test, expect } from "bun:test";
import { resolveGroupIds } from "./groups";

describe("resolveGroupIds", () => {
  test("sollte Gruppe 1 zu allen Gruppen [1,2,3] auflösen", () => {
    expect(resolveGroupIds(1)).toEqual([1, 2, 3]);
  });

  test("sollte Gruppe 2 zu [1,2] auflösen", () => {
    expect(resolveGroupIds(2)).toEqual([1, 2]);
  });

  test("sollte Gruppe 3 zu [1,3] auflösen", () => {
    expect(resolveGroupIds(3)).toEqual([1, 3]);
  });

  test("sollte andere Gruppennummern unverändert als Array zurückgeben", () => {
    expect(resolveGroupIds(4)).toEqual([4]);
    expect(resolveGroupIds(5)).toEqual([5]);
    expect(resolveGroupIds(10)).toEqual([10]);
    expect(resolveGroupIds(0)).toEqual([0]);
  });

  test("sollte negative Zahlen behandeln", () => {
    expect(resolveGroupIds(-1)).toEqual([-1]);
  });

  test("sollte ungültige Eingaben (NaN, undefined, null) behandeln", () => {
    // NaN wird als number betrachtet und im default-Fall zurückgegeben
    expect(resolveGroupIds(NaN)).toEqual([NaN]);
    
    // undefined und null werden zu number gecastet und zurückgegeben
    // TypeScript würde diese normalerweise nicht erlauben, aber zur Laufzeit möglich
    expect(resolveGroupIds(undefined as unknown as number)).toEqual([undefined] as unknown as number[]);
    expect(resolveGroupIds(null as unknown as number)).toEqual([null] as unknown as number[]);
  });
});
