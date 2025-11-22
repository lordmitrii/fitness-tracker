import { useState, useEffect, useCallback } from "react";
import api from "@/src/shared/api";

interface User {
  id: string | number;
  roles?: Array<{ name: string }>;
}

interface UseRoleAssignmentParams {
  onSuccess?: () => void;
}

export function useRoleAssignment({ onSuccess }: UseRoleAssignmentParams = {}) {
  const [allRoles, setAllRoles] = useState<any[]>([]);
  const [selectedRoleNames, setSelectedRoleNames] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/admin/roles")
      .then((res) => !cancelled && setAllRoles(res.data || []))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const editUserRoles = useCallback((user: User) => {
    setSelectedRoleNames(user.roles?.map((r) => r.name) || []);
  }, []);

  const toggleRole = useCallback((roleName: string) => {
    setSelectedRoleNames((prev) => {
      if (prev.includes(roleName)) {
        return prev.filter((name) => name !== roleName);
      }
      return [...prev, roleName];
    });
  }, []);

  const saveRoles = useCallback(
    async (userId: string | number) => {
      setSavingRoles(true);
      try {
        await api.post(`/admin/users/${userId}/roles`, {
          role_names: selectedRoleNames,
        });
        setSelectedRoleNames([]);
        onSuccess?.();
      } catch (err) {
        console.error("Error saving roles:", err);
        throw err;
      } finally {
        setSavingRoles(false);
      }
    },
    [selectedRoleNames, onSuccess]
  );

  const reset = useCallback(() => {
    setSelectedRoleNames([]);
  }, []);

  return {
    allRoles,
    selectedRoleNames,
    savingRoles,
    editUserRoles,
    toggleRole,
    saveRoles,
    reset,
  };
}

