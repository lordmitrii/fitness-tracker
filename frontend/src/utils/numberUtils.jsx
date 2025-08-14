const toNumberOrEmpty = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
};

export { toNumberOrEmpty };
