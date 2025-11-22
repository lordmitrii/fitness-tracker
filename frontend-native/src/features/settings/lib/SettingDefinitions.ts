import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function useSettingDefinitions() {
  const { t } = useTranslation();

  const SETTING_DEFS = useMemo(
    () => ({
      unit_system: {
        type: "select" as const,
        title: t("settings.unit_system.title"),
        description: t("settings.unit_system.hint"),
        options: [
          { value: "metric", label: t("settings.unit_system.metric") },
          { value: "imperial", label: t("settings.unit_system.imperial") },
        ],
      },
      beta_opt_in: {
        type: "switch" as const,
        title: t("settings.beta_opt_in.title"),
        description: t("settings.beta_opt_in.hint"),
        toBool: (v: any) => Boolean(v),
        fromBool: (b: boolean) => Boolean(b),
      },
      email_notifications: {
        type: "switch" as const,
        title: t("settings.email_notifications.title"),
        description: t("settings.email_notifications.hint"),
        toBool: (v: any) => Boolean(v),
        fromBool: (b: boolean) => Boolean(b),
      },
      calculate_calories: {
        type: "switch" as const,
        title: t("settings.calculate_calories.title"),
        description: t("settings.calculate_calories.hint"),
        toBool: (v: any) => Boolean(v),
        fromBool: (b: boolean) => Boolean(b),
      },
    }),
    [t]
  );

  return { SETTING_DEFS };
}

