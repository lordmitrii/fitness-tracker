import { useState, useCallback } from "react";
import { router } from "expo-router";
import { useAuth } from "@/src/shared/lib/context/AuthContext";

export function useLoginForm() {
  const { login, isRefreshing, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setError(null);
    try {
      const resp = await login(username, password);
      if (!resp?.message) {
        router.replace("/(tabs)");
      } else {
        setError(resp.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [username, password, login]);

  return {
    username,
    password,
    error,
    isSubmitting: isRefreshing || loading,
    setUsername,
    setPassword,
    handleSubmit,
  };
}

