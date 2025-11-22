import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export function useResetPasswordValidation() {
  const { t } = useTranslation();

  const validatePasswords = useCallback((password: string, confirmPassword: string): string | null => {
    if (password !== confirmPassword) {
      return t("reset_password.passwords_mismatch");
    }

    if (password.length < 8) {
      return t("reset_password.password_min_length", { minLength: 8 });
    } else if (password.length > 128) {
      return t("reset_password.password_too_long", { limit: 128 });
    }

    return null;
  }, [t]);

  return { validatePasswords };
}

