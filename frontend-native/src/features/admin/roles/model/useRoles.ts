import { useState, useEffect, useCallback } from "react";
import api from "@/src/shared/api";
import { useHapticFeedback } from "@/src/shared/hooks/interaction";

export interface Role {
  id: number;
  name: string;
}

export function useRoles() {
  const haptics = useHapticFeedback();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/roles");
      setRoles(res.data || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.triggerLight();
    try {
      await loadRoles();
      haptics.triggerSuccess();
    } catch (err) {
      haptics.triggerError();
      console.error("Error refreshing roles:", err);
    } finally {
      setRefreshing(false);
    }
  }, [loadRoles, haptics]);

  return {
    roles,
    loading,
    error,
    refreshing,
    loadRoles,
    handleRefresh,
  };
}

