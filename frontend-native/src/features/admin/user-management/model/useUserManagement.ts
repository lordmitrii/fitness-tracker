import { useState, useEffect, useCallback } from "react";
import api from "@/src/shared/api";

const PAGE_SIZE = 20;

interface UseUserManagementParams {
  searchQuery: string;
  page: number;
}

export function useUserManagement({ searchQuery, page }: UseUserManagementParams) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const loadUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get("/admin/users", {
        params: {
          q: searchQuery || undefined,
          page,
          page_size: PAGE_SIZE,
        },
      })
      .then((res) => {
        setUsers(res.data?.users || []);
        setTotal(res.data?.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [searchQuery, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users,
    total,
    loading,
    error,
    refetch: loadUsers,
    pageSize: PAGE_SIZE,
  };
}

