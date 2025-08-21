import { useTranslation } from "react-i18next";

const Chevron = ({ rotation = 0 }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    style={{ transform: `rotate(${rotation}deg)` }}
    className="transition-transform duration-200"
  >
    <path
      d="M6 9l6 6 6-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Spinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" className="animate-spin">
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      opacity="0.25"
    />
    <path
      d="M21 12a9 9 0 0 1-9 9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default function PullToRefreshPill({
  progress,
  status,
  className = "",
}) {
  const { t } = useTranslation();
  const armed = status === "ready";
  const refreshing = status === "refreshing";

  const p = Math.max(0, Math.min(1, progress));
  const eased = 1 - Math.pow(1 - p, 2);
  const scale = 0.94 + 0.06 * eased;
  const opacity = 0 + 0.95 * eased;
  const chevronRotation = armed ? 180 : 0;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-40 ${className}`}
      style={{
        transform: `translateY(10px) scale(${scale})`,
        opacity,
        transition: refreshing
          ? "none"
          : "transform 360ms cubic-bezier(.22,1,.36,1), opacity 280ms ease",
      }}
    >
      <div className="mx-auto w-fit">
        <div
          className="
        inline-flex items-center gap-2 px-3 py-1.5
        rounded-full shadow-lg ring-1 ring-black/10
        bg-white/70 backdrop-blur
        text-caption
      "
        >
          <div className="h-4 w-4 flex items-center justify-center">
            {refreshing ? <Spinner /> : <Chevron rotation={chevronRotation} />}
          </div>
          <span className="whitespace-nowrap">
            {refreshing
              ? t("general.refreshing")
              : armed
              ? t("general.release_to_refresh")
              : t("general.pull_to_refresh")}
          </span>
        </div>
      </div>
    </div>
  );
}
