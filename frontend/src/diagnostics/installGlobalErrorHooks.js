export function installGlobalErrorHooks(push) {
  window.addEventListener("error", (ev) => {
    push({
      level: "error",
      msg: ev.message,
      meta: {
        filename: ev.filename,
        lineno: ev.lineno,
        colno: ev.colno,
        stack: ev.error && ev.error.stack,
      },
    });
  });
  window.addEventListener("unhandledrejection", (ev) => {
    push({
      level: "error",
      msg: String(ev.reason),
      meta: { reason: ev.reason },
    });
  });
}
