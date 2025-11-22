import { useState, useCallback } from "react";
import { router } from "expo-router";
import { useAuth } from "@/src/shared/lib/context/AuthContext";
import { useVersionsData } from "@/src/shared/api/versions";
import { useRegisterValidation } from "./useRegisterValidation";

export function useRegisterForm() {
  const { login, register, isRefreshing, loading } = useAuth();
  const { getVersion } = useVersionsData({ skipQuery: false });
  const { validateForm } = useRegisterValidation();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [healthDataConsent, setHealthDataConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleSubmit = useCallback(async () => {
    setError(null);
    setFormErrors({});

    const errors = validateForm({
      email,
      username,
      password,
      privacyConsent,
      healthDataConsent,
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const healthDataConsentVersion = getVersion("healthDataPolicy");
    const privacyConsentVersion = getVersion("privacyPolicy");

    const resp = await register(
      username,
      email,
      password,
      privacyConsent,
      privacyConsentVersion,
      healthDataConsent,
      healthDataConsentVersion
    );

    if (!resp?.message) {
      const loginResp = await login(username, password);
      if (!loginResp?.message) {
        router.replace("/(auth)/account-verification?registering=true");
      } else {
        router.replace("/(auth)/login");
      }
    } else {
      setError(resp.message);
    }
  }, [email, username, password, privacyConsent, healthDataConsent, validateForm, register, login, getVersion]);

  const clearFieldError = useCallback((field: string) => {
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    email,
    username,
    password,
    privacyConsent,
    healthDataConsent,
    error,
    formErrors,
    isSubmitting: isRefreshing || loading,
    setEmail,
    setUsername,
    setPassword,
    setPrivacyConsent,
    setHealthDataConsent,
    handleSubmit,
    clearFieldError,
  };
}

