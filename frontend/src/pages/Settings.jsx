import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LayoutHeader } from "../layout/LayoutHeader";
import DropdownSelect from "../components/DropdownSelect";
import useSettingsData from "../hooks/data/useSettingsData";
import LoadingState from "../states/LoadingState";
import ErrorState from "../states/ErrorState";
import { useCallback } from "react";
import { usePullToRefreshOverride } from "../context/PullToRefreshContext";

function Switch({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={[
        "relative inline-flex h-8 w-20 items-center rounded-full transition duration-400 shadow-md",
        checked ? "bg-blue-600" : "bg-gray-300",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-7 w-7 transform rounded-full bg-white dark:bg-gray-100 shadow transition duration-400",
          checked ? "translate-x-12" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

const Settings = () => {
  const { t } = useTranslation();
  const { settings, loading, error, updateSetting, savingKey, refetch } =
    useSettingsData();
  
  usePullToRefreshOverride(
    useCallback(async () => {
      await refetch();
    }, [refetch])
  );

  const SETTING_DEFS = useMemo(
    () => ({
      unit_system: {
        type: "select",
        title: t("settings.unit_system.title"),
        description: t("settings.unit_system.hint"),
        options: [
          { value: "metric", label: t("settings.unit_system.metric") },
          { value: "imperial", label: t("settings.unit_system.imperial") },
        ],
      },
      beta_opt_in: {
        type: "switch",
        title: t("settings.beta_opt_in.title"),
        description: t("settings.beta_opt_in.hint"),
        toBool: (v) => Boolean(v),
        fromBool: (b) => Boolean(b),
      },
      email_notifications: {
        type: "switch",
        title: t("settings.email_notifications.title"),
        description: t("settings.email_notifications.hint"),
        toBool: (v) => Boolean(v),
        fromBool: (b) => Boolean(b),
      },
    }),
    [t]
  );

  if (loading) return <LoadingState message={t("settings.loading")} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <>
      <LayoutHeader>
        <h1 className="text-title font-bold px-4">{t("settings.title")}</h1>
      </LayoutHeader>

      <div className="">
        {Object.entries(SETTING_DEFS).map(([key, def]) => {
          const value = settings?.[key];

          if (def.type === "select") {
            return (
              <div key={key} className="card">
                <div className="flex flex-col items-start justify-between gap-2">
                  <h2 className="text-body font-semibold">{def.title}</h2>
                  {def.description && (
                    <p className="text-caption mt-1">{def.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <DropdownSelect
                      value={value ?? def.options[0].value}
                      onChange={(next) => updateSetting(key, next)}
                      options={def.options}
                      disabled={savingKey === key}
                      widthClass="w-60 sm:w-70"
                    />
                  </div>
                </div>
              </div>
            );
          }

          if (def.type === "switch") {
            const checked = def.toBool ? def.toBool(value) : Boolean(value);
            return (
              <div key={key} className="card">
                <div className="flex flex-col items-start justify-between gap-2">
                  <h2 className="text-body font-semibold">{def.title}</h2>
                  {def.description && (
                    <p className="text-caption mt-1">{def.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={checked}
                      onChange={(next) =>
                        updateSetting(
                          key,
                          def.fromBool ? def.fromBool(next) : next
                        )
                      }
                      disabled={savingKey === key}
                    />
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}

        {/* other settings that are not in SETTING_DEFS */}
        {/* {settings &&
          Object.entries(settings)
            .filter(([key]) => !SETTING_DEFS[key])
            .map(([key, value]) => (
              <div key={key} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-body font-semibold capitalize">
                      {t(`settings.${key}`)}
                    </h2>
                    <p className="text-caption break-words">{String(value)}</p>
                  </div>
                </div>
              </div>
            ))} */}
      </div>
    </>
  );
};

export default Settings;
