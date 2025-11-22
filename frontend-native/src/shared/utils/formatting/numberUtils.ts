import { G_PER_KG, G_PER_LB, MM_PER_FT, MM_PER_CM } from "@/src/shared/config/constants/fitness";

export type UnitSystem = "metric" | "imperial";

const pow10 = (p: number) => Math.pow(10, p);

const roundDown = (x: number, p: number) => Math.floor(x * pow10(p)) / pow10(p);

const roundUp = (x: number, p: number) => Math.ceil(x * pow10(p)) / pow10(p);

export const toNullIfEmpty = <T>(v: T | "" | null | undefined): T | null => {
  return v === "" || v === undefined || v === null ? null : v;
};

export const toDisplayWeight = (
  weight_g: number | "" | null | undefined,
  system: UnitSystem = "metric",
  precision = 1
): number | "" => {
  if (weight_g === "" || weight_g === null || weight_g === undefined) return "";
  const v = system === "metric" ? weight_g / G_PER_KG : weight_g / G_PER_LB;
  return Number(v.toFixed(precision));
};

export const toDisplayHeight = (
  height_mm: number | "" | null | undefined,
  system: UnitSystem = "metric",
  precision = 1
): number | "" => {
  if (height_mm === "" || height_mm === null || height_mm === undefined)
    return "";
  const v = system === "metric" ? height_mm / MM_PER_CM : height_mm / MM_PER_FT;
  return Number(v.toFixed(precision));
};

export const fromDisplayWeight = (
  displayValue: number | "" | null | undefined,
  system: UnitSystem = "metric"
): number | "" => {
  if (
    displayValue === "" ||
    displayValue === null ||
    displayValue === undefined
  ) {
    return "";
  }
  const v = Number(displayValue);
  const g = system === "metric" ? v * G_PER_KG : v * G_PER_LB;
  return Math.round(g);
};

export const fromDisplayHeight = (
  displayValue: number | "" | null | undefined,
  system: UnitSystem = "metric"
): number | "" => {
  if (
    displayValue === "" ||
    displayValue === null ||
    displayValue === undefined
  ) {
    return "";
  }
  const v = Number(displayValue);
  const mm = system === "metric" ? v * MM_PER_CM : v * MM_PER_FT;
  return Math.round(mm);
};

export const displayWeightMin = (
  baseMinG: number,
  system: UnitSystem = "metric",
  precision = 1
): number => {
  const v = system === "metric" ? baseMinG / G_PER_KG : baseMinG / G_PER_LB;
  return Number.isInteger(v) ? v : roundDown(v, precision);
};

export const displayWeightMax = (
  baseMaxG: number,
  system: UnitSystem = "metric",
  precision = 1
): number => {
  const v = system === "metric" ? baseMaxG / G_PER_KG : baseMaxG / G_PER_LB;
  return Number.isInteger(v) ? v : roundUp(v, precision);
};

export const displayHeightMin = (
  baseMinMM: number,
  system: UnitSystem = "metric",
  precision = 1
): number => {
  const v = system === "metric" ? baseMinMM / MM_PER_CM : baseMinMM / MM_PER_FT;
  return Number.isInteger(v) ? v : roundDown(v, precision);
};

export const displayHeightMax = (
  baseMaxMM: number,
  system: UnitSystem = "metric",
  precision = 1
): number => {
  const v = system === "metric" ? baseMaxMM / MM_PER_CM : baseMaxMM / MM_PER_FT;
  return Number.isInteger(v) ? v : roundUp(v, precision);
};

export const DECIMAL_INPUT_RE: RegExp = /^-?\d*(?:[.,]\d*)?$/;
export const INTEGER_INPUT_RE: RegExp = /^-?\d*$/;

export const toNumOrNull = (s: string | null | undefined): number | null => {
  if (s == null) return null;
  const trimmed = s.trim();
  if (
    trimmed === "" ||
    trimmed === "." ||
    trimmed === "," ||
    trimmed === "-" ||
    trimmed === "-." ||
    trimmed === "-,"
  ) {
    return null;
  }
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

