import { useState, useMemo, useCallback } from "react";
import { router } from "expo-router";
import api from "@/src/shared/api";
import { useTranslation } from "react-i18next";
import { useCooldown } from "@/src/shared/hooks/interaction";
import { useAuth } from "@/src/shared/lib/context/AuthContext";
import { useStorageObject } from "@/src/shared/hooks";

export function useAccountVerification(isRegistering: boolean) {
  const { t, i18n } = useTranslation();
  const { user, refresh } = useAuth();
  const { cooldown, start: startCooldown } = useCooldown("cooldown:account-verification");
  const [email, setEmail] = useState(user?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [codeValue, setCodeValue] = useState("");
  const [persisted, setPersisted] = useStorageObject("accountVerification:state", {
    showInputField: false,
  });
  const [pending, setPending] = useState(false);

  const emailModified = useMemo(() => user?.email !== email, [user?.email, email]);
  const showInputField = persisted.showInputField;

  const validateEmail = useCallback((emailToValidate: string): string | null => {
    if (!emailToValidate) {
      return t("account_verification.email_required");
    } else if (!/\S+@\S+\.\S+/.test(emailToValidate)) {
      return t("account_verification.email_invalid");
    } else if (emailToValidate.length > 255) {
      return t("account_verification.email_too_long", { limit: 255 });
    }
    return null;
  }, [t]);

  const handleSave = useCallback(async () => {
    if (pending) return;
    setError(null);
    setSuccessMessage(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setPending(true);
    setPersisted((prev) => ({ ...prev, showInputField: false }));
    try {
      await api.patch("users/accounts", { email });
      setEmail(email);
      if (user) {
        user.email = email;
      }
    } catch (error) {
      console.error("Error updating verification email:", error);
      setSuccessMessage(null);
      setError(t("account_verification.error_updating_email"));
    } finally {
      setPending(false);
    }
  }, [email, pending, validateEmail, setPersisted, user, t]);

  const handleSend = useCallback(async () => {
    if (pending) return;
    setError(null);
    setSuccessMessage(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setPending(true);

    try {
      const response = await api.post("/email/send-account-verification", {
        to: email,
        language: i18n.language,
      });

      if (response.status === 200) {
        setError(null);
        setSuccessMessage(t("account_verification.code_sent"));
        setPersisted((prev) => ({ ...prev, showInputField: true }));
        startCooldown(60);
      } else {
        throw new Error(t("account_verification.error_sending_email"));
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      setError(t("account_verification.error_sending_email"));
    } finally {
      setPending(false);
    }
  }, [email, pending, validateEmail, i18n.language, setPersisted, startCooldown, t]);

  const handleVerify = useCallback(async () => {
    if (pending || !codeValue) return;
    setPending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await api.post("/email/verify-account", {
        token: codeValue,
      });
      if (response.status === 200) {
        await refresh();
        setSuccessMessage(t("account_verification.verification_success"));
        setPersisted((prev) => ({ ...prev, showInputField: false }));

        if (isRegistering) {
          router.replace("/(auth)/login");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        throw new Error(t("account_verification.error_verifying"));
      }
    } catch (error) {
      console.error("Error verifying the code:", error);
      setError(t("account_verification.error_verifying"));
    } finally {
      setPending(false);
    }
  }, [codeValue, pending, refresh, setPersisted, isRegistering, t]);

  const handleEmailChange = useCallback((value: string) => {
    setPersisted((prev) => ({ ...prev, showInputField: false }));
    setEmail(value);
  }, [setPersisted]);

  return {
    email,
    codeValue,
    error,
    successMessage,
    cooldown,
    pending,
    emailModified,
    showInputField,
    setCodeValue,
    handleEmailChange,
    handleSave,
    handleSend,
    handleVerify,
  };
}

