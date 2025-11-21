import { useCallback, useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryObserverResult,
} from "@tanstack/react-query";

import api from "@/src/api";
import { QK } from "@/src/utils/queryKeys";
import type { Profile } from "@/src/hooks/data/types";

export async function fetchProfile(): Promise<Profile> {
  try {
    const res = await api.get("/users/profile");
    return (res?.data as Profile) ?? {};
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    if (status === 404) {
      return {};
    }
    throw error;
  }
}

interface UseProfileDataOptions {
  skipQuery?: boolean;
}

type SetProfileCacheArg =
  | Profile
  | ((previous: Profile) => Profile | undefined);

export default function useProfileData(
  { skipQuery = false }: UseProfileDataOptions = {}
) {
  const queryClient = useQueryClient();

  const {
    data,
    error,
    isLoading,
    isFetched,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: QK.profile,
    queryFn: fetchProfile,
    enabled: !skipQuery,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (result: Profile | undefined) => result ?? {},
    placeholderData: (previous) => previous,
  });

  const setProfileCache = useCallback(
    (next: SetProfileCacheArg) => {
      queryClient.setQueryData(QK.profile, (old: Profile | undefined) => {
        if (typeof next === "function") {
          return (next as (prev: Profile) => Profile | undefined)(old ?? {});
        }
        return next ?? {};
      });
    },
    [queryClient]
  );

  const invalidateProfile = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QK.profile }).catch(() => {});
  }, [queryClient]);

  const optimistic = useMemo(
    () => ({
      onMutate: async (payload: Profile) => {
        await queryClient.cancelQueries({ queryKey: QK.profile });
        const previous = queryClient.getQueryData<Profile>(QK.profile);
        queryClient.setQueryData(QK.profile, (old: Profile | undefined) => ({
          ...(old ?? {}),
          ...payload,
        }));
        return { previous };
      },
      onError: (_error: unknown, _payload: Profile, ctx?: { previous?: Profile }) => {
        if (ctx?.previous !== undefined) {
          queryClient.setQueryData(QK.profile, ctx.previous);
        }
      },
      onSuccess: (serverData: Profile) => {
        queryClient.setQueryData(QK.profile, serverData ?? {});
      },
    }),
    [queryClient]
  );

  const upsert = useMutation({
    mutationFn: async (payload: Profile) => {
      const res = await api.put("/users/profile", payload);
      return (res.data as Profile) ?? {};
    },
    ...optimistic,
  });

  const create = useMutation({
    mutationFn: async (payload: Profile) => {
      const res = await api.post("/users/profile", payload);
      return (res.data as Profile) ?? {};
    },
    ...optimistic,
  });

  return useMemo(
    () => ({
      profile: data ?? {},
      error,
      loading: isLoading,
      fetchedOnce: isFetched,
      refetch: refetch as () => Promise<QueryObserverResult<Profile>>,
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

