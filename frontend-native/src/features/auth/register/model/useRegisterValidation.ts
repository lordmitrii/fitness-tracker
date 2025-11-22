import { useCallback } from "react";
import { useTranslation } from "react-i18next";

interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  privacyConsent: boolean;
  healthDataConsent: boolean;
}

export function useRegisterValidation() {
  const { t } = useTranslation();

  const validateForm = useCallback((formData: RegisterFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = t("register_form.email_required");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t("register_form.email_invalid");
    } else if (formData.email.length > 255) {
      errors.email = t("register_form.email_too_long", { limit: 255 });
    }

    if (!formData.username) {
      errors.username = t("register_form.username_required");
    } else if (formData.username.length < 6) {
      errors.username = t("register_form.username_min_length", { minLength: 6 });
    } else if (formData.username.length > 50) {
      errors.username = t("register_form.username_too_long", { limit: 50 });
    }

    if (!formData.password) {
      errors.password = t("register_form.password_required");
    } else if (formData.password.length < 8) {
      errors.password = t("register_form.password_min_length", { minLength: 8 });
    } else if (formData.password.length > 128) {
      errors.password = t("register_form.password_too_long", { limit: 128 });
    }

    if (!formData.privacyConsent) {
      errors.privacyConsent = t("register_form.privacy_policy_consent_missing");
    }

    if (!formData.healthDataConsent) {
      errors.healthDataConsent = t("register_form.health_data_consent_missing");
    }

    return errors;
  }, [t]);

  return { validateForm };
}

