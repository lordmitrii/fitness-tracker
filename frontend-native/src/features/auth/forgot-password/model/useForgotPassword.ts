import { useState, useCallback } from "react";
import api from "@/src/shared/api";
import { useTranslation } from "react-i18next";
import { useCooldown } from "@/src/shared/hooks/interaction";

export function useForgotPassword() {
  const { t, i18n } = useTranslation();
  const { cooldown, start: startCooldown } = useCooldown("cooldown:forgot-password");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setSuccess(false);

    if (!email) {
      setSuccess(false);
      setError(t("forgot_password.email_invalid"));
      return;
    }

    try {
      const response = await api.post("/email/send-reset-password", {
        to: email,
        language: i18n.language,
      });

      if (response.status === 200) {
        setError(null);
        setSuccess(true);
        startCooldown(60);
      } else {
        throw new Error(t("forgot_password.error_sending_email"));
      }
    } catch (error) {
      console.error("Error sending reset password email:", error);
      setSuccess(false);
      setError(t("forgot_password.error_sending_email"));
    }
  }, [email, t, i18n.language, startCooldown]);

  return {
    email,
    error,
    success,
    cooldown,
    setEmail,
    handleSubmit,
  };
}

