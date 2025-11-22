import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import api from "@/src/shared/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { useResetPasswordValidation } from "./useResetPasswordValidation";

export function useResetPassword(token?: string) {
  const { t } = useTranslation();
  const { validatePasswords } = useResetPasswordValidation();
  const [linkValid, setLinkValid] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);
      setError(null);

      if (!token) {
        setLinkValid(false);
        setLoading(false);
        return;
      }

      try {
        const response = await api.post("/email/validate-token", {
          token,
          token_type: "reset_password",
        });

        if (response.status !== 200) {
          setLinkValid(false);
          return;
        }

        setLinkValid(true);
      } catch (error) {
        setLinkValid(false);
        console.error("Error verifying token:", error);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = useCallback(async () => {
    const validationError = validatePasswords(password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const response = await api.post("/email/reset-password", {
        token,
        new_password: password,
      });

      if (response.status === 200) {
        await AsyncStorage.setItem("hasLoaded", "1");
        router.replace("/(auth)/login");
      } else {
        setError(t("reset_password.reset_failed"));
        console.error("Password reset failed:", response.data);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setError(t("reset_password.reset_failed"));
    }
  }, [password, confirmPassword, token, validatePasswords, t]);

  return {
    linkValid,
    password,
    confirmPassword,
    loading,
    error,
    setPassword,
    setConfirmPassword,
    handleSubmit,
  };
}

