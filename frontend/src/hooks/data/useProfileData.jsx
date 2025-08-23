import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import api from "../../api";
import { QK } from "../../utils/queryKeys";

export async function fetchProfile() {
  try {
    const res = await api.get("/users/profile");
    return res?.data ?? {};
  } catch (err) {
    if (err?.response?.status === 404) return {};
    throw err;
  }
}

export default function useProfileData({ skipQuery = false } = {}) {
  const queryClient = useQueryClient();

  const { data, error, isLoading, isFetched, refetch, isFetching } = useQuery({
    queryKey: QK.profile,
    queryFn: fetchProfile,
    enabled: !skipQuery,
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 30 * 60 * 1000, // 30 min
    select: (data) => data ?? {},
    placeholderData: (prev) => prev,
  });

  const setProfileCache = useCallback(
    (next) => {
      queryClient.setQueryData(QK.profile, (old) =>
        typeof next === "function" ? next(old ?? {}) : next
      );
    },
    [queryClient]
  );

  const invalidateProfile = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QK.profile });
  }, [queryClient]);

  const optimistic = useMemo(
    () => ({
      onMutate: async (payload) => {
        await queryClient.cancelQueries({ queryKey: QK.profile });
        const previous = queryClient.getQueryData(QK.profile);
        queryClient.setQueryData(QK.profile, (old) => ({
          ...(old ?? {}),
          ...payload,
        }));
        return { previous };
      },
      onError: (_e, _p, ctx) => {
        if (ctx?.previous !== undefined)
          queryClient.setQueryData(QK.profile, ctx.previous);
      },
      onSuccess: (serverData) => {
        queryClient.setQueryData(QK.profile, serverData ?? {});
      },
      // onSettled: () => {
      //   queryClient.invalidateQueries({ queryKey: QK.profile });
      // },
    }),
    [queryClient]
  );

  const upsert = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put("/users/profile", payload);
      return res.data ?? {};
    },
    ...optimistic,
  });

  const create = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/users/profile", payload);
      return res.data ?? {};
    },
    ...optimistic,
  });

  return useMemo(
    () => ({
      profile: data ?? {},
      error,
      loading: isLoading,
      fetchedOnce: isFetched,
      refetch,
      isFetching,
      setProfileCache,
      invalidateProfile,
      mutations: { upsert, create },
    }),
    [
      data,
      error,
      isLoading,
      isFetched,
      refetch,
      isFetching,
      setProfileCache,
      invalidateProfile,
      upsert,
      create,
    ]
  );
}
