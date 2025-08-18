export const toNumberOrEmpty = (v) => {
  if (v === "" || v === "-" || v === "." || v === "-.") return "";
  if (typeof v === "string" && v.trim() === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
};

export const toNullIfEmpty = (v) => (v === "" || v == null ? null : v);
