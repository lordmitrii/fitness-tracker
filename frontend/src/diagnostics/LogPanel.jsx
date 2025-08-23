import { useState, useEffect, useMemo } from "react";
import { logStore } from "./LogStore";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export default function LogPanel({ onClose }) {
  const { t } = useTranslation();
  const { hasAnyRole } = useAuth();

  const allowed = useMemo(
    () => (hasAnyRole ? hasAnyRole(["tester", "admin"]) : false),
    [hasAnyRole]
  );

  useEffect(() => {
    if (!allowed) onClose?.();
  }, [allowed, onClose]);

  if (!allowed) return null;

  const [, setTick] = useState(0);
  useEffect(() => logStore.subscribe(() => setTick((t) => t + 1)), []);
  const logs = logStore.list();

  const buildLogsText = () =>
    JSON.stringify({ ua: navigator.userAgent, logs: logStore.list() }, null, 2);

  const download = () => {
    const blob = new Blob([buildLogsText()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const makeTextFile = () =>
    new File([buildLogsText()], `logs-${new Date().toISOString()}.txt`, {
      type: "text/plain",
    });

  const supportsFileShare = () => {
    if (!("share" in navigator) || !("canShare" in navigator)) return false;
    try {
      const probe = new File(["probe"], "probe.txt", { type: "text/plain" });
      return navigator.canShare({ files: [probe] });
    } catch {
      return false;
    }
  };

  const share = async () => {
    const text = buildLogsText();

    if (supportsFileShare()) {
      try {
        await navigator.share({
          title: "App logs",
          text: "Diagnostics bundle",
          files: [makeTextFile()],
        });
        return;
      } catch {}
    }

    if ("share" in navigator) {
      try {
        await navigator.share({ title: "App logs", text });
        return;
      } catch {}
    }
    download();
  };

  const levelClass = (level) =>
    level === "error"
      ? "text-red-600"
      : level === "warn"
      ? "text-yellow-600"
      : level === "info"
      ? "text-blue-600"
      : "text-gray-500";

  return (
    <div
      className="
        fixed inset-x-0 bottom-0 h-[65dvh]
        backdrop-blur
        rounded-t-2xl shadow-2xl border-t border-gray-500
        flex flex-col z-[9999]
        font-mono text-xs
        pb-[env(safe-area-inset-bottom)]
      "
      style={{ background: "rgba(255, 255, 255, 0.95)" }}
    >
      <div className="px-3 py-2 border-b border-gray-500 flex items-center gap-2 touch-none">
        <strong className="font-sans">{t("general.diagnostics")}</strong>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => logStore.clear()} className="underline">
            {t("general.clear")}
          </button>
          <button onClick={download} className="underline">
            {t("general.download")}
          </button>
          <button onClick={share} className="underline">
            {t("general.share")}
          </button>
          <button onClick={onClose} className="underline">
            {t("general.close")}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 select-auto">
        {logs.map((l, i) => (
          <div key={i} className="mb-2">
            <span className="opacity-60 mr-2">
              {new Date(l.ts || Date.now()).toLocaleTimeString()}
            </span>
            <span className={`font-bold ${levelClass(l.level)}`}>
              [{String(l.level || "").toUpperCase()}]
            </span>{" "}
            <span>
              {typeof l.msg === "string" ? l.msg : JSON.stringify(l.msg)}
            </span>
            {l.meta ? (
              <details className="opacity-80">
                <summary>details</summary>
                <pre className="whitespace-pre-wrap m-0">
                  {JSON.stringify(l.meta, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
