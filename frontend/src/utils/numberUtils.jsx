import { G_PER_KG, G_PER_LB, MM_PER_FT, MM_PER_CM } from "../config/constants";

const pow10 = (p) => Math.pow(10, p);
const roundDown = (x, p) => Math.floor(x * pow10(p)) / pow10(p);
const roundUp = (x, p) => Math.ceil(x * pow10(p)) / pow10(p);


export const toNullIfEmpty = (v) =>
  v === "" || v === undefined || v === null ? null : v;

export const toDisplayWeight = (weight_g, system = "metric", precision = 1) => {
  if (weight_g === "" || weight_g === null || weight_g === undefined) return "";
  const v = system === "metric" ? weight_g / G_PER_KG : weight_g / G_PER_LB;
  return Number(v.toFixed(precision));
};

export const toDisplayHeight = (
  height_mm,
  system = "metric",
  precision = 1
) => {
  if (height_mm === "" || height_mm === null || height_mm === undefined)
    return "";
  const v = system === "metric" ? height_mm / MM_PER_CM : height_mm / MM_PER_FT;
  return Number(v.toFixed(precision));
};

export const fromDisplayWeight = (displayValue, system = "metric") => {
  if (
    displayValue === "" ||
    displayValue === null ||
    displayValue === undefined
  )
    return "";
  const g =
    system === "metric" ? displayValue * G_PER_KG : displayValue * G_PER_LB;
  return Math.round(g);
};

export const fromDisplayHeight = (displayValue, system = "metric") => {
  if (
    displayValue === "" ||
    displayValue === null ||
    displayValue === undefined
  )
    return "";
  const mm =
    system === "metric" ? displayValue * MM_PER_CM : displayValue * MM_PER_FT;
  return Math.round(mm);
};

export const displayWeightMin = (
  baseMinG,
  system = "metric",
  precision = 1
) => {
  const v = system === "metric" ? baseMinG / G_PER_KG : baseMinG / G_PER_LB;
  return Number.isInteger(v) ? v : roundDown(v, precision);
};

export const displayWeightMax = (
  baseMaxG,
  system = "metric",
  precision = 1
) => {
  const v = system === "metric" ? baseMaxG / G_PER_KG : baseMaxG / G_PER_LB;
  return Number.isInteger(v) ? v : roundUp(v, precision);
};

export const displayHeightMin = (
  baseMinMM,
  system = "metric",
  precision = 1
) => {
  const v = system === "metric" ? baseMinMM / MM_PER_CM : baseMinMM / MM_PER_FT;
  return Number.isInteger(v) ? v : roundDown(v, precision);
};

export const displayHeightMax = (
  baseMaxMM,
  system = "metric",
  precision = 1
) => {
  const v = system === "metric" ? baseMaxMM / MM_PER_CM : baseMaxMM / MM_PER_FT;
  return Number.isInteger(v) ? v : roundUp(v, precision);
};

export const DECIMAL_INPUT_RE = /^-?\d*(?:[.,]\d*)?$/;
export const INTEGER_INPUT_RE = /^-?\d*$/;

export const toNumOrNull = (s) => {
  if (s == null) return null;
  const trimmed = s.trim();
  if (
    trimmed === "" ||
    trimmed === "." ||
    trimmed === "," ||
    trimmed === "-" ||
    trimmed === "-." ||
    trimmed === "-,"
  )
    return null;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
