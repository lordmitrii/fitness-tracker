import { useTranslation } from "react-i18next";

export function validateWorkoutPlanName(
  name: string,
  t: (key: string, options?: any) => string
): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!name.trim()) {
    errors.name = t("update_workout_plan_form.plan_name_required") || "Plan name is required";
  } else if (name.length > 50) {
    errors.name = t("update_workout_plan_form.plan_name_too_long", { limit: 50 }) || "Plan name too long";
  }
  
  return errors;
}

